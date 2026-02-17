const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io;

// Connected users map: { odaId: { odaDetails }, odaId: { odaDetails } }
const connectedUsers = new Map();

// Initialize Socket.io
const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.query.token;

            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('name avatar');

            if (!user) {
                return next(new Error('Authentication error: User not found'));
            }

            // Attach user to socket
            socket.user = {
                id: user._id.toString(),
                name: user.name,
                avatar: user.avatar
            };

            next();
        } catch (error) {
            console.error('Socket auth error:', error.message);
            next(new Error('Authentication error: Invalid token'));
        }
    });

    // Connection handler
    io.on('connection', (socket) => {
        const userId = socket.user.id;
        console.log(`[Socket] User connected: ${socket.user.name} (${userId})`);

        // Store user's socket
        if (!connectedUsers.has(userId)) {
            connectedUsers.set(userId, new Set());
        }
        connectedUsers.get(userId).add(socket.id);

        // Join user's personal room
        socket.join(`user:${userId}`);

        // Broadcast user online status
        io.emit('user:online', { userId, name: socket.user.name });

        // Join conversation room (with participant check)
        socket.on('conversation:join', async (conversationId) => {
            try {
                const { Conversation } = require('../models/Message');
                const conv = await Conversation.findById(conversationId);
                if (conv && conv.participants.some(p => p.toString() === userId)) {
                    socket.join(`conversation:${conversationId}`);
                } else {
                    socket.emit('error', { message: 'Bu konuşmaya erişim yetkiniz yok' });
                }
            } catch (error) {
                socket.emit('error', { message: 'Konuşma doğrulanamadı' });
            }
        });

        // Leave conversation room
        socket.on('conversation:leave', (conversationId) => {
            socket.leave(`conversation:${conversationId}`);
            console.log(`[Socket] ${socket.user.name} left conversation: ${conversationId}`);
        });

        // Handle new message
        socket.on('message:send', async (data) => {
            try {
                const { conversationId, receiverId, content, messageType, offer } = data;

                // Emit to conversation room
                io.to(`conversation:${conversationId}`).emit('message:new', {
                    conversationId,
                    senderId: userId,
                    senderName: socket.user.name,
                    senderAvatar: socket.user.avatar,
                    content,
                    messageType,
                    offer,
                    createdAt: new Date()
                });

                // Also emit to receiver's personal room (for notification)
                if (receiverId && !isUserInRoom(receiverId, `conversation:${conversationId}`)) {
                    io.to(`user:${receiverId}`).emit('notification:message', {
                        conversationId,
                        senderId: userId,
                        senderName: socket.user.name,
                        preview: content.substring(0, 50)
                    });
                }

            } catch (error) {
                console.error('[Socket] Message send error:', error);
                socket.emit('error', { message: 'Mesaj gönderilemedi' });
            }
        });

        // Handle typing indicator
        socket.on('typing:start', (data) => {
            socket.to(`conversation:${data.conversationId}`).emit('typing:update', {
                userId,
                userName: socket.user.name,
                isTyping: true
            });
        });

        socket.on('typing:stop', (data) => {
            socket.to(`conversation:${data.conversationId}`).emit('typing:update', {
                userId,
                userName: socket.user.name,
                isTyping: false
            });
        });

        // Handle message read
        socket.on('messages:read', (data) => {
            socket.to(`conversation:${data.conversationId}`).emit('messages:marked_read', {
                conversationId: data.conversationId,
                readBy: userId
            });
        });

        // Handle offer response
        socket.on('offer:respond', (data) => {
            io.to(`conversation:${data.conversationId}`).emit('offer:updated', {
                messageId: data.messageId,
                status: data.status,
                respondedBy: userId
            });
        });

        // Disconnect handler
        socket.on('disconnect', () => {
            console.log(`[Socket] User disconnected: ${socket.user.name}`);

            // Remove from connected users
            if (connectedUsers.has(userId)) {
                connectedUsers.get(userId).delete(socket.id);
                if (connectedUsers.get(userId).size === 0) {
                    connectedUsers.delete(userId);
                    // Broadcast user offline status
                    io.emit('user:offline', { userId });
                }
            }
        });

        // Error handler
        socket.on('error', (error) => {
            console.error('[Socket] Error:', error);
        });
    });

    console.log('[Socket.io] Initialized');
    return io;
};

// Helper to check if user is in a room
const isUserInRoom = (userId, room) => {
    const userSockets = connectedUsers.get(userId);
    if (!userSockets) return false;

    for (const socketId of userSockets) {
        const socket = io.sockets.sockets.get(socketId);
        if (socket && socket.rooms.has(room)) {
            return true;
        }
    }
    return false;
};

// Get io instance
const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

// Check if user is online
const isUserOnline = (userId) => {
    return connectedUsers.has(userId);
};

// Send notification to specific user
const sendToUser = (userId, event, data) => {
    if (io) {
        io.to(`user:${userId}`).emit(event, data);
    }
};

// Send to conversation
const sendToConversation = (conversationId, event, data) => {
    if (io) {
        io.to(`conversation:${conversationId}`).emit(event, data);
    }
};

// Get online users count
const getOnlineUsersCount = () => {
    return connectedUsers.size;
};

module.exports = {
    initSocket,
    getIO,
    isUserOnline,
    sendToUser,
    sendToConversation,
    getOnlineUsersCount
};

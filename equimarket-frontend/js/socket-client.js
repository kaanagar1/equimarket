// EquiMarket Socket.io Client
(function() {
    'use strict';

    // Socket instance
    let socket = null;
    let isConnected = false;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;

    // Event handlers storage
    const eventHandlers = new Map();

    // Get API URL from config
    const getApiUrl = () => {
        return window.API_BASE_URL || 'http://localhost:5000';
    };

    // Initialize socket connection
    const connect = () => {
        const token = localStorage.getItem('equimarket_token');
        if (!token) {
            console.log('[Socket] No token found, skipping connection');
            return null;
        }

        if (socket && socket.connected) {
            console.log('[Socket] Already connected');
            return socket;
        }

        // Load Socket.io client library if not loaded
        if (typeof io === 'undefined') {
            console.log('[Socket] Loading Socket.io client library...');
            const script = document.createElement('script');
            script.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
            script.onload = () => {
                initConnection(token);
            };
            document.head.appendChild(script);
            return null;
        }

        return initConnection(token);
    };

    // Initialize the actual connection
    const initConnection = (token) => {
        const apiUrl = getApiUrl();

        socket = io(apiUrl, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000
        });

        // Connection events
        socket.on('connect', () => {
            console.log('[Socket] Connected');
            isConnected = true;
            reconnectAttempts = 0;
            triggerEvent('connected');
        });

        socket.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
            isConnected = false;
            triggerEvent('disconnected', { reason });
        });

        socket.on('connect_error', (error) => {
            console.error('[Socket] Connection error:', error.message);
            reconnectAttempts++;
            triggerEvent('error', { error: error.message });
        });

        // Message events
        socket.on('message:new', (data) => {
            console.log('[Socket] New message received:', data);
            triggerEvent('message:new', data);
        });

        socket.on('notification:message', (data) => {
            console.log('[Socket] Message notification:', data);
            triggerEvent('notification:message', data);
            showMessageNotification(data);
        });

        // Typing events
        socket.on('typing:update', (data) => {
            triggerEvent('typing:update', data);
        });

        // Messages read
        socket.on('messages:marked_read', (data) => {
            triggerEvent('messages:read', data);
        });

        // Offer events
        socket.on('offer:updated', (data) => {
            triggerEvent('offer:updated', data);
        });

        // User status events
        socket.on('user:online', (data) => {
            triggerEvent('user:online', data);
        });

        socket.on('user:offline', (data) => {
            triggerEvent('user:offline', data);
        });

        // Error handling
        socket.on('error', (data) => {
            console.error('[Socket] Error:', data);
            triggerEvent('error', data);
        });

        return socket;
    };

    // Disconnect socket
    const disconnect = () => {
        if (socket) {
            socket.disconnect();
            socket = null;
            isConnected = false;
        }
    };

    // Join a conversation room
    const joinConversation = (conversationId) => {
        if (socket && isConnected) {
            socket.emit('conversation:join', conversationId);
        }
    };

    // Leave a conversation room
    const leaveConversation = (conversationId) => {
        if (socket && isConnected) {
            socket.emit('conversation:leave', conversationId);
        }
    };

    // Send a message via socket
    const sendMessage = (data) => {
        if (socket && isConnected) {
            socket.emit('message:send', data);
        }
    };

    // Start typing indicator
    const startTyping = (conversationId) => {
        if (socket && isConnected) {
            socket.emit('typing:start', { conversationId });
        }
    };

    // Stop typing indicator
    const stopTyping = (conversationId) => {
        if (socket && isConnected) {
            socket.emit('typing:stop', { conversationId });
        }
    };

    // Mark messages as read
    const markMessagesRead = (conversationId) => {
        if (socket && isConnected) {
            socket.emit('messages:read', { conversationId });
        }
    };

    // Respond to offer
    const respondToOffer = (conversationId, messageId, status) => {
        if (socket && isConnected) {
            socket.emit('offer:respond', { conversationId, messageId, status });
        }
    };

    // Register event handler
    const on = (event, handler) => {
        if (!eventHandlers.has(event)) {
            eventHandlers.set(event, new Set());
        }
        eventHandlers.get(event).add(handler);

        // Return unsubscribe function
        return () => {
            eventHandlers.get(event).delete(handler);
        };
    };

    // Remove event handler
    const off = (event, handler) => {
        if (eventHandlers.has(event)) {
            if (handler) {
                eventHandlers.get(event).delete(handler);
            } else {
                eventHandlers.delete(event);
            }
        }
    };

    // Trigger event handlers
    const triggerEvent = (event, data) => {
        if (eventHandlers.has(event)) {
            eventHandlers.get(event).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`[Socket] Event handler error (${event}):`, error);
                }
            });
        }
    };

    // Show message notification
    const showMessageNotification = (data) => {
        // Show toast notification
        if (window.showToast) {
            window.showToast(`${data.senderName}: ${data.preview}`, 'info');
        }

        // Update unread count in header if function exists
        if (window.updateMessageBadge) {
            window.updateMessageBadge();
        }

        // Browser notification if permission granted
        if (Notification.permission === 'granted') {
            new Notification('EquiMarket - Yeni Mesaj', {
                body: `${data.senderName}: ${data.preview}`,
                icon: '/images/icons/icon-192x192.png',
                tag: `message-${data.conversationId}`
            });
        }
    };

    // Request notification permission
    const requestNotificationPermission = async () => {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return Notification.permission === 'granted';
    };

    // Get connection status
    const getStatus = () => ({
        connected: isConnected,
        reconnectAttempts
    });

    // Auto-connect when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(connect, 1000); // Wait 1 second after page load
        });
    } else {
        setTimeout(connect, 1000);
    }

    // Expose API globally
    window.EquiMarketSocket = {
        connect,
        disconnect,
        joinConversation,
        leaveConversation,
        sendMessage,
        startTyping,
        stopTyping,
        markMessagesRead,
        respondToOffer,
        on,
        off,
        getStatus,
        requestNotificationPermission
    };
})();

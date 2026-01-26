const Horse = require('../models/Horse');
const Notification = require('../models/Notification');
const SavedSearch = require('../models/SavedSearch');

// Check for expiring listings and send notifications
const checkExpiringListings = async () => {
    try {
        const now = new Date();
        const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        // Find listings expiring in 7 days (send first warning)
        const expiringSoon7Days = await Horse.find({
            status: 'active',
            expiresAt: { $gte: now, $lte: sevenDaysFromNow }
        }).populate('seller', 'name email');

        // Find listings expiring in 3 days (send urgent warning)
        const expiringSoon3Days = await Horse.find({
            status: 'active',
            expiresAt: { $gte: now, $lte: threeDaysFromNow }
        }).populate('seller', 'name email');

        // Send 7-day warning notifications
        for (const horse of expiringSoon7Days) {
            const daysLeft = Math.ceil((horse.expiresAt - now) / (24 * 60 * 60 * 1000));

            // Check if notification already sent
            const existingNotification = await Notification.findOne({
                user: horse.seller._id,
                type: 'listing_expiring',
                'metadata.horseId': horse._id,
                'metadata.daysLeft': { $lte: 7, $gt: 3 }
            });

            if (!existingNotification && daysLeft > 3) {
                await Notification.create({
                    user: horse.seller._id,
                    type: 'listing_expiring',
                    title: 'İlanınız yakında sona erecek',
                    message: `"${horse.name}" ilanınızın süresi ${daysLeft} gün içinde dolacak. Yenilemek için tıklayın.`,
                    metadata: {
                        horseId: horse._id,
                        horseName: horse.name,
                        daysLeft: daysLeft
                    },
                    actionUrl: `/dashboard.html?renew=${horse._id}`
                });
            }
        }

        // Send 3-day urgent warning notifications
        for (const horse of expiringSoon3Days) {
            const daysLeft = Math.ceil((horse.expiresAt - now) / (24 * 60 * 60 * 1000));

            // Check if urgent notification already sent
            const existingNotification = await Notification.findOne({
                user: horse.seller._id,
                type: 'listing_expiring',
                'metadata.horseId': horse._id,
                'metadata.daysLeft': { $lte: 3 }
            });

            if (!existingNotification) {
                await Notification.create({
                    user: horse.seller._id,
                    type: 'listing_expiring',
                    title: 'Acil: İlanınız sona ermek üzere!',
                    message: `"${horse.name}" ilanınızın süresi ${daysLeft} gün içinde dolacak! Hemen yenileyin.`,
                    metadata: {
                        horseId: horse._id,
                        horseName: horse.name,
                        daysLeft: daysLeft,
                        urgent: true
                    },
                    actionUrl: `/dashboard.html?renew=${horse._id}`
                });
            }
        }

        console.log(`[Scheduled Job] Checked expiring listings. 7-day warnings: ${expiringSoon7Days.length}, 3-day warnings: ${expiringSoon3Days.length}`);

    } catch (error) {
        console.error('[Scheduled Job] Error checking expiring listings:', error);
    }
};

// Expire listings that have passed their expiration date
const expireOldListings = async () => {
    try {
        const now = new Date();

        const result = await Horse.updateMany(
            {
                status: 'active',
                expiresAt: { $lt: now }
            },
            {
                $set: { status: 'expired' }
            }
        );

        if (result.modifiedCount > 0) {
            console.log(`[Scheduled Job] Expired ${result.modifiedCount} listings`);

            // Send notifications to affected sellers
            const expiredListings = await Horse.find({
                status: 'expired',
                updatedAt: { $gte: new Date(now.getTime() - 60 * 1000) } // Updated in last minute
            }).populate('seller', 'name email');

            for (const horse of expiredListings) {
                await Notification.create({
                    user: horse.seller._id,
                    type: 'listing_expired',
                    title: 'İlanınız sona erdi',
                    message: `"${horse.name}" ilanınızın süresi doldu. İlanınızı yenilemek için tıklayın.`,
                    metadata: {
                        horseId: horse._id,
                        horseName: horse.name
                    },
                    actionUrl: `/dashboard.html?renew=${horse._id}`
                });
            }
        }

    } catch (error) {
        console.error('[Scheduled Job] Error expiring old listings:', error);
    }
};

// Check saved searches for new matches
const checkSavedSearches = async () => {
    try {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Get saved searches that need checking
        const searches = await SavedSearch.find({
            'notifications.enabled': true,
            $or: [
                // Daily notifications not sent today
                {
                    'notifications.frequency': 'daily',
                    $or: [
                        { 'notifications.lastNotifiedAt': { $lt: oneDayAgo } },
                        { 'notifications.lastNotifiedAt': null }
                    ]
                },
                // Weekly notifications not sent this week
                {
                    'notifications.frequency': 'weekly',
                    $or: [
                        { 'notifications.lastNotifiedAt': { $lt: oneWeekAgo } },
                        { 'notifications.lastNotifiedAt': null }
                    ]
                }
            ]
        }).populate('user', 'name email');

        for (const search of searches) {
            // Build filter
            let filter = { status: 'active' };

            if (search.filters.breed) filter.breed = search.filters.breed;
            if (search.filters.gender) filter.gender = search.filters.gender;
            if (search.filters.color) filter.color = search.filters.color;
            if (search.filters.city) filter['location.city'] = search.filters.city;

            if (search.filters.minPrice || search.filters.maxPrice) {
                filter.price = {};
                if (search.filters.minPrice) filter.price.$gte = Number(search.filters.minPrice);
                if (search.filters.maxPrice) filter.price.$lte = Number(search.filters.maxPrice);
            }

            if (search.filters.minAge || search.filters.maxAge) {
                filter.age = {};
                if (search.filters.minAge) filter.age.$gte = Number(search.filters.minAge);
                if (search.filters.maxAge) filter.age.$lte = Number(search.filters.maxAge);
            }

            // Check for new listings since last check
            if (search.lastCheckedAt) {
                filter.createdAt = { $gt: search.lastCheckedAt };
            }

            const newMatches = await Horse.countDocuments(filter);

            if (newMatches > 0) {
                // Send notification
                await Notification.create({
                    user: search.user._id,
                    type: 'system',
                    title: 'Kayıtlı aramanızla eşleşen yeni ilanlar',
                    message: `"${search.name}" aramanızla eşleşen ${newMatches} yeni ilan var!`,
                    metadata: {
                        savedSearchId: search._id,
                        searchName: search.name,
                        newMatches
                    },
                    actionUrl: `/ilanlar.html?savedSearch=${search._id}`
                });

                // Update search
                search.notifications.lastNotifiedAt = now;
            }

            // Update match count
            const totalFilter = { ...filter };
            delete totalFilter.createdAt;
            search.matchCount = await Horse.countDocuments(totalFilter);
            search.lastCheckedAt = now;
            await search.save();
        }

        console.log(`[Scheduled Job] Checked ${searches.length} saved searches`);

    } catch (error) {
        console.error('[Scheduled Job] Error checking saved searches:', error);
    }
};

// Clean up old notifications (older than 30 days and read)
const cleanupOldNotifications = async () => {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const result = await Notification.deleteMany({
            isRead: true,
            createdAt: { $lt: thirtyDaysAgo }
        });

        if (result.deletedCount > 0) {
            console.log(`[Scheduled Job] Cleaned up ${result.deletedCount} old notifications`);
        }

    } catch (error) {
        console.error('[Scheduled Job] Error cleaning up notifications:', error);
    }
};

// Initialize scheduled jobs with setInterval (runs on server start)
const initScheduledJobs = () => {
    console.log('[Scheduled Jobs] Initializing...');

    // Run immediately on start
    setTimeout(() => {
        checkExpiringListings();
        expireOldListings();
    }, 5000); // Wait 5 seconds after server start

    // Check for expiring listings every 6 hours
    setInterval(checkExpiringListings, 6 * 60 * 60 * 1000);

    // Expire old listings every hour
    setInterval(expireOldListings, 60 * 60 * 1000);

    // Clean up old notifications once a day
    setInterval(cleanupOldNotifications, 24 * 60 * 60 * 1000);

    // Check saved searches every 6 hours
    setInterval(checkSavedSearches, 6 * 60 * 60 * 1000);

    console.log('[Scheduled Jobs] Initialized successfully');
};

module.exports = {
    initScheduledJobs,
    checkExpiringListings,
    expireOldListings,
    cleanupOldNotifications,
    checkSavedSearches
};

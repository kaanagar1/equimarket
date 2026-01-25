const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middlewares/auth');
const {
    getDashboardStats, getUsers, getUser, updateUser, deleteUser,
    getListings, updateListing, deleteListing, bulkApproveListing
} = require('../controllers/adminController');
const {
    adminGetBlogs, adminGetBlog, adminCreateBlog, adminUpdateBlog, adminDeleteBlog
} = require('../controllers/blogController');
const {
    getContactMessages, updateContactMessage, getReports, updateReport
} = require('../controllers/supportController');

router.use(protect);
router.use(isAdmin);

// Dashboard
router.get('/stats', getDashboardStats);

// Users
router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Listings
router.get('/listings', getListings);
router.put('/listings/:id', updateListing);
router.delete('/listings/:id', deleteListing);
router.post('/listings/bulk-approve', bulkApproveListing);

// Blogs
router.get('/blogs', adminGetBlogs);
router.get('/blogs/:id', adminGetBlog);
router.post('/blogs', adminCreateBlog);
router.put('/blogs/:id', adminUpdateBlog);
router.delete('/blogs/:id', adminDeleteBlog);

// Support - Contact & Reports
router.get('/support/contacts', getContactMessages);
router.put('/support/contacts/:id', updateContactMessage);
router.get('/support/reports', getReports);
router.put('/support/reports/:id', updateReport);

module.exports = router;

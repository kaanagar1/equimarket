const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middlewares/auth');
const {
    getBlogs,
    getBlog,
    getCategories,
    adminGetBlogs,
    adminGetBlog,
    adminCreateBlog,
    adminUpdateBlog,
    adminDeleteBlog
} = require('../controllers/blogController');

// Public routes
router.get('/', getBlogs);
router.get('/categories', getCategories);
router.get('/:slug', getBlog);

module.exports = router;

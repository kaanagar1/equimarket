const Blog = require('../models/Blog');

// @desc    Tüm blogları getir (public)
// @route   GET /api/blogs
// @access  Public
exports.getBlogs = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            category, 
            tag,
            featured,
            search,
            status = 'published' // Public için sadece published
        } = req.query;

        const query = {};
        
        // Sadece yayınlanmış bloglar (public endpoint)
        query.status = status;
        
        // Kategori filtresi
        if (category) {
            query.category = category;
        }
        
        // Tag filtresi
        if (tag) {
            query.tags = { $in: [tag] };
        }
        
        // Öne çıkan filtresi
        if (featured === 'true') {
            query.isFeatured = true;
        }
        
        // Arama
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { excerpt: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const blogs = await Blog.find(query)
            .populate('author', 'name avatar')
            .sort({ publishedAt: -1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .select('-content'); // Liste için content hariç

        const total = await Blog.countDocuments(query);

        res.status(200).json({
            success: true,
            data: blogs,
            total,
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Get blogs error:', error);
        res.status(500).json({ success: false, message: 'Bloglar yüklenemedi' });
    }
};

// @desc    Tek blog getir (public)
// @route   GET /api/blogs/:slug
// @access  Public
exports.getBlog = async (req, res) => {
    try {
        const { slug } = req.params;
        
        // Slug veya ID ile bul
        let blog;
        if (slug.match(/^[0-9a-fA-F]{24}$/)) {
            blog = await Blog.findById(slug).populate('author', 'name avatar bio');
        } else {
            blog = await Blog.findOne({ slug }).populate('author', 'name avatar bio');
        }

        if (!blog) {
            return res.status(404).json({ success: false, message: 'Blog bulunamadı' });
        }

        // Sadece yayınlanmış bloglar görüntülenebilir (admin hariç)
        if (blog.status !== 'published') {
            return res.status(404).json({ success: false, message: 'Blog bulunamadı' });
        }

        // Görüntülenme sayısını artır
        blog.views += 1;
        await blog.save();

        // İlgili blogları getir
        const relatedBlogs = await Blog.find({
            _id: { $ne: blog._id },
            status: 'published',
            category: blog.category
        })
        .select('title slug coverImage excerpt publishedAt')
        .limit(3)
        .sort({ publishedAt: -1 });

        res.status(200).json({
            success: true,
            data: blog,
            related: relatedBlogs
        });
    } catch (error) {
        console.error('Get blog error:', error);
        res.status(500).json({ success: false, message: 'Blog yüklenemedi' });
    }
};

// @desc    Kategorileri getir
// @route   GET /api/blogs/categories
// @access  Public
exports.getCategories = async (req, res) => {
    try {
        const categories = await Blog.aggregate([
            { $match: { status: 'published' } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const categoryLabels = {
            'haberler': 'Haberler',
            'rehber': 'Rehber',
            'bakım': 'Bakım',
            'eğitim': 'Eğitim',
            'yarış': 'Yarış',
            'sağlık': 'Sağlık',
            'beslenme': 'Beslenme',
            'ekipman': 'Ekipman',
            'etkinlik': 'Etkinlik',
            'diğer': 'Diğer'
        };

        const result = categories.map(c => ({
            value: c._id,
            label: categoryLabels[c._id] || c._id,
            count: c.count
        }));

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ success: false, message: 'Kategoriler yüklenemedi' });
    }
};

// ============ ADMIN ENDPOINTS ============

// @desc    Admin - Tüm blogları getir
// @route   GET /api/admin/blogs
// @access  Admin
exports.adminGetBlogs = async (req, res) => {
    try {
        const { page = 1, limit = 15, status, search } = req.query;
        const query = {};

        if (status) {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { excerpt: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const blogs = await Blog.find(query)
            .populate('author', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Blog.countDocuments(query);

        // İstatistikler
        const stats = {
            total: await Blog.countDocuments(),
            published: await Blog.countDocuments({ status: 'published' }),
            draft: await Blog.countDocuments({ status: 'draft' }),
            totalViews: (await Blog.aggregate([{ $group: { _id: null, views: { $sum: '$views' } } }]))[0]?.views || 0
        };

        res.status(200).json({
            success: true,
            data: blogs,
            total,
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            stats
        });
    } catch (error) {
        console.error('Admin get blogs error:', error);
        res.status(500).json({ success: false, message: 'Bloglar yüklenemedi' });
    }
};

// @desc    Admin - Tek blog getir
// @route   GET /api/admin/blogs/:id
// @access  Admin
exports.adminGetBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id).populate('author', 'name');
        
        if (!blog) {
            return res.status(404).json({ success: false, message: 'Blog bulunamadı' });
        }

        res.status(200).json({ success: true, data: blog });
    } catch (error) {
        console.error('Admin get blog error:', error);
        res.status(500).json({ success: false, message: 'Blog yüklenemedi' });
    }
};

// @desc    Admin - Blog oluştur
// @route   POST /api/admin/blogs
// @access  Admin
exports.adminCreateBlog = async (req, res) => {
    try {
        const { title, content, excerpt, category, tags, coverImage, status, isFeatured, metaTitle, metaDescription } = req.body;

        const blog = await Blog.create({
            title,
            content,
            excerpt,
            category,
            tags: tags || [],
            coverImage,
            status: status || 'draft',
            isFeatured: isFeatured || false,
            metaTitle,
            metaDescription,
            author: req.user._id
        });

        res.status(201).json({
            success: true,
            data: blog,
            message: 'Blog başarıyla oluşturuldu'
        });
    } catch (error) {
        console.error('Admin create blog error:', error);
        res.status(500).json({ success: false, message: error.message || 'Blog oluşturulamadı' });
    }
};

// @desc    Admin - Blog güncelle
// @route   PUT /api/admin/blogs/:id
// @access  Admin
exports.adminUpdateBlog = async (req, res) => {
    try {
        const { title, content, excerpt, category, tags, coverImage, status, isFeatured, metaTitle, metaDescription } = req.body;

        const blog = await Blog.findById(req.params.id);
        
        if (!blog) {
            return res.status(404).json({ success: false, message: 'Blog bulunamadı' });
        }

        // Alanları güncelle
        if (title) blog.title = title;
        if (content) blog.content = content;
        if (excerpt !== undefined) blog.excerpt = excerpt;
        if (category) blog.category = category;
        if (tags) blog.tags = tags;
        if (coverImage !== undefined) blog.coverImage = coverImage;
        if (status) blog.status = status;
        if (isFeatured !== undefined) blog.isFeatured = isFeatured;
        if (metaTitle !== undefined) blog.metaTitle = metaTitle;
        if (metaDescription !== undefined) blog.metaDescription = metaDescription;

        await blog.save();

        res.status(200).json({
            success: true,
            data: blog,
            message: 'Blog başarıyla güncellendi'
        });
    } catch (error) {
        console.error('Admin update blog error:', error);
        res.status(500).json({ success: false, message: 'Blog güncellenemedi' });
    }
};

// @desc    Admin - Blog sil
// @route   DELETE /api/admin/blogs/:id
// @access  Admin
exports.adminDeleteBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        
        if (!blog) {
            return res.status(404).json({ success: false, message: 'Blog bulunamadı' });
        }

        await blog.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Blog başarıyla silindi'
        });
    } catch (error) {
        console.error('Admin delete blog error:', error);
        res.status(500).json({ success: false, message: 'Blog silinemedi' });
    }
};

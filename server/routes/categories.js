// If you want to protect any category routes, use:
// const { protect } = require('../middleware/authMiddleware');
const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// POST /api/categories - create a new category
router.post('/', async (req, res) => {
    try {
        const { name, description } = req.body;

        const existing = await Category.findOne({ name });
        if (existing) {
            return res.status(400).json({
                success: false,
                error: error.message || 'Category already exists'
            });
        }
        const category = new Category({ name, description });
        await category.save();

        res.status(201).json({
            success: true,
            data: category,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.message || 'Server Error'
        });
    }
});

// GET /api/categories - Get all categories
router.get('/', async (req, res) => {
    try {
        const { includePosts, search, slug } = req.query;

        let filter = {};

        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }

        if (slug) {
            filter.slug = slug;
        }

        const query = Category.find(filter);

        if (includePosts) {
            query.populate('posts', 'title slug featuredImage');
        }
        
        const categories = await query;

        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.message || 'Server Error'
        });
    }
});

// GET /api/categories/:id - Get a specific category by ID
router.get('/:id', async (req, res) => {
    try {
        const { includePosts } = req.query;
        const categoryId = req.params.id;

        const category = includePosts ?
            await Category.findById(categoryId).populate('posts', 'title slug featuredImage')
            : await Category.findById(categoryId);
        
        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category does not exist',
            });
        }
        res.status(200).json({
            success: true,
            data: category,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.message || 'Server Error'
        });
    }
});

// PUT /api/categories/:id - Update a category by ID
router.put('/:id', async (req, res) => {
    try {
        const categoryId = req.params.id;
        const { name, description } = req.body;

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category does not exist',
            });
        }
        
        if (name) category.name = name;
        if (description) category.description = description;

        if (name) {
            category.slug = name
                .toLowerCase()
                .replace(/[^\w ]+/g, '')
                .replace(/ +/g, '-');
        }

        const updatedCategory = await category.save();
        res.status(200).json({
            success: true,
            data: updatedCategory,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.message || 'Server Error'
        });
    }
});

// DELETE /api/categories/:id - Delete a category by ID
router.delete('/:id', async (req, res) => {
    try {
        const categoryId = req.params.id;
        const deletedCategory = await Category.findByIdAndDelete(categoryId);

        if (!deletedCategory) {
            return res.status(404).json({
                success: false,
                error: 'Category does not exist',
            });
        }

        const Post = require('../models/Post');
        const postswithCategory = await Post.find({ category: categoryId });
        if (postswithCategory.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete category with associated posts. Please reassign or delete those posts first.',
            });
        }

        await deletedCategory.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Category deleted successfully',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.message || 'Server Error'
        });
    }
});

module.exports = router;
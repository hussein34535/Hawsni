const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/api/categoryController');
const upload = require('../middleware/upload');

// @route   GET /api/categories
router.get('/', CategoryController.getCategories);

// @route   POST /api/categories
// @desc    Create category (Admin only)
router.post('/', upload.single('image'), CategoryController.createCategoryApi);

// @route   PUT /api/categories/:id
router.put('/:id', upload.single('image'), CategoryController.updateCategoryApi);

// @route   DELETE /api/categories/:id
router.delete('/:id', CategoryController.deleteCategoryApi);

module.exports = router;
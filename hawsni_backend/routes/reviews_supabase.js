const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Get product reviews
router.get('/product/:productId', async (req, res) => {
  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*, users(name)')
      .eq('product_id', req.params.productId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Format reviews to match the expected structure
    const formattedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.created_at,
      user: {
        name: review.users?.name || 'Anonymous'
      }
    }));
    
    res.json({ success: true, reviews: formattedReviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create review
router.post('/', async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    
    // For now, we'll create a review without user authentication
    // In a real app, you would get the user ID from the authenticated user
    // We'll use a null user_id for now to avoid foreign key constraint issues
    const userId = null;
    
    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        user_id: userId,
        product_id: productId,
        rating: rating,
        comment: comment
      })
      .select('*, users(name)')
      .single();
    
    if (error) throw error;
    
    // Format review to match the expected structure
    const formattedReview = {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.created_at,
      user: {
        name: review.users?.name || 'Anonymous'
      }
    };
    
    // Update product rating
    await updateProductRating(productId);
    
    res.status(201).json({ success: true, review: formattedReview });
  } catch (error) {
    console.error('Error creating review:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ success: false, message: 'You already reviewed this product' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update review
router.put('/:id', async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    const { data: review, error } = await supabase
      .from('reviews')
      .update({
        rating: rating,
        comment: comment
      })
      .eq('id', req.params.id)
      .select('*, users(name)')
      .single();
    
    if (error) throw error;
    
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    
    // Format review to match the expected structure
    const formattedReview = {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.created_at,
      user: {
        name: review.users?.name || 'Anonymous'
      }
    };
    
    // Update product rating
    await updateProductRating(review.product_id);
    
    res.json({ success: true, review: formattedReview });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete review
router.delete('/:id', async (req, res) => {
  try {
    // First get the review to get the product_id
    const { data: review, error: fetchError } = await supabase
      .from('reviews')
      .select('product_id')
      .eq('id', req.params.id)
      .single();
    
    if (fetchError) throw fetchError;
    
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    
    // Delete the review
    const { error: deleteError } = await supabase
      .from('reviews')
      .delete()
      .eq('id', req.params.id);
    
    if (deleteError) throw deleteError;
    
    // Update product rating
    await updateProductRating(review.product_id);
    
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper function to update product rating
async function updateProductRating(productId) {
  try {
    // Get all reviews for this product
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', productId);
    
    if (error) throw error;
    
    // Calculate average rating
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;
    
    // Update product
    const { error: updateError } = await supabase
      .from('products')
      .update({
        rating: avgRating,
        num_reviews: reviews.length
      })
      .eq('id', productId);
    
    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error updating product rating:', error);
  }
}

module.exports = router;
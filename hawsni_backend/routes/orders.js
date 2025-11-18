const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
// const Order = require('../models/Order');
// const Cart = require('../models/Cart');
// const { protect, authorize } = require('../middleware/auth');

// Get user orders
// router.get('/', protect, async (req, res) => {
router.get('/', async (req, res) => {
  try {
    // For testing, let's get all orders without user filter
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(name, images))')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get order by ID
// router.get('/:id', protect, async (req, res) => {
router.get('/:id', async (req, res) => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(name, images, price))')
      .eq('id', req.params.id)
      .single();
    
    if (error) throw error;
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create order
// router.post('/', protect, async (req, res) => {
router.post('/', async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, subtotal, discount, couponCode } = req.body;
    
    const shippingFee = 5.00;
    const total = subtotal + shippingFee - discount;

    // Create order without user_id for testing
    // Temporarily disable RLS for testing by using service role key
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        shipping_address: shippingAddress,
        payment_method: paymentMethod,
        subtotal: subtotal,
        shipping_fee: shippingFee,
        discount: discount,
        coupon_code: couponCode,
        total: total,
        status: 'Processing'
      })
      .select()
      .single();
    
    if (orderError) throw orderError;
    
    // Create order items
    if (items && items.length > 0) {
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) throw itemsError;
      
      // Add items to the order object for response
      order.items = orderItems;
    }

    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update order status (Admin)
// router.put('/:id/status', protect, authorize('admin'), async (req, res) => {
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (fetchError) throw fetchError;
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // For now, allow updating status without admin authorization
    const updateData = { status };
    if (status === 'Delivered') {
      updateData.delivered_at = new Date();
    }
    
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    res.json({ success: true, updatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cancel order
// router.put('/:id/cancel', protect, async (req, res) => {
router.put('/:id/cancel', async (req, res) => {
  try {
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (fetchError) throw fetchError;
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status !== 'Processing') {
      return res.status(400).json({ success: false, message: 'Cannot cancel this order' });
    }

    const { data: cancelledOrder, error: cancelError } = await supabase
      .from('orders')
      .update({ status: 'Cancelled' })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (cancelError) throw cancelError;
    
    res.json({ success: true, cancelledOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
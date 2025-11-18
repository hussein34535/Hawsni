const supabase = require('./hawsni_backend/config/supabase');

async function testAPI() {
  console.log('Testing API...');
  
  // Test creating an order without user_id
  console.log('Creating test order...');
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      shipping_address: { title: 'Test Address', address: '123 Test St', city: 'Test City', country: 'Test Country' },
      payment_method: 'Cash on Delivery',
      subtotal: 100.00,
      shipping_fee: 5.00,
      discount: 0,
      coupon_code: '',
      total: 105.00,
      status: 'Processing'
    })
    .select()
    .single();
  
  if (orderError) {
    console.error('Error creating order:', orderError);
  } else {
    console.log('Order created successfully:', order);
  }
}

testAPI();
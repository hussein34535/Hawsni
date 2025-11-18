import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hawsni_app/core/services/api_service.dart';
import 'package:hawsni_app/core/services/coupon_service.dart';
import 'package:hawsni_app/features/cart/bloc/cart_bloc.dart';
import 'package:hawsni_app/features/cart/bloc/cart_event.dart';
import 'package:hawsni_app/features/cart/bloc/cart_state.dart';
import 'package:hawsni_app/features/checkout/models/address.dart';
import 'package:hawsni_app/features/checkout/presentation/screens/address_management_screen.dart';
import 'package:hawsni_app/features/checkout/presentation/screens/order_confirmation_screen.dart';

class CheckoutScreen extends StatefulWidget {
  final List<String> cartItems;
  final double totalAmount;

  const CheckoutScreen({
    super.key,
    required this.cartItems,
    required this.totalAmount,
  });

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  final _couponController = TextEditingController();

  // Initialize with sample addresses
  late List<Address> _addresses;
  Address? _selectedAddress;
  String _selectedPayment = 'Cash on Delivery';
  double _discount = 0;
  String? _appliedCoupon;

  final Map<String, double> _coupons = {
    'WELCOME10': 0.10,
    'SAVE20': 0.20,
    'HAWSNI50': 0.50,
  };

  @override
  void initState() {
    super.initState();
    // Initialize addresses
    _addresses = [
      Address(
        id: '1',
        title: 'Home',
        fullName: 'John Doe',
        address: '123 Main St',
        city: 'City',
        country: 'Country',
        phone: '+1234567890',
        isDefault: true,
      ),
      Address(
        id: '2',
        title: 'Work',
        fullName: 'John Doe',
        address: '456 Office Blvd',
        city: 'City',
        country: 'Country',
        phone: '+1234567890',
        isDefault: false,
      ),
    ];

    // Set default address as selected
    try {
      _selectedAddress = _addresses.firstWhere((address) => address.isDefault);
    } catch (e) {
      // If no default address found, select the first one
      _selectedAddress = _addresses.isNotEmpty ? _addresses[0] : null;
    }
  }

  @override
  void dispose() {
    _couponController.dispose();
    super.dispose();
  }

  void _manageAddresses() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AddressManagementScreen(
          addresses: _addresses,
          selectedAddress: _selectedAddress,
        ),
      ),
    );

    if (result != null && result is Address) {
      setState(() {
        _selectedAddress = result;
      });
    }
  }

  void _applyCoupon() async {
    final couponCode = _couponController.text.trim();
    if (couponCode.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter a coupon code'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Show loading indicator
    final loadingSnackBar = SnackBar(
      content: const Row(
        children: [
          SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
            ),
          ),
          SizedBox(width: 16),
          Text('Validating coupon...'),
        ],
      ),
      backgroundColor: Colors.blue,
    );

    ScaffoldMessenger.of(context).showSnackBar(loadingSnackBar);

    try {
      // Validate coupon with backend
      final result = await CouponService.validateCoupon(couponCode);

      if (result != null && result['success'] == true) {
        final coupon = result['coupon'];
        final discountPercentage = coupon['discount'] / 100;
        final discountAmount = widget.totalAmount * discountPercentage;

        setState(() {
          _discount = discountAmount;
          _appliedCoupon = couponCode.toUpperCase();
        });

        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                'Coupon "${couponCode.toUpperCase()}" applied! You saved \$${discountAmount.toStringAsFixed(2)}'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Invalid or expired coupon code'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Error validating coupon. Please try again.'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _removeCoupon() {
    setState(() {
      _discount = 0;
      _appliedCoupon = null;
      _couponController.clear();
    });
  }

  void _placeOrder() async {
    if (_formKey.currentState!.validate()) {
      // Show loading dialog
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const AlertDialog(
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text('Placing your order...'),
            ],
          ),
        ),
      );

      try {
        // Get cart items from the cart bloc
        final cartState = context.read<CartBloc>().state;
        List<Map<String, dynamic>> orderItems = [];

        if (cartState is CartLoaded) {
          for (var item in cartState.items) {
            // Fix: Parse price correctly by removing currency symbols
            final priceString = item.price.replaceAll(RegExp(r'[^\d.]'), '');
            final price = double.tryParse(priceString) ?? 0.0;

            orderItems.add({
              'product': item.id, // This should be the product ID
              'name': item.name,
              'price': price,
              'quantity': item.quantity,
              'imageUrl': item.imageUrl,
            });
          }
        }

        // Prepare order data to match backend schema
        final orderData = {
          'items': orderItems,
          'subtotal': widget.totalAmount,
          'shippingAddress': {
            'title': _selectedAddress?.title ?? 'Home',
            'address': _selectedAddress?.address ?? '123 Main St',
            'city': _selectedAddress?.city ?? 'City',
            'country': _selectedAddress?.country ?? 'Country',
            'phone': _selectedAddress?.phone ?? '+1234567890',
          },
          'paymentMethod': _selectedPayment,
          'discount': _discount,
          'couponCode': _appliedCoupon ?? '',
        };

        // Send order to backend
        final response = await ApiService.createOrder(orderData);

        // Close loading dialog
        Navigator.of(context).pop();

        if (response != null) {
          // Clear cart
          context.read<CartBloc>().add(ClearCart());

          // Show success dialog
          showDialog(
            context: context,
            builder: (context) => AlertDialog(
              title: const Text('Order Placed!'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Your order has been placed successfully!'),
                  const SizedBox(height: 16),
                  Text('Order ID: ${response['order']?['id'] ?? 'N/A'}'),
                  const SizedBox(height: 8),
                  Text('Total: \$${widget.totalAmount.toStringAsFixed(2)}'),
                  if (_discount > 0)
                    Text('Discount: -\$${_discount.toStringAsFixed(2)}',
                        style: const TextStyle(color: Colors.green)),
                  const Divider(),
                  Text(
                    'Final Amount: \$${(widget.totalAmount - _discount + 5).toStringAsFixed(2)}',
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 18),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () {
                    Navigator.of(context).pop(); // Close dialog
                    // Navigate to order confirmation screen
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(
                        builder: (context) => OrderConfirmationScreen(
                          orderData: response,
                        ),
                      ),
                    );
                  },
                  child: const Text('View Details'),
                ),
              ],
            ),
          );
        } else {
          throw Exception('Failed to create order');
        }
      } catch (e) {
        print('Error placing order: $e');
        // Close loading dialog
        Navigator.of(context).pop();

        // Show error dialog
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Order Failed'),
            content:
                const Text('Failed to place your order. Please try again.'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('OK'),
              ),
            ],
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final finalAmount = widget.totalAmount - _discount;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Checkout'),
      ),
      body: Form(
        key: _formKey,
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildSection(
                      title: 'Delivery Address',
                      child: Column(
                        children: [
                          if (_selectedAddress != null) ...[
                            ListTile(
                              title: Text(_selectedAddress!.title),
                              subtitle: Text(
                                  '${_selectedAddress!.fullName}\n${_selectedAddress!.address}, ${_selectedAddress!.city}, ${_selectedAddress!.country}\n${_selectedAddress!.phone}'),
                              trailing: const Icon(Icons.arrow_forward_ios),
                              onTap: _manageAddresses,
                            ),
                            const Divider(),
                          ],
                          TextButton.icon(
                            onPressed: _manageAddresses,
                            icon: const Icon(Icons.edit),
                            label: Text(_selectedAddress != null
                                ? 'Change Address'
                                : 'Select Address'),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildSection(
                      title: 'Payment Method',
                      child: Column(
                        children: [
                          // Cash on Delivery
                          Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            child: RadioListTile<String>(
                              title: const Text('Cash on Delivery'),
                              subtitle: const Text('Pay when you receive'),
                              value: 'Cash on Delivery',
                              groupValue: _selectedPayment,
                              onChanged: (value) {
                                setState(() {
                                  _selectedPayment = value!;
                                });
                              },
                              activeColor: Colors.blue,
                              contentPadding: const EdgeInsets.all(16),
                            ),
                          ),

                          // Credit Card
                          Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            child: RadioListTile<String>(
                              title: const Text('Credit Card'),
                              subtitle:
                                  const Text('Pay securely with your card'),
                              value: 'Credit Card',
                              groupValue: _selectedPayment,
                              onChanged: (value) {
                                setState(() {
                                  _selectedPayment = value!;
                                });
                              },
                              activeColor: Colors.blue,
                              contentPadding: const EdgeInsets.all(16),
                            ),
                          ),

                          // PayPal
                          Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            child: RadioListTile<String>(
                              title: const Text('PayPal'),
                              subtitle: const Text('Pay with PayPal account'),
                              value: 'PayPal',
                              groupValue: _selectedPayment,
                              onChanged: (value) {
                                setState(() {
                                  _selectedPayment = value!;
                                });
                              },
                              activeColor: Colors.blue,
                              contentPadding: const EdgeInsets.all(16),
                            ),
                          ),

                          // Apple Pay
                          Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            child: RadioListTile<String>(
                              title: const Text('Apple Pay'),
                              subtitle: const Text('Pay with Apple Pay'),
                              value: 'Apple Pay',
                              groupValue: _selectedPayment,
                              onChanged: (value) {
                                setState(() {
                                  _selectedPayment = value!;
                                });
                              },
                              activeColor: Colors.blue,
                              contentPadding: const EdgeInsets.all(16),
                            ),
                          ),

                          // Google Pay
                          Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            child: RadioListTile<String>(
                              title: const Text('Google Pay'),
                              subtitle: const Text('Pay with Google Pay'),
                              value: 'Google Pay',
                              groupValue: _selectedPayment,
                              onChanged: (value) {
                                setState(() {
                                  _selectedPayment = value!;
                                });
                              },
                              activeColor: Colors.blue,
                              contentPadding: const EdgeInsets.all(16),
                            ),
                          ),

                          // Bank Transfer
                          Card(
                            child: RadioListTile<String>(
                              title: const Text('Bank Transfer'),
                              subtitle: const Text(
                                  'Transfer money directly to our bank account'),
                              value: 'Bank Transfer',
                              groupValue: _selectedPayment,
                              onChanged: (value) {
                                setState(() {
                                  _selectedPayment = value!;
                                });
                              },
                              activeColor: Colors.blue,
                              contentPadding: const EdgeInsets.all(16),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildSection(
                      title: 'Apply Coupon',
                      child: Column(
                        children: [
                          if (_appliedCoupon != null)
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.green[50],
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.green),
                              ),
                              child: Row(
                                children: [
                                  Icon(Icons.check_circle,
                                      color: Colors.green[700]),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'Coupon "$_appliedCoupon" applied',
                                      style: TextStyle(
                                        color: Colors.green[700],
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.close),
                                    onPressed: _removeCoupon,
                                    color: Colors.green[700],
                                  ),
                                ],
                              ),
                            )
                          else
                            Row(
                              children: [
                                Expanded(
                                  child: TextFormField(
                                    controller: _couponController,
                                    decoration: InputDecoration(
                                      hintText: 'Enter coupon code',
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                    ),
                                    textCapitalization:
                                        TextCapitalization.characters,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                ElevatedButton(
                                  onPressed: _applyCoupon,
                                  style: ElevatedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 24, vertical: 16),
                                  ),
                                  child: const Text('Apply'),
                                ),
                              ],
                            ),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 8,
                            children: _coupons.keys.map((code) {
                              return ActionChip(
                                label: Text(code),
                                onPressed: () {
                                  _couponController.text = code;
                                  _applyCoupon();
                                },
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildSection(
                      title: 'Order Summary',
                      child: Column(
                        children: [
                          _buildSummaryRow('Items (${widget.cartItems.length})',
                              '\$${widget.totalAmount.toStringAsFixed(2)}'),
                          _buildSummaryRow('Delivery Fee', '\$5.00'),
                          if (_discount > 0)
                            _buildSummaryRow(
                              'Discount',
                              '-\$${_discount.toStringAsFixed(2)}',
                              color: Colors.green,
                            ),
                          const Divider(),
                          _buildSummaryRow(
                            'Total',
                            '\$${(finalAmount + 5).toStringAsFixed(2)}',
                            isBold: true,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Container(
              padding: const EdgeInsets.all(16.0),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withOpacity(0.3),
                    spreadRadius: 1,
                    blurRadius: 5,
                    offset: const Offset(0, -2),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Total Amount:',
                        style: TextStyle(
                            fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        '\$${(finalAmount + 5).toStringAsFixed(2)}',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: Colors.blue[700],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: _placeOrder,
                    style: ElevatedButton.styleFrom(
                      minimumSize: const Size(double.infinity, 56),
                      backgroundColor: Colors.blue[700],
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('Place Order',
                        style: TextStyle(fontSize: 18)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection({required String title, required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.2),
            spreadRadius: 1,
            blurRadius: 5,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value,
      {bool isBold = false, Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: isBold ? 18 : 16,
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
              color: color,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: isBold ? 18 : 16,
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

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
import 'package:hawsni_app/core/themes/app_theme.dart';
import 'package:hawsni_app/core/widgets/spinning_loader.dart';

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

    try {
      _selectedAddress = _addresses.firstWhere((address) => address.isDefault);
    } catch (e) {
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
          backgroundColor: AppTheme.errorColor,
        ),
      );
      return;
    }

    final loadingSnackBar = SnackBar(
      content: const Row(
        children: [
          SizedBox(
            width: 20,
            height: 20,
            child: SpinningLoader(size: 20),
          ),
          SizedBox(width: 16),
          Text('Validating coupon...'),
        ],
      ),
      backgroundColor: AppTheme.primaryColor,
    );

    ScaffoldMessenger.of(context).showSnackBar(loadingSnackBar);

    try {
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
            backgroundColor: AppTheme.successColor,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Invalid or expired coupon code'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Error validating coupon. Please try again.'),
          backgroundColor: AppTheme.errorColor,
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
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const AlertDialog(
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SpinningLoader(size: 50, color: AppTheme.accentColor),
              SizedBox(height: 16),
              Text('Placing your order...'),
            ],
          ),
        ),
      );

      try {
        final cartState = context.read<CartBloc>().state;
        List<Map<String, dynamic>> orderItems = [];

        if (cartState is CartLoaded) {
          for (var item in cartState.items) {
            final priceString = item.price.replaceAll(RegExp(r'[^\d.]'), '');
            final price = double.tryParse(priceString) ?? 0.0;

            orderItems.add({
              'product': item.id,
              'name': item.name,
              'price': price,
              'quantity': item.quantity,
              'imageUrl': item.imageUrl,
            });
          }
        }

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

        final response = await ApiService.createOrder(orderData);

        Navigator.of(context).pop();

        if (response != null) {
          context.read<CartBloc>().add(ClearCart());

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
                        style: const TextStyle(color: AppTheme.successColor)),
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
                    Navigator.of(context).pop();
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
        Navigator.of(context).pop();

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
    final theme = Theme.of(context);
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
                      context,
                      title: 'Delivery Address',
                      child: Column(
                        children: [
                          if (_selectedAddress != null) ...[
                            ListTile(
                              title: Text(_selectedAddress!.title, style: theme.textTheme.titleMedium),
                              subtitle: Text(
                                  '${_selectedAddress!.fullName}\n${_selectedAddress!.address}, ${_selectedAddress!.city}, ${_selectedAddress!.country}\n${_selectedAddress!.phone}'),
                              trailing: const Icon(Icons.arrow_forward_ios, size: 16),
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
                      context,
                      title: 'Payment Method',
                      child: Column(
                        children: [
                          for (var method in ['Cash on Delivery', 'Credit Card', 'PayPal', 'Apple Pay', 'Google Pay', 'Bank Transfer'])
                            RadioListTile<String>(
                              title: Text(method),
                              value: method,
                              groupValue: _selectedPayment,
                              onChanged: (value) => setState(() => _selectedPayment = value!),
                              activeColor: AppTheme.primaryColor,
                              contentPadding: EdgeInsets.zero,
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildSection(
                      context,
                      title: 'Apply Coupon',
                      child: Column(
                        children: [
                          if (_appliedCoupon != null)
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.green[50],
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: AppTheme.successColor),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.check_circle,
                                      color: AppTheme.successColor),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'Coupon "$_appliedCoupon" applied',
                                      style: const TextStyle(
                                        color: AppTheme.successColor,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.close),
                                    onPressed: _removeCoupon,
                                    color: AppTheme.successColor,
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
                                    decoration: const InputDecoration(
                                      hintText: 'Enter coupon code',
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
                      context,
                      title: 'Order Summary',
                      child: Column(
                        children: [
                          _buildSummaryRow(context, 'Items (${widget.cartItems.length})',
                              '\$${widget.totalAmount.toStringAsFixed(2)}'),
                          _buildSummaryRow(context, 'Delivery Fee', '\$5.00'),
                          if (_discount > 0)
                            _buildSummaryRow(
                              context,
                              'Discount',
                              '-\$${_discount.toStringAsFixed(2)}',
                              color: AppTheme.successColor,
                            ),
                          const Divider(),
                          _buildSummaryRow(
                            context,
                            'Total',
                            '\$${(finalAmount + 5).toStringAsFixed(2)}',
                            isBold: true,
                            color: AppTheme.primaryColor,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Container(
              padding: const EdgeInsets.all(24.0),
              decoration: BoxDecoration(
                color: theme.cardTheme.color,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Total Amount:',
                        style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      Text(
                        '\$${(finalAmount + 5).toStringAsFixed(2)}',
                        style: theme.textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: AppTheme.primaryColor,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _placeOrder,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 18),
                      ),
                      child: const Text('Place Order',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(BuildContext context, {required String title, required Widget child}) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: theme.cardTheme.color,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }

  Widget _buildSummaryRow(BuildContext context, String label, String value,
      {bool isBold = false, Color? color}) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: theme.textTheme.bodyLarge?.copyWith(
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
              color: color,
            ),
          ),
          Text(
            value,
            style: theme.textTheme.bodyLarge?.copyWith(
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

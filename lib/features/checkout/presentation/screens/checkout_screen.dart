import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hawsni_app/features/cart/bloc/cart_bloc.dart';
import 'package:hawsni_app/features/cart/bloc/cart_event.dart';
import 'package:hawsni_app/features/cart/bloc/cart_state.dart';
import 'package:hawsni_app/features/orders/bloc/order_bloc.dart';
import 'package:hawsni_app/features/orders/bloc/order_event.dart';
import 'package:hawsni_app/features/orders/bloc/order_state.dart';
import 'package:hawsni_app/core/themes/app_theme.dart';
import 'package:hawsni_app/core/widgets/spinning_loader.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  bool _isLoading = false;

  void _processCheckout(List<CartItem> cartItems, double subtotal) {
    final orderData = {
      'shippingAddress':
          '123 Fashion Street, Luxury District, New York, NY 10001',
      'paymentMethod': 'Credit Card',
      'subtotal': subtotal,
      'discount': 0.0,
      'couponCode': null,
    };

    final items = cartItems
        .map((item) => {
              'product': item.productId,
              'name': item.name,
              'quantity': item.quantity,
              'price':
                  double.parse(item.price.replaceAll(RegExp(r'[^0-9.]'), '')),
            })
        .toList();

    context.read<OrderBloc>().add(CreateOrder(
          orderData: orderData,
          items: items,
        ));
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<OrderBloc, OrderState>(
      listener: (context, state) {
        if (state is OrderCreating) {
          setState(() => _isLoading = true);
        } else if (state is OrderCreated) {
          setState(() => _isLoading = false);
          context.read<CartBloc>().add(ClearCart());
          _showSuccessDialog();
        } else if (state is OrderError) {
          setState(() => _isLoading = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.message),
              backgroundColor: AppTheme.errorColor,
            ),
          );
        }
      },
      child: Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          title: const Text(
            'Checkout',
            style: TextStyle(
                fontFamily: 'Playfair Display', fontWeight: FontWeight.bold),
          ),
          backgroundColor: Colors.black,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ),
        body: _isLoading
            ? const Center(child: SpinningLoader())
            : BlocBuilder<CartBloc, CartState>(
                builder: (context, state) {
                  if (state is CartLoaded) {
                    double subtotal = state.items.fold(
                      0,
                      (sum, item) =>
                          sum +
                          (double.parse(item.price
                                  .replaceAll(RegExp(r'[^0-9.]'), '')) *
                              item.quantity),
                    );

                    return Stack(
                      children: [
                        SingleChildScrollView(
                          padding: EdgeInsets.fromLTRB(16, 16, 16,
                              MediaQuery.of(context).padding.bottom + 120),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildSectionTitle('Shipping Address'),
                              _buildGlassContainer(
                                child: Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(10),
                                      decoration: BoxDecoration(
                                        color: AppTheme.primaryColor
                                            .withOpacity(0.1),
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(Icons.location_on,
                                          color: AppTheme.primaryColor),
                                    ),
                                    const SizedBox(width: 16),
                                    const Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            'Home',
                                            style: TextStyle(
                                                color: Colors.white,
                                                fontWeight: FontWeight.bold),
                                          ),
                                          Text(
                                            '123 Fashion Street, Luxury District\nNew York, NY 10001',
                                            style:
                                                TextStyle(color: Colors.grey),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const Icon(Icons.arrow_forward_ios,
                                        color: Colors.grey, size: 16),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 24),
                              _buildSectionTitle('Payment Method'),
                              _buildGlassContainer(
                                child: Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(10),
                                      decoration: BoxDecoration(
                                        color: AppTheme.primaryColor
                                            .withOpacity(0.1),
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(Icons.credit_card,
                                          color: AppTheme.primaryColor),
                                    ),
                                    const SizedBox(width: 16),
                                    const Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            'MasterCard',
                                            style: TextStyle(
                                                color: Colors.white,
                                                fontWeight: FontWeight.bold),
                                          ),
                                          Text(
                                            '**** **** **** 1234',
                                            style:
                                                TextStyle(color: Colors.grey),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const Icon(Icons.arrow_forward_ios,
                                        color: Colors.grey, size: 16),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 24),
                              _buildSectionTitle('Order Summary'),
                              _buildGlassContainer(
                                child: Column(
                                  children: [
                                    _buildSummaryRow('Subtotal',
                                        '\$${subtotal.toStringAsFixed(2)}'),
                                    const SizedBox(height: 8),
                                    _buildSummaryRow('Shipping', '\$10.00'),
                                    const SizedBox(height: 8),
                                    _buildSummaryRow('Tax',
                                        '\$${(subtotal * 0.05).toStringAsFixed(2)}'),
                                    const Padding(
                                      padding:
                                          EdgeInsets.symmetric(vertical: 12),
                                      child: Divider(color: Colors.grey),
                                    ),
                                    _buildSummaryRow(
                                      'Total',
                                      '\$${(subtotal + 10 + (subtotal * 0.05)).toStringAsFixed(2)}',
                                      isTotal: true,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        Positioned(
                          bottom: 0,
                          left: 0,
                          right: 0,
                          child: ClipRRect(
                            child: BackdropFilter(
                              filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                              child: Container(
                                padding: EdgeInsets.fromLTRB(24, 24, 24,
                                    MediaQuery.of(context).padding.bottom + 24),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.05),
                                  border: Border(
                                      top: BorderSide(
                                          color:
                                              Colors.white.withOpacity(0.1))),
                                ),
                                child: SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton(
                                    onPressed: () =>
                                        _processCheckout(state.items, subtotal),
                                    style: ElevatedButton.styleFrom(
                                      padding: const EdgeInsets.symmetric(
                                          vertical: 20),
                                      backgroundColor: AppTheme.primaryColor,
                                      shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(30)),
                                      elevation: 10,
                                      shadowColor: AppTheme.primaryColor
                                          .withOpacity(0.4),
                                    ),
                                    child: const Text(
                                      'Place Order',
                                      style: TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.black,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    );
                  }
                  return const SizedBox();
                },
              ),
      ),
    );
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
        child: AlertDialog(
          backgroundColor: Colors.black.withOpacity(0.8),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: BorderSide(color: AppTheme.primaryColor.withOpacity(0.5)),
          ),
          title: const Icon(Icons.check_circle,
              color: AppTheme.primaryColor, size: 60),
          content: const Text(
            'Order Placed Successfully!',
            textAlign: TextAlign.center,
            style: TextStyle(
                color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
          ),
          actions: [
            Center(
              child: TextButton(
                onPressed: () {
                  Navigator.of(context).popUntil((route) => route.isFirst);
                },
                child: const Text(
                  'Continue Shopping',
                  style: TextStyle(color: AppTheme.primaryColor, fontSize: 16),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12, left: 4),
      child: Text(
        title,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 18,
          fontWeight: FontWeight.bold,
          fontFamily: 'Playfair Display',
        ),
      ),
    );
  }

  Widget _buildGlassContainer({required Widget child}) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: AppTheme.glassDecoration,
          child: child,
        ),
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value, {bool isTotal = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: isTotal ? Colors.white : Colors.grey,
            fontSize: isTotal ? 18 : 14,
            fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            color: isTotal ? AppTheme.primaryColor : Colors.white,
            fontSize: isTotal ? 20 : 14,
            fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ],
    );
  }
}

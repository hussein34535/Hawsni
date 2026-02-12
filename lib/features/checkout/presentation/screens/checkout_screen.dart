import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hwasi_app/features/cart/bloc/cart_bloc.dart';
import 'package:hwasi_app/features/cart/bloc/cart_event.dart';
import 'package:hwasi_app/features/cart/bloc/cart_state.dart';
import 'package:hwasi_app/features/orders/bloc/order_bloc.dart';
import 'package:hwasi_app/features/orders/bloc/order_event.dart';
import 'package:hwasi_app/features/orders/bloc/order_state.dart';
import 'package:hwasi_app/core/themes/app_theme.dart';
import 'package:hwasi_app/core/widgets/spinning_loader.dart';
import 'package:hwasi_app/l10n/generated/app_localizations.dart';

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
      'paymentMethod': 'Cash on Delivery',
      'subtotal': subtotal,
      'discount': 0.0,
      'couponCode': null,
    };

    final items = cartItems
        .map(
          (item) => {
            'product': item.productId,
            'name': item.name,
            'quantity': item.quantity,
            'price': double.parse(
              item.price.replaceAll(RegExp(r'[^0-9.]'), ''),
            ),
          },
        )
        .toList();

    context.read<OrderBloc>().add(
          CreateOrder(orderData: orderData, items: items),
        );
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
        appBar: AppBar(
          title: Text(
            AppLocalizations.of(context)!.checkout,
            style: AppTheme.textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: AppTheme.textPrimary,
            ),
          ),
          centerTitle: true,
          backgroundColor: AppTheme.scaffoldBackgroundColor,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: AppTheme.textPrimary),
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
                          (double.parse(
                                item.price.replaceAll(RegExp(r'[^0-9.]'), ''),
                              ) *
                              item.quantity),
                    );

                    return Stack(
                      children: [
                        SingleChildScrollView(
                          padding: EdgeInsets.fromLTRB(
                            20,
                            10,
                            20,
                            MediaQuery.of(context).padding.bottom + 120,
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildSectionTitle(
                                AppLocalizations.of(context)!.shippingAddress,
                              ),
                              Container(
                                padding: const EdgeInsets.all(16),
                                decoration: AppTheme.cardDecoration,
                                child: Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(10),
                                      decoration: BoxDecoration(
                                        color: AppTheme.primaryColor.withValues(
                                          alpha: 0.1,
                                        ),
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(
                                        Icons.location_on,
                                        color: AppTheme.primaryColor,
                                      ),
                                    ),
                                    const SizedBox(width: 16),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            AppLocalizations.of(
                                              context,
                                            )!
                                                .homeLabel,
                                            style: AppTheme
                                                .textTheme.titleMedium
                                                ?.copyWith(
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            '123 Fashion Street, Luxury District\nNew York, NY 10001',
                                            style:
                                                AppTheme.textTheme.bodyMedium,
                                          ),
                                        ],
                                      ),
                                    ),
                                    const Icon(
                                      Icons.arrow_forward_ios,
                                      color: AppTheme.textTertiary,
                                      size: 16,
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 24),
                              _buildSectionTitle(
                                AppLocalizations.of(context)!.paymentMethod,
                              ),
                              Container(
                                padding: const EdgeInsets.all(16),
                                decoration: AppTheme.cardDecoration,
                                child: Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(10),
                                      decoration: BoxDecoration(
                                        color: AppTheme.primaryColor.withValues(
                                          alpha: 0.1,
                                        ),
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(
                                        Icons
                                            .money, // Changed icon to money/cash
                                        color: AppTheme.primaryColor,
                                      ),
                                    ),
                                    const SizedBox(width: 16),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            AppLocalizations.of(context)!
                                                .paymentMethod, // Use localized "Payment Method" or hardcode "Cash on Delivery" if localization missing
                                            style: AppTheme
                                                .textTheme.titleMedium
                                                ?.copyWith(
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            'Cash on Delivery (Only option)',
                                            style:
                                                AppTheme.textTheme.bodyMedium,
                                          ),
                                        ],
                                      ),
                                    ),
                                    // Removed arrow as it is the only option
                                  ],
                                ),
                              ),
                              const SizedBox(height: 24),
                              _buildSectionTitle(
                                AppLocalizations.of(context)!.orderSummary,
                              ),
                              Container(
                                padding: const EdgeInsets.all(20),
                                decoration: AppTheme.cardDecoration,
                                child: Column(
                                  children: [
                                    _buildSummaryRow(
                                      AppLocalizations.of(context)!.subtotal,
                                      '\$${subtotal.toStringAsFixed(2)}',
                                    ),
                                    const SizedBox(height: 12),
                                    _buildSummaryRow(
                                      AppLocalizations.of(context)!.shipping,
                                      '\$10.00',
                                    ),
                                    const SizedBox(height: 12),
                                    _buildSummaryRow(
                                      AppLocalizations.of(context)!.tax,
                                      '\$${(subtotal * 0.05).toStringAsFixed(2)}',
                                    ),
                                    const Padding(
                                      padding: EdgeInsets.symmetric(
                                        vertical: 16,
                                      ),
                                      child: Divider(
                                        color: AppTheme.dividerColor,
                                      ),
                                    ),
                                    _buildSummaryRow(
                                      AppLocalizations.of(context)!.total,
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
                          child: Container(
                            padding: EdgeInsets.fromLTRB(
                              24,
                              24,
                              24,
                              MediaQuery.of(context).padding.bottom + 24,
                            ),
                            decoration: BoxDecoration(
                              color: AppTheme.surfaceColor,
                              boxShadow: [
                                BoxShadow(
                                  color: AppTheme.primaryColor.withValues(
                                    alpha: 0.08,
                                  ),
                                  blurRadius: 20,
                                  offset: const Offset(0, -5),
                                ),
                              ],
                              borderRadius: const BorderRadius.vertical(
                                top: Radius.circular(30),
                              ),
                            ),
                            child: SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: () =>
                                    _processCheckout(state.items, subtotal),
                                style: ElevatedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 20,
                                  ),
                                  backgroundColor: AppTheme.primaryColor,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  elevation: 8,
                                  shadowColor: AppTheme.primaryColor.withValues(
                                    alpha: 0.4,
                                  ),
                                ),
                                child: Text(
                                  AppLocalizations.of(context)!.placeOrder,
                                  style:
                                      AppTheme.textTheme.labelLarge?.copyWith(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
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
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.surfaceColor,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Icon(
          Icons.check_circle,
          color: AppTheme.successColor,
          size: 60,
        ),
        content: Text(
          AppLocalizations.of(context)!.orderPlacedSuccess,
          textAlign: TextAlign.center,
          style: AppTheme.textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          Center(
            child: TextButton(
              onPressed: () {
                Navigator.of(context).popUntil((route) => route.isFirst);
              },
              child: Text(
                AppLocalizations.of(context)!.continueShopping,
                style: AppTheme.textTheme.labelLarge?.copyWith(
                  color: AppTheme.primaryColor,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12, left: 4),
      child: Text(
        title,
        style: AppTheme.textTheme.headlineSmall?.copyWith(
          fontSize: 18,
          color: AppTheme.textSecondary,
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
          style: AppTheme.textTheme.bodyLarge?.copyWith(
            color: isTotal ? AppTheme.textPrimary : AppTheme.textSecondary,
            fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
          ),
        ),
        Text(
          value,
          style: AppTheme.textTheme.bodyLarge?.copyWith(
            color: isTotal ? AppTheme.primaryColor : AppTheme.textPrimary,
            fontSize: isTotal ? 20 : 16,
            fontWeight: isTotal ? FontWeight.bold : FontWeight.bold,
          ),
        ),
      ],
    );
  }
}

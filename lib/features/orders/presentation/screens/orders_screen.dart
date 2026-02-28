import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:hwasi_app/core/themes/app_theme.dart';
import 'package:hwasi_app/core/widgets/spinning_loader.dart';
import 'package:hwasi_app/features/orders/bloc/order_bloc.dart';
import 'package:hwasi_app/features/orders/bloc/order_event.dart';
import 'package:hwasi_app/features/orders/bloc/order_state.dart';
import 'package:hwasi_app/features/orders/presentation/widgets/tracking_stepper.dart';
import 'package:hwasi_app/l10n/generated/app_localizations.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  @override
  void initState() {
    super.initState();
    context.read<OrderBloc>().add(LoadOrders());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text(
          'طلباتي',
          style: TextStyle(fontFamily: 'Cairo',
            fontWeight: FontWeight.bold,
            color: AppTheme.textPrimary,
            fontSize: 20,
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
      body: BlocBuilder<OrderBloc, OrderState>(
        builder: (context, state) {
          if (state is OrderLoading) {
            return const Center(child: SpinningLoader());
          }

          if (state is OrderError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline,
                      size: 64, color: AppTheme.errorColor),
                  const SizedBox(height: 16),
                  Text(state.message,
                      style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary),
                      textAlign: TextAlign.center),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () =>
                        context.read<OrderBloc>().add(LoadOrders()),
                    style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryColor,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(30))),
                    child: Text(AppLocalizations.of(context)!.retry,
                        style: const TextStyle(color: Colors.white)),
                  ),
                ],
              ),
            );
          }

          if (state is OrderLoaded) {
            if (state.orders.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(32),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.05),
                            blurRadius: 20,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: const Icon(Icons.shopping_bag_outlined,
                          size: 64, color: AppTheme.primaryColor),
                    ),
                    const SizedBox(height: 24),
                    Text(AppLocalizations.of(context)!.noOrdersYet,
                        style: const TextStyle(fontFamily: 'Cairo',
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textPrimary)),
                    const SizedBox(height: 8),
                    Text(AppLocalizations.of(context)!.startShoppingToSeeOrders,
                        style: const TextStyle(fontFamily: 'Cairo',
                            fontSize: 16, color: AppTheme.textSecondary)),
                    const SizedBox(height: 32),
                    ElevatedButton(
                      onPressed: () => Navigator.of(context).pop(),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryColor,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 32, vertical: 16),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(30)),
                      ),
                      child: Text(AppLocalizations.of(context)!.startShopping,
                          style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              );
            }

            return RefreshIndicator(
              onRefresh: () async =>
                  context.read<OrderBloc>().add(LoadOrders()),
              color: AppTheme.primaryColor,
              backgroundColor: Colors.white,
              child: ListView.separated(
                padding: const EdgeInsets.all(20),
                itemCount: state.orders.length,
                separatorBuilder: (_, __) => const SizedBox(height: 16),
                itemBuilder: (context, index) =>
                    _buildOrderCard(context, state.orders[index]),
              ),
            );
          }

          return const SizedBox();
        },
      ),
    );
  }

  Widget _buildOrderCard(BuildContext context, Map<String, dynamic> order) {
    final orderId = order['id']?.toString().substring(0, 8) ?? 'N/A';
    final total = (order['total'] ?? order['subtotal'] ?? 0).toDouble();
    final status = order['status'] ?? 'Processing';
    final items = (order['items'] as List?) ?? [];
    final createdAt = order['created_at'] != null
        ? DateTime.tryParse(order['created_at'].toString())
        : null;

    // Get first product image
    String? productImage;
    if (items.isNotEmpty) {
      final firstItem = items[0];
      final product = firstItem['products'];
      final images = product?['images'] as List?;
      if (images != null && images.isNotEmpty) productImage = images[0];
    }

    return GestureDetector(
      onTap: () => _showOrderDetails(context, order),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  // Product image
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      color: AppTheme.scaffoldBackgroundColor,
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: productImage != null
                          ? Image.network(productImage,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => const Icon(
                                  Icons.shopping_bag,
                                  color: AppTheme.textTertiary))
                          : const Icon(Icons.shopping_bag,
                              color: AppTheme.textTertiary),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'طلب #$orderId',
                          style: const TextStyle(fontFamily: 'Cairo',
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.textPrimary),
                        ),
                        if (createdAt != null)
                          Text(
                            _formatDate(createdAt),
                            style: const TextStyle(fontFamily: 'Cairo',
                                fontSize: 12, color: AppTheme.textSecondary),
                          ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '${total.toStringAsFixed(0)} ج.م',
                        style: const TextStyle(fontFamily: 'Cairo',
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.black87),
                      ),
                      const SizedBox(height: 4),
                      _buildStatusBadge(status),
                    ],
                  ),
                ],
              ),
            ),
            // Estimated delivery banner
            if (status != 'Delivered' && status != 'Cancelled')
              Container(
                margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.blue.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.local_shipping_outlined,
                        size: 18, color: Colors.blue),
                    const SizedBox(width: 8),
                    Text(
                      _getEstimatedDelivery(order),
                      style: TextStyle(fontFamily: 'Cairo',
                          fontSize: 13,
                          color: Colors.blue[700],
                          fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
            // Footer
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius:
                    const BorderRadius.vertical(bottom: Radius.circular(20)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    AppLocalizations.of(context)!.itemsCount(items.length),
                    style: const TextStyle(fontFamily: 'Cairo',
                        color: AppTheme.textSecondary, fontSize: 13),
                  ),
                  const Row(
                    children: [
                      Text('تتبع الطلب',
                          style: TextStyle(fontFamily: 'Cairo',
                              fontSize: 13,
                              color: AppTheme.primaryColor,
                              fontWeight: FontWeight.w600)),
                      SizedBox(width: 4),
                      Icon(Icons.arrow_forward_ios,
                          size: 12, color: AppTheme.primaryColor),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    const months = [
      'يناير',
      'فبراير',
      'مارس',
      'أبريل',
      'مايو',
      'يونيو',
      'يوليو',
      'أغسطس',
      'سبتمبر',
      'أكتوبر',
      'نوفمبر',
      'ديسمبر'
    ];
    return '${date.day} ${months[date.month - 1]} ${date.year}';
  }

  String _getEstimatedDelivery(Map<String, dynamic> order) {
    final status = order['status'] ?? 'Processing';
    final createdAt = order['created_at'] != null
        ? DateTime.tryParse(order['created_at'].toString())
        : DateTime.now();
    final orderDate = createdAt ?? DateTime.now();

    // Default 3-7 days from order date
    final minDate = orderDate.add(const Duration(days: 3));
    final maxDate = orderDate.add(const Duration(days: 7));

    if (status == 'Shipped' || status == 'In Transit') {
      return 'متوقع الوصول: ${_formatDate(minDate)} - ${_formatDate(maxDate)}';
    }
    return 'التوصيل خلال 3-7 أيام عمل';
  }

  Widget _buildStatusBadge(String status) {
    Color color;
    String label;
    switch (status.toLowerCase()) {
      case 'delivered':
        color = Colors.green;
        label = 'تم التوصيل';
        break;
      case 'shipped':
        color = Colors.blue;
        label = 'تم الشحن';
        break;
      case 'in transit':
        color = Colors.orange;
        label = 'في الطريق';
        break;
      case 'cancelled':
        color = Colors.red;
        label = 'ملغي';
        break;
      default:
        color = Colors.grey[600]!;
        label = 'قيد المعالجة';
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(label,
          style: TextStyle(fontFamily: 'Cairo',
              fontSize: 11, fontWeight: FontWeight.bold, color: color)),
    );
  }

  void _showOrderDetails(BuildContext context, Map<String, dynamic> order) {
    final status = order['status'] ?? 'Processing';
    final createdAt = order['created_at'] != null
        ? DateTime.tryParse(order['created_at'].toString())
        : DateTime.now();
    final orderDate = _formatDate(createdAt ?? DateTime.now());

    // Extract expected days from our helper method
    final deliveryText = _getEstimatedDelivery(order);
    // Parse the days from text like "متوقع الوصول: 3-7 أيام"
    String expectedDays = '';
    if (deliveryText.contains('التوصيل خلال')) {
      expectedDays = deliveryText.replaceAll('التوصيل خلال ', '');
    } else if (deliveryText.contains('متوقع الوصول: ')) {
      expectedDays = deliveryText.replaceAll('متوقع الوصول: ', '');
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.85,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (context, scrollController) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          child: Column(
            children: [
              const SizedBox(height: 12),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2)),
              ),
              Expanded(
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.all(24),
                  children: [
                    // Title
                    const Text('تتبع الطلب',
                        style: TextStyle(fontFamily: 'Cairo',
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: Colors.black87),
                        textAlign: TextAlign.center),
                    const SizedBox(height: 4),
                    Text(
                        'رقم الطلب: #${order['id']?.toString().substring(0, 8) ?? 'N/A'}',
                        style: TextStyle(fontFamily: 'Cairo',
                            fontSize: 13, color: Colors.grey[500]),
                        textAlign: TextAlign.center),
                    const SizedBox(height: 24),

                    // Estimated delivery card
                    if (status != 'Delivered' && status != 'Cancelled')
                      Container(
                        margin: const EdgeInsets.only(bottom: 24),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Colors.blue.withValues(alpha: 0.08),
                              Colors.blue.withValues(alpha: 0.04)
                            ],
                          ),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                              color: Colors.blue.withValues(alpha: 0.2)),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: Colors.blue.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.local_shipping_outlined,
                                  color: Colors.blue, size: 24),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('موعد التوصيل المتوقع',
                                      style: TextStyle(fontFamily: 'Cairo',
                                          fontSize: 12,
                                          color: Colors.grey[500])),
                                  Text(
                                    _getEstimatedDelivery(order),
                                    style: TextStyle(fontFamily: 'Cairo',
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.blue[700]),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),

                    // Tracking stepper
                    TrackingStepper(
                      status: status,
                      orderDate: orderDate,
                      expectedDays: expectedDays,
                    ),
                    const SizedBox(height: 24),
                    const Divider(),
                    const SizedBox(height: 16),

                    // Order items
                    const Text('المنتجات',
                        style: TextStyle(fontFamily: 'Cairo',
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.black87)),
                    const SizedBox(height: 12),
                    if (order['items'] != null)
                      ...((order['items'] as List).map((item) => Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: Row(
                              children: [
                                Container(
                                  width: 56,
                                  height: 56,
                                  decoration: BoxDecoration(
                                    color: AppTheme.scaffoldBackgroundColor,
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: const Icon(Icons.shopping_bag,
                                      color: AppTheme.textTertiary),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(item['name'] ?? 'منتج',
                                          style: const TextStyle(fontFamily: 'Cairo',
                                              fontSize: 14,
                                              fontWeight: FontWeight.bold,
                                              color: AppTheme.textPrimary)),
                                      Text(
                                          AppLocalizations.of(context)!
                                              .quantityAbbr(item['quantity']),
                                          style: const TextStyle(fontFamily: 'Cairo',
                                              color: AppTheme.textSecondary,
                                              fontSize: 13)),
                                    ],
                                  ),
                                ),
                                Text(
                                    '${((item['price'] as num?) ?? 0).toStringAsFixed(0)} ج.م',
                                    style: const TextStyle(fontFamily: 'Cairo',
                                        fontSize: 15,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.black87)),
                              ],
                            ),
                          ))),

                    // Total
                    const Divider(),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('الإجمالي',
                            style: TextStyle(fontFamily: 'Cairo',
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Colors.black87)),
                        Text(
                            '${(order['total'] ?? order['subtotal'] ?? 0).toStringAsFixed(0)} ج.م',
                            style: const TextStyle(fontFamily: 'Cairo',
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Colors.black)),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:hwasi_app/core/themes/app_theme.dart';
import 'package:hwasi_app/core/widgets/spinning_loader.dart';
import 'package:hwasi_app/features/orders/bloc/order_bloc.dart';
import 'package:hwasi_app/features/orders/bloc/order_event.dart';
import 'package:hwasi_app/features/orders/bloc/order_state.dart';
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
    // Only load if not already loaded (avoids race with bloc's own init)
    final currentState = context.read<OrderBloc>().state;
    if (currentState is! OrderLoaded && currentState is! OrderLoading) {
      context.read<OrderBloc>().add(LoadOrders());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F7F7),
      appBar: AppBar(
        title: const Text(
          'طلباتي',
          style: TextStyle(
            fontFamily: 'Cairo',
            fontWeight: FontWeight.w700,
            color: Colors.black87,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded,
              color: Colors.black87, size: 20),
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
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: Colors.red.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.error_outline,
                          size: 40, color: Colors.red),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      state.message,
                      style: const TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: () =>
                          context.read<OrderBloc>().add(LoadOrders()),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryColor,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 32, vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                        elevation: 0,
                      ),
                      child: Text(AppLocalizations.of(context)!.retry,
                          style: const TextStyle(
                              fontFamily: 'Cairo',
                              fontWeight: FontWeight.w600)),
                    ),
                  ],
                ),
              ),
            );
          }

          if (state is OrderLoaded) {
            if (state.orders.isEmpty) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 100,
                        height: 100,
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor.withValues(alpha: 0.08),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.receipt_long_outlined,
                            size: 48, color: AppTheme.primaryColor),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        AppLocalizations.of(context)!.noOrdersYet,
                        style: const TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        AppLocalizations.of(context)!.startShoppingToSeeOrders,
                        style: const TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 14,
                          color: Colors.grey,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 32),
                      ElevatedButton(
                        onPressed: () => Navigator.of(context).pop(),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryColor,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 36, vertical: 14),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                          elevation: 0,
                        ),
                        child: Text(
                          AppLocalizations.of(context)!.startShopping,
                          style: const TextStyle(
                            fontFamily: 'Cairo',
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }

            return RefreshIndicator(
              onRefresh: () async =>
                  context.read<OrderBloc>().add(LoadOrders()),
              color: AppTheme.primaryColor,
              backgroundColor: Colors.white,
              child: ListView.builder(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                itemCount: state.orders.length,
                itemBuilder: (context, index) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _buildOrderCard(context, state.orders[index]),
                  );
                },
              ),
            );
          }

          return const SizedBox();
        },
      ),
    );
  }

  Widget _buildOrderCard(BuildContext context, Map<String, dynamic> order) {
    final orderId = order['id']?.toString().substring(0, 8).toUpperCase() ?? 'N/A';
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
      if (productImage == null || productImage.isEmpty) {
        productImage = firstItem['image_url'] as String?;
      }
    }

    final statusConfig = _getStatusConfig(status);

    return GestureDetector(
      onTap: () => _showOrderDetails(context, order),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          child: InkWell(
            onTap: () => _showOrderDetails(context, order),
            borderRadius: BorderRadius.circular(16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Product thumbnail
                      Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF5F5F5),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: productImage != null && productImage.isNotEmpty
                            ? Image.network(
                                productImage,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => const Icon(
                                    Icons.shopping_bag_outlined,
                                    color: Color(0xFFBBBBBB),
                                    size: 28),
                              )
                            : const Icon(Icons.shopping_bag_outlined,
                                color: Color(0xFFBBBBBB), size: 28),
                      ),

                      const SizedBox(width: 12),

                      // Order info
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'طلب #$orderId',
                                  style: const TextStyle(
                                    fontFamily: 'Cairo',
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.black87,
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: statusConfig['color'] as Color,
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    statusConfig['label'] as String,
                                    style: TextStyle(
                                      fontFamily: 'Cairo',
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color:
                                          statusConfig['textColor'] as Color,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            if (createdAt != null)
                              Text(
                                _formatDate(createdAt),
                                style: TextStyle(
                                  fontFamily: 'Cairo',
                                  fontSize: 12,
                                  color: Colors.grey[500],
                                ),
                              ),
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  '${items.length} ${items.length == 1 ? 'منتج' : 'منتجات'}',
                                  style: TextStyle(
                                    fontFamily: 'Cairo',
                                    fontSize: 12,
                                    color: Colors.grey[500],
                                  ),
                                ),
                                Text(
                                  '${total.toStringAsFixed(0)} ج.م',
                                  style: const TextStyle(
                                    fontFamily: 'Cairo',
                                    fontSize: 15,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.black87,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  // Arrow hint
                  Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Text(
                          'تفاصيل الطلب',
                          style: TextStyle(
                            fontFamily: 'Cairo',
                            fontSize: 12,
                            color: AppTheme.primaryColor.withValues(alpha: 0.8),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Icon(Icons.arrow_forward_ios_rounded,
                            size: 11,
                            color:
                                AppTheme.primaryColor.withValues(alpha: 0.8)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Map<String, dynamic> _getStatusConfig(String status) {
    switch (status.toLowerCase()) {
      case 'delivered':
        return {
          'label': 'تم التوصيل',
          'color': Colors.green.withValues(alpha: 0.12),
          'textColor': Colors.green[700]!,
        };
      case 'shipped':
        return {
          'label': 'تم الشحن',
          'color': Colors.blue.withValues(alpha: 0.12),
          'textColor': Colors.blue[700]!,
        };
      case 'in transit':
        return {
          'label': 'في الطريق',
          'color': Colors.orange.withValues(alpha: 0.12),
          'textColor': Colors.orange[700]!,
        };
      case 'cancelled':
        return {
          'label': 'ملغي',
          'color': Colors.red.withValues(alpha: 0.10),
          'textColor': Colors.red[600]!,
        };
      default:
        return {
          'label': 'قيد المعالجة',
          'color': const Color(0xFFF0F0F0),
          'textColor': const Color(0xFF666666),
        };
    }
  }

  String _formatDate(DateTime date) {
    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return '${date.day} ${months[date.month - 1]} ${date.year}';
  }

  String _getEstimatedDelivery(Map<String, dynamic> order) {
    final status = order['status'] ?? 'Processing';
    if (status == 'Delivered') return '';
    if (status == 'Cancelled') return '';
    if (status == 'Shipped' || status == 'In Transit') {
      return 'متوقع الوصول خلال 1–3 أيام';
    }
    return 'التوصيل خلال 3–7 أيام عمل';
  }

  void _showOrderDetails(BuildContext context, Map<String, dynamic> order) {
    final status = order['status'] ?? 'Processing';
    final createdAt = order['created_at'] != null
        ? DateTime.tryParse(order['created_at'].toString())
        : DateTime.now();
    final orderDate = _formatDate(createdAt ?? DateTime.now());
    final orderId =
        order['id']?.toString().substring(0, 8).toUpperCase() ?? 'N/A';
    final items = (order['items'] as List?) ?? [];
    final total =
        (order['total'] ?? order['subtotal'] ?? 0).toDouble();
    final statusConfig = _getStatusConfig(status);
    final deliveryText = _getEstimatedDelivery(order);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      useSafeArea: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.9,
        minChildSize: 0.5,
        maxChildSize: 1.0,
        snap: true,
        builder: (context, scrollController) => Container(
          decoration: const BoxDecoration(
            color: Color(0xFFF7F7F7),
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              // Handle
              Container(
                margin: const EdgeInsets.only(top: 12, bottom: 8),
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),

              // Header inside sheet
              Container(
                color: Colors.transparent,
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.06),
                              blurRadius: 8,
                            )
                          ],
                        ),
                        child: const Icon(Icons.close_rounded,
                            size: 18, color: Colors.black54),
                      ),
                    ),
                    const Expanded(
                      child: Text(
                        'تفاصيل الطلب',
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: Colors.black87,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                    const SizedBox(width: 36),
                  ],
                ),
              ),

              Expanded(
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                  children: [
                    // Order ID + Status Card
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'طلب #$orderId',
                                  style: const TextStyle(
                                    fontFamily: 'Cairo',
                                    fontSize: 16,
                                    fontWeight: FontWeight.w800,
                                    color: Colors.black87,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  orderDate,
                                  style: TextStyle(
                                    fontFamily: 'Cairo',
                                    fontSize: 13,
                                    color: Colors.grey[500],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 14, vertical: 6),
                            decoration: BoxDecoration(
                              color: statusConfig['color'] as Color,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              statusConfig['label'] as String,
                              style: TextStyle(
                                fontFamily: 'Cairo',
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: statusConfig['textColor'] as Color,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 12),

                    // Delivery estimate (if active)
                    if (deliveryText.isNotEmpty)
                      Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 14),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor.withValues(alpha: 0.07),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.local_shipping_outlined,
                                size: 20,
                                color: AppTheme.primaryColor.withValues(alpha: 0.9)),
                            const SizedBox(width: 10),
                            Text(
                              deliveryText,
                              style: const TextStyle(
                                fontFamily: 'Cairo',
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.primaryColor,
                              ),
                            ),
                          ],
                        ),
                      ),

                    // Tracking Steps
                    _buildTrackingCard(status, orderDate),

                    const SizedBox(height: 12),

                    // Items Card
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'المنتجات',
                            style: TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: Colors.black87,
                            ),
                          ),
                          const SizedBox(height: 12),
                          if (items.isNotEmpty)
                            ...items.asMap().entries.map((entry) {
                              final idx = entry.key;
                              final item = entry.value as Map<String, dynamic>;
                              final isLast = idx == items.length - 1;

                              final product = item['products'];
                              final images = product?['images'] as List?;
                              String? imgUrl;
                              if (images != null && images.isNotEmpty) {
                                imgUrl = images[0] as String?;
                              }
                              imgUrl ??= item['image_url'] as String?;

                              final itemName =
                                  item['name'] ?? product?['name'] ?? 'منتج';
                              final qty = item['quantity'] ?? 1;
                              final price =
                                  ((item['price'] as num?) ?? 0).toDouble();
                              final size = item['size'];
                              final color = item['color'];

                              return Column(
                                children: [
                                  Row(
                                    crossAxisAlignment: CrossAxisAlignment.center,
                                    children: [
                                      Container(
                                        width: 56,
                                        height: 56,
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFF5F5F5),
                                          borderRadius:
                                              BorderRadius.circular(10),
                                        ),
                                        clipBehavior: Clip.antiAlias,
                                        child: imgUrl != null &&
                                                imgUrl.isNotEmpty
                                            ? Image.network(imgUrl,
                                                fit: BoxFit.cover,
                                                errorBuilder: (_, __, ___) =>
                                                    const Icon(
                                                        Icons.shopping_bag_outlined,
                                                        color: Color(0xFFBBBBBB),
                                                        size: 26))
                                            : const Icon(
                                                Icons.shopping_bag_outlined,
                                                color: Color(0xFFBBBBBB),
                                                size: 26),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              itemName,
                                              style: const TextStyle(
                                                fontFamily: 'Cairo',
                                                fontSize: 14,
                                                fontWeight: FontWeight.w600,
                                                color: Colors.black87,
                                              ),
                                              maxLines: 2,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              [
                                                if (size != null &&
                                                    size.toString().isNotEmpty)
                                                  'مقاس: $size',
                                                if (color != null &&
                                                    color.toString().isNotEmpty)
                                                  'لون: $color',
                                                'x$qty',
                                              ].join('  •  '),
                                              style: TextStyle(
                                                fontFamily: 'Cairo',
                                                fontSize: 12,
                                                color: Colors.grey[500],
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        '${(price * qty).toStringAsFixed(0)} ج.م',
                                        style: const TextStyle(
                                          fontFamily: 'Cairo',
                                          fontSize: 14,
                                          fontWeight: FontWeight.w700,
                                          color: Colors.black87,
                                        ),
                                      ),
                                    ],
                                  ),
                                  if (!isLast)
                                    Divider(
                                      height: 24,
                                      color: Colors.grey[100],
                                    ),
                                ],
                              );
                            }),
                        ],
                      ),
                    ),

                    const SizedBox(height: 12),

                    // Total card
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 20, vertical: 18),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'الإجمالي',
                            style: TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: Colors.black87,
                            ),
                          ),
                          Text(
                            '${total.toStringAsFixed(0)} ج.م',
                            style: const TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: Colors.black,
                            ),
                          ),
                        ],
                      ),
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

  Widget _buildTrackingCard(String status, String orderDate) {
    final isCancelled = status.toLowerCase() == 'cancelled';

    final steps = [
      {'title': 'تم استلام الطلب', 'icon': Icons.receipt_long_outlined},
      {'title': 'تم التأكيد', 'icon': Icons.check_circle_outline_rounded},
      {'title': 'جاري التجهيز', 'icon': Icons.inventory_2_outlined},
      {'title': 'في الطريق إليك', 'icon': Icons.local_shipping_outlined},
      {'title': 'تم التوصيل', 'icon': Icons.home_outlined},
    ];

    int currentIndex = 0;
    switch (status.toLowerCase()) {
      case 'pending':
        currentIndex = 0;
        break;
      case 'confirmed':
        currentIndex = 1;
        break;
      case 'processing':
        currentIndex = 2;
        break;
      case 'shipped':
      case 'in transit':
        currentIndex = 3;
        break;
      case 'delivered':
        currentIndex = 4;
        break;
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                isCancelled ? Icons.cancel_outlined : Icons.route_outlined,
                size: 18,
                color: isCancelled ? Colors.red : AppTheme.primaryColor,
              ),
              const SizedBox(width: 8),
              Text(
                isCancelled ? 'الطلب ملغي' : 'تتبع حالة الطلب',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color:
                      isCancelled ? Colors.red : Colors.black87,
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          if (!isCancelled)
            ...steps.asMap().entries.map((entry) {
              final idx = entry.key;
              final step = entry.value;
              final isCompleted = currentIndex >= idx;
              final isCurrent = currentIndex == idx;
              final isLast = idx == steps.length - 1;

              return Padding(
                padding: const EdgeInsets.only(bottom: 0),
                child: IntrinsicHeight(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Timeline column
                      SizedBox(
                        width: 36,
                        child: Column(
                          children: [
                            // Circle
                            Container(
                              width: 32,
                              height: 32,
                              decoration: BoxDecoration(
                                color: isCompleted
                                    ? AppTheme.primaryColor
                                    : Colors.white,
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: isCompleted
                                      ? AppTheme.primaryColor
                                      : Colors.grey[300]!,
                                  width: 1.5,
                                ),
                              ),
                              child: Icon(
                                step['icon'] as IconData,
                                size: 16,
                                color: isCompleted
                                    ? Colors.white
                                    : Colors.grey[400],
                              ),
                            ),
                            // Connecting line
                            if (!isLast)
                              Expanded(
                                child: Container(
                                  width: 1.5,
                                  margin: const EdgeInsets.symmetric(
                                      vertical: 3),
                                  color: isCompleted && currentIndex > idx
                                      ? AppTheme.primaryColor.withValues(alpha: 0.3)
                                      : Colors.grey[200],
                                ),
                              ),
                          ],
                        ),
                      ),

                      const SizedBox(width: 12),

                      // Step label
                      Expanded(
                        child: Padding(
                          padding: EdgeInsets.only(
                              top: 6, bottom: isLast ? 0 : 24),
                          child: Text(
                            step['title'] as String,
                            style: TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 14,
                              fontWeight: isCurrent
                                  ? FontWeight.w700
                                  : FontWeight.w500,
                              color: isCompleted
                                  ? Colors.black87
                                  : Colors.grey[400],
                            ),
                          ),
                        ),
                      ),

                      // Check mark for completed
                      if (isCompleted)
                        Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Icon(
                            Icons.check_rounded,
                            size: 16,
                            color: AppTheme.primaryColor.withValues(alpha: 0.7),
                          ),
                        ),
                    ],
                  ),
                ),
              );
            })
          else
            Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: Column(
                  children: [
                    Icon(Icons.cancel_outlined, size: 48, color: Colors.red[300]),
                    const SizedBox(height: 10),
                    Text(
                      'تم إلغاء هذا الطلب',
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 14,
                        color: Colors.red[400],
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

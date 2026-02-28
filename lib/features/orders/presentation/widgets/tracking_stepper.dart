import 'package:flutter/material.dart';
import 'package:hwasi_app/core/themes/app_theme.dart';


class TrackingStepper extends StatelessWidget {
  final String status;
  final String orderDate;
  final String expectedDays;

  const TrackingStepper({
    super.key,
    required this.status,
    required this.orderDate,
    this.expectedDays = '',
  });

  int _getStatusIndex(String status) {
    switch (status.toLowerCase()) {
      case 'معلق':
      case 'pending':
        return 0;
      case 'تم التأكيد':
      case 'confirmed':
        return 1;
      case 'جاري التجهيز':
      case 'processing':
        return 2;
      case 'تم الشحن':
      case 'shipped':
        return 3;
      case 'مكتمل':
      case 'completed':
      case 'تم التوصيل':
      case 'delivered':
        return 4;
      default:
        return 0; // default to pending if unknown
    }
  }

  bool _isCancelled(String status) {
    return status.toLowerCase() == 'ملغي' ||
        status.toLowerCase() == 'cancelled';
  }

  @override
  Widget build(BuildContext context) {
    bool isCancelled = _isCancelled(status);
    int currentIndex = isCancelled ? -1 : _getStatusIndex(status);

    final steps = [
      {'title': 'تم استلام الطلب', 'icon': Icons.receipt_long},
      {'title': 'تم التأكيد', 'icon': Icons.check_circle_outline},
      {'title': 'جاري التجهيز', 'icon': Icons.inventory_2_outlined},
      {'title': 'في الطريق إليك', 'icon': Icons.local_shipping_outlined},
      {'title': 'تم التوصيل', 'icon': Icons.home_outlined},
    ];

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                isCancelled ? 'الطلب ملغي' : 'تتبع حالة الطلب',
                style: TextStyle(fontFamily: 'Cairo',
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: isCancelled ? Colors.red : AppTheme.primaryColor,
                ),
              ),
              if (!isCancelled && expectedDays.isNotEmpty) ...[
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.timer_outlined,
                          size: 14, color: AppTheme.primaryColor),
                      const SizedBox(width: 4),
                      Text(
                        'توصيل خلال $expectedDays',
                        style: const TextStyle(fontFamily: 'Cairo',
                          fontSize: 12,
                          color: AppTheme.primaryColor,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'تاريخ الطلب: $orderDate',
            style: TextStyle(fontFamily: 'Cairo',
              fontSize: 14,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 24),
          if (!isCancelled) ...[
            Stack(
              children: [
                Positioned(
                  left: 20,
                  top: 0,
                  bottom: 0,
                  child: Container(
                    width: 2,
                    decoration: BoxDecoration(
                      color: Colors.grey[200],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: steps.length,
                  itemBuilder: (context, index) {
                    final step = steps[index];
                    final isCompleted = currentIndex >= index;
                    final isCurrent = currentIndex == index;

                    return _buildStepItem(
                      step['title'] as String,
                      step['icon'] as IconData,
                      isCompleted,
                      isCurrent,
                      isLast: index == steps.length - 1,
                    );
                  },
                ),
              ],
            ),
          ] else ...[
            const Center(
              child: Column(
                children: [
                  Icon(Icons.cancel_outlined,
                      size: 60, color: Colors.red),
                  SizedBox(height: 16),
                  Text(
                    'عذراً، لقد تم إلغاء هذا الطلب.',
                    style: TextStyle(fontFamily: 'Cairo',
                      fontSize: 16,
                      color: Colors.red,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStepItem(
    String title,
    IconData icon,
    bool isCompleted,
    bool isCurrent, {
    required bool isLast,
  }) {
    return Padding(
      padding: EdgeInsets.only(bottom: isLast ? 0 : 24),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: isCompleted ? AppTheme.primaryColor : Colors.white,
              shape: BoxShape.circle,
              border: Border.all(
                color: isCompleted ? AppTheme.primaryColor : Colors.grey[300]!,
                width: 2,
              ),
              boxShadow: isCurrent
                  ? [
                      BoxShadow(
                        color: AppTheme.primaryColor.withValues(alpha: 0.3),
                        blurRadius: 8,
                        spreadRadius: 2,
                      )
                    ]
                  : null,
            ),
            child: Icon(
              icon,
              size: 20,
              color: isCompleted ? Colors.white : Colors.grey[400],
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Container(
              height: 40,
              alignment: Alignment.centerRight, // Adjust for RTL
              child: Text(
                title,
                style: TextStyle(fontFamily: 'Cairo',
                  fontSize: 16,
                  fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
                  color: isCompleted ? Colors.black87 : Colors.grey[500],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

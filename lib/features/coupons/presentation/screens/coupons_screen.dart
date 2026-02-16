import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:hwasi_app/core/themes/app_theme.dart';

import 'package:hwasi_app/core/widgets/spinning_loader.dart';

class CouponsScreen extends StatefulWidget {
  const CouponsScreen({super.key});

  @override
  State<CouponsScreen> createState() => _CouponsScreenState();
}

class _CouponsScreenState extends State<CouponsScreen> {
  List<Map<String, dynamic>> _coupons = [];
  bool _isLoading = true;
  bool _hasError = false;

  @override
  void initState() {
    super.initState();
    _loadCoupons();
  }

  Future<void> _loadCoupons() async {
    try {
      setState(() {
        _isLoading = true;
        _hasError = false;
      });

      // Simulate network delay
      await Future.delayed(const Duration(seconds: 1));

      final List<Map<String, dynamic>> sampleCoupons = [
        {
          'code': 'WELCOME10',
          'discount': 10,
          'description': '10% off your first order',
          'expiresAt': DateTime.now().add(const Duration(days: 30)),
          'isActive': true,
        },
        {
          'code': 'SAVE20',
          'discount': 20,
          'description': '20% off on orders over \$50',
          'expiresAt': DateTime.now().add(const Duration(days: 15)),
          'isActive': true,
        },
        {
          'code': 'hwasi50',
          'discount': 50,
          'description': '50% off on selected items',
          'expiresAt': DateTime.now().add(const Duration(days: 7)),
          'isActive': true,
        },
        {
          'code': 'EXPIRED10',
          'discount': 10,
          'description': '10% off (Expired)',
          'expiresAt': DateTime.now().subtract(const Duration(days: 5)),
          'isActive': false,
        },
      ];

      setState(() {
        _coupons = sampleCoupons;
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading coupons: $e');
      setState(() {
        _isLoading = false;
        _hasError = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text(
          'My Coupons',
          style: TextStyle(
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
          ? Center(child: SpinningLoader())
          : _hasError
              ? _buildErrorState()
              : _coupons.isEmpty
                  ? _buildEmptyState()
                  : RefreshIndicator(
                      onRefresh: _loadCoupons,
                      color: AppTheme.primaryColor,
                      backgroundColor: Colors.white,
                      child: ListView.separated(
                        padding: const EdgeInsets.all(24.0),
                        itemCount: _coupons.length,
                        separatorBuilder: (context, index) =>
                            const SizedBox(height: 16),
                        itemBuilder: (context, index) {
                          final coupon = _coupons[index];
                          return _buildCouponCard(coupon);
                        },
                      ),
                    ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.error_outline,
            size: 64,
            color: AppTheme.errorColor,
          ),
          const SizedBox(height: 16),
          const Text(
            'Failed to load coupons',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'Please try again later',
            style: TextStyle(fontSize: 16, color: AppTheme.textSecondary),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _loadCoupons,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryColor,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30)),
            ),
            child: const Text('Retry', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: const BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.local_offer_outlined,
              size: 48,
              color: AppTheme.textTertiary,
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'No coupons available',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'Check back later for exclusive offers',
            style: TextStyle(fontSize: 16, color: AppTheme.textSecondary),
          ),
        ],
      ),
    );
  }

  Widget _buildCouponCard(Map<String, dynamic> coupon) {
    final bool isExpired =
        !coupon['isActive'] || coupon['expiresAt'].isBefore(DateTime.now());

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.borderColor),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Column(
          children: [
            // Coupon header with discount info
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: isExpired ? Colors.grey[200] : AppTheme.primaryColor,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${coupon['discount']}% OFF',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color:
                              isExpired ? AppTheme.textSecondary : Colors.white,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Limited Time Offer',
                        style: TextStyle(
                          fontSize: 14,
                          color: isExpired
                              ? AppTheme.textTertiary
                              : Colors.white.withValues(alpha: 0.9),
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: isExpired
                          ? Colors.white.withValues(alpha: 0.5)
                          : Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                          color: isExpired
                              ? Colors.transparent
                              : Colors.white.withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      children: [
                        Text(
                          coupon['code'],
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: isExpired
                                ? AppTheme.textSecondary
                                : Colors.white,
                            letterSpacing: 1,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Icon(Icons.copy,
                            color: isExpired
                                ? AppTheme.textSecondary
                                : Colors.white,
                            size: 16),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Coupon details
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    coupon['description'],
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: isExpired
                          ? AppTheme.textTertiary
                          : AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.access_time,
                          size: 16,
                          color: isExpired
                              ? AppTheme.errorColor
                              : AppTheme.successColor),
                      const SizedBox(width: 6),
                      Text(
                        isExpired
                            ? 'Expired'
                            : 'Expires on ${_formatDate(coupon['expiresAt'])}',
                        style: TextStyle(
                          fontSize: 14,
                          color: isExpired
                              ? AppTheme.errorColor
                              : AppTheme.successColor,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (!isExpired)
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          Clipboard.setData(
                              ClipboardData(text: coupon['code']));
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                  'Coupon "${coupon['code']}" copied to clipboard!'),
                              backgroundColor: AppTheme.successColor,
                              behavior: SnackBarBehavior.floating,
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10)),
                            ),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryColor,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(30)),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: const Text('Copy Code',
                            style: TextStyle(
                                fontSize: 16, fontWeight: FontWeight.bold)),
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

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}

import 'package:flutter/material.dart';

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

      // In a real app, you would fetch coupons from the backend
      // final coupons = await CouponService.getUserCoupons();

      // For now, we'll use sample data
      await Future.delayed(
          const Duration(seconds: 1)); // Simulate network delay

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
          'code': 'HAWSNI50',
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
      appBar: AppBar(
        title: const Text('My Coupons'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _hasError
              ? _buildErrorState()
              : _coupons.isEmpty
                  ? _buildEmptyState()
                  : RefreshIndicator(
                      onRefresh: _loadCoupons,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16.0),
                        itemCount: _coupons.length,
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
          Icon(
            Icons.error_outline,
            size: 80,
            color: Colors.grey[300],
          ),
          const SizedBox(height: 24),
          const Text(
            'Failed to load coupons',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'Please try again later',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _loadCoupons,
            child: const Text('Retry'),
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
          Icon(
            Icons.local_offer_outlined,
            size: 80,
            color: Colors.grey[300],
          ),
          const SizedBox(height: 24),
          const Text(
            'No coupons available',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'Check back later for exclusive offers',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCouponCard(Map<String, dynamic> coupon) {
    final bool isExpired =
        !coupon['isActive'] || coupon['expiresAt'].isBefore(DateTime.now());
    final Color cardColor = isExpired ? Colors.grey[200]! : Colors.blue[50]!;
    final Color textColor = isExpired ? Colors.grey : Colors.blue[700]!;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isExpired ? Colors.grey : Colors.blue,
          width: isExpired ? 1 : 2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 5,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Coupon header with discount info
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isExpired ? Colors.grey[300] : Colors.blue,
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(12)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${coupon['discount']}% OFF',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: isExpired ? Colors.grey[600] : Colors.white,
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: isExpired ? Colors.grey[400] : Colors.white,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    coupon['code'],
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: isExpired ? Colors.grey[700] : Colors.blue,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Coupon details
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  coupon['description'],
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                    color: isExpired ? Colors.grey[600] : Colors.black,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  isExpired
                      ? 'Expired'
                      : 'Expires on ${_formatDate(coupon['expiresAt'])}',
                  style: TextStyle(
                    fontSize: 14,
                    color: isExpired ? Colors.red : Colors.green,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 16),
                if (!isExpired)
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                                'Coupon "${coupon['code']}" copied to clipboard!'),
                            backgroundColor: Colors.green,
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Copy Code'),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}

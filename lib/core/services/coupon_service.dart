import 'package:flutter/foundation.dart';
import 'package:hwasi_app/core/services/api_service.dart';

class CouponService {
  // Validate coupon
  static Future<Map<String, dynamic>?> validateCoupon(String code) async {
    try {
      final data = await ApiService.post(
        '/coupons/validate',
        {
          'code': code,
        },
        includeAuth: true,
      );
      return data;
    } catch (e) {
      debugPrint('Error validating coupon: $e');
      return null;
    }
  }

  // Get user coupons
  static Future<List<dynamic>> getUserCoupons() async {
    try {
      final data = await ApiService.get('/coupons', includeAuth: true);
      return data['coupons'] ?? [];
    } catch (e) {
      debugPrint('Error fetching coupons: $e');
      return [];
    }
  }
}

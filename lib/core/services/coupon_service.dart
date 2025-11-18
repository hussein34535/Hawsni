import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:hawsni_app/core/services/auth_service.dart';

class CouponService {
  static const String baseUrl = 'http://192.168.100.8:5000/api';

  // Helper method to get headers with auth token
  static Map<String, String> _getHeaders() {
    final headers = {
      'Content-Type': 'application/json',
    };

    if (AuthService.token != null) {
      headers['Authorization'] = 'Bearer ${AuthService.token}';
    }

    return headers;
  }

  // Validate coupon
  static Future<Map<String, dynamic>?> validateCoupon(String code) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/coupons/validate'),
        headers: _getHeaders(),
        body: json.encode({
          'code': code,
        }),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data;
      } else {
        print('Failed to validate coupon: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Error validating coupon: $e');
      return null;
    }
  }

  // Get user coupons
  static Future<List<dynamic>> getUserCoupons() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/coupons'),
        headers: _getHeaders(),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['coupons'] ?? [];
      } else {
        print('Failed to load coupons: ${response.body}');
        return [];
      }
    } catch (e) {
      print('Error fetching coupons: $e');
      return [];
    }
  }
}

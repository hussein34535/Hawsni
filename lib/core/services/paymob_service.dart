import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';

class PaymobService {
  // TODO: Replace with actual keys from secure storage or config
  static const String _apiKey = 'YOUR_PAYMOB_API_KEY';
  static const String _integrationId = 'YOUR_PAYMOB_INTEGRATION_ID';
  static const String _iframeId = 'YOUR_PAYMOB_IFRAME_ID';

  static const String _baseUrl = 'https://accept.paymob.com/api';

  String? _authToken;

  // 1. Authentication Request
  Future<String?> authenticate() async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/auth/tokens'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'api_key': _apiKey}),
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        _authToken = data['token'];
        debugPrint('Paymob Auth Token: $_authToken');
        return _authToken;
      } else {
        debugPrint('Paymob Auth Error: ${response.body}');
        return null;
      }
    } catch (e) {
      debugPrint('Paymob Auth Exception: $e');
      return null;
    }
  }

  // 2. Order Registration API
  Future<String?> registerOrder({
    required String authToken,
    required String amountCents,
    required List items,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/ecommerce/orders'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'auth_token': authToken,
          'delivery_needed': 'false',
          'amount_cents': amountCents,
          'currency': 'EGP',
          'items': items,
        }),
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        final orderId = data['id'].toString();
        debugPrint('Paymob Order ID: $orderId');
        return orderId;
      } else {
        debugPrint('Paymob Order Error: ${response.body}');
        return null;
      }
    } catch (e) {
      debugPrint('Paymob Order Exception: $e');
      return null;
    }
  }

  // 3. Payment Key Request
  Future<String?> getPaymentKey({
    required String authToken,
    required String orderId,
    required String amountCents,
    required Map<String, dynamic> billingData,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/acceptance/payment_keys'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'auth_token': authToken,
          'amount_cents': amountCents,
          'expiration': 3600,
          'order_id': orderId,
          'billing_data': billingData,
          'currency': 'EGP',
          'integration_id': _integrationId,
        }),
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        final paymentKey = data['token'];
        debugPrint('Paymob Payment Key: $paymentKey');
        return paymentKey;
      } else {
        debugPrint('Paymob Payment Key Error: ${response.body}');
        return null;
      }
    } catch (e) {
      debugPrint('Paymob Payment Key Exception: $e');
      return null;
    }
  }

  // Helper to get Iframe URL
  String getIframeUrl(String paymentKey) {
    return '$_baseUrl/acceptance/iframes/$_iframeId?payment_token=$paymentKey';
  }
}

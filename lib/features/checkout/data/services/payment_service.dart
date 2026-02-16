import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:hwasi_app/core/services/api_service.dart';
import 'package:hwasi_app/core/services/auth_service.dart';

class PaymentService {
  // Stripe: Create Payment Intent
  Future<Map<String, dynamic>> createStripePaymentIntent(
      double amount, String currency) async {
    final token = await AuthService.getToken();
    final response = await http.post(
      Uri.parse('${ApiService.baseUrl}/api/payment/stripe/intent'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'amount': amount,
        'currency': currency,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(
          'Failed to create Stripe payment intent: ${response.body}');
    }
  }

  // PayPal: Create Order
  Future<Map<String, dynamic>> createPaypalOrder(
      double amount, String currency) async {
    final token = await AuthService.getToken();
    final response = await http.post(
      Uri.parse('${ApiService.baseUrl}/api/payment/paypal/create'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'amount': amount,
        'currency': currency,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to create PayPal order: ${response.body}');
    }
  }

  // PayPal: Capture Order
  Future<Map<String, dynamic>> capturePaypalOrder(String orderId) async {
    final token = await AuthService.getToken();
    final response = await http.post(
      Uri.parse('${ApiService.baseUrl}/api/payment/paypal/capture'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'orderId': orderId,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to capture PayPal order: ${response.body}');
    }
  }
}

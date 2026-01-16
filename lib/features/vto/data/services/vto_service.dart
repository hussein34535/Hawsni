import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:hawsni_app/core/config/app_config.dart';
import 'package:hawsni_app/core/services/api_service.dart';

class VtoService {
  static const String _baseUrl = '${AppConfig.apiBaseUrl}/vto';

  static Future<Map<String, dynamic>> startTryOn({
    required String humanImageUrl,
    required String garmentImageUrl,
    String? description,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/try-on'),
        headers: ApiService.headers,
        body: jsonEncode({
          'human_image': humanImageUrl,
          'garment_image': garmentImageUrl,
          'description': description,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to start try-on: ${response.body}');
      }
    } catch (e) {
      print('VTO Start Error: $e');
      rethrow;
    }
  }

  static Future<Map<String, dynamic>> checkStatus(String id) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/status/$id'),
        headers: ApiService.headers,
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to check status: ${response.body}');
      }
    } catch (e) {
      print('VTO Status Error: $e');
      rethrow;
    }
  }
}

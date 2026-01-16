import 'package:hawsni_app/core/services/api_service.dart';

class VtoService {
  static const String _vtoEndpoint = '/vto';

  static Future<Map<String, dynamic>> startTryOn({
    required String humanImageUrl,
    required String garmentImageUrl,
    String? description,
  }) async {
    try {
      final response = await ApiService.post(
        '$_vtoEndpoint/try-on',
        {
          'human_image': humanImageUrl,
          'garment_image': garmentImageUrl,
          'description': description,
        },
        includeAuth: true,
      );

      return response;
    } catch (e) {
      // ApiService already logs errors
      rethrow;
    }
  }

  static Future<Map<String, dynamic>> checkStatus(String id) async {
    try {
      final response = await ApiService.get(
        '$_vtoEndpoint/status/$id',
        includeAuth: true,
      );

      return response;
    } catch (e) {
      rethrow;
    }
  }
}

import 'dart:convert';
import 'package:hawsni_app/core/services/api_service.dart';
import 'package:hawsni_app/features/home/data/models/category_model.dart';

class CategoryService {
  Future<List<CategoryModel>> getCategories() async {
    try {
      final response = await ApiService.get('/categories');

      if (response['success'] == true) {
        final List<dynamic> categoriesJson = response['categories'];
        return categoriesJson
            .map((json) => CategoryModel.fromJson(json))
            .toList();
      } else {
        throw Exception(response['message'] ?? 'Failed to load categories');
      }
    } catch (e) {
      throw Exception('Error fetching categories: $e');
    }
  }
}

import 'package:flutter/foundation.dart';
import 'package:hwasi_app/core/services/api_service.dart';
import 'package:hwasi_app/features/products/data/models/product_model.dart';

class ProductService {
  Future<List<ProductModel>> getProducts({String? categoryId}) async {
    try {
      String endpoint = '/products';
      if (categoryId != null &&
          categoryId.isNotEmpty &&
          categoryId != 'All' &&
          categoryId != 'Featured') {
        endpoint += '?category=$categoryId';
      }

      final data = await ApiService.get(endpoint);

      if (data['success'] == true) {
        final List<dynamic> productsJson = data['products'] ?? [];
        return productsJson.map((json) => ProductModel.fromJson(json)).toList();
      } else {
        throw Exception(data['message'] ?? 'Failed to load products');
      }
    } catch (e) {
      debugPrint('Error fetching products: $e');
      rethrow;
    }
  }

  Future<ProductModel> getProductById(String id) async {
    try {
      final data = await ApiService.get('/products/$id');

      if (data['success'] == true) {
        return ProductModel.fromJson(data['product']);
      } else {
        throw Exception(data['message'] ?? 'Failed to load product');
      }
    } catch (e) {
      debugPrint('Error fetching product: $e');
      rethrow;
    }
  }

  Future<List<ProductModel>> getFeaturedProducts() async {
    try {
      final data = await ApiService.get('/products/featured');

      if (data['success'] == true) {
        final List<dynamic> productsJson = data['products'];
        return productsJson.map((json) => ProductModel.fromJson(json)).toList();
      } else {
        throw Exception(data['message'] ?? 'Failed to load featured products');
      }
    } catch (e) {
      debugPrint('Error fetching featured products: $e');
      rethrow;
    }
  }
}

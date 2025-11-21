import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:hawsni_app/core/services/api_service.dart';
import 'package:hawsni_app/features/products/data/models/product_model.dart';

class ProductService {
  Future<List<ProductModel>> getProducts({String? category}) async {
    try {
      String url = '${ApiService.baseUrl}/products';
      if (category != null &&
          category.isNotEmpty &&
          category != 'All' &&
          category != 'Featured') {
        url += '?category=$category';
      }

      // Handle 'Featured' as a special case if needed, or backend handles it
      // For now assuming backend has a generic products endpoint

      final response = await http.get(Uri.parse(url));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> productsJson = data['products'] ?? [];
        return productsJson.map((json) => ProductModel.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load products');
      }
    } catch (e) {
      print('Error fetching products: $e');
      throw e;
    }
  }

  Future<ProductModel> getProductById(String id) async {
    try {
      final response =
          await http.get(Uri.parse('${ApiService.baseUrl}/products/$id'));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return ProductModel.fromJson(data['product']);
      } else {
        throw Exception('Failed to load product');
      }
    } catch (e) {
      print('Error fetching product: $e');
      throw e;
    }
  }

  Future<List<ProductModel>> getFeaturedProducts() async {
    try {
      final response =
          await http.get(Uri.parse('${ApiService.baseUrl}/products/featured'));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          final List<dynamic> productsJson = data['products'];
          return productsJson
              .map((json) => ProductModel.fromJson(json))
              .toList();
        } else {
          throw Exception(
              data['message'] ?? 'Failed to load featured products');
        }
      } else {
        throw Exception(
            'Failed to load featured products: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching featured products: $e');
      throw e;
    }
  }
}

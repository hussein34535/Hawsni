import 'package:hawsni_app/core/services/api_service.dart';
import 'package:hawsni_app/features/products/data/models/product_model.dart';

class ProductService {
  Future<List<ProductModel>> getProducts({String? category}) async {
    try {
      String endpoint = '/products';
      if (category != null &&
          category.isNotEmpty &&
          category != 'All' &&
          category != 'Featured') {
        endpoint += '?category=$category';
      }

      final data = await ApiService.get(endpoint);

      if (data['success'] == true) {
        final List<dynamic> productsJson = data['products'] ?? [];
        return productsJson.map((json) => ProductModel.fromJson(json)).toList();
      } else {
        throw Exception(data['message'] ?? 'Failed to load products');
      }
    } catch (e) {
      print('Error fetching products: $e');
      throw e;
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
      print('Error fetching product: $e');
      throw e;
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
      print('Error fetching featured products: $e');
      throw e;
    }
  }
}

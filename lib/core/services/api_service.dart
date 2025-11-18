import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:hawsni_app/core/services/auth_service.dart';

class ApiService {
  // Change this to your computer's IP address if testing on physical device
  // For emulator, use 10.0.2.2 or your computer's IP address
  static const String baseUrl = 'http://192.168.100.8:5000/api';

  // Helper method to get headers with optional auth token
  static Map<String, String> _getHeaders({bool includeAuth = false}) {
    final headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && AuthService.token != null) {
      headers['Authorization'] = 'Bearer ${AuthService.token}';
    }

    return headers;
  }

  // Get all products
  static Future<List<dynamic>> getProducts() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/products'));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['products'] ?? [];
      } else {
        throw Exception('Failed to load products');
      }
    } catch (e) {
      print('Error fetching products: $e');
      return [];
    }
  }

  // Get product by ID
  static Future<Map<String, dynamic>?> getProduct(String id) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/products/$id'));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['product'];
      } else {
        throw Exception('Failed to load product');
      }
    } catch (e) {
      print('Error fetching product: $e');
      return null;
    }
  }

  // Get all categories
  static Future<List<dynamic>> getCategories() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/categories'));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['categories'] ?? [];
      } else {
        throw Exception('Failed to load categories');
      }
    } catch (e) {
      print('Error fetching categories: $e');
      return [];
    }
  }

  // Get products by category
  static Future<List<dynamic>> getProductsByCategory(String categoryId) async {
    try {
      final response =
          await http.get(Uri.parse('$baseUrl/products?category=$categoryId'));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['products'] ?? [];
      } else {
        throw Exception('Failed to load products');
      }
    } catch (e) {
      print('Error fetching products by category: $e');
      return [];
    }
  }

  // Search products
  static Future<List<dynamic>> searchProducts(String query) async {
    try {
      final response =
          await http.get(Uri.parse('$baseUrl/products?search=$query'));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['products'] ?? [];
      } else {
        throw Exception('Failed to search products');
      }
    } catch (e) {
      print('Error searching products: $e');
      return [];
    }
  }

  // Search products with filters and sorting
  static Future<List<dynamic>> searchProductsWithFilters({
    String? query,
    String? category,
    double? minPrice,
    double? maxPrice,
    String? sortBy,
    bool? isFeatured,
  }) async {
    try {
      // Build query parameters
      final queryParams = <String, String>{};

      if (query != null && query.isNotEmpty) {
        queryParams['search'] = query;
      }

      if (category != null && category.isNotEmpty) {
        queryParams['category'] = category;
      }

      if (minPrice != null) {
        queryParams['minPrice'] = minPrice.toString();
      }

      if (maxPrice != null) {
        queryParams['maxPrice'] = maxPrice.toString();
      }

      if (sortBy != null && sortBy.isNotEmpty) {
        queryParams['sort'] = sortBy;
      }

      if (isFeatured != null) {
        queryParams['featured'] = isFeatured.toString();
      }

      // Build URL with query parameters
      String url = '$baseUrl/products';
      if (queryParams.isNotEmpty) {
        url += '?';
        url += queryParams.entries.map((e) => '${e.key}=${e.value}').join('&');
      }

      final response = await http.get(Uri.parse(url));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['products'] ?? [];
      } else {
        throw Exception('Failed to search products');
      }
    } catch (e) {
      print('Error searching products with filters: $e');
      return [];
    }
  }

  // Create order
  static Future<Map<String, dynamic>?> createOrder(
      Map<String, dynamic> orderData) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/orders'),
        headers: _getHeaders(includeAuth: false), // Don't require auth for now
        body: json.encode(orderData),
      );

      if (response.statusCode == 201) {
        final data = json.decode(response.body);
        return data;
      } else {
        print('Failed to create order: ${response.body}');
        throw Exception('Failed to create order: ${response.body}');
      }
    } catch (e) {
      print('Error creating order: $e');
      return null;
    }
  }

  // Get user orders
  static Future<List<dynamic>> getUserOrders() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/orders'),
        headers: _getHeaders(includeAuth: false), // Don't require auth for now
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['orders'] ?? [];
      } else {
        print('Failed to load orders: ${response.body}');
        throw Exception('Failed to load orders: ${response.body}');
      }
    } catch (e) {
      print('Error fetching orders: $e');
      return [];
    }
  }

  // Get product reviews
  static Future<List<dynamic>> getProductReviews(String productId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/reviews/product/$productId'),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['reviews'] ?? [];
      } else {
        throw Exception('Failed to load reviews');
      }
    } catch (e) {
      print('Error fetching reviews: $e');
      return [];
    }
  }

  // Create review
  static Future<Map<String, dynamic>?> createReview({
    required String productId,
    required int rating,
    required String comment,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/reviews'),
        headers: _getHeaders(includeAuth: true),
        body: json.encode({
          'productId': productId,
          'rating': rating,
          'comment': comment,
        }),
      );

      if (response.statusCode == 201) {
        final data = json.decode(response.body);
        return data['review'];
      } else {
        print('Failed to create review: ${response.body}');
        throw Exception('Failed to create review: ${response.body}');
      }
    } catch (e) {
      print('Error creating review: $e');
      return null;
    }
  }

  // Get order tracking information
  static Future<Map<String, dynamic>?> getOrderTracking(String orderId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/orders/$orderId/tracking'),
        headers: _getHeaders(includeAuth: true),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['tracking'];
      } else {
        print('Failed to load tracking info: ${response.body}');
        throw Exception('Failed to load tracking info: ${response.body}');
      }
    } catch (e) {
      print('Error fetching tracking info: $e');
      return null;
    }
  }
}

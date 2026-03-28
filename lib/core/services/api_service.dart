import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:hwasi_app/core/config/app_config.dart';
import 'package:hwasi_app/core/services/auth_service.dart';

class ApiException implements Exception {
  final String message;
  final int statusCode;

  ApiException(this.message, this.statusCode);

  @override
  String toString() => 'ApiException: $message (Status: $statusCode)';
}

class ApiService {
  static late AppConfig _config;

  static String get baseUrl => _config.baseUrl;

  // Initialize the service with the correct configuration
  static void initialize(AppConfig config) {
    _config = config;
  }

  // Helper method to get headers with optional auth token
  static Map<String, String> _getHeaders({bool includeAuth = false}) {
    final headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };

    if (includeAuth && AuthService.token != null) {
      headers['Authorization'] = 'Bearer ${AuthService.token}';
    }

    return headers;
  }

  // Generic GET request
  static Future<dynamic> get(String endpoint, {bool includeAuth = true}) async {
    try {
      final String cacheBuster = endpoint.contains('?') 
          ? '&_t=${DateTime.now().millisecondsSinceEpoch}' 
          : '?_t=${DateTime.now().millisecondsSinceEpoch}';

      final response = await http.get(
        Uri.parse('${_config.baseUrl}$endpoint$cacheBuster'),
        headers: _getHeaders(includeAuth: includeAuth),
      );

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return json.decode(response.body);
      } else {
        throw ApiException(
            'Failed to load data: ${response.body}', response.statusCode);
      }
    } catch (e) {
      debugPrint('Error in GET $endpoint: $e');
      rethrow;
    }
  }

  // Generic POST request
  static Future<dynamic> post(String endpoint, Map<String, dynamic> data,
      {bool includeAuth = true}) async {
    try {
      final response = await http.post(
        Uri.parse('${_config.baseUrl}$endpoint'),
        headers: _getHeaders(includeAuth: includeAuth),
        body: json.encode(data),
      );

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return json.decode(response.body);
      } else {
        throw ApiException(
            'Failed to post data: ${response.body}', response.statusCode);
      }
    } catch (e) {
      debugPrint('Error in POST $endpoint: $e');
      rethrow;
    }
  }

  // Generic PUT request
  static Future<dynamic> put(String endpoint, Map<String, dynamic> data,
      {bool includeAuth = true}) async {
    try {
      final response = await http.put(
        Uri.parse('${_config.baseUrl}$endpoint'),
        headers: _getHeaders(includeAuth: includeAuth),
        body: json.encode(data),
      );

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return json.decode(response.body);
      } else {
        throw ApiException(
            'Failed to put data: ${response.body}', response.statusCode);
      }
    } catch (e) {
      debugPrint('Error in PUT $endpoint: $e');
      rethrow;
    }
  }

  // Generic DELETE request
  static Future<dynamic> delete(String endpoint,
      {bool includeAuth = true}) async {
    try {
      final response = await http.delete(
        Uri.parse('${_config.baseUrl}$endpoint'),
        headers: _getHeaders(includeAuth: includeAuth),
      );

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return json.decode(response.body);
      } else {
        throw ApiException(
            'Failed to delete data: ${response.body}', response.statusCode);
      }
    } catch (e) {
      debugPrint('Error in DELETE $endpoint: $e');
      rethrow;
    }
  }

  // Get all products
  static Future<List<dynamic>> getProducts({String? categoryId}) async {
    try {
      String endpoint = '/products';
      if (categoryId != null && categoryId.isNotEmpty) {
        endpoint += '?category=$categoryId';
      }
      final data = await get(endpoint, includeAuth: false);
      return data['products'] ?? [];
    } catch (e) {
      debugPrint('Error fetching products: $e');
      return [];
    }
  }

  // Get product by ID
  static Future<Map<String, dynamic>?> getProduct(String id) async {
    try {
      final data = await get('/products/$id', includeAuth: false);
      return data['product'];
    } catch (e) {
      debugPrint('Error fetching product: $e');
      return null;
    }
  }

  // Get all categories
  static Future<List<dynamic>> getCategories() async {
    try {
      final data = await get('/categories', includeAuth: false);
      return data['categories'] ?? [];
    } catch (e) {
      debugPrint('Error fetching categories: $e');
      return [];
    }
  }

  // Search products
  static Future<List<dynamic>> searchProducts(String query) async {
    try {
      final data = await get('/products?search=$query', includeAuth: false);
      return data['products'] ?? [];
    } catch (e) {
      debugPrint('Error searching products: $e');
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
      String endpoint = '/products';
      if (queryParams.isNotEmpty) {
        endpoint += '?';
        endpoint +=
            queryParams.entries.map((e) => '${e.key}=${e.value}').join('&');
      }

      final data = await get(endpoint, includeAuth: false);
      return data['products'] ?? [];
    } catch (e) {
      debugPrint('Error searching products with filters: $e');
      return [];
    }
  }

  // Create order
  static Future<Map<String, dynamic>?> createOrder(
      Map<String, dynamic> orderData) async {
    try {
      final data = await post('/orders', orderData,
          includeAuth: AuthService.token != null);
      return data;
    } catch (e) {
      debugPrint('Error creating order: $e');
      return null;
    }
  }

  // Get user orders
  static Future<List<dynamic>> getUserOrders() async {
    try {
      final data = await get('/orders', includeAuth: true);
      return data['orders'] ?? [];
    } catch (e) {
      debugPrint('Error fetching orders: $e');
      return [];
    }
  }

  // Get product reviews
  static Future<List<dynamic>> getProductReviews(String productId) async {
    try {
      final data = await get('/reviews/product/$productId', includeAuth: false);
      return data['reviews'] ?? [];
    } catch (e) {
      debugPrint('Error fetching reviews: $e');
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
      final data = await post(
          '/reviews',
          {
            'productId': productId,
            'rating': rating,
            'comment': comment,
          },
          includeAuth: true);
      return data['review'];
    } catch (e) {
      debugPrint('Error creating review: $e');
      return null;
    }
  }

  // Get order tracking information
  static Future<Map<String, dynamic>?> getOrderTracking(String orderId) async {
    try {
      final data = await get('/orders/$orderId/tracking',
          includeAuth: AuthService.token != null);
      return data['tracking'];
    } catch (e) {
      debugPrint('Error fetching tracking info: $e');
      return null;
    }
  }

  // Get Banners
  static Future<List<dynamic>> getBanners() async {
    try {
      final data = await get('/banners', includeAuth: false);
      return data is List ? data : (data['banners'] ?? []);
    } catch (e) {
      debugPrint('Error fetching banners: $e');
      return [];
    }
  }

  // --- User Profile & Addresses ---

  // Get User Profile (Real Data)
  static Future<Map<String, dynamic>?> getUserProfile() async {
    try {
      final data = await get('/users/profile', includeAuth: true);
      return data['user'];
    } catch (e) {
      debugPrint('Error fetching profile: $e');
      return null;
    }
  }

  // Update User Profile
  static Future<bool> updateUserProfile(String name, String phone) async {
    try {
      await put('/users/profile', {'name': name, 'phone': phone},
          includeAuth: true);
      return true;
    } catch (e) {
      debugPrint('Error updating profile: $e');
      return false;
    }
  }

  // Get Addresses
  static Future<List<dynamic>> getAddresses() async {
    try {
      final data = await get('/users/addresses', includeAuth: true);
      return data['addresses'] ?? [];
    } catch (e) {
      debugPrint('Error fetching addresses: $e');
      return [];
    }
  }

  // Add Address
  static Future<Map<String, dynamic>?> addAddress(
      Map<String, dynamic> addressData) async {
    try {
      final data =
          await post('/users/addresses', addressData, includeAuth: true);
      return data['address'];
    } catch (e) {
      debugPrint('Error adding address: $e');
      return null;
    }
  }

  // Update Address
  static Future<Map<String, dynamic>?> updateAddress(
      String addressId, Map<String, dynamic> addressData) async {
    try {
      final data = await put('/users/addresses/$addressId', addressData,
          includeAuth: true);
      return data['address'];
    } catch (e) {
      debugPrint('Error updating address: $e');
      return null;
    }
  }

  // Delete Address
  static Future<bool> deleteAddress(String addressId) async {
    try {
      await delete('/users/addresses/$addressId', includeAuth: true);
      return true;
    } catch (e) {
      debugPrint('Error deleting address: $e');
      return false;
    }
  }

  // Get User Wishlist
  static Future<List<dynamic>> getWishlist() async {
    try {
      final data = await get('/wishlist', includeAuth: true);
      if (data['wishlist'] != null && data['wishlist']['products'] != null) {
        return data['wishlist']['products'];
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching wishlist: $e');
      return [];
    }
  }

  // Add to Wishlist
  static Future<bool> addToWishlist(String productId) async {
    try {
      await post('/wishlist/products/$productId', {}, includeAuth: true);
      return true;
    } catch (e) {
      debugPrint('Error adding to wishlist: $e');
      return false;
    }
  }

  // Remove from Wishlist
  static Future<bool> removeFromWishlist(String productId) async {
    try {
      await delete('/wishlist/products/$productId', includeAuth: true);
      return true;
    } catch (e) {
      debugPrint('Error removing from wishlist: $e');
      return false;
    }
  }

  // Get Shipping Settings
  static Future<Map<String, dynamic>?> getShippingSettings() async {
    try {
      final data = await get('/shipping/settings', includeAuth: false);
      if (data['success'] == true) {
        return data['settings'];
      }
      return null;
    } catch (e) {
      debugPrint('Error fetching shipping settings: $e');
      return null;
    }
  }
}

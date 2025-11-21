import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:hawsni_app/core/services/auth_service.dart';

class ApiService {
  // Production URL
  static const String baseUrl = 'https://hawsnibackend.vercel.app/api';
  // Local URL (for testing)
  // static const String baseUrl = 'http://192.168.100.8:5000/api';

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

  // Generic GET request
  static Future<dynamic> get(String endpoint, {bool includeAuth = true}) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl$endpoint'),
        headers: _getHeaders(includeAuth: includeAuth),
      );

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to load data: ${response.body}');
      }
    } catch (e) {
      print('Error in GET $endpoint: $e');
      rethrow;
    }
  }

  // Generic POST request
  static Future<dynamic> post(String endpoint, Map<String, dynamic> data,
      {bool includeAuth = true}) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl$endpoint'),
        headers: _getHeaders(includeAuth: includeAuth),
        body: json.encode(data),
      );

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to post data: ${response.body}');
      }
    } catch (e) {
      print('Error in POST $endpoint: $e');
      rethrow;
    }
  }

  // Generic PUT request
  static Future<dynamic> put(String endpoint, Map<String, dynamic> data,
      {bool includeAuth = true}) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl$endpoint'),
        headers: _getHeaders(includeAuth: includeAuth),
        body: json.encode(data),
      );

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to put data: ${response.body}');
      }
    } catch (e) {
      print('Error in PUT $endpoint: $e');
      rethrow;
    }
  }

  // Generic DELETE request
  static Future<dynamic> delete(String endpoint,
      {bool includeAuth = true}) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl$endpoint'),
        headers: _getHeaders(includeAuth: includeAuth),
      );

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to delete data: ${response.body}');
      }
    } catch (e) {
      print('Error in DELETE $endpoint: $e');
      rethrow;
    }
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

  // --- User Profile & Addresses ---

  // Get User Profile (Real Data)
  static Future<Map<String, dynamic>?> getUserProfile() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/users/profile'),
        headers: _getHeaders(includeAuth: true),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['user'];
      }
      return null;
    } catch (e) {
      print('Error fetching profile: $e');
      return null;
    }
  }

  // Update User Profile
  static Future<bool> updateUserProfile(String name, String phone) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/users/profile'),
        headers: _getHeaders(includeAuth: true),
        body: json.encode({'name': name, 'phone': phone}),
      );
      return response.statusCode == 200;
    } catch (e) {
      print('Error updating profile: $e');
      return false;
    }
  }

  // Get Addresses
  static Future<List<dynamic>> getAddresses() async {
    try {
      // ملاحظة: سنستفيد من بروفايل المستخدم لأنه يحتوي على مصفوفة العناوين
      final profile = await getUserProfile();
      if (profile != null && profile['addresses'] != null) {
        return profile['addresses'];
      }
      return [];
    } catch (e) {
      print('Error fetching addresses: $e');
      return [];
    }
  }

  // Add Address
  static Future<bool> addAddress(Map<String, dynamic> addressData) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/users/addresses'),
        headers: _getHeaders(includeAuth: true),
        body: json.encode(addressData),
      );
      return response.statusCode == 200;
    } catch (e) {
      print('Error adding address: $e');
      return false;
    }
  }

  // Delete Address
  static Future<bool> deleteAddress(String addressId) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/users/addresses/$addressId'),
        headers: _getHeaders(includeAuth: true),
      );
      return response.statusCode == 200;
    } catch (e) {
      print('Error deleting address: $e');
      return false;
    }
  }

  // Get User Wishlist
  static Future<List<dynamic>> getWishlist() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/wishlist'),
        headers: _getHeaders(includeAuth: true),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['wishlist'] ?? [];
      }
      return [];
    } catch (e) {
      print('Error fetching wishlist: $e');
      return [];
    }
  }

  // Add to Wishlist
  static Future<bool> addToWishlist(String productId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/wishlist/products/$productId'),
        headers: _getHeaders(includeAuth: true),
      );
      return response.statusCode == 200;
    } catch (e) {
      print('Error adding to wishlist: $e');
      return false;
    }
  }

  // Remove from Wishlist
  static Future<bool> removeFromWishlist(String productId) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/wishlist/products/$productId'),
        headers: _getHeaders(includeAuth: true),
      );
      return response.statusCode == 200;
    } catch (e) {
      print('Error removing from wishlist: $e');
      return false;
    }
  }
}

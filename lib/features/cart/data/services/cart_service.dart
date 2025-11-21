import 'package:hawsni_app/core/services/api_service.dart';
import 'package:hawsni_app/features/cart/bloc/cart_state.dart';

class CartService {
  Future<List<CartItem>> getCart() async {
    try {
      final response = await ApiService.get('/cart');
      if (response['success'] == true) {
        final List<dynamic> items = response['cart']['items'];
        return items.map((item) {
          final product = item['product'];
          return CartItem(
            id: item['id'].toString(), // Cart Item ID
            name: product['name'],
            price: product['price'].toString(),
            imageUrl: (product['images'] as List).isNotEmpty
                ? product['images'][0]
                : 'https://via.placeholder.com/150',
            quantity: item['quantity'],
            size: item['size'],
            color: item['color'],
            productId: product['id'].toString(), // Keep reference to product ID
          );
        }).toList();
      }
      return [];
    } catch (e) {
      print('Error fetching cart: $e');
      return [];
    }
  }

  Future<List<CartItem>> addToCart(String productId, int quantity,
      {String? size, String? color}) async {
    try {
      final response = await ApiService.post('/cart/items', {
        'productId': productId,
        'quantity': quantity,
        'size': size,
        'color': color,
      });

      if (response['success'] == true) {
        final List<dynamic> items = response['cart']['items'];
        return items.map((item) {
          final product = item['product'];
          return CartItem(
            id: item['id'].toString(),
            name: product['name'],
            price: product['price'].toString(),
            imageUrl: (product['images'] as List).isNotEmpty
                ? product['images'][0]
                : 'https://via.placeholder.com/150',
            quantity: item['quantity'],
            size: item['size'],
            color: item['color'],
            productId: product['id'].toString(),
          );
        }).toList();
      }
      return [];
    } catch (e) {
      print('Error adding to cart: $e');
      rethrow;
    }
  }

  Future<List<CartItem>> updateCartItem(String itemId, int quantity) async {
    try {
      final response = await ApiService.put('/cart/items/$itemId', {
        'quantity': quantity,
      });

      if (response['success'] == true) {
        final List<dynamic> items = response['cart']['items'];
        return items.map((item) {
          final product = item['product'];
          return CartItem(
            id: item['id'].toString(),
            name: product['name'],
            price: product['price'].toString(),
            imageUrl: (product['images'] as List).isNotEmpty
                ? product['images'][0]
                : 'https://via.placeholder.com/150',
            quantity: item['quantity'],
            size: item['size'],
            color: item['color'],
            productId: product['id'].toString(),
          );
        }).toList();
      }
      return [];
    } catch (e) {
      print('Error updating cart item: $e');
      rethrow;
    }
  }

  Future<List<CartItem>> removeFromCart(String itemId) async {
    try {
      final response = await ApiService.delete('/cart/items/$itemId');

      if (response['success'] == true) {
        final List<dynamic> items = response['cart']['items'];
        return items.map((item) {
          final product = item['product'];
          return CartItem(
            id: item['id'].toString(),
            name: product['name'],
            price: product['price'].toString(),
            imageUrl: (product['images'] as List).isNotEmpty
                ? product['images'][0]
                : 'https://via.placeholder.com/150',
            quantity: item['quantity'],
            size: item['size'],
            color: item['color'],
            productId: product['id'].toString(),
          );
        }).toList();
      }
      return [];
    } catch (e) {
      print('Error removing from cart: $e');
      rethrow;
    }
  }

  Future<void> clearCart() async {
    try {
      await ApiService.delete('/cart');
    } catch (e) {
      print('Error clearing cart: $e');
      rethrow;
    }
  }
}

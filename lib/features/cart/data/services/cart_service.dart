import 'dart:convert';
import 'package:hawsni_app/core/services/api_service.dart';
import 'package:hawsni_app/core/services/auth_service.dart';
import 'package:hawsni_app/features/cart/bloc/cart_state.dart';
import 'package:shared_preferences/shared_preferences.dart';

class CartService {
  static const String _localCartKey = 'local_cart';

  Future<List<CartItem>> getCart() async {
    if (AuthService.isGuest) {
      return _getLocalCart();
    }
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
    if (AuthService.isGuest) {
      // We need to fetch product details first to store them locally (Name, Price, Image)
      // This is a bit tricky since we only have productId.
      // For a smooth UX, we might need to assume the caller passes details OR fetch them.
      // However, the caller usually has the product object.
      // TRICK: We will fetch the single product from API to get its details.
      try {
        final productResponse = await ApiService.get('/products/$productId');
        if (productResponse['success'] == true) {
          final product = productResponse['product'];
          final newItem = CartItem(
            id: DateTime.now().millisecondsSinceEpoch.toString(),
            productId: productId,
            name: product['name'],
            price: product['price'].toString(),
            imageUrl: (product['images'] as List).isNotEmpty
                ? product['images'][0]
                : '',
            quantity: quantity,
            size: size,
            color: color,
          );
          return _addToLocalCart(newItem);
        }
      } catch (e) {
        print('Error fetching product for local cart: $e');
      }
      return _getLocalCart();
    }

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
    if (AuthService.isGuest) {
      return _updateLocalCart(itemId, quantity);
    }
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
    if (AuthService.isGuest) {
      return _removeFromLocalCart(itemId);
    }
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
    if (AuthService.isGuest) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_localCartKey);
      return;
    }
    try {
      await ApiService.delete('/cart');
    } catch (e) {
      print('Error clearing cart: $e');
      rethrow;
    }
  }

  // --- Sync Guest Cart to Account ---
  Future<void> syncLocalCartToApi() async {
    try {
      print('Syncing local cart to API...');
      final localItems = await _getLocalCart();
      if (localItems.isEmpty) return;

      for (final item in localItems) {
        // We explicitly call the API version by temporarily ignoring isGuest flag
        // But since we call this AFTER login, isGuest is false!
        // So calling addToCart directly will hit the API.
        // We catch errors to continue syncing others.
        try {
          await addToCart(item.productId!, item.quantity,
              size: item.size, color: item.color);
        } catch (e) {
          print('Failed to sync item ${item.name}: $e');
        }
      }

      // Clear local cart after syncing
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_localCartKey);
      print('Local cart synced and cleared.');
    } catch (e) {
      print('Error syncing cart: $e');
    }
  }

  // --- Local Cart Helpers ---

  Future<List<CartItem>> _getLocalCart() async {
    final prefs = await SharedPreferences.getInstance();
    final String? cartJson = prefs.getString(_localCartKey);
    if (cartJson == null) return [];

    final List<dynamic> decoded = json.decode(cartJson);
    return decoded.map((e) => CartItem.fromJson(e)).toList();
  }

  Future<List<CartItem>> _addToLocalCart(CartItem newItem) async {
    List<CartItem> currentCart = await _getLocalCart();

    // Check if duplicate (same product, same variation)
    final index = currentCart.indexWhere((item) =>
        item.productId == newItem.productId &&
        item.size == newItem.size &&
        item.color == newItem.color);

    if (index != -1) {
      // Update quantity
      final existingItem = currentCart[index];
      currentCart[index] = existingItem.copyWith(
          quantity: existingItem.quantity + newItem.quantity);
    } else {
      currentCart.add(newItem);
    }

    await _saveLocalCart(currentCart);
    return currentCart;
  }

  Future<List<CartItem>> _updateLocalCart(String itemId, int quantity) async {
    List<CartItem> currentCart = await _getLocalCart();
    final index = currentCart.indexWhere((item) => item.id == itemId);

    if (index != -1) {
      if (quantity <= 0) {
        currentCart.removeAt(index);
      } else {
        currentCart[index] = currentCart[index].copyWith(quantity: quantity);
      }
      await _saveLocalCart(currentCart);
    }
    return currentCart;
  }

  Future<List<CartItem>> _removeFromLocalCart(String itemId) async {
    List<CartItem> currentCart = await _getLocalCart();
    currentCart.removeWhere((item) => item.id == itemId);
    await _saveLocalCart(currentCart);
    return currentCart;
  }

  Future<void> _saveLocalCart(List<CartItem> cart) async {
    final prefs = await SharedPreferences.getInstance();
    final String encoded = json.encode(cart.map((e) => e.toJson()).toList());
    await prefs.setString(_localCartKey, encoded);
  }
}

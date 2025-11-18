import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hawsni_app/features/cart/bloc/cart_event.dart';
import 'package:hawsni_app/features/cart/bloc/cart_state.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

class CartBloc extends Bloc<CartEvent, CartState> {
  CartBloc() : super(CartLoading()) {
    on<CartStarted>(_onCartStarted);
    on<AddToCart>(_onAddToCart);
    on<RemoveFromCart>(_onRemoveFromCart);
    on<UpdateQuantity>(_onUpdateQuantity);
    on<ClearCart>(_onClearCart);
    on<SaveForLater>(_onSaveForLater);
    on<MoveFromSaved>(_onMoveFromSaved);
  }

  void _onCartStarted(CartStarted event, Emitter<CartState> emit) async {
    // Load cart from shared preferences
    final cartItems = await _loadCartFromStorage();
    emit(CartLoaded(items: cartItems));
  }

  void _onAddToCart(AddToCart event, Emitter<CartState> emit) {
    final state = this.state;
    if (state is CartLoaded) {
      // Check if item already exists in cart
      final existingItemIndex =
          state.items.indexWhere((item) => item.id == event.item.id);

      if (existingItemIndex != -1) {
        // If item exists, increase quantity
        final updatedItems = List<CartItem>.from(state.items);
        final existingItem = updatedItems[existingItemIndex];
        updatedItems[existingItemIndex] = existingItem.copyWith(
          quantity: existingItem.quantity + 1,
        );
        emit(CartLoaded(items: updatedItems));
        // Save to storage
        _saveCartToStorage(updatedItems);
      } else {
        // If item doesn't exist, add new item
        final updatedItems = List<CartItem>.from(state.items)..add(event.item);
        emit(CartLoaded(items: updatedItems));
        // Save to storage
        _saveCartToStorage(updatedItems);
      }
    }
  }

  void _onRemoveFromCart(RemoveFromCart event, Emitter<CartState> emit) {
    final state = this.state;
    if (state is CartLoaded) {
      final updatedItems = List<CartItem>.from(state.items)
        ..removeWhere((item) => item.id == event.itemId);
      emit(CartLoaded(items: updatedItems));
      // Save to storage
      _saveCartToStorage(updatedItems);
    }
  }

  void _onUpdateQuantity(UpdateQuantity event, Emitter<CartState> emit) {
    final state = this.state;
    if (state is CartLoaded) {
      // Ensure quantity is at least 1
      final newQuantity = event.quantity < 1 ? 1 : event.quantity;

      // Update item quantity
      final updatedItems = List<CartItem>.from(state.items);
      final itemIndex =
          updatedItems.indexWhere((item) => item.id == event.itemId);

      if (itemIndex != -1) {
        final updatedItem =
            updatedItems[itemIndex].copyWith(quantity: newQuantity);
        updatedItems[itemIndex] = updatedItem;
        emit(CartLoaded(items: updatedItems));
        // Save to storage
        _saveCartToStorage(updatedItems);
      }
    }
  }

  void _onClearCart(ClearCart event, Emitter<CartState> emit) {
    emit(const CartLoaded(items: []));
    // Save to storage
    _saveCartToStorage([]);
  }

  void _onSaveForLater(SaveForLater event, Emitter<CartState> emit) {
    final state = this.state;
    if (state is CartLoaded) {
      // Remove items from cart and save them to saved items storage
      final updatedItems = List<CartItem>.from(state.items)
        ..removeWhere((item) => event.itemIds.contains(item.id));

      emit(CartLoaded(items: updatedItems));
      // Save cart to storage
      _saveCartToStorage(updatedItems);
      // Save items to saved items storage
      _saveSavedItemsToStorage(event.itemIds, state.items);
    }
  }

  void _onMoveFromSaved(MoveFromSaved event, Emitter<CartState> emit) {
    final state = this.state;
    if (state is CartLoaded) {
      // Load saved items and add them to cart
      _loadSavedItemsFromStorage().then((savedItems) {
        final itemsToMove = savedItems
            .where((item) => event.itemIds.contains(item.id))
            .toList();

        // Add items to cart
        final updatedItems = List<CartItem>.from(state.items)
          ..addAll(itemsToMove);

        emit(CartLoaded(items: updatedItems));
        // Save cart to storage
        _saveCartToStorage(updatedItems);
        // Remove moved items from saved items storage
        _removeSavedItemsFromStorage(event.itemIds);
      });
    }
  }

  // Save cart items to shared preferences
  Future<void> _saveCartToStorage(List<CartItem> items) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cartJson = jsonEncode(
        items
            .map((item) => {
                  'id': item.id,
                  'name': item.name,
                  'price': item.price,
                  'imageUrl': item.imageUrl,
                  'quantity': item.quantity,
                })
            .toList(),
      );
      await prefs.setString('cart_items', cartJson);
    } catch (e) {
      print('Error saving cart to storage: $e');
    }
  }

  // Load cart items from shared preferences
  Future<List<CartItem>> _loadCartFromStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cartJson = prefs.getString('cart_items');

      if (cartJson != null && cartJson.isNotEmpty) {
        final List<dynamic> cartData = jsonDecode(cartJson);
        return cartData
            .map((item) {
              return CartItem(
                id: item['id'],
                name: item['name'],
                price: item['price'],
                imageUrl: item['imageUrl'],
                quantity: item['quantity'],
              );
            })
            .toList()
            .cast<CartItem>();
      }
    } catch (e) {
      print('Error loading cart from storage: $e');
    }
    return [];
  }

  // Save items to saved items storage
  Future<void> _saveSavedItemsToStorage(
      List<String> itemIds, List<CartItem> allItems) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedItems =
          allItems.where((item) => itemIds.contains(item.id)).toList();

      final savedItemsJson = jsonEncode(
        savedItems
            .map((item) => {
                  'id': item.id,
                  'name': item.name,
                  'price': item.price,
                  'imageUrl': item.imageUrl,
                  'quantity': item.quantity,
                })
            .toList(),
      );
      await prefs.setString('saved_items', savedItemsJson);
    } catch (e) {
      print('Error saving saved items to storage: $e');
    }
  }

  // Load saved items from storage
  Future<List<CartItem>> _loadSavedItemsFromStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedItemsJson = prefs.getString('saved_items');

      if (savedItemsJson != null && savedItemsJson.isNotEmpty) {
        final List<dynamic> savedItemsData = jsonDecode(savedItemsJson);
        return savedItemsData
            .map((item) {
              return CartItem(
                id: item['id'],
                name: item['name'],
                price: item['price'],
                imageUrl: item['imageUrl'],
                quantity: item['quantity'],
              );
            })
            .toList()
            .cast<CartItem>();
      }
    } catch (e) {
      print('Error loading saved items from storage: $e');
    }
    return [];
  }

  // Remove saved items from storage
  Future<void> _removeSavedItemsFromStorage(List<String> itemIds) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedItemsJson = prefs.getString('saved_items');

      if (savedItemsJson != null && savedItemsJson.isNotEmpty) {
        final List<dynamic> savedItemsData = jsonDecode(savedItemsJson);
        final updatedSavedItems = savedItemsData
            .where((item) => !itemIds.contains(item['id']))
            .toList();

        final updatedSavedItemsJson = jsonEncode(updatedSavedItems);
        await prefs.setString('saved_items', updatedSavedItemsJson);
      }
    } catch (e) {
      print('Error removing saved items from storage: $e');
    }
  }
}

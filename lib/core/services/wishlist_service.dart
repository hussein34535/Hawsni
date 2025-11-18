import 'package:flutter/foundation.dart';

class WishlistItem {
  final String id;
  final String name;
  final String price;
  final String imageUrl;
  final String description;
  final double rating;
  final int reviewCount;

  WishlistItem({
    required this.id,
    required this.name,
    required this.price,
    required this.imageUrl,
    required this.description,
    required this.rating,
    required this.reviewCount,
  });
}

class WishlistService extends ChangeNotifier {
  final List<WishlistItem> _items = [];

  List<WishlistItem> get items => _items;

  bool isItemInWishlist(String itemId) {
    return _items.any((item) => item.id == itemId);
  }

  void addToWishlist(WishlistItem item) {
    if (!isItemInWishlist(item.id)) {
      _items.add(item);
      notifyListeners();
    }
  }

  void removeFromWishlist(String itemId) {
    _items.removeWhere((item) => item.id == itemId);
    notifyListeners();
  }

  void clearWishlist() {
    _items.clear();
    notifyListeners();
  }

  int get itemCount => _items.length;
}

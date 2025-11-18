import 'package:flutter/foundation.dart';
import 'package:hawsni_app/core/services/api_service.dart';
import 'package:hawsni_app/core/services/auth_service.dart';

class WishlistItem {
  final String id;
  final String name;
  final dynamic price; // Dynamic to handle string or number
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

  factory WishlistItem.fromJson(Map<String, dynamic> json) {
    // معالجة الصورة: إذا كانت مصفوفة أو نص
    String img = 'https://via.placeholder.com/150';
    if (json['imageUrl'] != null) {
      img = json['imageUrl'];
    } else if (json['images'] != null && (json['images'] as List).isNotEmpty) {
      img = json['images'][0];
    }

    return WishlistItem(
      id: json['id'].toString(),
      name: json['name'] ?? '',
      price: json['price'],
      imageUrl: img,
      description: json['description'] ?? '',
      rating: (json['rating'] ?? 0.0).toDouble(),
      reviewCount: json['reviewCount'] ?? 0,
    );
  }
}

class WishlistService extends ChangeNotifier {
  List<WishlistItem> _items = [];
  bool _isLoading = false;

  List<WishlistItem> get items => _items;
  bool get isLoading => _isLoading;

  // عند بدء التطبيق، اجلب البيانات
  WishlistService() {
    if (AuthService.isAuthenticated()) {
      fetchWishlist();
    }
  }

  Future<void> fetchWishlist() async {
    if (!AuthService.isAuthenticated()) return;

    _isLoading = true;
    notifyListeners();

    try {
      final List<dynamic> data = await ApiService.getWishlist();
      _items = data.map((json) => WishlistItem.fromJson(json)).toList();
    } catch (e) {
      print("Wishlist fetch error: $e");
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  bool isItemInWishlist(String itemId) {
    return _items.any((item) => item.id == itemId);
  }

  Future<void> addToWishlist(WishlistItem item) async {
    // 1. تحديث الواجهة فوراً (Optimistic UI Update)
    if (!isItemInWishlist(item.id)) {
      _items.add(item);
      notifyListeners();

      // 2. إرسال الطلب للسيرفر
      final success = await ApiService.addToWishlist(item.id);

      // 3. التراجع في حال الفشل
      if (!success) {
        _items.removeWhere((i) => i.id == item.id);
        notifyListeners();
      }
    }
  }

  Future<void> removeFromWishlist(String itemId) async {
    // 1. الاحتفاظ بالعنصر مؤقتاً للتمكن من إعادته في حال الفشل
    final existingIndex = _items.indexWhere((item) => item.id == itemId);
    if (existingIndex == -1) return;

    final existingItem = _items[existingIndex];

    // 2. التحديث الفوري للواجهة
    _items.removeAt(existingIndex);
    notifyListeners();

    // 3. إرسال الطلب للسيرفر
    final success = await ApiService.removeFromWishlist(itemId);

    // 4. التراجع في حال الفشل
    if (!success) {
      _items.insert(existingIndex, existingItem);
      notifyListeners();
    }
  }

  void clearWishlist() {
    _items.clear();
    notifyListeners();
  }
}

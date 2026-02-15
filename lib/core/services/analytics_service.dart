import 'package:firebase_analytics/firebase_analytics.dart';

class AnalyticsService {
  final FirebaseAnalytics _analytics = FirebaseAnalytics.instance;

  Future<void> logEvent({
    required String name,
    Map<String, Object>? parameters,
  }) async {
    await _analytics.logEvent(
      name: name,
      parameters: parameters,
    );
  }

  Future<void> logViewItem({
    required String itemId,
    required String itemName,
    required String itemCategory,
  }) async {
    await _analytics.logViewItem(
      currency: 'SAR',
      value: 0, // Optional or pass price if available
      items: [
        AnalyticsEventItem(
          itemId: itemId,
          itemName: itemName,
          itemCategory: itemCategory,
        ),
      ],
    );
  }

  Future<void> logAddToCart({
    required String itemId,
    required String itemName,
    required String itemCategory,
    required double price,
    int quantity = 1,
  }) async {
    await _analytics.logAddToCart(
      currency: 'SAR',
      value: price * quantity,
      items: [
        AnalyticsEventItem(
          itemId: itemId,
          itemName: itemName,
          itemCategory: itemCategory,
          price: price,
          quantity: quantity,
        ),
      ],
    );
  }

  Future<void> logPurchase({
    required String transactionId,
    required double value,
    required List<AnalyticsEventItem> items,
  }) async {
    await _analytics.logPurchase(
      transactionId: transactionId,
      currency: 'SAR',
      value: value,
      items: items,
    );
  }

  Future<void> logShare({
    required String contentType,
    required String itemId,
    required String method,
  }) async {
    await _analytics.logShare(
      contentType: contentType,
      itemId: itemId,
      method: method,
    );
  }
}

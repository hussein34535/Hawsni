import 'package:hwasi_app/core/services/api_service.dart';

class OrderService {
  Future<List<dynamic>> getUserOrders() async {
    try {
      return await ApiService.getUserOrders();
    } catch (e) {
      print('Error fetching user orders: $e');
      rethrow;
    }
  }

  Future<Map<String, dynamic>?> createOrder(
      Map<String, dynamic> orderData) async {
    try {
      return await ApiService.createOrder(orderData);
    } catch (e) {
      print('Error creating order: $e');
      rethrow;
    }
  }

  Future<Map<String, dynamic>?> getOrderTracking(String orderId) async {
    try {
      return await ApiService.getOrderTracking(orderId);
    } catch (e) {
      print('Error fetching order tracking: $e');
      rethrow;
    }
  }
}

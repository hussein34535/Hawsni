import 'package:equatable/equatable.dart';
import 'package:hwasi_app/features/checkout/models/address.dart';

abstract class OrderEvent extends Equatable {
  const OrderEvent();
  @override
  List<Object?> get props => [];
}

class LoadOrders extends OrderEvent {}

class ClearOrders extends OrderEvent {}

class CreateOrder extends OrderEvent {
  final Map<String, dynamic> orderData;
  final List<dynamic> items;

  const CreateOrder({required this.orderData, required this.items});

  @override
  List<Object?> get props => [orderData, items];
}

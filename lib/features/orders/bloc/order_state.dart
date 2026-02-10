import 'package:equatable/equatable.dart';
import 'package:hwasi_app/features/orders/bloc/order_bloc.dart';

abstract class OrderState extends Equatable {
  const OrderState();
  @override
  List<Object?> get props => [];
}

class OrderInitial extends OrderState {}

class OrderLoading extends OrderState {}

class OrderLoaded extends OrderState {
  final List<dynamic> orders;
  const OrderLoaded(this.orders);
  @override
  List<Object?> get props => [orders];
}

class OrderError extends OrderState {
  final String message;
  const OrderError(this.message);
  @override
  List<Object?> get props => [message];
}

class OrderCreating extends OrderState {}

class OrderCreated extends OrderState {
  final Map<String, dynamic> order;
  const OrderCreated(this.order);
  @override
  List<Object?> get props => [order];
}

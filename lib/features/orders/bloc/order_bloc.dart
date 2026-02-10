import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hwasi_app/features/orders/bloc/order_event.dart';
import 'package:hwasi_app/features/orders/bloc/order_state.dart';
import 'package:hwasi_app/features/orders/data/services/order_service.dart';
import 'package:hwasi_app/core/services/auth_service.dart';

class OrderBloc extends Bloc<OrderEvent, OrderState> {
  final OrderService _orderService;

  OrderBloc(this._orderService) : super(OrderInitial()) {
    on<LoadOrders>(_onLoadOrders);
    on<CreateOrder>(_onCreateOrder);
    on<ClearOrders>(_onClearOrders);

    // Listen to auth changes
    AuthService.authStateChanges.listen((isAuthenticated) {
      if (isAuthenticated) {
        add(LoadOrders());
      } else {
        add(ClearOrders());
      }
    });
  }

  Future<void> _onLoadOrders(LoadOrders event, Emitter<OrderState> emit) async {
    emit(OrderLoading());
    try {
      final orders = await _orderService.getUserOrders();
      emit(OrderLoaded(orders));
    } catch (e) {
      emit(OrderError('Failed to load orders: $e'));
    }
  }

  Future<void> _onCreateOrder(
      CreateOrder event, Emitter<OrderState> emit) async {
    emit(OrderCreating());
    try {
      // Combine order data with items
      final orderData = Map<String, dynamic>.from(event.orderData);
      orderData['items'] = event.items;

      final order = await _orderService.createOrder(orderData);
      if (order != null) {
        emit(OrderCreated(order));
        // Refresh orders list
        add(LoadOrders());
      } else {
        emit(const OrderError('Failed to create order'));
      }
    } catch (e) {
      emit(OrderError('Failed to create order: $e'));
    }
  }

  void _onClearOrders(ClearOrders event, Emitter<OrderState> emit) {
    emit(OrderInitial());
  }
}

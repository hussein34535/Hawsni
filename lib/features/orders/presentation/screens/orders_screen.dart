import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hawsni_app/core/themes/app_theme.dart';
import 'package:hawsni_app/core/widgets/spinning_loader.dart';
import 'package:hawsni_app/features/orders/bloc/order_bloc.dart';
import 'package:hawsni_app/features/orders/bloc/order_event.dart';
import 'package:hawsni_app/features/orders/bloc/order_state.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  @override
  void initState() {
    super.initState();
    context.read<OrderBloc>().add(LoadOrders());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text(
          'My Orders',
          style: TextStyle(
              fontFamily: 'Playfair Display', fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.black,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: BlocBuilder<OrderBloc, OrderState>(
        builder: (context, state) {
          if (state is OrderLoading) {
            return const Center(child: SpinningLoader());
          }

          if (state is OrderError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline,
                      size: 80, color: AppTheme.errorColor),
                  const SizedBox(height: 16),
                  Text(
                    state.message,
                    style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.white),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () =>
                        context.read<OrderBloc>().add(LoadOrders()),
                    style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryColor),
                    child: const Text('Retry',
                        style: TextStyle(color: Colors.black)),
                  ),
                ],
              ),
            );
          }

          if (state is OrderLoaded) {
            if (state.orders.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.shopping_bag_outlined,
                        size: 100, color: Colors.grey[800]),
                    const SizedBox(height: 16),
                    const Text(
                      'No orders yet',
                      style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.white),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Start shopping to see your orders here',
                      style: TextStyle(fontSize: 16, color: Colors.grey),
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: () => Navigator.of(context).pop(),
                      style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryColor),
                      child: const Text('Start Shopping',
                          style: TextStyle(color: Colors.black)),
                    ),
                  ],
                ),
              );
            }

            return RefreshIndicator(
              onRefresh: () async {
                context.read<OrderBloc>().add(LoadOrders());
              },
              color: AppTheme.primaryColor,
              backgroundColor: Colors.black,
              child: ListView.builder(
                padding: const EdgeInsets.all(16.0),
                itemCount: state.orders.length,
                itemBuilder: (context, index) {
                  final order = state.orders[index];
                  return _buildOrderCard(context, order);
                },
              ),
            );
          }

          return const SizedBox();
        },
      ),
    );
    switch (status.toLowerCase()) {
      case 'delivered':
        return AppTheme.successColor;
      case 'processing':
        return Colors.blue;
      case 'cancelled':
        return AppTheme.errorColor;
      default:
        return AppTheme.primaryColor;
    }
  }

  void _showOrderDetails(BuildContext context, Map<String, dynamic> order) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.8,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (context, scrollController) => Container(
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.9),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            border: Border(
                top: BorderSide(color: AppTheme.primaryColor.withOpacity(0.3))),
          ),
          child: ListView(
            controller: scrollController,
            padding: const EdgeInsets.all(24),
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey[800],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Order Details',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                  fontFamily: 'Playfair Display',
                ),
              ),
              const SizedBox(height: 24),
              // Add more details here matching the theme...
              // For brevity, keeping it simple but consistent
              Text(
                'Order #${order['id']}',
                style: const TextStyle(color: Colors.white, fontSize: 16),
              ),
              const SizedBox(height: 16),
              if (order['items'] != null)
                ...((order['items'] as List).map((item) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Row(
                        children: [
                          Container(
                            width: 50,
                            height: 50,
                            decoration: BoxDecoration(
                              color: Colors.grey[900],
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(Icons.shopping_bag,
                                color: Colors.white54),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item['name'] ?? 'Product',
                                  style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold),
                                ),
                                Text(
                                  'Qty: ${item['quantity']}',
                                  style: const TextStyle(color: Colors.grey),
                                ),
                              ],
                            ),
                          ),
                          Text(
                            '\$${((item['price'] as num?) ?? 0).toStringAsFixed(2)}',
                            style: const TextStyle(
                                color: AppTheme.primaryColor,
                                fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ))),
            ],
          ),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';

class OrderManagementScreen extends StatefulWidget {
  const OrderManagementScreen({super.key});

  @override
  State<OrderManagementScreen> createState() => _OrderManagementScreenState();
}

class _OrderManagementScreenState extends State<OrderManagementScreen> {
  final List<Map<String, dynamic>> _orders = [
    {
      'id': 'ORD1001',
      'customer': 'Ahmed Hassan',
      'amount': 125.99,
      'status': 'Processing',
      'date': '2023-06-15',
      'items': 3,
    },
    {
      'id': 'ORD1002',
      'customer': 'Fatima Ali',
      'amount': 89.50,
      'status': 'Shipped',
      'date': '2023-06-14',
      'items': 2,
    },
    {
      'id': 'ORD1003',
      'customer': 'Mohamed Khalid',
      'amount': 245.75,
      'status': 'Delivered',
      'date': '2023-06-12',
      'items': 5,
    },
    {
      'id': 'ORD1004',
      'customer': 'Sara Mahmoud',
      'amount': 67.25,
      'status': 'Cancelled',
      'date': '2023-06-10',
      'items': 1,
    },
    {
      'id': 'ORD1005',
      'customer': 'Omar Farouk',
      'amount': 198.00,
      'status': 'Processing',
      'date': '2023-06-08',
      'items': 4,
    },
  ];

  bool _isLoading = false;

  void _viewOrderDetails(String orderId) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('View order details feature coming soon!'),
      ),
    );
  }

  void _updateOrderStatus(String orderId) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Update order status feature coming soon!'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Order Management'),
        backgroundColor: Colors.blue[700],
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Search and filter bar
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          decoration: InputDecoration(
                            hintText: 'Search orders...',
                            prefixIcon: const Icon(Icons.search),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Container(
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.grey),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: PopupMenuButton<String>(
                          icon: const Icon(Icons.filter_list),
                          onSelected: (String result) {
                            // Handle filter selection
                          },
                          itemBuilder: (BuildContext context) =>
                              <PopupMenuEntry<String>>[
                            const PopupMenuItem<String>(
                              value: 'all',
                              child: Text('All Orders'),
                            ),
                            const PopupMenuItem<String>(
                              value: 'processing',
                              child: Text('Processing'),
                            ),
                            const PopupMenuItem<String>(
                              value: 'shipped',
                              child: Text('Shipped'),
                            ),
                            const PopupMenuItem<String>(
                              value: 'delivered',
                              child: Text('Delivered'),
                            ),
                            const PopupMenuItem<String>(
                              value: 'cancelled',
                              child: Text('Cancelled'),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // Orders list
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _orders.length,
                    itemBuilder: (context, index) {
                      final order = _orders[index];
                      return _buildOrderCard(order);
                    },
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildOrderCard(Map<String, dynamic> order) {
    Color statusColor = Colors.grey;
    if (order['status'] == 'Delivered') {
      statusColor = Colors.green;
    } else if (order['status'] == 'Shipped') {
      statusColor = Colors.blue;
    } else if (order['status'] == 'Processing') {
      statusColor = Colors.orange;
    } else if (order['status'] == 'Cancelled') {
      statusColor = Colors.red;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 5,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        title: Text(
          order['id'],
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              order['customer'],
              style: const TextStyle(
                fontSize: 14,
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              '\$${order['amount'].toStringAsFixed(2)} • ${order['items']} items',
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                order['status'],
                style: TextStyle(
                  color: statusColor,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        trailing: PopupMenuButton<String>(
          icon: const Icon(Icons.more_vert),
          onSelected: (String result) {
            switch (result) {
              case 'view':
                _viewOrderDetails(order['id']);
                break;
              case 'update':
                _updateOrderStatus(order['id']);
                break;
            }
          },
          itemBuilder: (BuildContext context) => <PopupMenuEntry<String>>[
            const PopupMenuItem<String>(
              value: 'view',
              child: Text('View Details'),
            ),
            const PopupMenuItem<String>(
              value: 'update',
              child: Text('Update Status'),
            ),
          ],
        ),
      ),
    );
  }
}

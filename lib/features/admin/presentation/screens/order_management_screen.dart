import 'package:flutter/material.dart';
import '../../../../core/services/admin_service.dart';

class OrderManagementScreen extends StatefulWidget {
  const OrderManagementScreen({super.key});

  @override
  State<OrderManagementScreen> createState() => _OrderManagementScreenState();
}

class _OrderManagementScreenState extends State<OrderManagementScreen> {
  final AdminService _adminService = AdminService();
  bool _isLoading = true;
  List<dynamic> _orders = [];

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    try {
      final orders = await _adminService.getOrders();
      if (mounted) {
        setState(() {
          _orders = orders;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading orders: $e')),
      );
    }
  }

  Future<void> _updateStatus(String orderId, String newStatus) async {
    try {
      await _adminService.updateOrderStatus(orderId, newStatus);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Order updated to $newStatus')),
      );
      _loadOrders(); // Reload to reflect changes
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to update status: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Order Management',
            style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 24),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : Card(
                    child: ListView(
                      children: [
                        PaginatedDataTable(
                          columns: const [
                            DataColumn(label: Text('Order ID')),
                            DataColumn(label: Text('Customer')),
                            DataColumn(label: Text('Date')),
                            DataColumn(label: Text('Total')),
                            DataColumn(label: Text('Status')),
                            DataColumn(label: Text('Actions')),
                          ],
                          source: _OrderDataSource(_orders, _updateStatus),
                          rowsPerPage: 10,
                        ),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

class _OrderDataSource extends DataTableSource {
  final List<dynamic> orders;
  final Function(String, String) onStatusUpdate;

  _OrderDataSource(this.orders, this.onStatusUpdate);

  @override
  DataRow? getRow(int index) {
    if (index >= orders.length) return null;
    final order = orders[index];

    return DataRow(cells: [
      DataCell(Text('#${order['id'].toString().substring(0, 8)}...')),
      DataCell(Text(order['user_id'] != null
          ? 'User ${order['user_id'].toString().substring(0, 4)}...'
          : 'Guest')),
      DataCell(Text(order['created_at'].toString().substring(0, 10))),
      DataCell(Text('\$${order['total']}')),
      DataCell(
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: _getStatusColor(order['status']),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            order['status'] ?? 'Processing',
            style: const TextStyle(color: Colors.white, fontSize: 12),
          ),
        ),
      ),
      DataCell(
        PopupMenuButton<String>(
          icon: const Icon(Icons.edit, color: Colors.blue),
          onSelected: (String status) =>
              onStatusUpdate(order['id'].toString(), status),
          itemBuilder: (BuildContext context) => <PopupMenuEntry<String>>[
            const PopupMenuItem<String>(
                value: 'Processing', child: Text('Processing')),
            const PopupMenuItem<String>(
                value: 'Shipped', child: Text('Shipped')),
            const PopupMenuItem<String>(
                value: 'Delivered', child: Text('Delivered')),
            const PopupMenuItem<String>(
                value: 'Cancelled', child: Text('Cancelled')),
          ],
        ),
      ),
    ]);
  }

  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'processing':
        return Colors.blue;
      case 'shipped':
        return Colors.orange;
      case 'delivered':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  bool get isRowCountApproximate => false;
  @override
  int get rowCount => orders.length;
  @override
  int get selectedRowCount => 0;
}

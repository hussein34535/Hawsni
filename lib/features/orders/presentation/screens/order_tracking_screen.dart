import 'package:flutter/material.dart';
import 'package:hawsni_app/core/services/api_service.dart';

class OrderTrackingScreen extends StatefulWidget {
  final Map<String, dynamic> order;

  const OrderTrackingScreen({super.key, required this.order});

  @override
  State<OrderTrackingScreen> createState() => _OrderTrackingScreenState();
}

class _OrderTrackingScreenState extends State<OrderTrackingScreen> {
  List<Map<String, dynamic>> _trackingEvents = [];
  bool _isLoading = true;
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _loadTrackingData();
  }

  Future<void> _loadTrackingData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      final orderId = widget.order['id']?.toString() ?? '';
      if (orderId.isEmpty) {
        throw Exception('Invalid order ID');
      }

      final trackingData = await ApiService.getOrderTracking(orderId);

      if (trackingData != null && trackingData['events'] != null) {
        setState(() {
          _trackingEvents =
              List<Map<String, dynamic>>.from(trackingData['events']);
          _isLoading = false;
        });
      } else {
        throw Exception('No tracking data available');
      }
    } catch (e) {
      print('Error loading tracking data: $e');
      setState(() {
        _isLoading = false;
        _errorMessage =
            'Failed to load tracking information. Please try again later.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final orderId = widget.order['id']?.toString().substring(0, 8) ?? 'N/A';
    final status = widget.order['status'] ?? 'Processing';
    final customerAddress =
        widget.order['shippingAddress']?['address'] ?? 'N/A';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Order Tracking'),
      ),
      body: RefreshIndicator(
        onRefresh: _loadTrackingData,
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Loading indicator
                if (_isLoading)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(16.0),
                      child: CircularProgressIndicator(),
                    ),
                  ),

                // Error message
                if (_errorMessage.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.red.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      children: [
                        Text(
                          _errorMessage,
                          style: const TextStyle(color: Colors.red),
                        ),
                        const SizedBox(height: 8),
                        ElevatedButton(
                          onPressed: _loadTrackingData,
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),

                // Order header
                if (!_isLoading && _errorMessage.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(16),
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
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Order #$orderId',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: _getStatusColor(status).withOpacity(0.1),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Text(
                                status,
                                style: TextStyle(
                                  color: _getStatusColor(status),
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          customerAddress,
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),

                const SizedBox(height: 24),

                // Tracking timeline
                if (!_isLoading && _errorMessage.isEmpty)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Tracking Timeline',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 16),
                      _buildTrackingTimeline(),
                    ],
                  ),

                const SizedBox(height: 24),

                // Delivery information
                if (!_isLoading && _errorMessage.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(16),
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
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Delivery Information',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 16),
                        _buildDeliveryInfoRow(
                          Icons.person,
                          'Delivery Partner',
                          'Express Logistics',
                        ),
                        const SizedBox(height: 12),
                        _buildDeliveryInfoRow(
                          Icons.phone,
                          'Contact',
                          '+1 234 567 8900',
                        ),
                        const SizedBox(height: 12),
                        _buildDeliveryInfoRow(
                          Icons.location_on,
                          'Estimated Delivery',
                          'Today between 2:00 PM - 6:00 PM',
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTrackingTimeline() {
    if (_trackingEvents.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(16.0),
          child: Text('No tracking events available'),
        ),
      );
    }

    return Column(
      children: List.generate(_trackingEvents.length, (index) {
        final event = _trackingEvents[index];
        final isCompleted = event['status'] == 'completed';
        final isCurrent = event['status'] == 'current';
        final isPending = event['status'] == 'pending';

        return Column(
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Timeline indicator
                Column(
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: isCompleted
                            ? event['color']
                            : isCurrent
                                ? event['color']
                                : Colors.white,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: isPending ? Colors.grey : event['color'],
                          width: 2,
                        ),
                      ),
                      child: isCompleted
                          ? Icon(
                              event['icon'],
                              color: Colors.white,
                              size: 20,
                            )
                          : isCurrent
                              ? Icon(
                                  event['icon'],
                                  color: Colors.white,
                                  size: 20,
                                )
                              : Icon(
                                  event['icon'],
                                  color: Colors.grey,
                                  size: 20,
                                ),
                    ),
                    if (index < _trackingEvents.length - 1)
                      Container(
                        width: 2,
                        height: 40,
                        color: isCompleted ? event['color'] : Colors.grey[300],
                      ),
                  ],
                ),
                const SizedBox(width: 12),
                // Event details
                Expanded(
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          event['title'],
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight:
                                isCurrent ? FontWeight.bold : FontWeight.normal,
                            color: isCurrent ? event['color'] : Colors.black,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          event['description'],
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _formatDateTime(event['timestamp']),
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[500],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        );
      }),
    );
  }

  Widget _buildDeliveryInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 20, color: Colors.blue),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
              ),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Delivered':
        return Colors.green;
      case 'In Transit':
      case 'Out for Delivery':
        return Colors.blue;
      case 'Processing':
        return Colors.orange;
      case 'Cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _formatDateTime(dynamic timestamp) {
    DateTime dateTime;

    if (timestamp is String) {
      // Try to parse ISO date string
      try {
        dateTime = DateTime.parse(timestamp);
      } catch (e) {
        // If parsing fails, return the original string
        return timestamp;
      }
    } else if (timestamp is int) {
      // Assume it's milliseconds since epoch
      dateTime = DateTime.fromMillisecondsSinceEpoch(timestamp);
    } else if (timestamp is DateTime) {
      dateTime = timestamp;
    } else {
      return timestamp.toString();
    }

    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays == 0) {
      return 'Today ${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
    } else if (difference.inDays == 1) {
      return 'Yesterday ${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
    } else {
      return '${dateTime.day}/${dateTime.month}/${dateTime.year} ${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
    }
  }
}

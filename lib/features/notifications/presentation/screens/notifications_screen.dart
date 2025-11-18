import 'package:flutter/material.dart';
import 'package:hawsni_app/core/services/notification_service.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<Map<String, dynamic>> _notifications = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() {
      _isLoading = true;
    });

    // Simulate loading notifications from a service
    await Future.delayed(const Duration(seconds: 1));

    // Sample notifications data
    final List<Map<String, dynamic>> sampleNotifications = [
      {
        'id': '1',
        'title': 'Order Delivered',
        'message': 'Your order #12345 has been delivered successfully!',
        'time': DateTime.now().subtract(const Duration(hours: 2)),
        'icon': Icons.check_circle,
        'color': Colors.green,
        'isRead': false,
        'type': 'order',
      },
      {
        'id': '2',
        'title': 'Special Offer',
        'message': 'Get 50% off on all winter collection. Limited time only!',
        'time': DateTime.now().subtract(const Duration(hours: 5)),
        'icon': Icons.local_offer,
        'color': Colors.orange,
        'isRead': false,
        'type': 'promotion',
      },
      {
        'id': '3',
        'title': 'Order Shipped',
        'message': 'Your order #12344 is on the way. Track your order now.',
        'time': DateTime.now().subtract(const Duration(days: 1)),
        'icon': Icons.local_shipping,
        'color': Colors.blue,
        'isRead': true,
        'type': 'order',
      },
      {
        'id': '4',
        'title': 'Payment Successful',
        'message': 'Payment of \$85.00 has been processed successfully.',
        'time': DateTime.now().subtract(const Duration(days: 2)),
        'icon': Icons.payment,
        'color': Colors.green,
        'isRead': true,
        'type': 'payment',
      },
      {
        'id': '5',
        'title': 'New Arrival',
        'message': 'Check out our latest collection of summer dresses!',
        'time': DateTime.now().subtract(const Duration(days: 3)),
        'icon': Icons.new_releases,
        'color': Colors.purple,
        'isRead': true,
        'type': 'product',
      },
    ];

    setState(() {
      _notifications = sampleNotifications;
      _isLoading = false;
    });
  }

  void _markAsRead(String id) {
    setState(() {
      _notifications = _notifications.map((notification) {
        if (notification['id'] == id) {
          return {...notification, 'isRead': true};
        }
        return notification;
      }).toList();
    });
  }

  void _markAllAsRead() {
    setState(() {
      _notifications = _notifications.map((notification) {
        return {...notification, 'isRead': true};
      }).toList();
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('All notifications marked as read')),
    );
  }

  void _deleteNotification(String id) {
    setState(() {
      _notifications.removeWhere((notification) => notification['id'] == id);
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Notification deleted')),
    );
  }

  void _clearAll() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear All Notifications'),
        content:
            const Text('Are you sure you want to delete all notifications?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              setState(() {
                _notifications.clear();
              });
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('All notifications cleared')),
              );
            },
            child: const Text('Clear', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  String _formatTimeAgo(DateTime time) {
    final now = DateTime.now();
    final difference = now.difference(time);

    if (difference.inMinutes < 60) {
      return '${difference.inMinutes} minutes ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours} hours ago';
    } else {
      return '${difference.inDays} days ago';
    }
  }

  @override
  Widget build(BuildContext context) {
    final unreadCount =
        _notifications.where((n) => n['isRead'] == false).length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (unreadCount > 0)
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Container(
                decoration: const BoxDecoration(
                  color: Colors.red,
                  shape: BoxShape.circle,
                ),
                constraints: const BoxConstraints(
                  minWidth: 20,
                  minHeight: 20,
                ),
                child: Text(
                  '$unreadCount',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          if (_notifications.isNotEmpty)
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert),
              onSelected: (String result) {
                switch (result) {
                  case 'mark_all_read':
                    _markAllAsRead();
                    break;
                  case 'clear_all':
                    _clearAll();
                    break;
                }
              },
              itemBuilder: (BuildContext context) => <PopupMenuEntry<String>>[
                const PopupMenuItem<String>(
                  value: 'mark_all_read',
                  child: Text('Mark all as read'),
                ),
                const PopupMenuItem<String>(
                  value: 'clear_all',
                  child: Text('Clear all'),
                ),
              ],
            ),
        ],
      ),
      body: Column(
        children: [
          // Test notification button
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      // Show a test notification
                      NotificationService().showOrderUpdateNotification(
                        orderId: '12345',
                        status: 'confirmed',
                      );
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                            content: Text(
                                'Test notification sent! Check your status bar.')),
                      );
                    },
                    child: const Text('Send Test Notification'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton(
                    onPressed: _loadNotifications,
                    child: const Text('Refresh'),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _notifications.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.notifications_none,
                                size: 100, color: Colors.grey[400]),
                            const SizedBox(height: 16),
                            Text(
                              'No notifications',
                              style: TextStyle(
                                fontSize: 18,
                                color: Colors.grey[600],
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'You\'re all caught up!',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey[500],
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        itemCount: _notifications.length,
                        itemBuilder: (context, index) {
                          final notification = _notifications[index];
                          final isRead = notification['isRead'] as bool;

                          return Dismissible(
                            key: Key(notification['id'] as String),
                            direction: DismissDirection.endToStart,
                            onDismissed: (direction) {
                              _deleteNotification(notification['id'] as String);
                            },
                            background: Container(
                              color: Colors.red,
                              alignment: Alignment.centerRight,
                              padding: const EdgeInsets.only(right: 20),
                              child: const Icon(
                                Icons.delete,
                                color: Colors.white,
                              ),
                            ),
                            child: Container(
                              color: isRead ? Colors.white : Colors.blue[50],
                              child: Column(
                                children: [
                                  ListTile(
                                    leading: CircleAvatar(
                                      backgroundColor:
                                          (notification['color'] as Color)
                                              .withOpacity(0.2),
                                      child: Icon(
                                        notification['icon'] as IconData,
                                        color: notification['color'] as Color,
                                      ),
                                    ),
                                    title: Text(
                                      notification['title'] as String,
                                      style: TextStyle(
                                        fontWeight: isRead
                                            ? FontWeight.normal
                                            : FontWeight.bold,
                                      ),
                                    ),
                                    subtitle: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        const SizedBox(height: 4),
                                        Text(
                                          notification['message'] as String,
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          _formatTimeAgo(
                                              notification['time'] as DateTime),
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.grey[600],
                                          ),
                                        ),
                                      ],
                                    ),
                                    trailing: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        if (!isRead)
                                          Container(
                                            width: 8,
                                            height: 8,
                                            decoration: const BoxDecoration(
                                              color: Colors.blue,
                                              shape: BoxShape.circle,
                                            ),
                                          ),
                                        PopupMenuButton<String>(
                                          icon: const Icon(Icons.more_vert),
                                          onSelected: (String result) {
                                            switch (result) {
                                              case 'mark_read':
                                                _markAsRead(notification['id']
                                                    as String);
                                                break;
                                              case 'delete':
                                                _deleteNotification(
                                                    notification['id']
                                                        as String);
                                                break;
                                            }
                                          },
                                          itemBuilder: (BuildContext context) =>
                                              <PopupMenuEntry<String>>[
                                            if (!isRead)
                                              const PopupMenuItem<String>(
                                                value: 'mark_read',
                                                child: Text('Mark as read'),
                                              ),
                                            const PopupMenuItem<String>(
                                              value: 'delete',
                                              child: Text('Delete'),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                    onTap: () {
                                      _showNotificationDetail(
                                          context, notification);
                                      if (!isRead) {
                                        _markAsRead(
                                            notification['id'] as String);
                                      }
                                    },
                                  ),
                                  const Divider(height: 1),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }

  void _showNotificationDetail(
      BuildContext context, Map<String, dynamic> notification) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(
              notification['icon'] as IconData,
              color: notification['color'] as Color,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(notification['title'] as String),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(notification['message'] as String),
            const SizedBox(height: 12),
            Text(
              _formatTimeAgo(notification['time'] as DateTime),
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:hawsni_app/core/services/notification_service.dart';
import 'package:hawsni_app/core/themes/app_theme.dart';

import 'package:hawsni_app/core/widgets/spinning_loader.dart';

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
        'color': AppTheme.successColor,
        'isRead': false,
        'type': 'order',
      },
      {
        'id': '2',
        'title': 'Special Offer',
        'message': 'Get 50% off on all winter collection. Limited time only!',
        'time': DateTime.now().subtract(const Duration(hours: 5)),
        'icon': Icons.local_offer,
        'color': AppTheme.primaryColor,
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
        'color': AppTheme.successColor,
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
      SnackBar(
        content: Text('All notifications marked as read',
            style:
                AppTheme.textTheme.bodyMedium?.copyWith(color: Colors.white)),
        backgroundColor: AppTheme.primaryColor,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  void _deleteNotification(String id) {
    setState(() {
      _notifications.removeWhere((notification) => notification['id'] == id);
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Notification deleted',
            style:
                AppTheme.textTheme.bodyMedium?.copyWith(color: Colors.white)),
        backgroundColor: AppTheme.textSecondary,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  void _clearAll() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.surfaceColor,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Clear All Notifications',
            style: AppTheme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
        content: Text('Are you sure you want to delete all notifications?',
            style: AppTheme.textTheme.bodyMedium),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel', style: AppTheme.textTheme.bodyMedium),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              setState(() {
                _notifications.clear();
              });
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('All notifications cleared',
                      style: AppTheme.textTheme.bodyMedium
                          ?.copyWith(color: Colors.white)),
                  backgroundColor: AppTheme.textSecondary,
                  behavior: SnackBarBehavior.floating,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10)),
                ),
              );
            },
            child: const Text('Clear',
                style: TextStyle(color: AppTheme.errorColor)),
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
      backgroundColor: AppTheme.scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text(
          'Notifications',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: AppTheme.textPrimary,
          ),
        ),
        centerTitle: true,
        backgroundColor: AppTheme.scaffoldBackgroundColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppTheme.textPrimary),
          onPressed: () => Navigator.of(context).pop(),
        ),
        actions: [
          if (unreadCount > 0)
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Container(
                decoration: const BoxDecoration(
                  color: AppTheme.errorColor,
                  shape: BoxShape.circle,
                ),
                constraints: const BoxConstraints(
                  minWidth: 20,
                  minHeight: 20,
                ),
                child: Center(
                  child: Text(
                    '$unreadCount',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
            ),
          if (_notifications.isNotEmpty)
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert, color: AppTheme.textPrimary),
              color: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
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
                  child: Text('Mark all as read',
                      style: TextStyle(color: AppTheme.textPrimary)),
                ),
                const PopupMenuItem<String>(
                  value: 'clear_all',
                  child: Text('Clear all',
                      style: TextStyle(color: AppTheme.textPrimary)),
                ),
              ],
            ),
        ],
      ),
      body: Column(
        children: [
          // Test notification button
          Padding(
            padding: const EdgeInsets.all(24.0),
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
                        SnackBar(
                          content: const Text(
                              'Test notification sent! Check your status bar.',
                              style: TextStyle(color: Colors.white)),
                          backgroundColor: AppTheme.primaryColor,
                          behavior: SnackBarBehavior.floating,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10)),
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30)),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: const Text('Send Test Notification',
                        style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton(
                    onPressed: _loadNotifications,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.primaryColor,
                      side: const BorderSide(color: AppTheme.primaryColor),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30)),
                    ),
                    child: const Text('Refresh',
                        style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: _isLoading
                ? Center(child: SpinningLoader())
                : _notifications.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(24),
                              decoration: const BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.notifications_none,
                                  size: 48, color: AppTheme.textTertiary),
                            ),
                            const SizedBox(height: 24),
                            const Text(
                              'No notifications',
                              style: TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              'You\'re all caught up!',
                              style: TextStyle(
                                  fontSize: 16, color: AppTheme.textSecondary),
                            ),
                          ],
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        itemCount: _notifications.length,
                        separatorBuilder: (context, index) =>
                            const SizedBox(height: 16),
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
                              decoration: BoxDecoration(
                                color: AppTheme.errorColor,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              alignment: Alignment.centerRight,
                              padding: const EdgeInsets.only(right: 20),
                              child: const Icon(
                                Icons.delete,
                                color: Colors.white,
                              ),
                            ),
                            child: Container(
                              decoration: BoxDecoration(
                                color: isRead
                                    ? Colors.white
                                    : AppTheme.primaryColor
                                        .withValues(alpha: 0.05),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                    color: isRead
                                        ? AppTheme.borderColor
                                        : AppTheme.primaryColor
                                            .withValues(alpha: 0.2)),
                              ),
                              child: ListTile(
                                contentPadding: const EdgeInsets.all(16),
                                leading: Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: (notification['color'] as Color)
                                        .withValues(alpha: 0.1),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    notification['icon'] as IconData,
                                    color: notification['color'] as Color,
                                    size: 24,
                                  ),
                                ),
                                title: Text(
                                  notification['title'] as String,
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: isRead
                                        ? FontWeight.w600
                                        : FontWeight.bold,
                                    color: AppTheme.textPrimary,
                                  ),
                                ),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const SizedBox(height: 4),
                                    Text(
                                      notification['message'] as String,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                          fontSize: 14,
                                          color: AppTheme.textSecondary),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      _formatTimeAgo(
                                          notification['time'] as DateTime),
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: AppTheme.textTertiary,
                                      ),
                                    ),
                                  ],
                                ),
                                trailing: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    if (!isRead)
                                      Container(
                                        width: 10,
                                        height: 10,
                                        decoration: const BoxDecoration(
                                          color: AppTheme.primaryColor,
                                          shape: BoxShape.circle,
                                        ),
                                      ),
                                    PopupMenuButton<String>(
                                      icon: const Icon(Icons.more_vert,
                                          color: AppTheme.textTertiary),
                                      color: Colors.white,
                                      shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(12)),
                                      onSelected: (String result) {
                                        switch (result) {
                                          case 'mark_read':
                                            _markAsRead(
                                                notification['id'] as String);
                                            break;
                                          case 'delete':
                                            _deleteNotification(
                                                notification['id'] as String);
                                            break;
                                        }
                                      },
                                      itemBuilder: (BuildContext context) =>
                                          <PopupMenuEntry<String>>[
                                        if (!isRead)
                                          const PopupMenuItem<String>(
                                            value: 'mark_read',
                                            child: Text('Mark as read',
                                                style: TextStyle(
                                                    color:
                                                        AppTheme.textPrimary)),
                                          ),
                                        const PopupMenuItem<String>(
                                          value: 'delete',
                                          child: Text('Delete',
                                              style: TextStyle(
                                                  color: AppTheme.textPrimary)),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                                onTap: () {
                                  _showNotificationDetail(
                                      context, notification);
                                  if (!isRead) {
                                    _markAsRead(notification['id'] as String);
                                  }
                                },
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
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: (notification['color'] as Color).withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                notification['icon'] as IconData,
                color: notification['color'] as Color,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(notification['title'] as String,
                  style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary)),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(notification['message'] as String,
                style: const TextStyle(
                    fontSize: 16, color: AppTheme.textSecondary)),
            const SizedBox(height: 16),
            Text(
              _formatTimeAgo(notification['time'] as DateTime),
              style: const TextStyle(
                fontSize: 14,
                color: AppTheme.textTertiary,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close',
                style: TextStyle(
                    color: AppTheme.primaryColor, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}

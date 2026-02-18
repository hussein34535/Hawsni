import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest.dart' as tz;
import 'package:timezone/timezone.dart' as tz;

// Top-level function for background messaging handling
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // If you're going to use other Firebase services in the background, such as Firestore,
  // make sure you call `Firebase.initializeApp` before using other Firebase services.
  debugPrint('Handling a background message: ${message.messageId}');
}

class NotificationService {
  static final NotificationService _notificationService =
      NotificationService._internal();

  factory NotificationService() => _notificationService;

  NotificationService._internal();

  static const int _notificationId = 0;
  final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
      FlutterLocalNotificationsPlugin();
  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;

  Future<void> init() async {
    // 1. Initialize Local Notifications
    await _initLocalNotifications();

    // 2. Initialize Firebase Messaging
    await _initFirebaseMessaging();
  }

  Future<void> _initLocalNotifications() async {
    tz.initializeTimeZones();

    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    final DarwinInitializationSettings initializationSettingsIOS =
        DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
      onDidReceiveLocalNotification:
          (int id, String? title, String? body, String? payload) async {
        // Handle iOS local notification received while app is in foreground
      },
    );

    final InitializationSettings initializationSettings =
        InitializationSettings(
      android: initializationSettingsAndroid,
      iOS: initializationSettingsIOS,
    );

    await flutterLocalNotificationsPlugin.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse:
          (NotificationResponse notificationResponse) {
        if (notificationResponse.payload != null) {
          debugPrint('Notification payload: ${notificationResponse.payload}');
          // Handle navigation logic here if needed
        }
      },
    );
  }

  Future<void> _initFirebaseMessaging() async {
    // Request permission
    NotificationSettings settings = await _firebaseMessaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );

    debugPrint('User granted permission: ${settings.authorizationStatus}');

    // Set background handler
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Get FCM Token
    try {
      String? token = await _firebaseMessaging.getToken();
      debugPrint('FCM Token: $token');
      // Save token to backend if needed (e.g., ApiService.updateDeviceToken(token))
    } catch (e) {
      debugPrint('Failed to get FCM token: $e');
    }

    // Foreground Message Handler
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint('Got a message whilst in the foreground!');
      debugPrint('Message data: ${message.data}');

      if (message.notification != null) {
        debugPrint(
            'Message also contained a notification: ${message.notification}');

        // Show local notification for foreground messages
        showNotification(
          title: message.notification?.title ?? 'Notification',
          body: message.notification?.body ?? '',
          payload: message.data.toString(), // or specific payload
        );
      }
    });

    // Message Opened Handler
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      debugPrint('A new onMessageOpenedApp event was published!');
      // Handle navigation logic here
    });
  }

  Future<void> showNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    const AndroidNotificationDetails androidNotificationDetails =
        AndroidNotificationDetails(
      'high_importance_channel', // channelId
      'High Importance Notifications', // channelName
      channelDescription: 'This channel is used for important notifications.',
      importance: Importance.max,
      priority: Priority.high,
      ticker: 'ticker',
    );

    const NotificationDetails notificationDetails = NotificationDetails(
      android: androidNotificationDetails,
      iOS: DarwinNotificationDetails(
        presentAlert: true,
        presentBadge: true,
        presentSound: true,
      ),
    );

    await flutterLocalNotificationsPlugin.show(
      _notificationId,
      title,
      body,
      notificationDetails,
      payload: payload,
    );
  }

  // Keep existing scheduling method
  Future<void> scheduleNotification({
    required String title,
    required String body,
    required DateTime scheduledTime,
    String? payload,
  }) async {
    const AndroidNotificationDetails androidNotificationDetails =
        AndroidNotificationDetails(
      'scheduled_channel',
      'Scheduled Notifications',
      channelDescription: 'Channel for scheduled notifications',
      importance: Importance.max,
      priority: Priority.high,
    );

    const NotificationDetails notificationDetails = NotificationDetails(
      android: androidNotificationDetails,
    );

    await flutterLocalNotificationsPlugin.zonedSchedule(
      _notificationId,
      title,
      body,
      tz.TZDateTime.from(scheduledTime, tz.local),
      notificationDetails,
      payload: payload,
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
    );
  }

  // Keep existing order update method (can be used for local simulation or manual trigger)
  Future<void> showOrderUpdateNotification({
    required String orderId,
    required String status,
  }) async {
    String title = 'Order Update';
    String body = 'Your order #$orderId is now $status';

    switch (status.toLowerCase()) {
      case 'confirmed':
        title = 'Order Confirmed';
        body = 'Your order #$orderId has been confirmed!';
        break;
      case 'shipped':
        title = 'Order Shipped';
        body = 'Your order #$orderId is on the way!';
        break;
      case 'delivered':
        title = 'Order Delivered';
        body = 'Your order #$orderId has been delivered successfully!';
        break;
      case 'cancelled':
        title = 'Order Cancelled';
        body = 'Your order #$orderId has been cancelled.';
        break;
    }

    await showNotification(
      title: title,
      body: body,
      payload: 'order_update:$orderId:$status',
    );
  }
}

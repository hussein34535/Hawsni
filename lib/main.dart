import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hawsni_app/app.dart';
import 'package:hawsni_app/core/services/auth_service.dart';
import 'package:hawsni_app/core/services/notification_service.dart';
import 'package:hawsni_app/features/cart/bloc/cart_bloc.dart';
import 'package:hawsni_app/features/cart/bloc/cart_event.dart';
// import 'package:firebase_core/firebase_core.dart';
// import 'package:hawsni_app/firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Load authentication token
  await AuthService.loadToken();

  // Initialize notification service
  await NotificationService().init();

  // Firebase disabled temporarily
  // await Firebase.initializeApp(
  //   options: DefaultFirebaseOptions.currentPlatform,
  // );

  runApp(
    BlocProvider(
      create: (context) => CartBloc()..add(CartStarted()),
      child: const App(),
    ),
  );
}

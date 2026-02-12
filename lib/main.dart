import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hwasi_app/app.dart';
import 'package:hwasi_app/core/services/auth_service.dart';
import 'package:hwasi_app/core/services/notification_service.dart';
import 'package:hwasi_app/features/cart/bloc/cart_bloc.dart';

import 'package:hwasi_app/features/cart/data/services/cart_service.dart';

import 'package:hwasi_app/features/orders/bloc/order_bloc.dart';
import 'package:hwasi_app/features/orders/data/services/order_service.dart';
import 'package:hwasi_app/core/config/prod_config.dart';

import 'package:hwasi_app/core/services/api_service.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:hwasi_app/firebase_options.dart';
import 'package:flutter/foundation.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize App Configuration - Using PRODUCTION server (Vercel)
  print('-------------------------------------------');
  print('🚀 STARTING APP - FORCING CONNECTION TO VERCEL');
  print('🚀 URL: https://hwasibackend.vercel.app/api');
  print('-------------------------------------------');

  final config = ProdConfig();
  ApiService.initialize(config);

  // Initialize Firebase
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  // Load authentication token
  await AuthService.loadToken();

  // Initialize notification service
  if (!kIsWeb) {
    await NotificationService().init();
  }

  runApp(
    MultiBlocProvider(
      providers: [
        BlocProvider(
          create: (context) => CartBloc(CartService()),
        ),
        BlocProvider(
          create: (context) => OrderBloc(OrderService()),
        ),
      ],
      child: const App(),
    ),
  );
}

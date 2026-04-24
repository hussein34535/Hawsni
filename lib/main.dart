import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hwasi_app/app.dart';
import 'package:hwasi_app/core/services/auth_service.dart';
import 'package:hwasi_app/core/services/notification_service.dart';
import 'package:provider/provider.dart';
import 'package:hwasi_app/core/providers/settings_provider.dart';
import 'package:hwasi_app/core/services/wishlist_service.dart';
import 'package:hwasi_app/core/services/analytics_service.dart';
import 'package:hwasi_app/features/cart/bloc/cart_bloc.dart';

import 'package:hwasi_app/features/cart/data/services/cart_service.dart';

import 'package:hwasi_app/features/orders/bloc/order_bloc.dart';
import 'package:hwasi_app/features/orders/data/services/order_service.dart';
import 'package:hwasi_app/core/config/prod_config.dart';

import 'package:hwasi_app/core/services/api_service.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:hwasi_app/firebase_options.dart';
import 'package:flutter/foundation.dart';
import 'package:hwasi_app/features/address/data/services/address_service.dart';
import 'package:hwasi_app/features/address/bloc/address_bloc.dart';
import 'package:hwasi_app/features/address/bloc/address_event.dart';
import 'package:flutter_web_plugins/url_strategy.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  usePathUrlStrategy();
  // MetaSEO is disabled because it currently crashes Flutter WASM builds due to dart:html dependency.
  // SEO is instead handled by the backend middleware for bots.

  // On web: runtime font fetching enabled to ensure fonts load without assets
  // Removed GoogleFonts configuration as it causes CanvasKit Typeface BindingError
  // We rely on the native font-family definition 'Cairo' which is also preloaded in index.html

  // Initialize App Configuration - Using PRODUCTION server (Vercel)
  // Initialize App Configuration - Using PRODUCTION server (Vercel)

  final config = ProdConfig();
  ApiService.initialize(config);

  // Initialize Firebase
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  // Load authentication token
  await AuthService.loadToken();

  // Initialize Supabase
  await Supabase.initialize(
    url: config.supabaseUrl,
    anonKey: config.supabaseAnonKey,
  );

  // Initialize notification service
  if (!kIsWeb) {
    await NotificationService().init();
  }

  // Catch and log uncaught errors to prevent black screen
  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.presentError(details);
    debugPrint('FLUTTER ERROR: ${details.exception}');
  };

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => SettingsProvider()),
        ChangeNotifierProvider(create: (_) => WishlistService()),
        Provider(create: (_) => AnalyticsService()),
      ],
      child: MultiRepositoryProvider(
        providers: [
          RepositoryProvider(create: (_) => AddressService()),
        ],
        child: MultiBlocProvider(
          providers: [
            BlocProvider(
              create: (context) => CartBloc(
                CartService(),
                Provider.of<WishlistService>(context, listen: false),
              ),
            ),
            BlocProvider(
              create: (context) => OrderBloc(OrderService()),
            ),
            BlocProvider(
              create: (context) {
                final bloc = AddressBloc(
                  addressService:
                      RepositoryProvider.of<AddressService>(context),
                );
                if (AuthService.token != null) {
                  bloc.add(LoadAddresses());
                }
                return bloc;
              },
            ),
          ],
          child: const App(),
        ),
      ),
    ),
  );
}

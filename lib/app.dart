import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'package:hawsni_app/core/services/wishlist_service.dart';
import 'package:hawsni_app/core/providers/settings_provider.dart';
import 'package:hawsni_app/core/themes/app_theme.dart';
import 'package:hawsni_app/features/splash/presentation/screens/splash_screen.dart';
import 'package:hawsni_app/features/admin/presentation/screens/admin_login_screen.dart';
import 'package:hawsni_app/features/admin/presentation/screens/admin_dashboard_screen.dart';
import 'package:hawsni_app/features/admin/presentation/screens/product_management_screen.dart';
import 'package:hawsni_app/features/admin/presentation/screens/category_management_screen.dart';
import 'package:hawsni_app/features/admin/presentation/screens/order_management_screen.dart';
import 'package:hawsni_app/features/admin/presentation/screens/user_management_screen.dart';
import 'package:hawsni_app/features/search/presentation/screens/search_suggestions_screen.dart';
import 'package:hawsni_app/features/products/presentation/screens/product_comparison_screen.dart';

class App extends StatefulWidget {
  const App({super.key});

  @override
  State<App> createState() => _AppState();
}

class _AppState extends State<App> {
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => SettingsProvider()),
        ChangeNotifierProvider(create: (_) => WishlistService()),
      ],
      child: Consumer<SettingsProvider>(
        builder: (context, settingsProvider, child) {
          return MaterialApp(
            title: 'Hawsni',
            locale: Locale(settingsProvider.language),
            localizationsDelegates: const [
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            supportedLocales: const [
              Locale('en'), // English
              Locale('ar'), // Arabic
            ],
            themeMode:
                settingsProvider.isDarkMode ? ThemeMode.dark : ThemeMode.light,
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            home: const SplashScreen(),
            routes: {
              '/admin/login': (context) => const AdminLoginScreen(),
              '/admin/dashboard': (context) => const AdminDashboardScreen(),
              '/admin/products': (context) => const ProductManagementScreen(),
              '/admin/categories': (context) =>
                  const CategoryManagementScreen(),
              '/admin/orders': (context) => const OrderManagementScreen(),
              '/admin/users': (context) => const UserManagementScreen(),
              '/search/suggestions': (context) =>
                  SearchSuggestionsScreen(onSuggestionSelected: (query) {}),
              '/products/compare': (context) =>
                  const ProductComparisonScreen(products: []),
            },
          );
        },
      ),
    );
  }
}

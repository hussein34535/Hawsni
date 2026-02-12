import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'package:hwasi_app/core/services/wishlist_service.dart';
import 'package:hwasi_app/core/providers/settings_provider.dart';
import 'package:hwasi_app/core/themes/app_theme.dart';
import 'package:hwasi_app/features/splash/presentation/screens/splash_screen.dart';
import 'package:hwasi_app/features/admin/presentation/screens/admin_login_screen.dart'
    deferred as admin_login;
import 'package:hwasi_app/features/admin/presentation/screens/admin_dashboard_screen.dart'
    deferred as admin_dashboard;
import 'package:hwasi_app/features/admin/presentation/screens/product_management_screen.dart'
    deferred as product_mgmt;
import 'package:hwasi_app/features/admin/presentation/screens/category_management_screen.dart'
    deferred as category_mgmt;
import 'package:hwasi_app/features/admin/presentation/screens/order_management_screen.dart'
    deferred as order_mgmt;
import 'package:hwasi_app/features/admin/presentation/screens/user_management_screen.dart'
    deferred as user_mgmt;
import 'package:hwasi_app/features/search/presentation/screens/search_suggestions_screen.dart';
import 'package:hwasi_app/features/products/presentation/screens/product_comparison_screen.dart';
import 'package:hwasi_app/l10n/generated/app_localizations.dart';

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
            title: 'HWASI',
            locale: Locale(settingsProvider.language),
            localizationsDelegates: [
              AppLocalizations.delegate,
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            supportedLocales: AppLocalizations.supportedLocales,
            themeMode:
                settingsProvider.isDarkMode ? ThemeMode.dark : ThemeMode.light,
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            home: const SplashScreen(),
            routes: {
              '/admin/login': (context) => _DeferredLoader(
                    loader: admin_login.loadLibrary(),
                    builder: () => admin_login.AdminLoginScreen(),
                  ),
              '/admin/dashboard': (context) => _DeferredLoader(
                    loader: admin_dashboard.loadLibrary(),
                    builder: () => admin_dashboard.AdminDashboardScreen(),
                  ),
              '/admin/products': (context) => _DeferredLoader(
                    loader: product_mgmt.loadLibrary(),
                    builder: () => product_mgmt.ProductManagementScreen(),
                  ),
              '/admin/categories': (context) => _DeferredLoader(
                    loader: category_mgmt.loadLibrary(),
                    builder: () => category_mgmt.CategoryManagementScreen(),
                  ),
              '/admin/orders': (context) => _DeferredLoader(
                    loader: order_mgmt.loadLibrary(),
                    builder: () => order_mgmt.OrderManagementScreen(),
                  ),
              '/admin/users': (context) => _DeferredLoader(
                    loader: user_mgmt.loadLibrary(),
                    builder: () => user_mgmt.UserManagementScreen(),
                  ),
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

class _DeferredLoader extends StatelessWidget {
  final Future<void> loader;
  final Widget Function() builder;

  const _DeferredLoader({required this.loader, required this.builder});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
      future: loader,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.done) {
          return builder();
        }
        return const Scaffold(
          body: Center(
            child: CircularProgressIndicator(),
          ),
        );
      },
    );
  }
}

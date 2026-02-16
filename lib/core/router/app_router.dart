import 'package:go_router/go_router.dart';
import 'package:hwasi_app/features/splash/presentation/screens/language_selection_screen.dart';
import 'package:hwasi_app/features/admin/presentation/widgets/admin_layout.dart';
import 'package:hwasi_app/features/splash/presentation/screens/splash_screen.dart';
import 'package:hwasi_app/features/home/presentation/screens/home_screen.dart';
import 'package:hwasi_app/features/products/presentation/screens/product_detail_screen.dart';
import 'package:hwasi_app/features/cart/presentation/screens/cart_screen.dart';
import 'package:hwasi_app/features/checkout/presentation/screens/checkout_screen.dart';
import 'package:hwasi_app/features/auth/presentation/screens/login_screen.dart';
import 'package:hwasi_app/features/search/presentation/screens/search_suggestions_screen.dart';
import 'package:hwasi_app/features/products/presentation/screens/product_comparison_screen.dart';

// Admin Screens (Deferred Loading)
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

import 'package:hwasi_app/core/router/deferred_loader.dart';
import 'package:hwasi_app/features/products/data/models/product_model.dart';

class AppRouter {
  static final router = GoRouter(
    initialLocation: '/',
    debugLogDiagnostics: true,
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/language',
        builder: (context, state) => const LanguageSelectionScreen(),
      ),
      GoRoute(
        path: '/product/:id',
        builder: (context, state) {
          final productId = state.pathParameters['id']!;
          // Pass the ID to the screen. The screen needs to handle fetching by ID if product object isn't passed.
          // For deep linking, we typically only have the ID.
          // We can pass 'extra' if we have the full product object from internal navigation.
          final product = state.extra as ProductModel?;

          return ProductDetailScreen(
            productId: productId,
            name: product?.name,
            price: product?.price.toString(),
            imageUrl: product?.imageUrl,
            description: product?.description ?? '',
            screenId: 'product_details_$productId',
          );
        },
      ),
      GoRoute(
        path: '/cart',
        builder: (context, state) => const CartScreen(),
      ),
      GoRoute(
        path: '/checkout',
        builder: (context, state) => const CheckoutScreen(),
      ),
      GoRoute(
        path: '/search/suggestions',
        builder: (context, state) =>
            SearchSuggestionsScreen(onSuggestionSelected: (query) {
          // Handle suggestion selection - maybe navigate to search results
        }),
      ),
      GoRoute(
        path: '/products/compare',
        builder: (context, state) =>
            const ProductComparisonScreen(products: []),
      ),

      // --- Admin Routes ---
      GoRoute(
        path: '/admin/login',
        builder: (context, state) => DeferredLoader(
          loader: admin_login.loadLibrary(),
          builder: () => admin_login.AdminLoginScreen(),
        ),
      ),

      // Admin Shell Route (Layout)
      ShellRoute(
        builder: (context, state, child) => DeferredLoader(
          loader: admin_dashboard
              .loadLibrary(), // Load dashboard lib as it contains layout usage mostly?
          // Actually AdminLayout is in 'widgets'. We need to import it.
          // But since we are using deferred loading, we might face issues if we don't import AdminLayout directly or deferred.
          // For simplicity, let's assume valid imports. I will add the import above.
          builder: () => AdminLayout(currentPath: state.uri.path, child: child),
        ),
        routes: [
          GoRoute(
            path: '/admin/dashboard',
            builder: (context, state) => DeferredLoader(
              loader: admin_dashboard.loadLibrary(),
              builder: () => admin_dashboard.AdminDashboardScreen(),
            ),
          ),
          GoRoute(
            path: '/admin/products',
            builder: (context, state) => DeferredLoader(
              loader: product_mgmt.loadLibrary(),
              builder: () => product_mgmt.ProductManagementScreen(),
            ),
          ),
          GoRoute(
            path: '/admin/categories',
            builder: (context, state) => DeferredLoader(
              loader: category_mgmt.loadLibrary(),
              builder: () => category_mgmt.CategoryManagementScreen(),
            ),
          ),
          GoRoute(
            path: '/admin/orders',
            builder: (context, state) => DeferredLoader(
              loader: order_mgmt.loadLibrary(),
              builder: () => order_mgmt.OrderManagementScreen(),
            ),
          ),
          GoRoute(
            path: '/admin/users',
            builder: (context, state) => DeferredLoader(
              loader: user_mgmt.loadLibrary(),
              builder: () => user_mgmt.UserManagementScreen(),
            ),
          ),
        ],
      ),
    ],
  );
}

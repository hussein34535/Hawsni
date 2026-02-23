import 'package:go_router/go_router.dart';
import 'package:hwasi_app/features/splash/presentation/screens/language_selection_screen.dart';
import 'package:hwasi_app/features/splash/presentation/screens/splash_screen.dart';

import 'package:hwasi_app/features/products/presentation/screens/product_detail_screen.dart';
import 'package:hwasi_app/features/cart/presentation/screens/cart_screen.dart';
import 'package:hwasi_app/features/checkout/presentation/screens/checkout_screen.dart';
import 'package:hwasi_app/features/auth/presentation/screens/login_screen.dart';
import 'package:hwasi_app/features/search/presentation/screens/search_suggestions_screen.dart';
import 'package:hwasi_app/features/products/presentation/screens/product_comparison_screen.dart';

import 'package:hwasi_app/features/products/data/models/product_model.dart';

import 'package:hwasi_app/features/main/presentation/screens/main_screen.dart';

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
        builder: (context, state) => const MainScreen(),
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
          final productId = state.pathParameters['id'] ?? '';
          if (productId.isEmpty) {
            return const MainScreen(); // Fallback for invalid route
          }
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
    ],
  );
}

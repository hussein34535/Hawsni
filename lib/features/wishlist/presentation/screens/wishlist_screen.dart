import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:share_plus/share_plus.dart';
import 'package:hwasi_app/core/services/wishlist_service.dart';
import 'package:hwasi_app/core/themes/app_theme.dart';
import 'package:hwasi_app/l10n/generated/app_localizations.dart';
import 'package:hwasi_app/features/cart/bloc/cart_bloc.dart';
import 'package:hwasi_app/features/cart/bloc/cart_event.dart';
import 'package:hwasi_app/features/cart/bloc/cart_state.dart';
import 'package:hwasi_app/features/home/presentation/widgets/product_card.dart';

class WishlistScreen extends StatelessWidget {
  const WishlistScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: AppTheme.scaffoldBackgroundColor,
      appBar: AppBar(
        title: Consumer<WishlistService>(
          builder: (context, ws, _) {
            final count = ws.items.length;
            return Text(
              count > 0
                  ? '${l10n.emptyWishlist.split(' ').first} ($count)'
                  : l10n.emptyWishlist.split(' ').first,
              style: const TextStyle(fontFamily: 'Cairo',
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
                fontSize: 20,
              ),
            );
          },
        ),
        centerTitle: true,
        backgroundColor: AppTheme.scaffoldBackgroundColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppTheme.textPrimary),
          onPressed: () => Navigator.of(context).pop(),
        ),
        actions: [
          Consumer<WishlistService>(
            builder: (context, wishlistService, child) {
              return wishlistService.items.isNotEmpty
                  ? IconButton(
                      icon: const Icon(
                        Icons.share,
                        color: AppTheme.textPrimary,
                      ),
                      onPressed: () {
                        final items = wishlistService.items;
                        final text = items
                            .map((item) => '• ${item.name} - ${item.price} EGP')
                            .join('\n');
                        SharePlus.instance.share(
                          ShareParams(
                              text: '🛍️ قائمة أمنياتي من hwasi:\n\n$text'),
                        );
                      },
                    )
                  : const SizedBox.shrink();
            },
          ),
        ],
      ),
      body: Consumer<WishlistService>(
        builder: (context, wishlistService, child) {
          if (wishlistService.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (wishlistService.items.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(32),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.05),
                          blurRadius: 20,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.favorite_border,
                      size: 64,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    l10n.emptyWishlist,
                    style: const TextStyle(fontFamily: 'Cairo',
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    l10n.saveItemsForLater,
                    style: const TextStyle(fontFamily: 'Cairo',
                      fontSize: 15,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
              ),
            );
          }

          return GridView.builder(
            padding: EdgeInsets.fromLTRB(
              16,
              10,
              16,
              MediaQuery.of(context).padding.bottom + 20,
            ),
            itemCount: wishlistService.items.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 0.55,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
            ),
            itemBuilder: (context, index) {
              final item = wishlistService.items[index];
              return Dismissible(
                key: Key(item.id),
                direction: DismissDirection.endToStart,
                background: Container(
                  alignment: Alignment.centerRight,
                  padding: const EdgeInsets.only(right: 20),
                  decoration: BoxDecoration(
                    color: Colors.red[50],
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.delete_outline,
                          color: Colors.red[400], size: 28),
                      const SizedBox(height: 4),
                      Text(
                        'حذف',
                        style: TextStyle(fontFamily: 'Cairo',
                          color: Colors.red[400],
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                onDismissed: (_) {
                  wishlistService.removeFromWishlist(item.id);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        'تم حذف ${item.name} من قائمة الأمنيات',
                        style: const TextStyle(fontFamily: 'Cairo',),
                      ),
                      backgroundColor: Colors.black87,
                      behavior: SnackBarBehavior.floating,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      action: SnackBarAction(
                        label: 'تراجع',
                        textColor: AppTheme.primaryColor,
                        onPressed: () {
                          wishlistService.addToWishlist(item);
                        },
                      ),
                    ),
                  );
                },
                child: Column(
                  children: [
                    Expanded(
                      child: ProductCard(
                        id: item.id,
                        imageUrl: item.imageUrl,
                        name: item.name,
                        price: item.price.toString(),
                        rating: item.rating,
                        reviewCount: item.reviewCount,
                        screenId: 'wishlist',
                      ),
                    ),
                    // Move to Cart Button
                    Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          onPressed: () {
                            final cartItem = CartItem(
                              id: item.id,
                              name: item.name,
                              price: item.price.toString(),
                              imageUrl: item.imageUrl,
                              quantity: 1,
                              productId: item.id,
                            );
                            context.read<CartBloc>().add(AddToCart(cartItem));
                            wishlistService.removeFromWishlist(item.id);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  'تم نقل ${item.name} إلى السلة 🛒',
                                  style: const TextStyle(fontFamily: 'Cairo',),
                                ),
                                backgroundColor: Colors.green[700],
                                behavior: SnackBarBehavior.floating,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                            );
                          },
                          icon: const Icon(Icons.shopping_cart_outlined,
                              size: 16),
                          label: const Text(
                            'أضف للسلة',
                            style: TextStyle(fontFamily: 'Cairo',
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.black,
                            side: BorderSide(color: Colors.grey[300]!),
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}

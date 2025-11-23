import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:hawsni_app/core/services/wishlist_service.dart';
import 'package:hawsni_app/features/home/presentation/widgets/product_card.dart';
import 'package:hawsni_app/features/cart/bloc/cart_bloc.dart';
import 'package:hawsni_app/features/cart/bloc/cart_event.dart';
import 'package:hawsni_app/features/cart/bloc/cart_state.dart';
import 'package:hawsni_app/core/themes/app_theme.dart';

class WishlistScreen extends StatelessWidget {
  const WishlistScreen({super.key});

  void _removeFromWishlist(BuildContext context, String itemId) {
    Provider.of<WishlistService>(context, listen: false)
        .removeFromWishlist(itemId);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Removed from wishlist',
            style: TextStyle(color: Colors.white)),
        backgroundColor: AppTheme.primaryColor,
      ),
    );
  }

  void _moveToCart(BuildContext context, WishlistItem item) {
    Provider.of<WishlistService>(context, listen: false)
        .removeFromWishlist(item.id);

    final cartItem = CartItem(
      id: item.id,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
      quantity: 1,
      productId: item.id,
    );

    context.read<CartBloc>().add(AddToCart(cartItem));

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Moved to cart', style: TextStyle(color: Colors.black)),
        backgroundColor: AppTheme.primaryColor,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text(
          'My Wishlist',
          style: TextStyle(
              fontFamily: 'Playfair Display', fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.black,
        elevation: 0,
        actions: [
          Consumer<WishlistService>(
            builder: (context, wishlistService, child) {
              return wishlistService.items.isNotEmpty
                  ? IconButton(
                      icon:
                          const Icon(Icons.share, color: AppTheme.primaryColor),
                      onPressed: () {
                        // Share logic
                      },
                    )
                  : const SizedBox.shrink();
            },
          ),
        ],
      ),
      body: Consumer<WishlistService>(
        builder: (context, wishlistService, child) {
          if (wishlistService.items.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.favorite_border,
                      size: 100, color: Colors.grey),
                  const SizedBox(height: 16),
                  const Text(
                    'Your wishlist is empty',
                    style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.white),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () {
                      // Navigate to home
                    },
                    style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryColor),
                    child: const Text('Start Shopping',
                        style: TextStyle(color: Colors.black)),
                  ),
                ],
              ),
            );
          }

          return GridView.builder(
            padding: const EdgeInsets.all(16.0),
            itemCount: wishlistService.items.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 0.65,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
            ),
            itemBuilder: (context, index) {
              final item = wishlistService.items[index];
              return Stack(
                children: [
                  ProductCard(
                    id: item.id,
                    imageUrl: item.imageUrl,
                    name: item.name,
                    price: item.price,
                    description: item.description,
                    rating: item.rating,
                    reviewCount: item.reviewCount,
                    screenId: 'wishlist',
                  ),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: GestureDetector(
                      onTap: () => _removeFromWishlist(context, item.id),
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.6),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.close,
                            color: Colors.white, size: 18),
                      ),
                    ),
                  ),
                ],
              );
            },
          );
        },
      ),
    );
  }
}

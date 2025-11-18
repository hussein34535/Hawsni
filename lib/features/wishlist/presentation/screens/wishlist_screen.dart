import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hawsni_app/core/services/wishlist_service.dart';
import 'package:hawsni_app/features/home/presentation/widgets/product_card.dart';
import 'package:hawsni_app/features/cart/bloc/cart_bloc.dart';
import 'package:hawsni_app/features/cart/bloc/cart_event.dart';
import 'package:hawsni_app/features/cart/bloc/cart_state.dart';
import 'package:share_plus/share_plus.dart';

class WishlistScreen extends StatelessWidget {
  const WishlistScreen({super.key});

  void _removeFromWishlist(BuildContext context, String itemId) {
    final wishlistService =
        Provider.of<WishlistService>(context, listen: false);
    wishlistService.removeFromWishlist(itemId);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Removed from wishlist'),
        backgroundColor: Colors.green,
      ),
    );
  }

  void _moveToCart(BuildContext context, WishlistItem item) {
    // Remove from wishlist
    final wishlistService =
        Provider.of<WishlistService>(context, listen: false);
    wishlistService.removeFromWishlist(item.id);

    // Add to cart
    final cartItem = CartItem(
      id: item.id,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
      quantity: 1,
    );
    
    context.read<CartBloc>().add(AddToCart(cartItem));

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Moved to cart'),
        backgroundColor: Colors.green,
      ),
    );
  }

  void _shareWishlist(BuildContext context) async {
    final wishlistService =
        Provider.of<WishlistService>(context, listen: false);
    
    if (wishlistService.items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Your wishlist is empty'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Create a shareable text with wishlist items
    final StringBuffer wishlistText = StringBuffer();
    wishlistText.writeln('Check out my wishlist from Hawsni App:');
    wishlistText.writeln();
    
    for (int i = 0; i < wishlistService.items.length; i++) {
      final item = wishlistService.items[i];
      wishlistText.writeln('${i + 1}. ${item.name} - ${item.price}');
    }
    
    wishlistText.writeln();
    wishlistText.write('Download the Hawsni App to see these products!');

    // Share the text
    await Share.share(
      wishlistText.toString(),
      subject: 'My Wishlist from Hawsni App',
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'My Wishlist',
          style: TextStyle(
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 2,
        actions: [
          Consumer<WishlistService>(
            builder: (context, wishlistService, child) {
              return wishlistService.items.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.share),
                      onPressed: () {
                        _shareWishlist(context);
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
                  Icon(
                    Icons.favorite_border,
                    size: 100,
                    color: Colors.grey[300],
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Your wishlist is empty',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Add items you like to your wishlist',
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey,
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () {
                      // Navigate to home screen
                      Navigator.of(context).pop();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 32,
                        vertical: 16,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(30),
                      ),
                    ),
                    child: const Text(
                      'Start Shopping',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }

          return Column(
            children: [
              // Header with item count
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${wishlistService.items.length} items in wishlist',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        showDialog(
                          context: context,
                          builder: (context) => AlertDialog(
                            title: const Text('Clear Wishlist'),
                            content: const Text(
                                'Are you sure you want to remove all items from your wishlist?'),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(context),
                                child: const Text('Cancel'),
                              ),
                              TextButton(
                                onPressed: () {
                                  wishlistService.clearWishlist();
                                  Navigator.pop(context);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                        content: Text('Wishlist cleared')),
                                  );
                                },
                                child: const Text(
                                  'Clear',
                                  style: TextStyle(color: Colors.red),
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                      child: const Text(
                        'Clear All',
                        style: TextStyle(color: Colors.red),
                      ),
                    ),
                  ],
                ),
              ),

              // Wishlist items
              Expanded(
                child: GridView.builder(
                  padding: const EdgeInsets.all(16.0),
                  itemCount: wishlistService.items.length,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.7,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
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
                        ),
                        Positioned(
                          top: 8,
                          right: 8,
                          child: Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.grey.withOpacity(0.3),
                                  spreadRadius: 1,
                                  blurRadius: 4,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: IconButton(
                              icon: const Icon(
                                Icons.favorite,
                                color: Colors.red,
                                size: 18,
                              ),
                              onPressed: () =>
                                  _removeFromWishlist(context, item.id),
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                            ),
                          ),
                        ),
                        // Move to cart button
                        Positioned(
                          bottom: 8,
                          right: 8,
                          child: Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.grey.withOpacity(0.3),
                                  spreadRadius: 1,
                                  blurRadius: 4,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: IconButton(
                              icon: const Icon(
                                Icons.shopping_cart,
                                color: Colors.blue,
                                size: 18,
                              ),
                              onPressed: () => _moveToCart(context, item),
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                            ),
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

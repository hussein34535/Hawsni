import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:hawsni_app/core/services/wishlist_service.dart';
import 'package:hawsni_app/features/cart/bloc/cart_bloc.dart';
import 'package:hawsni_app/features/cart/bloc/cart_event.dart';
import 'package:hawsni_app/features/cart/bloc/cart_state.dart';
import 'package:hawsni_app/features/products/presentation/screens/product_detail_screen.dart';

class ProductCard extends StatefulWidget {
  final String id;
  final String imageUrl;
  final String name;
  final String price;
  final String description;
  final double rating;
  final int reviewCount;
  final List<String>? sizes;
  final List<String>? colors;

  const ProductCard({
    super.key,
    required this.id,
    required this.imageUrl,
    required this.name,
    required this.price,
    this.description =
        'A high-quality, comfortable product perfect for everyday wear. Made from premium materials.',
    this.rating = 4.5,
    this.reviewCount = 128,
    this.sizes,
    this.colors,
  });

  @override
  State<ProductCard> createState() => _ProductCardState();
}

class _ProductCardState extends State<ProductCard> {
  void _toggleWishlist(BuildContext context) {
    final wishlistService =
        Provider.of<WishlistService>(context, listen: false);

    if (wishlistService.isItemInWishlist(widget.id)) {
      wishlistService.removeFromWishlist(widget.id);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Removed from wishlist!'),
          duration: Duration(seconds: 1),
        ),
      );
    } else {
      wishlistService.addToWishlist(
        WishlistItem(
          id: widget.id,
          name: widget.name,
          price: widget.price,
          imageUrl: widget.imageUrl,
          description: widget.description,
          rating: widget.rating,
          reviewCount: widget.reviewCount,
        ),
      );
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Added to wishlist!'),
          duration: Duration(seconds: 1),
        ),
      );
    }
  }

  void _addToCart(BuildContext context) {
    final cartItem = CartItem(
      id: widget.id,
      name: widget.name,
      price: widget.price,
      imageUrl: widget.imageUrl,
    );

    context.read<CartBloc>().add(AddToCart(cartItem));

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Added to cart!'),
        backgroundColor: Colors.green,
        duration: Duration(seconds: 1),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final wishlistService = Provider.of<WishlistService>(context);
    final isWishlisted = wishlistService.isItemInWishlist(widget.id);

    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => ProductDetailScreen(
              name: widget.name,
              price: widget.price,
              imageUrl: widget.imageUrl,
              description: widget.description,
              rating: widget.rating,
              reviewCount: widget.reviewCount,
              sizes: widget.sizes,
              colors: widget.colors,
              productId: widget.id, // Pass product ID
            ),
          ),
        );
      },
      child: Container(
        width: 160,
        margin: const EdgeInsets.only(right: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withOpacity(0.1),
              spreadRadius: 1,
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Product image
            Expanded(
              child: ClipRRect(
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(12)),
                child: Stack(
                  children: [
                    Container(
                      width: double.infinity,
                      decoration: const BoxDecoration(
                        color: Color(0xFFF5F5F5),
                      ),
                      child: Image.network(
                        widget.imageUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return const Icon(Icons.shopping_bag,
                              size: 40, color: Colors.grey);
                        },
                      ),
                    ),
                    // Wishlist button
                    Positioned(
                      top: 8,
                      right: 8,
                      child: GestureDetector(
                        onTap: () => _toggleWishlist(context),
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.9),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Icon(
                            isWishlisted
                                ? Icons.favorite
                                : Icons.favorite_border,
                            size: 18,
                            color: isWishlisted ? Colors.red : Colors.grey,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Product info
            Padding(
              padding: const EdgeInsets.all(12.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.name,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),

                  // Rating
                  Row(
                    children: [
                      const Icon(
                        Icons.star,
                        color: Colors.amber,
                        size: 16,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${widget.rating}',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '(${widget.reviewCount})',
                        style: const TextStyle(
                          fontSize: 12,
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 8),

                  // Price and Add to Cart button
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        widget.price,
                        style: const TextStyle(
                          color: Colors.blue,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.add_shopping_cart, size: 20),
                        onPressed: () => _addToCart(context),
                        color: Colors.blue,
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:hawsni_app/core/services/wishlist_service.dart';
import 'package:hawsni_app/features/cart/bloc/cart_bloc.dart';
import 'package:hawsni_app/features/cart/bloc/cart_event.dart';
import 'package:hawsni_app/features/products/presentation/screens/product_detail_screen.dart';
import 'package:hawsni_app/core/themes/app_theme.dart';

class ProductCard extends StatelessWidget {
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
    this.description = '',
    this.rating = 0.0,
    this.reviewCount = 0,
    this.sizes,
    this.colors,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => ProductDetailScreen(
              name: name,
              price: price,
              imageUrl: imageUrl,
              description: description,
              rating: rating,
              reviewCount: reviewCount,
              sizes: sizes,
              colors: colors,
              productId: id,
            ),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image Section
            Expanded(
              child: Stack(
                children: [
                  Hero(
                    tag: 'product_$id',
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                        image: DecorationImage(
                          image: NetworkImage(imageUrl),
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: _WishlistButton(productId: id),
                  ),
                ],
              ),
            ),
            
            // Details Section
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.star_rounded, size: 16, color: AppTheme.accentColor),
                      const SizedBox(width: 4),
                      Text(
                        rating.toString(),
                        style: theme.textTheme.bodySmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '($reviewCount)',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        price,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: AppTheme.primaryColor,
                        ),
                      ),
                      _AddToCartButton(
                        id: id,
                        name: name,
                        price: price,
                        imageUrl: imageUrl,
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

class _WishlistButton extends StatelessWidget {
  final String productId;

  const _WishlistButton({required this.productId});

  @override
  Widget build(BuildContext context) {
    final wishlistService = Provider.of<WishlistService>(context);
    final isWishlisted = wishlistService.isItemInWishlist(productId);

    return GestureDetector(
      onTap: () {
        if (isWishlisted) {
          wishlistService.removeFromWishlist(productId);
        } else {
          // In a real app, we'd need full product details here
          // For now, we just toggle the ID
          // wishlistService.addToWishlist(...); 
        }
      },
      child: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 4,
            ),
          ],
        ),
        child: Icon(
          isWishlisted ? Icons.favorite : Icons.favorite_border,
          size: 18,
          color: isWishlisted ? Colors.red : Colors.grey,
        ),
      ),
    );
  }
}

class _AddToCartButton extends StatelessWidget {
  final String id;
  final String name;
  final String price;
  final String imageUrl;

  const _AddToCartButton({
    required this.id,
    required this.name,
    required this.price,
    required this.imageUrl,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppTheme.primaryColor,
      borderRadius: BorderRadius.circular(8),
      child: InkWell(
        onTap: () {
          context.read<CartBloc>().add(AddToCart(CartItem(
            id: id,
            name: name,
            price: price,
            imageUrl: imageUrl,
          )));
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('Added to cart'),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              backgroundColor: AppTheme.primaryColor,
              duration: const Duration(seconds: 1),
            ),
          );
        },
        borderRadius: BorderRadius.circular(8),
        child: const Padding(
          padding: EdgeInsets.all(6),
          child: Icon(
            Icons.add,
            color: Colors.white,
            size: 20,
          ),
        ),
      ),
    );
  }
}

import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:hawsni_app/core/themes/app_theme.dart';
import 'package:hawsni_app/features/products/presentation/screens/product_detail_screen.dart';

class ProductCard extends StatefulWidget {
  final String id;
  final String name;
  final String price;
  final String? originalPrice;
  final String imageUrl;
  final double rating;
  final int reviewCount;
  final bool showBadge;
  final String? badgeText;
  final Color? badgeColor;
  final String screenId;

  const ProductCard({
    super.key,
    required this.id,
    required this.name,
    required this.price,
    this.originalPrice,
    required this.imageUrl,
    this.rating = 0.0,
    this.reviewCount = 0,
    this.showBadge = false,
    this.badgeText,
    this.badgeColor,
    required this.screenId,
  });

  @override
  State<ProductCard> createState() => _ProductCardState();
}

class _ProductCardState extends State<ProductCard> {
  bool isFavorite = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ProductDetailScreen(
              productId: widget.id,
              name: widget.name,
              price: widget.price,
              imageUrl: widget.imageUrl,
              screenId: widget.screenId,
              rating: widget.rating,
              reviewCount: widget.reviewCount,
            ),
          ),
        );
      },
      child: Container(
        decoration: const BoxDecoration(
          color: Colors
              .transparent, // bg-card (assuming transparent/white context)
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image Container
            // relative overflow-hidden rounded-xl bg-secondary
            Expanded(
              child: Stack(
                children: [
                  Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: AppTheme.secondaryColor, // bg-secondary
                      borderRadius: BorderRadius.circular(12), // rounded-xl
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.network(
                        widget.imageUrl,
                        fit: BoxFit.cover, // object-cover
                        errorBuilder: (context, error, stackTrace) {
                          return Center(
                            child: Icon(
                              Icons.image_not_supported_outlined,
                              color: Colors.grey[400],
                              size: 32,
                            ),
                          );
                        },
                      ),
                    ),
                  ),

                  // Favorite Button
                  // absolute right-3 top-3 flex h-9 w-9 ... rounded-full bg-card/90 backdrop-blur-sm
                  Positioned(
                    top: 12, // top-3 (3 * 4 = 12px)
                    right: 12, // right-3
                    child: GestureDetector(
                      onTap: () {
                        setState(() {
                          isFavorite = !isFavorite;
                        });
                      },
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(50),
                        child: BackdropFilter(
                          filter: ImageFilter.blur(
                              sigmaX: 4, sigmaY: 4), // backdrop-blur-sm
                          child: Container(
                            width: 36, // h-9 (9 * 4 = 36px)
                            height: 36, // w-9
                            decoration: BoxDecoration(
                              color:
                                  Colors.white.withOpacity(0.9), // bg-card/90
                              shape: BoxShape.circle,
                            ),
                            child: Center(
                              child: Icon(
                                isFavorite
                                    ? Icons.favorite
                                    : Icons.favorite_border, // Heart icon
                                size: 20, // h-5 w-5 (5 * 4 = 20px)
                                color: isFavorite
                                    ? AppTheme
                                        .primaryColor // fill-accent text-accent (using Primary Black as accent)
                                    : Colors.grey[500], // text-muted-foreground
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Details Section
            // p-3
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Name
                  // mb-2 font-medium text-foreground line-clamp-1
                  Text(
                    widget.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500, // font-medium
                      color: AppTheme.textPrimary, // text-foreground
                    ),
                  ),

                  const SizedBox(height: 8), // mb-2

                  // Rating
                  // mb-2 flex items-center gap-1
                  Row(
                    children: [
                      Row(
                        children: List.generate(5, (index) {
                          // i < Math.floor(rating) ? "text-accent" : "text-muted"
                          final bool isFilled = index < widget.rating.floor();
                          return Icon(
                            Icons
                                .star, // Using standard star icon to mimic the SVG path
                            size: 14, // h-3.5 w-3.5 (approx 14px)
                            color: isFilled
                                ? AppTheme.primaryColor // text-accent (Black)
                                : Colors.grey[300], // text-muted
                          );
                        }),
                      ),
                      const SizedBox(width: 4), // gap-1
                      // text-xs text-muted-foreground
                      Text(
                        '(${widget.reviewCount})',
                        style: TextStyle(
                          fontSize: 12, // text-xs
                          color:
                              AppTheme.textSecondary, // text-muted-foreground
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 8), // mb-2

                  // Price
                  // flex items-center gap-2
                  Row(
                    children: [
                      // text-lg font-bold text-accent
                      Text(
                        '\$${widget.price}',
                        style: TextStyle(
                          fontSize: 18, // text-lg
                          fontWeight: FontWeight.bold, // font-bold
                          color: AppTheme.primaryColor, // text-accent
                        ),
                      ),
                      if (widget.originalPrice != null) ...[
                        const SizedBox(width: 8), // gap-2
                        // text-sm text-muted-foreground line-through
                        Text(
                          '\$${widget.originalPrice}',
                          style: TextStyle(
                            fontSize: 14, // text-sm
                            decoration: TextDecoration.lineThrough,
                            color:
                                AppTheme.textSecondary, // text-muted-foreground
                          ),
                        ),
                      ],
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

import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hawsni_app/l10n/generated/app_localizations.dart';
import 'package:hawsni_app/core/themes/app_theme.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hawsni_app/features/products/bloc/product_bloc.dart';
import 'package:hawsni_app/features/products/bloc/product_event.dart';
import 'package:hawsni_app/features/products/data/services/product_service.dart';
import 'package:hawsni_app/features/products/presentation/screens/product_detail_screen.dart';
import 'package:provider/provider.dart';
import 'package:hawsni_app/core/services/wishlist_service.dart';

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
  final List<dynamic>? colors;
  final List<String>? sizes;

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
    this.colors,
    this.sizes,
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
            builder: (context) => BlocProvider(
              create: (context) => ProductBloc(ProductService())
                ..add(LoadProductDetails(widget.id)),
              child: ProductDetailScreen(
                productId: widget.id,
                name: widget.name,
                price: widget.price,
                imageUrl: widget.imageUrl,
                screenId: widget.screenId,
                rating: widget.rating,
                reviewCount: widget.reviewCount,
                sizes: widget.sizes,
                colors: widget.colors,
              ),
            ),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey[200]!),
          // Shadow removed as requested
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
                      color: const Color(
                          0xFFF5F5F5), // Gray background for transparent images
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

                  // Favorite Button (Conditional: Only if Favorite)
                  Positioned(
                    top: 12,
                    right: 12,
                    child: Consumer<WishlistService>(
                      builder: (context, wishlistService, _) {
                        final isFav =
                            wishlistService.isItemInWishlist(widget.id);

                        // If not favorite, hide completely
                        if (!isFav) return const SizedBox.shrink();

                        return GestureDetector(
                          onTap: () {
                            // Can only unlike (since it disappears after)
                            wishlistService.removeFromWishlist(widget.id);
                          },
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(50),
                            child: BackdropFilter(
                              filter: ImageFilter.blur(sigmaX: 4, sigmaY: 4),
                              child: Container(
                                width: 36,
                                height: 36,
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(
                                      alpha: 0.2), // Very transparent
                                  shape: BoxShape.circle,
                                ),
                                child: Center(
                                  child: Icon(
                                    Icons.favorite,
                                    size: 20,
                                    color: AppTheme
                                        .primaryColor, // Red/Green Heart
                                  ),
                                ),
                              ),
                            ),
                          ),
                        );
                      },
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
                          color: AppTheme.textSecondary,
                          fontStyle: FontStyle.normal, // Force normal style
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
                      // text-lg font-bold text-accent
                      Text.rich(
                        TextSpan(
                          children: [
                            TextSpan(
                              text: widget.price.split('.')[0], // No decimals
                              style: GoogleFonts.poppins(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.primaryColor,
                              ),
                            ),
                            const TextSpan(text: ' '),
                            TextSpan(
                              text:
                                  AppLocalizations.of(context)!.currencySymbol,
                              style: GoogleFonts.poppins(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.primaryColor,
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (widget.originalPrice != null) ...[
                        const SizedBox(width: 8), // gap-2
                        // text-sm text-muted-foreground line-through
                        Text(
                          widget.originalPrice!.split('.')[0], // No decimals
                          style: GoogleFonts.poppins(
                            fontSize: 14,
                            decoration: TextDecoration.lineThrough,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      ],
                    ],
                  ),
                  if (widget.colors != null && widget.colors!.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Row(
                      children: widget.colors!.take(4).map((c) {
                        String colorName = '';
                        if (c is Map) {
                          colorName = c['color']?.toString() ?? '';
                        } else if (c is String) {
                          if (c.trim().startsWith('{')) {
                            try {
                              final match = RegExp(r'"color"\s*:\s*"([^"]+)"')
                                  .firstMatch(c);
                              colorName = match?.group(1) ?? c;
                            } catch (_) {
                              colorName = c;
                            }
                          } else {
                            colorName = c;
                          }
                        }

                        Color color;
                        try {
                          if (colorName.startsWith('#')) {
                            color = Color(int.parse(colorName.substring(1, 7),
                                    radix: 16) +
                                0xFF000000);
                          } else {
                            switch (colorName.toLowerCase()) {
                              case 'red':
                                color = Colors.red;
                                break;
                              case 'blue':
                                color = Colors.blue;
                                break;
                              case 'green':
                                color = Colors.green;
                                break;
                              case 'black':
                                color = Colors.black;
                                break;
                              case 'white':
                                color = Colors.white;
                                break;
                              case 'grey':
                                color = Colors.grey;
                                break;
                              case 'yellow':
                                color = Colors.yellow;
                                break;
                              case 'orange':
                                color = Colors.orange;
                                break;
                              case 'purple':
                                color = Colors.purple;
                                break;
                              case 'pink':
                                color = Colors.pink;
                                break;
                              case 'brown':
                                color = Colors.brown;
                                break;
                              default:
                                color = Colors.transparent;
                            }
                          }
                        } catch (_) {
                          color = Colors.transparent;
                        }

                        if (color == Colors.transparent)
                          return const SizedBox.shrink();

                        return Container(
                          width: 12,
                          height: 12,
                          margin: const EdgeInsets.only(right: 4),
                          decoration: BoxDecoration(
                            color: color,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.grey[300]!),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

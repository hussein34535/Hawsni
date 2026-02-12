import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:hwasi_app/l10n/generated/app_localizations.dart';
import 'package:hwasi_app/core/themes/app_theme.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hwasi_app/features/products/bloc/product_bloc.dart';
import 'package:hwasi_app/features/products/bloc/product_event.dart';
import 'package:hwasi_app/features/products/data/services/product_service.dart';
import 'package:hwasi_app/features/products/presentation/screens/product_detail_screen.dart';
import 'package:provider/provider.dart';
import 'package:hwasi_app/core/services/wishlist_service.dart';

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
  final List<String>? images;

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
    this.images,
  });

  @override
  State<ProductCard> createState() => _ProductCardState();
}

class _ProductCardState extends State<ProductCard> {
  String? _selectedImageUrl;
  String? _selectedColorCode;

  @override
  void initState() {
    super.initState();
    _selectedImageUrl = widget.imageUrl;
  }

  @override
  void didUpdateWidget(ProductCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.imageUrl != widget.imageUrl) {
      _selectedImageUrl = widget.imageUrl;
    }
  }

  Color _getColorFromHex(String colorName) {
    try {
      if (colorName.startsWith('#')) {
        return Color(
            int.parse(colorName.substring(1, 7), radix: 16) + 0xFF000000);
      } else {
        switch (colorName.toLowerCase()) {
          case 'red':
            return Colors.red;
          case 'blue':
            return Colors.blue;
          case 'green':
            return Colors.green;
          case 'black':
            return Colors.black;
          case 'white':
            return Colors.white;
          case 'grey':
            return Colors.grey;
          case 'yellow':
            return Colors.yellow;
          case 'orange':
            return Colors.orange;
          case 'purple':
            return Colors.purple;
          case 'pink':
            return Colors.pink;
          case 'brown':
            return Colors.brown;
          default:
            return Colors.transparent;
        }
      }
    } catch (_) {
      return Colors.transparent;
    }
  }

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
                imageUrl: _selectedImageUrl ?? widget.imageUrl,
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
          borderRadius: BorderRadius.circular(16), // Softer corners
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image Container - Fixed Aspect Ratio
            AspectRatio(
              aspectRatio: 1,
              child: Stack(
                children: [
                  Container(
                    width: double.infinity,
                    height: double.infinity,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF5F5F5),
                      borderRadius:
                          const BorderRadius.vertical(top: Radius.circular(12)),
                    ),
                    child: ClipRRect(
                      borderRadius:
                          const BorderRadius.vertical(top: Radius.circular(12)),
                      child: CachedNetworkImage(
                        imageUrl: _selectedImageUrl ?? widget.imageUrl,
                        fit: BoxFit.cover,
                        memCacheHeight: 600,
                        placeholder: (context, url) => Container(
                          color: const Color(0xFFF5F5F5),
                        ),
                        errorWidget: (context, url, error) => Center(
                          child: Icon(
                            Icons.image_not_supported_outlined,
                            color: Colors.grey[400],
                            size: 32,
                          ),
                        ),
                      ),
                    ),
                  ),

                  // Favorite Button Overlay
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Consumer<WishlistService>(
                      builder: (context, wishlistService, _) {
                        final isFav =
                            wishlistService.isItemInWishlist(widget.id);
                        if (!isFav) return const SizedBox.shrink();

                        return Container(
                          width: 28,
                          height: 28,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.9),
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.1),
                                blurRadius: 4,
                              ),
                            ],
                          ),
                          child: Center(
                            child: Icon(
                              Icons.favorite,
                              size: 16,
                              color: AppTheme.primaryColor,
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
            Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 10.0, vertical: 12.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // 1. Product Name
                  Text(
                    widget.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.cairo(
                      // Ensure nice Arabic font
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      height: 1.2,
                      color: AppTheme.textPrimary,
                    ),
                  ),

                  const SizedBox(height: 6),

                  // 2. Interactive Colors (Requested: Show them prominent outside)
                  if (widget.colors != null && widget.colors!.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 6.0),
                      child: Row(
                        children: widget.colors!.take(5).map((c) {
                          String colorCode = '';
                          String? variantImage;
                          if (c is Map) {
                            colorCode = c['color']?.toString() ?? '';
                            variantImage = c['imageIndex']
                                ?.toString(); // Corrected key if needed, or stick to what API sends
                            // Try to check if imageIndex is sent, usually it's 'imageIndex' or 'image'
                            if (c.containsKey('image'))
                              variantImage = c['image']?.toString();
                            if (c.containsKey('imageIndex'))
                              variantImage = c['imageIndex']?.toString();
                          } else if (c is String) {
                            // Robust JSON parsing for stringified data
                            if (c.trim().startsWith('{')) {
                              try {
                                final colorMatch =
                                    RegExp(r'"color"\s*:\s*"([^"]+)"')
                                        .firstMatch(c);
                                if (colorMatch != null) {
                                  colorCode = colorMatch.group(1) ?? c;

                                  // Try to extract image/imageIndex
                                  final imageMatch =
                                      RegExp(r'"image"\s*:\s*"([^"]+)"')
                                          .firstMatch(c);
                                  if (imageMatch != null) {
                                    variantImage = imageMatch.group(1);
                                  } else {
                                    // Fallback to imageIndex if that's what is used
                                    final indexMatch =
                                        RegExp(r'"imageIndex"\s*:\s*(\d+)')
                                            .firstMatch(c);
                                    if (indexMatch != null)
                                      variantImage = indexMatch.group(1);
                                  }
                                } else {
                                  colorCode = c;
                                }
                              } catch (e) {
                                colorCode = c;
                              }
                            } else {
                              colorCode = c;
                            }
                          }

                          Color color = _getColorFromHex(colorCode);
                          if (color == Colors.transparent) {
                            return const SizedBox.shrink();
                          }

                          final bool isSelected =
                              _selectedColorCode == colorCode;

                          return GestureDetector(
                            onTap: () {
                              setState(() {
                                _selectedColorCode = colorCode;
                                if (variantImage != null &&
                                    variantImage.isNotEmpty) {
                                  // If it is an index (digits only), we can't swap the image URL directly unless we have the list of images.
                                  // But ProductCard only has `imageUrl`.
                                  // Limitation: We can only swap if we have the URL. `ProductDetailScreen` has the full `images` list.
                                  // `ProductCard` does NOT have the full list.
                                  // Strategy: If `variantImage` is a URL, use it. If it's an index, we can't do much without the list.
                                  // Checking if it looks like a URL:
                                  if (variantImage!.startsWith('http')) {
                                    _selectedImageUrl = variantImage;
                                  } else if (RegExp(r'^\d+$')
                                          .hasMatch(variantImage!) &&
                                      widget.images != null) {
                                    // It is an index
                                    try {
                                      final images = widget.images!;
                                      int index = int.parse(variantImage!);
                                      if (index >= 0 && index < images.length) {
                                        _selectedImageUrl = images[index];
                                      }
                                    } catch (_) {}
                                  }
                                }
                              });
                            },
                            child: Container(
                              width: 14,
                              height: 14,
                              margin: const EdgeInsets.only(right: 6),
                              decoration: BoxDecoration(
                                color: color,
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: isSelected
                                      ? AppTheme.primaryColor
                                      : Colors.grey[300]!,
                                  width: isSelected ? 1.5 : 0.5,
                                ),
                                boxShadow: isSelected
                                    ? [
                                        BoxShadow(
                                          color: AppTheme.primaryColor
                                              .withValues(alpha: 0.3),
                                          blurRadius: 4,
                                        )
                                      ]
                                    : null,
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),

                  // NOTE: Number of sizes removed as per user request

                  const SizedBox(height: 4),

                  // 3. Rating & Price Row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      // Price
                      Expanded(
                        child: Text.rich(
                          TextSpan(
                            children: [
                              TextSpan(
                                text: widget.price.split('.')[0],
                                style: GoogleFonts.poppins(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.primaryColor,
                                ),
                              ),
                              const TextSpan(text: ' '),
                              TextSpan(
                                text: AppLocalizations.of(context)!
                                    .currencySymbol,
                                style: GoogleFonts.poppins(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.primaryColor,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                      // Minimized Star Rating
                      Row(
                        children: [
                          Icon(Icons.star,
                              size: 10, color: AppTheme.primaryColor),
                          const SizedBox(width: 2),
                          Text(
                            widget.rating.toStringAsFixed(1),
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.textPrimary,
                            ),
                          ),
                        ],
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

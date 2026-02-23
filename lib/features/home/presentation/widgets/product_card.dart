import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;

import 'package:cached_network_image/cached_network_image.dart';
import 'package:hwasi_app/l10n/generated/app_localizations.dart';
import 'package:hwasi_app/core/themes/app_theme.dart';
import 'package:provider/provider.dart';
import 'package:hwasi_app/core/services/wishlist_service.dart';
import 'package:flutter_blurhash/flutter_blurhash.dart';
import 'package:go_router/go_router.dart';

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
  final int discount;
  final bool isFeatured;
  final String? blurHash;

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
    this.discount = 0,
    this.isFeatured = false,
    this.blurHash,
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

  void _triggerPrecache() {
    if (!mounted) return;
    try {
      // Precache main image
      precacheImage(
          CachedNetworkImageProvider(_selectedImageUrl ?? widget.imageUrl),
          context);

      // Precache variant images if any
      if (widget.images != null && widget.images!.length > 1) {
        precacheImage(CachedNetworkImageProvider(widget.images![1]), context);
      }

      // We can also trigger bloc events here to pre-fetch details
      // But standard precaching of the main images handles 90% of the perceived delay
    } catch (_) {}
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
    return Focus(
      onFocusChange: (focused) {},
      child: Builder(
        builder: (ctx) {
          // A simple visibility-like check by triggering precache when the widget enters the tree
          // and occasionally checking scroll if needed, but rendering itself is a strong signal.
          WidgetsBinding.instance.addPostFrameCallback((_) {
            _triggerPrecache();
          });

          return GestureDetector(
            onTap: () {
              context.push(
                '/product/${widget.id}',
                extra: null, // Let screen fetch product data
              );
            },
            child: Container(
              decoration: const BoxDecoration(
                color: Colors
                    .transparent, // Minimalist: No background color for the card itself
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
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: kIsWeb
                                ? [] // Enforce empty shadows on web for better WebGL performance
                                : [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.08),
                                      blurRadius: 8,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(16),
                            child: kIsWeb
                                ? Image.network(
                                    _selectedImageUrl ?? widget.imageUrl,
                                    fit: BoxFit.cover,
                                    width: double.infinity,
                                    height: double.infinity,
                                    filterQuality: FilterQuality
                                        .none, // High performance scaling
                                    errorBuilder:
                                        (context, error, stackTrace) => Center(
                                      child: Icon(
                                        Icons.image_not_supported_outlined,
                                        color: Colors.grey[400],
                                        size: 32,
                                      ),
                                    ),
                                  )
                                : CachedNetworkImage(
                                    imageUrl:
                                        _selectedImageUrl ?? widget.imageUrl,
                                    fit: BoxFit.cover,
                                    memCacheWidth:
                                        350, // Strict memory constraint
                                    memCacheHeight: 350,
                                    filterQuality: FilterQuality.none,
                                    placeholder: (context, url) {
                                      if (widget.blurHash != null &&
                                          widget.blurHash!.isNotEmpty) {
                                        return RepaintBoundary(
                                          child: BlurHash(
                                            hash: widget.blurHash!,
                                            imageFit: BoxFit.cover,
                                          ),
                                        );
                                      }
                                      return Container(
                                        color: const Color(0xFFF5F5F5),
                                      );
                                    },
                                    errorWidget: (context, url, error) =>
                                        Center(
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
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8.0, vertical: 8.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // 1. Product Name
                        Text(
                          widget.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontFamily: 'Cairo',
                            // Ensure nice Arabic font
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            height: 1.2,
                            color: AppTheme.textPrimary,
                          ),
                        ),

                        const SizedBox(height: 4),

                        // 2. Interactive Colors
                        if (widget.colors != null && widget.colors!.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 4.0),
                            child: Row(
                              children: widget.colors!.take(5).map((c) {
                                String colorCode = '';
                                String? variantImage;
                                if (c is Map) {
                                  colorCode = c['color']?.toString() ?? '';
                                  if (c.containsKey('image'))
                                    variantImage = c['image']?.toString();
                                  if (c.containsKey('imageIndex'))
                                    variantImage = c['imageIndex']?.toString();
                                } else if (c is String) {
                                  if (c.trim().startsWith('{')) {
                                    try {
                                      final colorMatch =
                                          RegExp(r'"color"\s*:\s*"([^"]+)"')
                                              .firstMatch(c);
                                      if (colorMatch != null) {
                                        colorCode = colorMatch.group(1) ?? c;
                                        final imageMatch =
                                            RegExp(r'"image"\s*:\s*"([^"]+)"')
                                                .firstMatch(c);
                                        if (imageMatch != null) {
                                          variantImage = imageMatch.group(1);
                                        } else {
                                          final indexMatch = RegExp(
                                                  r'"imageIndex"\s*:\s*(\d+)')
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
                                        if (variantImage.startsWith('http')) {
                                          _selectedImageUrl = variantImage;
                                        } else if (RegExp(r'^\d+$')
                                                .hasMatch(variantImage) &&
                                            widget.images != null) {
                                          try {
                                            final images = widget.images!;
                                            int index = int.parse(variantImage);
                                            if (index >= 0 &&
                                                index < images.length) {
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

                        // 3. Price
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Expanded(
                              child: Text.rich(
                                TextSpan(
                                  children: [
                                    TextSpan(
                                      text: widget.price.split('.')[0],
                                      style: TextStyle(fontFamily: 'Cairo',
                                        fontSize: 15,
                                        fontWeight: FontWeight.bold,
                                        color: AppTheme.primaryColor,
                                      ),
                                    ),
                                    const TextSpan(text: ' '),
                                    TextSpan(
                                      text: AppLocalizations.of(context)!
                                          .currencySymbol,
                                      style: TextStyle(fontFamily: 'Cairo',
                                        fontSize: 10,
                                        fontWeight: FontWeight.w600,
                                        color: AppTheme.primaryColor,
                                      ),
                                    ),
                                  ],
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
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
        },
      ),
    );
  }
}

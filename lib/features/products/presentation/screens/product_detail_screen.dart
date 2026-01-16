import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hawsni_app/features/cart/bloc/cart_bloc.dart';
import 'package:hawsni_app/features/cart/bloc/cart_event.dart';
import 'package:hawsni_app/features/cart/bloc/cart_state.dart';
import 'package:hawsni_app/features/products/presentation/widgets/reviews_section.dart';
import 'package:hawsni_app/features/reviews/bloc/review_bloc.dart';
import 'package:hawsni_app/features/reviews/bloc/review_event.dart';
import 'package:hawsni_app/features/reviews/data/services/review_service.dart';
import 'package:share_plus/share_plus.dart';
import 'package:hawsni_app/core/themes/app_theme.dart';
import 'package:hawsni_app/core/widgets/spinning_loader.dart';
import 'package:hawsni_app/features/products/bloc/product_bloc.dart';
import 'package:hawsni_app/features/products/bloc/product_event.dart';
import 'package:hawsni_app/features/products/bloc/product_state.dart';
import 'package:hawsni_app/l10n/generated/app_localizations.dart';
import 'package:provider/provider.dart';
import 'package:hawsni_app/core/services/wishlist_service.dart';
import 'package:hawsni_app/features/products/data/services/product_service.dart';
import 'dart:ui';

import 'package:hawsni_app/features/cart/presentation/screens/cart_screen.dart';

class ProductDetailScreen extends StatefulWidget {
  final String name;
  final String price;
  final String imageUrl;
  final String description;
  final double rating;
  final int reviewCount;
  final List<String>? sizes;
  final List<dynamic>? colors;
  final String productId;
  final String screenId;

  const ProductDetailScreen({
    super.key,
    required this.name,
    required this.price,
    required this.imageUrl,
    this.description =
        'A high-quality, comfortable product perfect for everyday wear. Made from premium materials.',
    this.rating = 4.5,
    this.reviewCount = 128,
    this.sizes,
    this.colors,
    required this.productId,
    required this.screenId,
  });

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  int quantity = 1;
  String? selectedSize;
  String? selectedColor;
  int _currentImageIndex = 0;

  final PageController _pageController = PageController();

  @override
  void initState() {
    super.initState();
    // _pageController initialized inline
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _incrementQuantity() => setState(() => quantity++);
  void _decrementQuantity() {
    if (quantity > 1) setState(() => quantity--);
  }

  Color _getColorFromName(String colorName) {
    try {
      if (colorName.startsWith('#')) {
        return Color(
            int.parse(colorName.substring(1, 7), radix: 16) + 0xFF000000);
      }
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
        case 'gold':
          return const Color(0xFFD4AF37);
        case 'silver':
          return const Color(0xFFC0C0C0);
        case 'navy':
          return const Color(0xFF000080);
        case 'teal':
          return Colors.teal;
        case 'maroon':
          return const Color(0xFF800000);
        case 'beige':
          return const Color(0xFFF5F5DC);
        default:
          return Colors.grey;
      }
    } catch (e) {
      return Colors.grey;
    }
  }

  void _addToCart(BuildContext context) {
    final productState = context.read<ProductBloc>().state;
    List<String> availableSizes = [];
    List<dynamic> availableColors = [];

    // Use state if loaded, otherwise fallback to widget properties (optimistic UI)
    if (productState is ProductDetailsLoaded) {
      availableSizes = productState.product.sizes ?? [];
      availableColors = productState.product.colors ?? [];
    } else {
      availableSizes = widget.sizes ?? [];
      availableColors = widget.colors ?? [];
    }

    // Safety check: If we have no data and are still loading, prevent blind add
    if (availableSizes.isEmpty &&
        availableColors.isEmpty &&
        productState is! ProductDetailsLoaded) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppLocalizations.of(context)!.loading,
              style: const TextStyle(color: Colors.white)),
          backgroundColor: Colors.black87,
          duration: const Duration(milliseconds: 1500),
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
      return;
    }

    // Check validation
    if (availableSizes.isNotEmpty && selectedSize == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppLocalizations.of(context)!.pleaseSelectSize,
              style: const TextStyle(color: Colors.white)),
          backgroundColor: Colors.black,
          duration: const Duration(seconds: 2),
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
      return;
    }

    if (availableColors.isNotEmpty && selectedColor == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppLocalizations.of(context)!.pleaseSelectColor,
              style: const TextStyle(color: Colors.white)),
          backgroundColor: Colors.black,
          duration: const Duration(seconds: 2),
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
      return;
    }

    final itemId =
        '${widget.productId}${selectedSize != null ? "_$selectedSize" : ""}${selectedColor != null ? "_$selectedColor" : ""}';

    context.read<CartBloc>().add(AddToCart(CartItem(
          id: itemId,
          name: widget.name,
          price: widget.price,
          imageUrl: widget.imageUrl,
          quantity: quantity,
          productId: widget.productId,
          size: selectedSize,
          color: selectedColor,
        )));

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(AppLocalizations.of(context)!.addedToCart,
            style:
                AppTheme.textTheme.bodyMedium?.copyWith(color: Colors.white)),
        backgroundColor: AppTheme.primaryColor,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  void _shareProduct() {
    Share.share(
      'Check out ${widget.name} on Hawsni App!\nPrice: ${widget.price}\nRating: ${widget.rating} ⭐',
      subject: 'Check out this product: ${widget.name}',
    );
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;

    return MultiBlocProvider(
      providers: [
        BlocProvider(
          create: (context) =>
              ReviewBloc(ReviewService())..add(LoadReviews(widget.productId)),
        ),
        BlocProvider(
          create: (context) => ProductBloc(ProductService())
            ..add(LoadProductDetails(widget.productId)),
        ),
      ],
      child: BlocListener<CartBloc, CartState>(
        listener: (context, state) {
          if (state is CartAuthError) {
            showDialog(
              context: context,
              barrierDismissible: false,
              builder: (context) => AlertDialog(
                title: Text(AppLocalizations.of(context)!.sessionExpired),
                content:
                    Text(AppLocalizations.of(context)!.sessionExpiredMessage),
                actions: [
                  TextButton(
                    onPressed: () {
                      Navigator.of(context).pop();
                      // Ideally navigate to login screen here
                    },
                    child: const Text('OK'),
                  ),
                ],
              ),
            );
          } else if (state is CartError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Colors.red,
                behavior: SnackBarBehavior.floating,
              ),
            );
          }
        },
        child: Scaffold(
          backgroundColor: AppTheme.scaffoldBackgroundColor,
          body: Stack(
            children: [
              CustomScrollView(
                slivers: [
                  SliverAppBar(
                    expandedHeight:
                        screenHeight * 0.6, // Slightly reduced height
                    pinned: true,
                    backgroundColor: Colors.transparent,
                    leadingWidth: 0,
                    leading: const SizedBox.shrink(),
                    actions: const [SizedBox.shrink()],
                    flexibleSpace: FlexibleSpaceBar(
                      background: BlocBuilder<ProductBloc, ProductState>(
                        builder: (context, state) {
                          List<String> images = [widget.imageUrl];

                          if (state is ProductDetailsLoaded &&
                              state.product.images != null &&
                              state.product.images!.isNotEmpty) {
                            images = state.product.images!;
                          }

                          return Stack(
                            children: [
                              // Image Carousel
                              PageView.builder(
                                controller: _pageController,
                                itemCount: images.length,
                                itemBuilder: (context, index) {
                                  return Hero(
                                    tag: index == 0
                                        ? 'product_${widget.productId}_${widget.screenId}'
                                        : 'product_${widget.productId}_image_$index',
                                    child: Image.network(
                                      images[index],
                                      fit: BoxFit.cover,
                                      errorBuilder:
                                          (context, error, stackTrace) {
                                        return Container(
                                          color: Colors.grey[200],
                                          child: const Center(
                                            child: Icon(Icons.broken_image,
                                                size: 48),
                                          ),
                                        );
                                      },
                                    ),
                                  );
                                },
                                onPageChanged: (index) {
                                  setState(() {
                                    _currentImageIndex = index;
                                  });
                                },
                              ),
                              // Image indicators
                              if (images.length > 1)
                                Positioned(
                                  bottom: 20,
                                  left: 0,
                                  right: 0,
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: List.generate(
                                      images.length,
                                      (index) => Container(
                                        margin: const EdgeInsets.symmetric(
                                            horizontal: 4),
                                        width: _currentImageIndex == index
                                            ? 24
                                            : 8,
                                        height: 8,
                                        decoration: BoxDecoration(
                                          color: _currentImageIndex == index
                                              ? AppTheme.primaryColor
                                              : Colors.grey
                                                  .withValues(alpha: 0.5),
                                          borderRadius:
                                              BorderRadius.circular(4),
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                            ],
                          );
                        },
                      ),
                    ),
                  ),
                  SliverToBoxAdapter(
                    child: Container(
                      decoration: const BoxDecoration(
                        color: AppTheme.scaffoldBackgroundColor,
                        borderRadius:
                            BorderRadius.vertical(top: Radius.circular(32)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black12,
                            blurRadius: 20,
                            offset: Offset(0, -5),
                          ),
                        ],
                      ),
                      transform: Matrix4.translationValues(0, -32, 0),
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(24, 40, 24, 120),
                        child: BlocBuilder<ProductBloc, ProductState>(
                          builder: (context, state) {
                            String description = widget.description;
                            double rating = widget.rating;
                            int reviewCount = widget.reviewCount;
                            List<String>? sizes = widget.sizes;
                            List<dynamic>? colors = widget.colors;

                            if (state is ProductDetailsLoaded) {
                              description = state.product.description;
                              rating = state.product.rating;
                              reviewCount = state.product.reviewCount;
                              sizes = state.product.sizes;
                              colors = state.product.colors;
                            }

                            if (state is ProductLoading) {
                              return const Center(
                                  child: Padding(
                                padding: EdgeInsets.all(32.0),
                                child: SpinningLoader(),
                              ));
                            }

                            if (state is ProductError) {
                              return Center(
                                  child: Text('Error: ${state.message}',
                                      style: const TextStyle(
                                          color: AppTheme.errorColor)));
                            }

                            return Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Header
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        widget.name,
                                        style: AppTheme.textTheme.headlineMedium
                                            ?.copyWith(
                                          fontWeight: FontWeight.bold,
                                          color: AppTheme.textPrimary,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 16),
                                    Text(
                                      widget.price,
                                      style: AppTheme.textTheme.headlineSmall
                                          ?.copyWith(
                                        fontWeight: FontWeight.bold,
                                        color: AppTheme.primaryColor,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),

                                // Rating
                                Row(
                                  children: [
                                    const Icon(Icons.star_rounded,
                                        color: Color(0xFFFFC107), size: 24),
                                    const SizedBox(width: 4),
                                    Text(
                                      '$rating',
                                      style: AppTheme.textTheme.titleMedium
                                          ?.copyWith(
                                        fontWeight: FontWeight.bold,
                                        color: AppTheme.textPrimary,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      '($reviewCount ${AppLocalizations.of(context)!.reviews})',
                                      style: AppTheme.textTheme.bodyMedium
                                          ?.copyWith(
                                        color: AppTheme.textTertiary,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 32),

                                // Description
                                Text(
                                  AppLocalizations.of(context)!.description,
                                  style:
                                      AppTheme.textTheme.titleLarge?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.textPrimary,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  description,
                                  style: AppTheme.textTheme.bodyLarge?.copyWith(
                                    height: 1.6,
                                    color: AppTheme.textSecondary,
                                  ),
                                ),
                                const SizedBox(height: 32),

                                // Options (Size/Color)
                                if (sizes != null && sizes.isNotEmpty) ...[
                                  Text(
                                    AppLocalizations.of(context)!.selectSize,
                                    style: AppTheme.textTheme.titleMedium
                                        ?.copyWith(
                                      fontWeight: FontWeight.bold,
                                      color: AppTheme.textPrimary,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  Wrap(
                                    spacing: 12,
                                    runSpacing: 12,
                                    children: sizes.map((size) {
                                      final isSelected = selectedSize == size;
                                      return ChoiceChip(
                                        label: Text(size),
                                        selected: isSelected,
                                        onSelected: (selected) => setState(() =>
                                            selectedSize =
                                                selected ? size : null),
                                        selectedColor: AppTheme.primaryColor,
                                        labelStyle: TextStyle(
                                          color: isSelected
                                              ? Colors.white
                                              : AppTheme.textPrimary,
                                          fontWeight: FontWeight.bold,
                                        ),
                                        backgroundColor: AppTheme.surfaceColor,
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 16, vertical: 12),
                                        shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(12),
                                          side: BorderSide(
                                            color: isSelected
                                                ? AppTheme.primaryColor
                                                : AppTheme.borderColor,
                                          ),
                                        ),
                                      );
                                    }).toList(),
                                  ),
                                  const SizedBox(height: 32),
                                ],

                                if (colors != null && colors.isNotEmpty) ...[
                                  Text(
                                    AppLocalizations.of(context)!.selectColor,
                                    style: AppTheme.textTheme.titleMedium
                                        ?.copyWith(
                                      fontWeight: FontWeight.bold,
                                      color: AppTheme.textPrimary,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  Wrap(
                                    spacing: 12,
                                    runSpacing: 12,
                                    children: colors.map((colorData) {
                                      // Parse color data (handle both old string format and new object format)
                                      String colorName;
                                      int? linkedImageIndex;

                                      if (colorData is Map) {
                                        colorName =
                                            colorData['color']?.toString() ??
                                                '';
                                        final dynamic imageIndexValue =
                                            colorData['imageIndex'];
                                        if (imageIndexValue is int) {
                                          linkedImageIndex = imageIndexValue;
                                        } else if (imageIndexValue != null) {
                                          linkedImageIndex = int.tryParse(
                                              imageIndexValue.toString());
                                        }
                                      } else if (colorData is String) {
                                        // Handle stringified JSON object (Fix for gray colors issue)
                                        if (colorData.trim().startsWith('{')) {
                                          try {
                                            // Extract color using regex
                                            final colorMatch = RegExp(
                                                    r'"color"\s*:\s*"([^"]+)"')
                                                .firstMatch(colorData);
                                            if (colorMatch != null) {
                                              colorName = colorMatch.group(1) ??
                                                  colorData;

                                              // Extract imageIndex using regex
                                              final indexMatch = RegExp(
                                                      r'"imageIndex"\s*:\s*(\d+)')
                                                  .firstMatch(colorData);
                                              if (indexMatch != null) {
                                                linkedImageIndex = int.tryParse(
                                                    indexMatch.group(1)!);
                                              }
                                            } else {
                                              colorName = colorData;
                                              linkedImageIndex = null;
                                            }
                                          } catch (e) {
                                            colorName = colorData;
                                            linkedImageIndex = null;
                                          }
                                        } else {
                                          colorName = colorData;
                                          linkedImageIndex = null;
                                        }
                                      } else {
                                        colorName = colorData.toString();
                                        linkedImageIndex = null;
                                      }

                                      final isSelected =
                                          selectedColor == colorName;
                                      final color =
                                          _getColorFromName(colorName);

                                      return GestureDetector(
                                        onTap: () {
                                          setState(() {
                                            selectedColor =
                                                isSelected ? null : colorName;
                                            // Change image if color has linked image
                                            if (!isSelected &&
                                                linkedImageIndex != null) {
                                              _currentImageIndex =
                                                  linkedImageIndex;
                                              if (_pageController.hasClients) {
                                                _pageController.animateToPage(
                                                  linkedImageIndex,
                                                  duration: const Duration(
                                                      milliseconds: 300),
                                                  curve: Curves.easeInOut,
                                                );
                                              }
                                            }
                                          });
                                        },
                                        child: Container(
                                          width: 42,
                                          height: 42,
                                          decoration: BoxDecoration(
                                            color: color,
                                            shape: BoxShape.circle,
                                            border: Border.all(
                                              color: isSelected
                                                  ? AppTheme.primaryColor
                                                  : Colors.grey[300]!,
                                              width: isSelected ? 2 : 1,
                                            ),
                                            boxShadow: [
                                              BoxShadow(
                                                color: Colors.black
                                                    .withValues(alpha: 0.1),
                                                blurRadius: 4,
                                                offset: const Offset(0, 2),
                                              ),
                                            ],
                                          ),
                                          child: isSelected
                                              ? Icon(
                                                  Icons.check,
                                                  color:
                                                      color.computeLuminance() >
                                                              0.5
                                                          ? Colors.black
                                                          : Colors.white,
                                                  size: 24,
                                                )
                                              : null,
                                        ),
                                      );
                                    }).toList(),
                                  ),
                                  const SizedBox(height: 32),
                                ],

                                // Quantity
                                Row(
                                  children: [
                                    Text(
                                      AppLocalizations.of(context)!.quantity,
                                      style: AppTheme.textTheme.titleMedium
                                          ?.copyWith(
                                        fontWeight: FontWeight.bold,
                                        color: AppTheme.textPrimary,
                                      ),
                                    ),
                                    const Spacer(),
                                    Container(
                                      decoration: BoxDecoration(
                                        border: Border.all(
                                            color: AppTheme.borderColor),
                                        borderRadius: BorderRadius.circular(12),
                                        color: AppTheme.surfaceColor,
                                      ),
                                      child: Row(
                                        children: [
                                          IconButton(
                                            icon: const Icon(Icons.remove,
                                                color: AppTheme.textPrimary),
                                            onPressed: _decrementQuantity,
                                          ),
                                          Text(
                                            '$quantity',
                                            style: const TextStyle(
                                              fontSize: 18,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                          IconButton(
                                            icon: const Icon(Icons.add,
                                                color: AppTheme.textPrimary),
                                            onPressed: _incrementQuantity,
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 32),
                                const Divider(color: AppTheme.dividerColor),
                                const SizedBox(height: 16),

                                // Reviews Section
                                ReviewsSection(productId: widget.productId),
                              ],
                            );
                          },
                        ),
                      ),
                    ),
                  ),
                ],
              ),

              // Custom Top Bar (Back Button & Actions)
              Positioned(
                top: MediaQuery.of(context).padding.top + 8,
                left: 16,
                right: 16,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Back Button
                    _buildGlassIcon(
                      icon: Icons.arrow_back,
                      onTap: () => Navigator.of(context).pop(),
                    ),

                    // Actions
                    Row(
                      children: [
                        // Wishlist
                        Consumer<WishlistService>(
                          builder: (context, wishlistService, _) {
                            final isInWishlist = wishlistService
                                .isItemInWishlist(widget.productId);
                            return _buildGlassIcon(
                              icon: isInWishlist
                                  ? Icons.favorite
                                  : Icons.favorite_border,
                              color: isInWishlist
                                  ? AppTheme.errorColor
                                  : Colors.black,
                              onTap: () {
                                final item = WishlistItem(
                                  id: widget.productId,
                                  name: widget.name,
                                  price: widget.price,
                                  imageUrl: widget.imageUrl,
                                  description: widget.description,
                                  rating: widget.rating,
                                  reviewCount: widget.reviewCount,
                                );
                                if (isInWishlist) {
                                  wishlistService
                                      .removeFromWishlist(widget.productId);
                                } else {
                                  wishlistService.addToWishlist(item);
                                }
                              },
                            );
                          },
                        ),
                        const SizedBox(width: 12),

                        // Cart
                        BlocBuilder<CartBloc, CartState>(
                          builder: (context, state) {
                            final itemCount =
                                state is CartLoaded ? state.items.length : 0;
                            return Stack(
                              clipBehavior: Clip.none,
                              children: [
                                _buildGlassIcon(
                                  icon: Icons.shopping_bag_outlined,
                                  onTap: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                          builder: (_) => const CartScreen()),
                                    );
                                  },
                                ),
                                if (itemCount > 0)
                                  Positioned(
                                    right: -4,
                                    top: -4,
                                    child: Container(
                                      padding: const EdgeInsets.all(4),
                                      decoration: const BoxDecoration(
                                        color: AppTheme.primaryColor,
                                        shape: BoxShape.circle,
                                      ),
                                      child: Text(
                                        '$itemCount',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ),
                              ],
                            );
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Floating Bottom Bar
              Positioned(
                bottom: 32,
                left: 24,
                right: 24,
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(32),
                    boxShadow: AppTheme.shadowFloating,
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(32),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 24, vertical: 16),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.9),
                          borderRadius: BorderRadius.circular(32),
                        ),
                        child: Row(
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  AppLocalizations.of(context)!.totalPrice,
                                  style: AppTheme.textTheme.bodySmall?.copyWith(
                                    color: AppTheme.textSecondary,
                                  ),
                                ),
                                Text(
                                  widget.price,
                                  style:
                                      AppTheme.textTheme.titleLarge?.copyWith(
                                    color: AppTheme.primaryColor,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                            const Spacer(),
                            ElevatedButton.icon(
                              onPressed: () => _addToCart(context),
                              icon: const Icon(Icons.shopping_bag_outlined,
                                  color: Colors.white),
                              label:
                                  Text(AppLocalizations.of(context)!.addToBag),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primaryColor,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 24, vertical: 12),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(24),
                                ),
                                elevation: 0,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildGlassIcon({
    required IconData icon,
    required VoidCallback onTap,
    Color color = Colors.black,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: ClipOval(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.8),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 24),
          ),
        ),
      ),
    );
  }
}

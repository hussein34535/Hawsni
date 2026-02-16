import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hwasi_app/features/cart/bloc/cart_bloc.dart';
import 'package:hwasi_app/features/cart/bloc/cart_event.dart';
import 'package:hwasi_app/features/cart/bloc/cart_state.dart';
import 'package:hwasi_app/features/products/presentation/widgets/related_products.dart';
import 'package:hwasi_app/features/products/presentation/widgets/reviews_section.dart';
import 'package:hwasi_app/features/reviews/bloc/review_bloc.dart';
import 'package:hwasi_app/features/reviews/bloc/review_event.dart';

import 'package:hwasi_app/core/themes/app_theme.dart';
import 'package:hwasi_app/core/utils/responsive_layout.dart';
import 'package:hwasi_app/core/widgets/spinning_loader.dart';
import 'package:hwasi_app/features/products/bloc/product_bloc.dart';
import 'package:hwasi_app/features/products/bloc/product_event.dart';
import 'package:hwasi_app/features/products/bloc/product_state.dart';
import 'package:hwasi_app/l10n/generated/app_localizations.dart';
import 'package:share_plus/share_plus.dart';
import 'package:hwasi_app/core/services/analytics_service.dart';
import 'package:provider/provider.dart';
import 'package:hwasi_app/core/services/wishlist_service.dart';
import 'package:hwasi_app/features/products/data/services/product_service.dart';

import 'dart:ui';

import 'package:hwasi_app/features/auth/presentation/screens/login_screen.dart';
import 'package:hwasi_app/features/cart/presentation/screens/cart_screen.dart';
import 'package:hwasi_app/features/reviews/data/services/review_service.dart';

class ProductDetailScreen extends StatefulWidget {
  final String? name;
  final String? price;
  final String? imageUrl;
  final String description;
  final double rating;
  final int reviewCount;
  final List<String>? sizes;
  final List<dynamic>? colors;
  final String productId;
  final String screenId;

  const ProductDetailScreen({
    super.key,
    this.name,
    this.price,
    this.imageUrl,
    this.description = '',
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

  void _shareProduct(BuildContext context, String name, String id) {
    Share.share(
        'Check out this amazing product: $name\nhttps://hawsni.com/product/$id');
    context.read<AnalyticsService>().logShare(
          contentType: 'product',
          itemId: id,
          method: 'share_plus',
        );
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

    // Resolve product details
    String currentName = widget.name ?? '';
    String currentPrice = widget.price ?? '0';
    String currentImageUrl = widget.imageUrl ?? '';

    if (productState is ProductDetailsLoaded) {
      currentName = productState.product.name;
      currentPrice = productState.product.price.toString();
      if (productState.product.images != null &&
          productState.product.images!.isNotEmpty) {
        currentImageUrl = productState.product.images![0];
      }
    }

    // Fallback if data is missing (e.g. still loading deep link)
    if (currentName.isEmpty) return;

    final itemId =
        '${widget.productId}${selectedSize != null ? "_$selectedSize" : ""}${selectedColor != null ? "_$selectedColor" : ""}';

    context.read<CartBloc>().add(AddToCart(CartItem(
          id: itemId,
          name: currentName,
          price: currentPrice,
          imageUrl: currentImageUrl,
          quantity: quantity,
          productId: widget.productId,
          size: selectedSize,
          color: selectedColor,
        )));

    context.read<AnalyticsService>().logAddToCart(
          itemId: itemId,
          itemName: currentName,
          itemCategory: 'General', // Replace with actual category if available
          price: double.tryParse(currentPrice) ?? 0,
        );

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
      child: MultiBlocListener(
          listeners: [
            BlocListener<CartBloc, CartState>(
              listener: (context, state) {
                if (state is CartAuthError) {
                  showDialog(
                    context: context,
                    barrierDismissible: false,
                    builder: (context) => AlertDialog(
                      title: Text(AppLocalizations.of(context)!.sessionExpired),
                      content: Text(
                          AppLocalizations.of(context)!.sessionExpiredMessage),
                      actions: [
                        TextButton(
                          onPressed: () {
                            Navigator.of(context).pop();
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => const LoginScreen(),
                              ),
                            );
                          },
                          child: Text(AppLocalizations.of(context)!.ok),
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
            ),
            BlocListener<ProductBloc, ProductState>(
              listener: (context, state) {
                if (state is ProductDetailsLoaded) {
                  context.read<AnalyticsService>().logViewItem(
                        itemId: state.product.id,
                        itemName: state.product.name,
                        itemCategory: state.product.category,
                      );
                }
              },
            ),
          ],
          child: ResponsiveLayout.isDesktop(context)
              ? BlocBuilder<ProductBloc, ProductState>(
                  builder: (context, state) {
                    // Resolve values inside BlocBuilder for Desktop
                    String? displayName = widget.name;
                    String? displayPrice = widget.price;
                    String? displayImageUrl = widget.imageUrl;
                    String displayDescription = widget.description;
                    List<String> displayImages = [];
                    if (widget.imageUrl != null)
                      displayImages.add(widget.imageUrl!);

                    if (state is ProductDetailsLoaded) {
                      displayName = state.product.name;
                      displayPrice = '\$${state.product.price}';
                      if (state.product.images != null &&
                          state.product.images!.isNotEmpty) {
                        displayImageUrl = state.product.images![0];
                        displayImages = state.product.images!;
                      }
                      displayDescription = state.product.description;
                    }

                    if (displayName == null) {
                      return const Scaffold(
                          body: Center(child: CircularProgressIndicator()));
                    }

                    return _buildDesktopLayout(
                        context,
                        displayName,
                        displayPrice ?? '',
                        displayImageUrl ?? '',
                        displayDescription,
                        displayImages,
                        state);
                  },
                )
              : Scaffold(
                  backgroundColor: AppTheme.scaffoldBackgroundColor,
                  bottomNavigationBar: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 24, vertical: 16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.05),
                          blurRadius: 10,
                          offset: const Offset(0, -5),
                        )
                      ],
                    ),
                    child: SafeArea(
                      child: Row(
                        children: [
                          Container(
                            height: 50,
                            decoration: BoxDecoration(
                                border: Border.all(color: Colors.grey[200]!),
                                borderRadius: BorderRadius.circular(25)),
                            child: Row(
                              children: [
                                IconButton(
                                    icon: const Icon(Icons.remove, size: 20),
                                    onPressed: _decrementQuantity),
                                Text('$quantity',
                                    style: GoogleFonts.poppins(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold)),
                                IconButton(
                                    icon: const Icon(Icons.add, size: 20),
                                    onPressed: _incrementQuantity),
                              ],
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: SizedBox(
                              height: 54,
                              child: ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppTheme.primaryColor,
                                  elevation: 0,
                                  shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(27)),
                                ),
                                onPressed: () => _addToCart(context),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Icon(Icons.shopping_bag_outlined,
                                        color: Colors.white, size: 22),
                                    const SizedBox(width: 8),
                                    Text(
                                      AppLocalizations.of(context)!.addToCart,
                                      style: GoogleFonts.cairo(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.white),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  body: CustomScrollView(
                    slivers: [
                      SliverAppBar(
                        expandedHeight:
                            screenHeight * 0.6, // Slightly reduced height
                        pinned: true,
                        backgroundColor: Colors.transparent,
                        leadingWidth: 70,
                        leading: Padding(
                          padding: const EdgeInsets.only(left: 16),
                          child: _buildGlassIcon(
                            icon: Icons.arrow_back,
                            onTap: () => Navigator.of(context).pop(),
                          ),
                        ),
                        actions: [
                          // Wishlist
                          BlocBuilder<ProductBloc, ProductState>(
                            builder: (context, state) {
                              String currentName = widget.name ?? '';
                              String currentPrice = widget.price ?? '0';
                              String currentImageUrl = widget.imageUrl ?? '';

                              if (state is ProductDetailsLoaded) {
                                currentName = state.product.name;
                                currentPrice = state.product.price.toString();
                                if (state.product.images != null &&
                                    state.product.images!.isNotEmpty) {
                                  currentImageUrl = state.product.images![0];
                                }
                              }

                              return Consumer<WishlistService>(
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
                                      if (currentName.isEmpty) return;

                                      final item = WishlistItem(
                                        id: widget.productId,
                                        name: currentName,
                                        price: currentPrice,
                                        imageUrl: currentImageUrl.isNotEmpty
                                            ? currentImageUrl
                                            : 'https://via.placeholder.com/400',
                                        description: widget.description,
                                        rating: widget.rating,
                                        reviewCount: widget.reviewCount,
                                      );
                                      if (isInWishlist) {
                                        wishlistService.removeFromWishlist(
                                            widget.productId);
                                      } else {
                                        wishlistService.addToWishlist(item);
                                      }
                                    },
                                  );
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
                          const SizedBox(width: 12),

                          _buildGlassIcon(
                            icon: Icons.share,
                            onTap: () {
                              final currentState =
                                  context.read<ProductBloc>().state;
                              final name = widget.name ??
                                  (currentState is ProductDetailsLoaded
                                      ? currentState.product.name
                                      : '');
                              if (name.isNotEmpty) {
                                _shareProduct(context, name, widget.productId);
                              }
                            },
                          ),
                          const SizedBox(width: 16),
                        ],
                        flexibleSpace: FlexibleSpaceBar(
                          background: BlocBuilder<ProductBloc, ProductState>(
                            builder: (context, state) {
                              List<String> images = [];
                              if (widget.imageUrl != null) {
                                images.add(widget.imageUrl!);
                              }

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
                                        mainAxisAlignment:
                                            MainAxisAlignment.center,
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
                          ),
                          child: Padding(
                            padding: const EdgeInsets.fromLTRB(24, 24, 24, 120),
                            child: BlocBuilder<ProductBloc, ProductState>(
                              builder: (context, state) {
                                // String description = widget.description;
                                double rating = widget.rating;
                                int reviewCount = widget.reviewCount;
                                List<String>? sizes = widget.sizes;
                                List<dynamic>? colors = widget.colors;

                                String? displayName = widget.name;
                                String? displayPrice = widget.price;
                                String? displayDescription = widget.description;

                                if (state is ProductDetailsLoaded) {
                                  displayName = state.product.name;
                                  displayPrice = '\$${state.product.price}';
                                  displayDescription =
                                      state.product.description;
                                  rating = state.product.rating;
                                  reviewCount = state.product.reviewCount;
                                  sizes = state.product.sizes;
                                  colors = state.product.colors;
                                }

                                if (displayName == null) {
                                  return const Center(
                                      child: Padding(
                                    padding: EdgeInsets.all(32.0),
                                    child: SpinningLoader(),
                                  ));
                                }

                                if (state is ProductError) {
                                  return Center(
                                      child: Text(state.message,
                                          style: const TextStyle(
                                              color: Colors.red)));
                                }

                                return Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // 1. Header (Title & Price)
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Expanded(
                                          child: Text(
                                            displayName,
                                            style: GoogleFonts.cairo(
                                              fontSize: 18, // Reduced from 20
                                              fontWeight: FontWeight.bold,
                                              color: AppTheme.textPrimary,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 16),
                                        Text(
                                          displayPrice ?? '',
                                          style: GoogleFonts.poppins(
                                            fontSize: 18, // Reduced from 20
                                            fontWeight: FontWeight.bold,
                                            color: AppTheme.primaryColor,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),

                                    // Rating Section
                                    Row(
                                      children: [
                                        const Icon(Icons.star_rounded,
                                            color: Color(0xFFFFC107),
                                            size: 20), // Reduced from 24
                                        const SizedBox(width: 4),
                                        Text(
                                          '$rating',
                                          style: GoogleFonts.poppins(
                                            fontSize: 14, // Reduced from 16
                                            fontWeight: FontWeight.bold,
                                            color: AppTheme.textPrimary,
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          '($reviewCount ${AppLocalizations.of(context)!.reviews})',
                                          style: GoogleFonts.cairo(
                                            fontSize: 12, // Reduced from 14
                                            color: AppTheme.textTertiary,
                                          ),
                                        ),
                                      ],
                                    ),

                                    const SizedBox(
                                        height: 24), // Reduced from 32

                                    // 2. Color Selection
                                    if (colors != null &&
                                        colors.isNotEmpty) ...[
                                      Text(
                                        AppLocalizations.of(context)!
                                            .selectColor,
                                        style: GoogleFonts.cairo(
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                          color: AppTheme.textPrimary,
                                        ),
                                      ),
                                      const SizedBox(height: 16),
                                      Wrap(
                                        spacing: 12,
                                        runSpacing: 12,
                                        children: colors.map((colorData) {
                                          String colorName;
                                          int? linkedImageIndex;

                                          if (colorData is Map) {
                                            colorName = colorData['color']
                                                    ?.toString() ??
                                                '';
                                            final dynamic imageIndexValue =
                                                colorData['imageIndex'];
                                            if (imageIndexValue is int) {
                                              linkedImageIndex =
                                                  imageIndexValue;
                                            } else if (imageIndexValue !=
                                                null) {
                                              linkedImageIndex = int.tryParse(
                                                  imageIndexValue.toString());
                                            }
                                          } else if (colorData is String) {
                                            if (colorData
                                                .trim()
                                                .startsWith('{')) {
                                              try {
                                                final colorMatch = RegExp(
                                                        r'"color"\s*:\s*"([^"]+)"')
                                                    .firstMatch(colorData);
                                                if (colorMatch != null) {
                                                  colorName =
                                                      colorMatch.group(1) ??
                                                          colorData;
                                                  final indexMatch = RegExp(
                                                          r'"imageIndex"\s*:\s*(\d+)')
                                                      .firstMatch(colorData);
                                                  if (indexMatch != null) {
                                                    linkedImageIndex =
                                                        int.tryParse(indexMatch
                                                            .group(1)!);
                                                  }
                                                } else {
                                                  colorName = colorData;
                                                }
                                              } catch (e) {
                                                colorName = colorData;
                                              }
                                            } else {
                                              colorName = colorData;
                                            }
                                          } else {
                                            colorName = colorData.toString();
                                          }

                                          final isSelected =
                                              selectedColor == colorName;
                                          final color =
                                              _getColorFromName(colorName);

                                          return GestureDetector(
                                            onTap: () {
                                              setState(() {
                                                selectedColor = isSelected
                                                    ? null
                                                    : colorName;
                                                if (!isSelected &&
                                                    linkedImageIndex != null) {
                                                  _currentImageIndex =
                                                      linkedImageIndex;
                                                  if (_pageController
                                                      .hasClients) {
                                                    _pageController
                                                        .animateToPage(
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
                                              width: 36, // Reduced from 44
                                              height: 36, // Reduced from 44
                                              decoration: BoxDecoration(
                                                color: color,
                                                shape: BoxShape.circle,
                                                border: Border.all(
                                                  color: isSelected
                                                      ? AppTheme.primaryColor
                                                      : Colors.grey[200]!,
                                                  width: isSelected ? 2.5 : 1,
                                                ),
                                                boxShadow: isSelected
                                                    ? [
                                                        BoxShadow(
                                                          color: AppTheme
                                                              .primaryColor
                                                              .withValues(
                                                                  alpha: 0.2),
                                                          blurRadius: 8,
                                                          spreadRadius: 2,
                                                        )
                                                      ]
                                                    : null,
                                              ),
                                              child: isSelected
                                                  ? Icon(
                                                      Icons.check_rounded,
                                                      color:
                                                          color.computeLuminance() >
                                                                  0.5
                                                              ? Colors.black
                                                              : Colors.white,
                                                      size:
                                                          18, // Reduced from 20
                                                    )
                                                  : null,
                                            ),
                                          );
                                        }).toList(),
                                      ),
                                      const SizedBox(
                                          height: 24), // Reduced from 32
                                    ],

                                    // 3. Size Selection
                                    if (sizes != null && sizes.isNotEmpty) ...[
                                      Text(
                                        AppLocalizations.of(context)!
                                            .selectSize,
                                        style: GoogleFonts.cairo(
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                          color: AppTheme.textPrimary,
                                        ),
                                      ),
                                      const SizedBox(height: 16),
                                      Wrap(
                                        spacing: 12,
                                        runSpacing: 12,
                                        children: sizes.map((size) {
                                          final isSelected =
                                              selectedSize == size;
                                          return ChoiceChip(
                                            label: Text(size),
                                            selected: isSelected,
                                            onSelected: (selected) => setState(
                                                () => selectedSize =
                                                    selected ? size : null),
                                            selectedColor: Colors.black,
                                            labelStyle: GoogleFonts.poppins(
                                              color: isSelected
                                                  ? Colors.white
                                                  : Colors.black,
                                              fontWeight: FontWeight.bold,
                                            ),
                                            backgroundColor: Colors.white,
                                            padding: const EdgeInsets.symmetric(
                                                horizontal: 16, vertical: 12),
                                            shape: RoundedRectangleBorder(
                                              borderRadius:
                                                  BorderRadius.circular(14),
                                              side: BorderSide(
                                                color: isSelected
                                                    ? Colors.black
                                                    : Colors.grey[300]!,
                                              ),
                                            ),
                                          );
                                        }).toList(),
                                      ),
                                      const SizedBox(height: 32),
                                    ],

                                    // 3.5 Quantity & Add to Cart - MOVED TO FLOATING BAR
                                    const SizedBox(height: 24),

                                    // 4. Description
                                    Text(
                                      AppLocalizations.of(context)!.description,
                                      style: GoogleFonts.cairo(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                        color: AppTheme.textPrimary,
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    Text(
                                      displayDescription,
                                      style: GoogleFonts.cairo(
                                        fontSize: 15,
                                        height: 1.6,
                                        color: AppTheme.textSecondary,
                                      ),
                                    ),
                                    const SizedBox(height: 32),

                                    // Quantity (Original - Unused now but keeping format reference)
                                    /* Row(
                                        children: [
                                          Text(
                                            AppLocalizations.of(context)!
                                                .quantity,
                                            style: AppTheme
                                                .textTheme.titleMedium
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
                                              borderRadius:
                                                  BorderRadius.circular(12),
                                              color: AppTheme.surfaceColor,
                                            ),
                                            child: Row(
                                              children: [
                                                IconButton(
                                                  icon: const Icon(Icons.remove,
                                                      color:
                                                          AppTheme.textPrimary),
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
                                                      color:
                                                          AppTheme.textPrimary),
                                                  onPressed: _incrementQuantity,
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ), */
                                    const SizedBox(height: 32),
                                    const Divider(color: AppTheme.dividerColor),
                                    const SizedBox(height: 16),

                                    // Reviews Section
                                    ReviewsSection(productId: widget.productId),

                                    const SizedBox(height: 32),
                                    // Related Products
                                    if (state is ProductDetailsLoaded)
                                      RelatedProducts(
                                          products: state.relatedProducts),
                                  ],
                                );
                              },
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                )),
    );
  }

  Widget _buildDesktopLayout(
      BuildContext context,
      String name,
      String price,
      String imageUrl,
      String description,
      List<String> images,
      ProductState state) {
    return Scaffold(
      backgroundColor: AppTheme.scaffoldBackgroundColor,
      appBar: AppBar(
        title: Text(name),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 48, vertical: 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Breadcrumbs or Back button could go here
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Left Column: Images
                  Expanded(
                    flex: 1,
                    child: Column(
                      children: [
                        AspectRatio(
                          aspectRatio: 1,
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(20),
                            child: Hero(
                              tag: 'product_${widget.productId}',
                              child: Image.network(
                                imageUrl,
                                fit: BoxFit.cover,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        // Thumbnails
                        if (images.length > 1)
                          SizedBox(
                            height: 80,
                            child: ListView.separated(
                              scrollDirection: Axis.horizontal,
                              itemCount: images.length,
                              separatorBuilder: (_, __) =>
                                  const SizedBox(width: 12),
                              itemBuilder: (context, index) {
                                return GestureDetector(
                                  onTap: () {
                                    // Handle image selection (would need state management for selected image index)
                                  },
                                  child: Container(
                                    width: 80,
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(
                                        color: AppTheme.primaryColor,
                                        width: 2,
                                      ),
                                    ),
                                    child: ClipRRect(
                                      borderRadius: BorderRadius.circular(10),
                                      child: Image.network(
                                        images[index],
                                        fit: BoxFit.cover,
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
                  const SizedBox(width: 48),
                  // Right: Details
                  Expanded(
                    flex: 1,
                    child: SingleChildScrollView(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            name,
                            style: GoogleFonts.cairo(
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            price,
                            style: GoogleFonts.poppins(
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.primaryColor,
                            ),
                          ),
                          const SizedBox(height: 24),

                          // Colors
                          if (state is ProductDetailsLoaded &&
                              state.product.colors != null &&
                              state.product.colors!.isNotEmpty) ...[
                            Text(AppLocalizations.of(context)!.selectColor,
                                style: GoogleFonts.cairo(
                                    fontSize: 18, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 12),
                            Wrap(
                              spacing: 12,
                              runSpacing: 12,
                              children: state.product.colors!
                                  .map<Widget>((colorData) {
                                String colorName = colorData.toString();
                                // Simplified extraction for brevity, assuming standard format or simple string
                                if (colorData is Map)
                                  colorName =
                                      colorData['color']?.toString() ?? '';
                                // Note: Complex parsing omitted for brevity, relying on basic extraction

                                final isSelected = selectedColor == colorName;
                                final color = _getColorFromName(colorName);
                                return GestureDetector(
                                  onTap: () => setState(() => selectedColor =
                                      isSelected ? null : colorName),
                                  child: Container(
                                    width: 44,
                                    height: 44,
                                    decoration: BoxDecoration(
                                      color: color,
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                          color: isSelected
                                              ? AppTheme.primaryColor
                                              : Colors.grey[200]!,
                                          width: 2.5),
                                    ),
                                    child: isSelected
                                        ? Icon(Icons.check,
                                            color:
                                                color.computeLuminance() > 0.5
                                                    ? Colors.black
                                                    : Colors.white)
                                        : null,
                                  ),
                                );
                              }).toList(),
                            ),
                            const SizedBox(height: 24),
                          ],

                          // Sizes
                          if (state is ProductDetailsLoaded &&
                              state.product.sizes != null &&
                              state.product.sizes!.isNotEmpty) ...[
                            Text(AppLocalizations.of(context)!.selectSize,
                                style: GoogleFonts.cairo(
                                    fontSize: 18, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 12),
                            Wrap(
                              spacing: 12,
                              children: state.product.sizes!.map((size) {
                                final isSelected = selectedSize == size;
                                return ChoiceChip(
                                  label: Text(size),
                                  selected: isSelected,
                                  onSelected: (val) => setState(
                                      () => selectedSize = val ? size : null),
                                  selectedColor: Colors.black,
                                  labelStyle: TextStyle(
                                      color: isSelected
                                          ? Colors.white
                                          : Colors.black),
                                  backgroundColor: Colors.white,
                                );
                              }).toList(),
                            ),
                            const SizedBox(height: 32),
                          ],

                          const SizedBox(height: 32),

                          Row(
                            children: [
                              Container(
                                decoration: BoxDecoration(
                                    border:
                                        Border.all(color: Colors.grey[300]!),
                                    borderRadius: BorderRadius.circular(12)),
                                child: Row(
                                  children: [
                                    IconButton(
                                        icon: const Icon(Icons.remove),
                                        onPressed: _decrementQuantity),
                                    Text('$quantity',
                                        style: const TextStyle(
                                            fontSize: 18,
                                            fontWeight: FontWeight.bold)),
                                    IconButton(
                                        icon: const Icon(Icons.add),
                                        onPressed: _incrementQuantity),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: SizedBox(
                                  height: 56,
                                  child: ElevatedButton.icon(
                                    icon: const Icon(
                                        Icons.shopping_bag_outlined,
                                        color: Colors.white),
                                    label: Text(AppLocalizations.of(context)!
                                        .addToCart),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.black,
                                      textStyle: GoogleFonts.cairo(
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold),
                                      shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(12)),
                                    ),
                                    onPressed: () => _addToCart(context),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 32),

                          Text(AppLocalizations.of(context)!.description,
                              style: GoogleFonts.cairo(
                                  fontSize: 24, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 16),
                          Text(
                            description,
                            style: GoogleFonts.cairo(
                              fontSize: 16,
                              height: 1.6,
                              color: AppTheme.textSecondary,
                            ),
                          ),
                          const SizedBox(height: 32),

                          const SizedBox(height: 16),

                          Row(
                            children: [
                              ElevatedButton.icon(
                                onPressed: () {
                                  _shareProduct(
                                      context, name, widget.productId);
                                },
                                icon: const Icon(Icons.share),
                                label: Text('Share'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.grey[200],
                                  foregroundColor: Colors.black,
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 24, vertical: 16),
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 32),
                          ReviewsSection(productId: widget.productId),
                          const SizedBox(height: 32),
                        ],
                      ),
                    ),
                  ),
                ],
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
            padding: const EdgeInsets.all(8), // Reduced from 12
            decoration: BoxDecoration(
              color: Colors.black
                  .withValues(alpha: 0.2), // Darker, more transparent
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: Colors.white, size: 18), // Reduced from 24
          ),
        ),
      ),
    );
  }
}

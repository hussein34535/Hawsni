import 'dart:ui';
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
import 'package:provider/provider.dart';
import 'package:hawsni_app/core/services/wishlist_service.dart';
import 'package:hawsni_app/features/products/data/services/product_service.dart';

class ProductDetailScreen extends StatefulWidget {
  final String name;
  final String price;
  final String imageUrl;
  final String description;
  final double rating;
  final int reviewCount;
  final List<String>? sizes;
  final List<String>? colors;
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

  void _incrementQuantity() => setState(() => quantity++);
  void _decrementQuantity() {
    if (quantity > 1) setState(() => quantity--);
  }

  void _addToCart(BuildContext context) {
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
        content:
            const Text('Added to cart!', style: TextStyle(color: Colors.black)),
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
    final theme = Theme.of(context);

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
      child: Scaffold(
        backgroundColor: Colors.black,
        body: Stack(
          children: [
            CustomScrollView(
              slivers: [
                SliverAppBar(
                  expandedHeight: 500,
                  pinned: true,
                  backgroundColor: Colors.transparent,
                  leading: Container(
                    margin: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.3),
                      shape: BoxShape.circle,
                    ),
                    child: IconButton(
                      icon: const Icon(Icons.arrow_back, color: Colors.white),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ),
                  actions: [
                    Container(
                      margin: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.3),
                        shape: BoxShape.circle,
                      ),
                      child: Consumer<WishlistService>(
                        builder: (context, wishlistService, _) {
                          final isInWishlist = wishlistService
                              .isItemInWishlist(widget.productId);
                          return IconButton(
                            icon: Icon(
                              isInWishlist
                                  ? Icons.favorite
                                  : Icons.favorite_border,
                              color: isInWishlist ? Colors.red : Colors.white,
                            ),
                            onPressed: () {
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
                    ),
                    Container(
                      margin: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.3),
                        shape: BoxShape.circle,
                      ),
                      child: IconButton(
                        icon: const Icon(Icons.share, color: Colors.white),
                        onPressed: _shareProduct,
                      ),
                    ),
                  ],
                  flexibleSpace: FlexibleSpaceBar(
                    background: Hero(
                      tag: 'product_${widget.productId}',
                      child: Image.network(
                        widget.imageUrl,
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                ),
                SliverToBoxAdapter(
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.black,
                      borderRadius:
                          const BorderRadius.vertical(top: Radius.circular(32)),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.primaryColor.withOpacity(0.1),
                          blurRadius: 20,
                          offset: const Offset(0, -5),
                        ),
                      ],
                    ),
                    transform: Matrix4.translationValues(0, -24, 0),
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(24, 32, 24, 100),
                      child: BlocBuilder<ProductBloc, ProductState>(
                        builder: (context, state) {
                          String description = widget.description;
                          double rating = widget.rating;
                          int reviewCount = widget.reviewCount;
                          List<String>? sizes = widget.sizes;
                          List<String>? colors = widget.colors;

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
                                    style: const TextStyle(color: Colors.red)));
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
                                      style: theme.textTheme.displaySmall
                                          ?.copyWith(
                                        color: Colors.white,
                                        fontFamily: 'Playfair Display',
                                      ),
                                    ),
                                  ),
                                  Text(
                                    widget.price,
                                    style:
                                        theme.textTheme.displaySmall?.copyWith(
                                      color: AppTheme.primaryColor,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),

                              // Rating
                              Row(
                                children: [
                                  const Icon(Icons.star,
                                      color: AppTheme.primaryColor, size: 20),
                                  const SizedBox(width: 4),
                                  Text(
                                    '$rating',
                                    style:
                                        theme.textTheme.titleMedium?.copyWith(
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    '($reviewCount reviews)',
                                    style: theme.textTheme.bodyMedium
                                        ?.copyWith(color: Colors.grey),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 24),

                              // Description
                              Text(
                                'Description',
                                style: theme.textTheme.titleLarge?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.primaryColor,
                                  fontFamily: 'Playfair Display',
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                description,
                                style: theme.textTheme.bodyLarge?.copyWith(
                                  height: 1.6,
                                  color: Colors.white.withOpacity(0.8),
                                ),
                              ),
                              const SizedBox(height: 24),

                              // Options (Size/Color)
                              if (sizes != null && sizes.isNotEmpty) ...[
                                Text(
                                  'Size',
                                  style: theme.textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                Wrap(
                                  spacing: 12,
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
                                            ? Colors.black
                                            : Colors.white,
                                        fontWeight: FontWeight.bold,
                                      ),
                                      backgroundColor:
                                          Colors.white.withOpacity(0.1),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(8),
                                        side: BorderSide(
                                          color: isSelected
                                              ? AppTheme.primaryColor
                                              : Colors.white.withOpacity(0.2),
                                        ),
                                      ),
                                    );
                                  }).toList(),
                                ),
                                const SizedBox(height: 24),
                              ],

                              if (colors != null && colors.isNotEmpty) ...[
                                Text(
                                  'Color',
                                  style: theme.textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                Wrap(
                                  spacing: 12,
                                  children: colors.map((color) {
                                    final isSelected = selectedColor == color;
                                    return ChoiceChip(
                                      label: Text(color),
                                      selected: isSelected,
                                      onSelected: (selected) => setState(() =>
                                          selectedColor =
                                              selected ? color : null),
                                      selectedColor: AppTheme.primaryColor,
                                      labelStyle: TextStyle(
                                        color: isSelected
                                            ? Colors.black
                                            : Colors.white,
                                        fontWeight: FontWeight.bold,
                                      ),
                                      backgroundColor:
                                          Colors.white.withOpacity(0.1),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(8),
                                        side: BorderSide(
                                          color: isSelected
                                              ? AppTheme.primaryColor
                                              : Colors.white.withOpacity(0.2),
                                        ),
                                      ),
                                    );
                                  }).toList(),
                                ),
                                const SizedBox(height: 24),
                              ],

                              // Quantity
                              Row(
                                children: [
                                  Text(
                                    'Quantity',
                                    style:
                                        theme.textTheme.titleMedium?.copyWith(
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                  const Spacer(),
                                  Container(
                                    decoration: BoxDecoration(
                                      border: Border.all(
                                          color: Colors.white.withOpacity(0.2)),
                                      borderRadius: BorderRadius.circular(12),
                                      color: Colors.white.withOpacity(0.05),
                                    ),
                                    child: Row(
                                      children: [
                                        IconButton(
                                          icon: const Icon(Icons.remove,
                                              color: Colors.white),
                                          onPressed: _decrementQuantity,
                                        ),
                                        Text(
                                          '$quantity',
                                          style: theme.textTheme.titleMedium
                                              ?.copyWith(color: Colors.white),
                                        ),
                                        IconButton(
                                          icon: const Icon(Icons.add,
                                              color: Colors.white),
                                          onPressed: _incrementQuantity,
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 32),
                              const Divider(color: Colors.white24),
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
            // Floating Glass Bottom Bar
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: ClipRRect(
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                  child: Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.6),
                      border: Border(
                          top:
                              BorderSide(color: Colors.white.withOpacity(0.1))),
                    ),
                    child: ElevatedButton(
                      onPressed: () => _addToCart(context),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 20),
                        backgroundColor: AppTheme.primaryColor,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(30)),
                        elevation: 10,
                        shadowColor: AppTheme.primaryColor.withOpacity(0.4),
                      ),
                      child: const Text(
                        'Add to Cart',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.black,
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
    );
  }
}

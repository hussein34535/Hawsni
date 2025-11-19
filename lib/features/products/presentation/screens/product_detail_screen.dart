import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hawsni_app/features/cart/bloc/cart_bloc.dart';
import 'package:hawsni_app/features/cart/bloc/cart_event.dart';
import 'package:hawsni_app/features/reviews/presentation/widgets/review_card.dart';
import 'package:hawsni_app/features/reviews/presentation/screens/write_review_screen.dart';
import 'package:hawsni_app/features/products/presentation/widgets/product_image_gallery.dart';
import 'package:hawsni_app/features/products/presentation/widgets/related_products.dart';
import 'package:hawsni_app/features/products/presentation/widgets/reviews_section.dart';
import 'package:share_plus/share_plus.dart';
import 'package:hawsni_app/core/themes/app_theme.dart';

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

  const ProductDetailScreen({
    super.key,
    required this.name,
    required this.price,
    required this.imageUrl,
    this.description = 'A high-quality, comfortable product perfect for everyday wear. Made from premium materials.',
    this.rating = 4.5,
    this.reviewCount = 128,
    this.sizes,
    this.colors,
    required this.productId,
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
    final itemId = '${widget.productId}${selectedSize != null ? "_$selectedSize" : ""}${selectedColor != null ? "_$selectedColor" : ""}';

    context.read<CartBloc>().add(AddToCart(CartItem(
      id: itemId,
      name: widget.name,
      price: widget.price,
      imageUrl: widget.imageUrl,
      quantity: quantity,
    )));

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Added to cart!'),
        backgroundColor: AppTheme.successColor,
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

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 400,
            pinned: true,
            backgroundColor: Colors.white,
            leading: Container(
              margin: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.9),
                shape: BoxShape.circle,
              ),
              child: IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.black),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ),
            actions: [
              Container(
                margin: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.9),
                  shape: BoxShape.circle,
                ),
                child: IconButton(
                  icon: const Icon(Icons.share, color: Colors.black),
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
                color: theme.scaffoldBackgroundColor,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
              ),
              transform: Matrix4.translationValues(0, -24, 0),
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            widget.name,
                            style: theme.textTheme.displaySmall,
                          ),
                        ),
                        Text(
                          widget.price,
                          style: theme.textTheme.displaySmall?.copyWith(
                            color: AppTheme.accentColor,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    
                    // Rating
                    Row(
                      children: [
                        const Icon(Icons.star, color: AppTheme.accentColor, size: 20),
                        const SizedBox(width: 4),
                        Text(
                          '${widget.rating}',
                          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '(${widget.reviewCount} reviews)',
                          style: theme.textTheme.bodyMedium,
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Description
                    Text(
                      'Description',
                      style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      widget.description,
                      style: theme.textTheme.bodyLarge?.copyWith(height: 1.6),
                    ),
                    const SizedBox(height: 24),

                    // Options (Size/Color)
                    if (widget.sizes != null) ...[
                      Text('Size', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 12,
                        children: widget.sizes!.map((size) {
                          final isSelected = selectedSize == size;
                          return ChoiceChip(
                            label: Text(size),
                            selected: isSelected,
                            onSelected: (selected) => setState(() => selectedSize = selected ? size : null),
                            selectedColor: AppTheme.primaryColor,
                            labelStyle: TextStyle(color: isSelected ? Colors.white : Colors.black),
                            backgroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 24),
                    ],

                    // Quantity
                    Row(
                      children: [
                        Text('Quantity', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                        const Spacer(),
                        Container(
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.grey.shade300),
                            borderRadius: BorderRadius.circular(12),
                            color: Colors.white,
                          ),
                          child: Row(
                            children: [
                              IconButton(icon: const Icon(Icons.remove), onPressed: _decrementQuantity),
                              Text('$quantity', style: theme.textTheme.titleMedium),
                              IconButton(icon: const Icon(Icons.add), onPressed: _incrementQuantity),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),

                    // Add to Cart Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _addToCart,
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 20),
                          backgroundColor: AppTheme.primaryColor,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        child: const Text(
                          'Add to Cart',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

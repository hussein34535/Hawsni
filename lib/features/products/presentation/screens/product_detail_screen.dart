import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hawsni_app/features/cart/bloc/cart_bloc.dart';
import 'package:hawsni_app/features/cart/bloc/cart_event.dart';
import 'package:hawsni_app/features/cart/bloc/cart_state.dart';
import 'package:hawsni_app/features/cart/presentation/screens/cart_screen.dart';
import 'package:hawsni_app/features/reviews/presentation/widgets/review_card.dart';
import 'package:hawsni_app/features/reviews/presentation/screens/write_review_screen.dart';
import 'package:hawsni_app/core/services/api_service.dart';
import 'package:hawsni_app/features/products/presentation/widgets/product_image_gallery.dart';
import 'package:hawsni_app/features/products/presentation/widgets/related_products.dart';
import 'package:share_plus/share_plus.dart';

class ProductDetailScreen extends StatefulWidget {
  final String name;
  final String price;
  final String imageUrl;
  final String description;
  final double rating;
  final int reviewCount;
  final List<String>? sizes;
  final List<String>? colors;
  final String productId; // Add product ID

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
    required this.productId, // Add product ID parameter
  });

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  int quantity = 1;
  int selectedImageIndex = 0;
  String? selectedSize;
  String? selectedColor;
  List<dynamic> _reviews = [];
  bool _isLoadingReviews = true;

  @override
  void initState() {
    super.initState();
    _loadReviews();
  }

  Future<void> _loadReviews() async {
    try {
      final reviews = await ApiService.getProductReviews(widget.productId);
      setState(() {
        _reviews = reviews;
        _isLoadingReviews = false;
      });
    } catch (e) {
      print('Error loading reviews: $e');
      setState(() {
        _isLoadingReviews = false;
      });
    }
  }

  void _incrementQuantity() {
    setState(() {
      quantity++;
    });
  }

  void _decrementQuantity() {
    if (quantity > 1) {
      setState(() {
        quantity--;
      });
    }
  }

  void _selectSize(String size) {
    setState(() {
      selectedSize = size.isEmpty ? null : size;
    });
  }

  void _selectColor(String color) {
    setState(() {
      selectedColor = color.isEmpty ? null : color;
    });
  }

  void _addToCart(BuildContext context) {
    // Generate a unique ID for the product (in a real app, this would come from the backend)
    final productId = widget.name.hashCode.toString();

    // Create a unique ID that includes size and color if selected
    String itemId = productId;
    if (selectedSize != null) {
      itemId += '_${selectedSize}';
    }
    if (selectedColor != null) {
      itemId += '_${selectedColor}';
    }

    final cartItem = CartItem(
      id: itemId,
      name: widget.name,
      price: widget.price,
      imageUrl: widget.imageUrl,
      quantity: quantity,
    );

    context.read<CartBloc>().add(AddToCart(cartItem));

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Added to cart!'),
        backgroundColor: Colors.green,
      ),
    );
  }

  void _writeReview() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => WriteReviewScreen(
          productId: widget.productId,
          productName: widget.name,
        ),
      ),
    );

    // Reload reviews if a new review was submitted
    if (result == true) {
      _loadReviews();
    }
  }

  void _shareProduct() async {
    // Create a shareable text with product details
    final StringBuffer productText = StringBuffer();
    productText.writeln('Check out this product on Hawsni App:');
    productText.writeln();
    productText.writeln('Product: ${widget.name}');
    productText.writeln('Price: ${widget.price}');
    productText
        .writeln('Rating: ${widget.rating} (${widget.reviewCount} reviews)');
    productText.writeln();
    productText.write('Download the Hawsni App to see this product!');

    // Share the text
    await Share.share(
      productText.toString(),
      subject: 'Check out this product: ${widget.name}',
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      body: CustomScrollView(
        slivers: [
          // Product images section
          SliverAppBar(
            expandedHeight: 350,
            pinned: true,
            backgroundColor: Colors.white,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.black),
              onPressed: () => Navigator.of(context).pop(),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.share, color: Colors.black),
                onPressed: () {
                  _shareProduct();
                },
              ),
              IconButton(
                icon: const Icon(Icons.favorite_border, color: Colors.black),
                onPressed: () {},
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: ProductImageGallery(
                imageUrls: [
                  widget.imageUrl
                ], // In a real app, this would be a list of image URLs
                productName: widget.name,
              ),
            ),
          ),

          // Product details section
          SliverToBoxAdapter(
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Product title and price
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                widget.name,
                                style: const TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            Text(
                              widget.price,
                              style: const TextStyle(
                                fontSize: 22,
                                color: Colors.blue,
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
                                color: Colors.amber, size: 20),
                            const SizedBox(width: 4),
                            Text(
                              '${widget.rating}',
                              style:
                                  const TextStyle(fontWeight: FontWeight.w500),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '(${widget.reviewCount} reviews)',
                              style: const TextStyle(color: Colors.grey),
                            ),
                            const Spacer(),
                            const Icon(Icons.verified,
                                color: Colors.green, size: 16),
                            const SizedBox(width: 4),
                            const Text(
                              'In Stock',
                              style: TextStyle(
                                color: Colors.green,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Divider
                  const Divider(height: 1, thickness: 1),

                  // Sizes selector
                  if (widget.sizes != null && widget.sizes!.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Size',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: widget.sizes!.map((size) {
                              final isSelected = selectedSize == size;
                              return ChoiceChip(
                                label: Text(size),
                                selected: isSelected,
                                onSelected: (selected) {
                                  _selectSize(selected ? size : '');
                                },
                                selectedColor: Colors.blue,
                                backgroundColor: Colors.grey[200],
                                labelStyle: TextStyle(
                                  color:
                                      isSelected ? Colors.white : Colors.black,
                                  fontWeight: isSelected
                                      ? FontWeight.bold
                                      : FontWeight.normal,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                  side: BorderSide(
                                    color:
                                        isSelected ? Colors.blue : Colors.grey,
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                    ),

                  // Colors selector
                  if (widget.colors != null && widget.colors!.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Color',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: widget.colors!.map((color) {
                              final isSelected = selectedColor == color;
                              return ChoiceChip(
                                label: Text(color),
                                selected: isSelected,
                                onSelected: (selected) {
                                  _selectColor(selected ? color : '');
                                },
                                selectedColor: Colors.blue,
                                backgroundColor: Colors.grey[200],
                                labelStyle: TextStyle(
                                  color:
                                      isSelected ? Colors.white : Colors.black,
                                  fontWeight: isSelected
                                      ? FontWeight.bold
                                      : FontWeight.normal,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                  side: BorderSide(
                                    color:
                                        isSelected ? Colors.blue : Colors.grey,
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                    ),

                  // Quantity selector
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Quantity',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Container(
                              decoration: BoxDecoration(
                                border: Border.all(color: Colors.grey),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                children: [
                                  IconButton(
                                    icon: const Icon(Icons.remove, size: 18),
                                    onPressed: _decrementQuantity,
                                  ),
                                  Text(
                                    '$quantity',
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.add, size: 18),
                                    onPressed: _incrementQuantity,
                                  ),
                                ],
                              ),
                            ),
                            const Spacer(),
                            // Fix: Parse price correctly by removing currency symbols
                            Text(
                              'Total: \$${((double.tryParse(widget.price.replaceAll(RegExp(r'[^\d.]'), '')) ?? 0.0) * quantity).toStringAsFixed(2)}',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Colors.blue,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Divider
                  const Divider(height: 1, thickness: 1),

                  // Description
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Description',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          widget.description,
                          style: const TextStyle(
                            fontSize: 16,
                            height: 1.5,
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Divider
                  const Divider(height: 1, thickness: 1),

                  // Features
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Features',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 12),
                        _buildFeatureItem('✓', 'Premium Quality Materials'),
                        _buildFeatureItem('✓', 'Comfortable Design'),
                        _buildFeatureItem('✓', 'Durable Construction'),
                        _buildFeatureItem('✓', 'Easy to Maintain'),
                      ],
                    ),
                  ),

                  // Divider
                  const Divider(height: 1, thickness: 1),

                  // Reviews section
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Reviews',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            TextButton(
                              onPressed: _writeReview,
                              child: const Text('Write Review'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        _isLoadingReviews
                            ? const Center(child: CircularProgressIndicator())
                            : _reviews.isEmpty
                                ? const Center(
                                    child: Text(
                                      'No reviews yet. Be the first to review this product!',
                                      style: TextStyle(color: Colors.grey),
                                    ),
                                  )
                                : Column(
                                    children: _reviews.map((review) {
                                      return ReviewCard(
                                        userName: review['user']?['name'] ??
                                            'Anonymous',
                                        rating: review['rating'] ?? 0,
                                        comment: review['comment'] ?? '',
                                        date: _formatDate(
                                            review['createdAt'] ?? ''),
                                      );
                                    }).toList(),
                                  ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Related products section
          SliverToBoxAdapter(
            child: RelatedProducts(
              categoryId:
                  '1', // In a real app, this would be the actual category ID
              currentProductId: widget.productId,
            ),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16.0),
        decoration: const BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black12,
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: Row(
          children: [
            // Add to cart button
            Expanded(
              flex: 2,
              child: ElevatedButton(
                onPressed: () => _addToCart(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.all(16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text(
                  'Add to Cart',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ),
            ),
            const SizedBox(width: 12),
            // Buy now button
            Expanded(
              flex: 2,
              child: OutlinedButton(
                onPressed: () {
                  // Navigate to checkout
                },
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Colors.blue),
                  padding: const EdgeInsets.all(16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text(
                  'Buy Now',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.blue,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeatureItem(String icon, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        children: [
          Text(icon, style: const TextStyle(color: Colors.green)),
          const SizedBox(width: 8),
          Text(text, style: const TextStyle(fontSize: 16)),
        ],
      ),
    );
  }

  String _formatDate(String dateString) {
    try {
      final DateTime date = DateTime.parse(dateString);
      return '${date.day}/${date.month}/${date.year}';
    } catch (e) {
      return 'Unknown date';
    }
  }
}

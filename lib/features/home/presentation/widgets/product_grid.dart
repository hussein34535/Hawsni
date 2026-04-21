import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:hwasi_app/features/home/presentation/widgets/product_card.dart';
import 'package:hwasi_app/core/services/api_service.dart';
import 'package:hwasi_app/core/widgets/skeleton_loader.dart';

class ProductGrid extends StatefulWidget {
  final String? categoryId;
  const ProductGrid({super.key, this.categoryId});

  @override
  State<ProductGrid> createState() => _ProductGridState();
}

class _ProductGridState extends State<ProductGrid> {
  List<dynamic> products = [];
  bool isLoading = true;
  bool hasError = false;

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  Future<void> _loadProducts() async {
    try {
      // Check if the widget is still mounted before calling setState
      if (mounted) {
        setState(() {
          isLoading = true;
          hasError = false;
        });
      }

      final fetchedProducts =
          await ApiService.getProducts(categoryId: widget.categoryId);
      // Check if the widget is still mounted before calling setState
      if (mounted) {
        setState(() {
          products = fetchedProducts;
          isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading products: $e');
      // Check if the widget is still mounted before calling setState
      if (mounted) {
        setState(() {
          isLoading = false;
          hasError = true;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return SizedBox(
        height: 250,
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          itemCount: 4,
          itemBuilder: (context, index) {
            return Container(
              width: 160,
              margin: const EdgeInsets.only(right: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SkeletonLoader(
                    height: 150,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  const SizedBox(height: 12),
                  const SkeletonLoader(
                    height: 16,
                    width: 100,
                  ),
                  const SizedBox(height: 8),
                  const SkeletonLoader(
                    height: 14,
                    width: 60,
                  ),
                ],
              ),
            );
          },
        ),
      );
    }

    if (hasError) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              'حدث خطأ أثناء تحميل المنتجات',
              style: TextStyle(fontSize: 18, color: Colors.red),
            ),
            const SizedBox(height: 10),
            ElevatedButton(
              onPressed: _loadProducts,
              child: const Text('إعادة المحاولة'),
            ),
          ],
        ),
      );
    }

    if (products.isEmpty) {
      return const Center(
        child: Text(
          'لا توجد منتجات متاحة',
          style: TextStyle(fontSize: 18, color: Colors.grey),
        ),
      );
    }

    return SizedBox(
      height: 250,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: products.length,
        itemBuilder: (context, index) {
          final productMap = products[index] as Map<String, dynamic>;
          final images = productMap['images'] as List?;
          final imageUrl = images != null && images.isNotEmpty
              ? '${ApiService.baseUrl}${images[0]}'
              : '';

          final productId = productMap['id']?.toString() ?? 'product_$index';
          final stock = productMap['countInStock'] ?? productMap['stock'] ?? 0;

          return ProductCard(
            id: productId,
            name: productMap['name'] ?? 'منتج بدون اسم',
            price: '${productMap['price'] ?? 0}',
            imageUrl: imageUrl,
            rating: (productMap['rating'] ?? 4.5).toDouble(),
            reviewCount:
                productMap['numReviews'] ?? productMap['reviewCount'] ?? 128,
            screenId: 'product_grid',
            colors: productMap['colors'],
            sizes: productMap['sizes'] != null
                ? List<String>.from(productMap['sizes'])
                : null,
            images: images?.map((e) => e.toString()).toList(),
            discount: 0,
            isFeatured:
                productMap['isFeatured'] ?? productMap['is_featured'] ?? false,
            blurHash: productMap['blur_hash'],
            showBadge: stock <= 0,
            badgeText: stock <= 0 ? 'نفدت الكمية' : null,
            badgeColor: stock <= 0 ? Colors.red.shade600 : null,
          );
        },
      ),
    );
  }
}

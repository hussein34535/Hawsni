import 'package:flutter/material.dart';
import 'package:hawsni_app/features/home/presentation/widgets/product_card.dart';
import 'package:hawsni_app/core/services/api_service.dart';
import 'package:hawsni_app/core/widgets/skeleton_loader.dart';

class ProductGrid extends StatefulWidget {
  const ProductGrid({super.key});

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

      final fetchedProducts = await ApiService.getProducts();
      // Check if the widget is still mounted before calling setState
      if (mounted) {
        setState(() {
          products = fetchedProducts;
          isLoading = false;
        });
      }
    } catch (e) {
      print('Error loading products: $e');
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
          final product = products[index];
          final images = product['images'] as List?;
          final imageUrl = images != null && images.isNotEmpty
              ? 'http://192.168.100.8:5000${images[0]}'
              : 'https://via.placeholder.com/300';

          // Generate a unique ID for the product (in a real app, this would come from the backend)
          final productId = product['id']?.toString() ?? 'product_$index';

          return ProductCard(
            id: productId,
            imageUrl: imageUrl,
            name: product['name'] ?? 'منتج بدون اسم',
            price: '${product['price'] ?? 0} جنيه',
            description: product['description'] ?? 'No description available',
            rating: (product['rating'] ?? 4.5).toDouble(),
            reviewCount: product['reviewCount'] ?? 128,
            sizes: List<String>.from(product['sizes'] ?? []),
            colors: List<String>.from(product['colors'] ?? []),
          );
        },
      ),
    );
  }
}

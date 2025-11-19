import 'package:flutter/material.dart';
import 'package:hawsni_app/features/home/presentation/widgets/product_card.dart';
import 'package:hawsni_app/core/themes/app_theme.dart';

class ProductsScreen extends StatelessWidget {
  final String categoryName;

  const ProductsScreen({super.key, required this.categoryName});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    // Generate sample products for the category
    final List<Map<String, String>> products = List.generate(
      15,
      (index) => {
        'id': 'product_${categoryName}_$index',
        'image': 'https://via.placeholder.com/300',
        'name': '$categoryName Item ${index + 1}',
        'price': '\$${(index + 1) * 15}',
        'description': 'A high-quality product in the $categoryName category',
        'rating': '${4.0 + (index % 3) * 0.5}',
        'reviewCount': '${(index + 1) * 10}',
      },
    );

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 120,
            pinned: true,
            backgroundColor: theme.scaffoldBackgroundColor,
            elevation: 0,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(
                '$categoryName Collection',
                style: TextStyle(
                  color: theme.primaryColor,
                  fontWeight: FontWeight.bold,
                ),
              ),
              centerTitle: true,
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.white,
                      theme.scaffoldBackgroundColor,
                    ],
                  ),
                ),
              ),
            ),
            leading: IconButton(
              icon: Icon(Icons.arrow_back_ios_new, color: theme.primaryColor),
              onPressed: () => Navigator.of(context).pop(),
            ),
            actions: [
              IconButton(
                icon: Icon(Icons.filter_list, color: theme.primaryColor),
                onPressed: () {
                  // Show filter modal
                },
              ),
            ],
          ),
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.7,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
              ),
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  return ProductCard(
                    id: products[index]['id']!,
                    imageUrl: products[index]['image']!,
                    name: products[index]['name']!,
                    price: products[index]['price']!,
                    description: products[index]['description']!,
                    rating: double.parse(products[index]['rating']!),
                    reviewCount: int.parse(products[index]['reviewCount']!),
                  );
                },
                childCount: products.length,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

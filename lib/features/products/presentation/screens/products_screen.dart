import 'package:flutter/material.dart';
import 'package:hawsni_app/features/home/presentation/widgets/product_card.dart';

class ProductsScreen extends StatelessWidget {
  final String categoryName;

  const ProductsScreen({super.key, required this.categoryName});

  @override
  Widget build(BuildContext context) {
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
      appBar: AppBar(
        title: Text('$categoryName Products'),
        backgroundColor: Colors.white,
        elevation: 2,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: GridView.builder(
          itemCount: products.length,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 0.75,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
          ),
          itemBuilder: (context, index) {
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
        ),
      ),
    );
  }
}

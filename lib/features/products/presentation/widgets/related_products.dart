import 'package:flutter/material.dart';
import 'package:hawsni_app/features/home/presentation/widgets/product_card.dart';

class RelatedProducts extends StatelessWidget {
  final String categoryId;
  final String currentProductId;

  const RelatedProducts({
    super.key,
    required this.categoryId,
    required this.currentProductId,
  });

  @override
  Widget build(BuildContext context) {
    // Sample related products data
    // In a real app, this would be fetched from the backend based on the category
    final List<Map<String, dynamic>> relatedProducts = [
      {
        'id': 'related_1',
        'name': 'Summer Dress',
        'price': '\$49.99',
        'imageUrl':
            'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
        'rating': 4.5,
        'reviewCount': 128,
      },
      {
        'id': 'related_2',
        'name': 'Casual T-Shirt',
        'price': '\$29.99',
        'imageUrl':
            'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
        'rating': 4.2,
        'reviewCount': 96,
      },
      {
        'id': 'related_3',
        'name': 'Designer Handbag',
        'price': '\$129.99',
        'imageUrl':
            'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
        'rating': 4.8,
        'reviewCount': 215,
      },
      {
        'id': 'related_4',
        'name': 'Running Shoes',
        'price': '\$89.99',
        'imageUrl':
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
        'rating': 4.6,
        'reviewCount': 178,
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.all(16.0),
          child: Text(
            'Related Products',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        SizedBox(
          height: 280,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: relatedProducts.length,
            itemBuilder: (context, index) {
              final product = relatedProducts[index];
              return Container(
                width: 180,
                margin: const EdgeInsets.only(right: 12),
                child: ProductCard(
                  id: product['id'],
                  name: product['name'],
                  price: product['price'],
                  imageUrl: product['imageUrl'],
                  rating: product['rating'],
                  reviewCount: product['reviewCount'],
                  screenId: 'related',
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

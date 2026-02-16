import 'package:flutter/material.dart';

class ProductComparisonScreen extends StatefulWidget {
  final List<Map<String, dynamic>> products;

  const ProductComparisonScreen({super.key, required this.products});

  @override
  State<ProductComparisonScreen> createState() =>
      _ProductComparisonScreenState();
}

class _ProductComparisonScreenState extends State<ProductComparisonScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Compare Products'),
        backgroundColor: Colors.blue[700],
        foregroundColor: Colors.white,
      ),
      body: widget.products.isEmpty
          ? _buildEmptyState()
          : _buildComparisonTable(),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.compare,
            size: 64,
            color: Colors.grey[300],
          ),
          const SizedBox(height: 16),
          const Text(
            'No products to compare',
            style: TextStyle(
              fontSize: 18,
              color: Colors.grey,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Add products to compare their features',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildComparisonTable() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Product images and names row
          _buildProductInfoRow(),

          // Divider
          const Divider(height: 1),

          // Price row
          _buildComparisonRow(
            title: 'Price',
            values: widget.products
                .map((product) => product['price'] as String)
                .toList(),
          ),

          // Rating row
          _buildComparisonRow(
            title: 'Rating',
            values: widget.products
                .map((product) =>
                    '${product['rating']} (${product['reviewCount']} reviews)')
                .toList(),
          ),

          // Category row
          _buildComparisonRow(
            title: 'Category',
            values: widget.products
                .map((product) => product['category'] as String? ?? 'N/A')
                .toList(),
          ),

          // Brand row
          _buildComparisonRow(
            title: 'Brand',
            values: widget.products
                .map((product) => product['brand'] as String? ?? 'N/A')
                .toList(),
          ),

          // Size options row
          _buildComparisonRow(
            title: 'Sizes',
            values: widget.products.map((product) {
              final sizes = product['sizes'] as List<String>?;
              return sizes != null ? sizes.join(', ') : 'N/A';
            }).toList(),
          ),

          // Color options row
          _buildComparisonRow(
            title: 'Colors',
            values: widget.products.map((product) {
              final colors = product['colors'] as List<String>?;
              return colors != null ? colors.join(', ') : 'N/A';
            }).toList(),
          ),

          // Material row
          _buildComparisonRow(
            title: 'Material',
            values: widget.products
                .map((product) => product['material'] as String? ?? 'N/A')
                .toList(),
          ),

          // Warranty row
          _buildComparisonRow(
            title: 'Warranty',
            values: widget.products
                .map((product) => product['warranty'] as String? ?? 'N/A')
                .toList(),
          ),

          // Action buttons row
          _buildActionButtonsRow(),
        ],
      ),
    );
  }

  Widget _buildProductInfoRow() {
    return Row(
      children: [
        const SizedBox(
          width: 120,
          child: Padding(
            padding: EdgeInsets.all(16.0),
            child: Text(
              'Product',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
        ...widget.products.map((product) {
          return SizedBox(
            width: 200,
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  Container(
                    height: 150,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      color: Colors.grey[200],
                    ),
                    child: Image.network(
                      product['imageUrl'] as String,
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) {
                        return const Icon(
                          Icons.image,
                          size: 50,
                          color: Colors.grey,
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    product['name'] as String,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildComparisonRow(
      {required String title, required List<String> values}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 120,
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ),
        ...values.map((value) {
          return SizedBox(
            width: 200,
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Text(
                value,
                style: const TextStyle(fontSize: 16),
              ),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildActionButtonsRow() {
    return Row(
      children: [
        const SizedBox(
          width: 120,
          child: Padding(
            padding: EdgeInsets.all(16.0),
            child: Text(
              'Actions',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
        ...widget.products.asMap().entries.map((entry) {
          // final index = entry.key;
          final product = entry.value;
          return SizedBox(
            width: 200,
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        // Add to cart functionality
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Added ${product['name']} to cart'),
                            backgroundColor: Colors.green,
                          ),
                        );
                      },
                      child: const Text('Add to Cart'),
                    ),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: () {
                        // View product details functionality
                        Navigator.pop(context);
                      },
                      child: const Text('View Details'),
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }
}

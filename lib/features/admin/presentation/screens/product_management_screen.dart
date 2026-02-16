import 'package:flutter/material.dart';
import '../../../../core/services/admin_service.dart';

class ProductManagementScreen extends StatefulWidget {
  const ProductManagementScreen({super.key});

  @override
  State<ProductManagementScreen> createState() =>
      _ProductManagementScreenState();
}

class _ProductManagementScreenState extends State<ProductManagementScreen> {
  final AdminService _adminService = AdminService();
  bool _isLoading = true;
  List<dynamic> _products = [];

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  Future<void> _loadProducts() async {
    try {
      final products = await _adminService.getProducts();
      if (mounted) {
        setState(() {
          _products = products;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading products: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Products',
                style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
              ),
              ElevatedButton.icon(
                onPressed: () {
                  // Navigate to Add Product
                },
                icon: const Icon(Icons.add),
                label: const Text('Add Product'),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : Card(
                    child: ListView(
                      children: [
                        PaginatedDataTable(
                          columns: const [
                            DataColumn(label: Text('Image')),
                            DataColumn(label: Text('Name')),
                            DataColumn(label: Text('Price')),
                            DataColumn(label: Text('Stock')),
                            DataColumn(label: Text('Actions')),
                          ],
                          source: _ProductDataSource(_products),
                          rowsPerPage: 10,
                        ),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

class _ProductDataSource extends DataTableSource {
  final List<dynamic> products;

  _ProductDataSource(this.products);

  @override
  DataRow? getRow(int index) {
    if (index >= products.length) return null;
    final product = products[index];

    // Parse images if needed, or take first
    String? imageUrl;
    if (product['images'] != null && (product['images'] as List).isNotEmpty) {
      imageUrl = product['images'][0];
    }

    return DataRow(cells: [
      DataCell(
        imageUrl != null
            ? Image.network(imageUrl, width: 40, height: 40, fit: BoxFit.cover)
            : const Icon(Icons.image_not_supported),
      ),
      DataCell(Text(product['name'] ?? 'No Name')),
      DataCell(Text('\$${product['price']}')),
      DataCell(Text('${product['stock']}')),
      DataCell(Row(
        children: [
          IconButton(
              icon: const Icon(Icons.edit, color: Colors.blue),
              onPressed: () {}),
          IconButton(
              icon: const Icon(Icons.delete, color: Colors.red),
              onPressed: () {}),
        ],
      )),
    ]);
  }

  @override
  bool get isRowCountApproximate => false;
  @override
  int get rowCount => products.length;
  @override
  int get selectedRowCount => 0;
}

import 'package:flutter/material.dart';
import 'package:hawsni_app/features/products/presentation/screens/products_screen.dart';

class CategoryItem extends StatelessWidget {
  final IconData icon;
  final String name;

  const CategoryItem({super.key, required this.icon, required this.name});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => ProductsScreen(categoryName: name),
          ),
        );
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircleAvatar(
              radius: 30,
              backgroundColor: Colors.blue[100],
              child: Icon(icon, size: 30, color: Colors.blue[700]),
            ),
            const SizedBox(height: 8),
            Text(name, style: const TextStyle(fontSize: 12)),
          ],
        ),
      ),
    );
  }
}

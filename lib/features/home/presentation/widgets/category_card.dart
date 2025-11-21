import 'package:flutter/material.dart';
import 'package:hawsni_app/core/widgets/svg_image.dart';

class CategoryCard extends StatelessWidget {
  final String name;
  final String? image;
  final VoidCallback onTap;

  const CategoryCard({
    super.key,
    required this.name,
    this.image,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 100,
        margin: const EdgeInsets.only(right: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withOpacity(0.1),
              spreadRadius: 1,
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Category image
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.withOpacity(0.1),
                borderRadius: BorderRadius.circular(50),
              ),
              child: _buildCategoryImage(),
            ),
            const SizedBox(height: 8),
            // Category name
            Text(
              name,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryImage() {
    // If we have an image URL, display the image
    if (image != null && image!.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(50),
        child: SvgImage(
          url: '${ApiService.baseUrl}$image',
          width: 40,
          height: 40,
          fit: BoxFit.cover,
        ),
      );
    }

    // Fallback to default icon
    return const Icon(
      Icons.category,
      size: 40,
      color: Colors.blue,
    );
  }
}

import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

class CategoryGridItem {
  final String name;
  final IconData? icon;
  final String? imageUrl;
  final String? categoryId;

  CategoryGridItem({
    required this.name,
    this.icon,
    this.imageUrl,
    this.categoryId,
  });
}

class CategoryGrid extends StatelessWidget {
  final List<CategoryGridItem> categories;
  final Function(CategoryGridItem)? onCategoryTap;

  const CategoryGrid({
    super.key,
    required this.categories,
    this.onCategoryTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 4,
          crossAxisSpacing: 12,
          mainAxisSpacing: 16,
          childAspectRatio: 0.85,
        ),
        itemCount: categories.length > 8 ? 8 : categories.length,
        itemBuilder: (context, index) {
          final category = categories[index];
          return _buildCategoryCard(context, category);
        },
      ),
    );
  }

  Widget _buildCategoryCard(BuildContext context, CategoryGridItem category) {
    return GestureDetector(
      onTap: () => onCategoryTap?.call(category),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Glassmorphism Container
          Container(
            width: 70,
            height: 70,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: const Color(0xFFD4AF37).withOpacity(0.3),
                width: 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFFD4AF37).withOpacity(0.1),
                  blurRadius: 10,
                  spreadRadius: 2,
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Colors.white.withOpacity(0.1),
                        Colors.white.withOpacity(0.05),
                      ],
                    ),
                  ),
                  child: Center(
                    child: category.imageUrl != null
                        ? (category.imageUrl!.toLowerCase().endsWith('.svg')
                            ? SvgPicture.network(
                                category.imageUrl!,
                                width: 40,
                                height: 40,
                                fit: BoxFit.contain,
                                placeholderBuilder: (BuildContext context) =>
                                    const Center(
                                        child: CircularProgressIndicator()),
                              )
                            : Image.network(
                                category.imageUrl!,
                                width: 40,
                                height: 40,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) {
                                  return Icon(
                                    category.icon ?? Icons.category,
                                    size: 32,
                                    color: const Color(0xFFD4AF37),
                                  );
                                },
                              ))
                        : Icon(
                            category.icon ?? Icons.category,
                            size: 32,
                            color: const Color(0xFFD4AF37),
                          ),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 8),
          // Category Name
          Text(
            category.name,
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 12,
              color: Colors.white,
              fontWeight: FontWeight.w500,
              height: 1.2,
            ),
          ),
        ],
      ),
    );
  }
}

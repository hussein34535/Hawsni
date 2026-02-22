import 'package:flutter/material.dart';
import 'package:hwasi_app/core/themes/app_theme.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:cached_network_image/cached_network_image.dart';

class CategoryGridItem {
  final String id;
  final String name;
  final String? imageUrl;
  final IconData? icon;

  CategoryGridItem({
    required this.id,
    required this.name,
    this.imageUrl,
    this.icon,
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
    return SizedBox(
      height: 140, // Increased height for bubbles + text
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        addAutomaticKeepAlives: false,
        addRepaintBoundaries: false,
        itemCount: categories.length,
        separatorBuilder: (context, index) => const SizedBox(width: 20),
        itemBuilder: (context, index) {
          final category = categories[index];
          return RepaintBoundary(
            child: _buildCategoryBubble(context, category),
          );
        },
      ),
    );
  }

  Widget _buildCategoryBubble(BuildContext context, CategoryGridItem category) {
    return GestureDetector(
      onTap: () => onCategoryTap?.call(category),
      child: Column(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppTheme.surfaceColor,
              shape: BoxShape.circle,
              boxShadow: AppTheme.shadowSoft,
            ),
            child: Center(
              child: category.imageUrl != null
                  ? ClipOval(
                      child: category.imageUrl!.toLowerCase().endsWith('.svg')
                          ? SvgPicture.network(
                              category.imageUrl!,
                              width: 40,
                              height: 40,
                              colorFilter: const ColorFilter.mode(
                                AppTheme.primaryColor,
                                BlendMode.srcIn,
                              ),
                              placeholderBuilder: (context) =>
                                  Container(color: Colors.transparent),
                            )
                          : CachedNetworkImage(
                              imageUrl: category.imageUrl!,
                              width: 80,
                              height: 80,
                              fit: BoxFit.cover,
                              memCacheWidth: 200,
                              memCacheHeight: 200, // Better quality
                              placeholder: (context, url) =>
                                  Container(color: Colors.transparent),
                              errorWidget: (context, url, error) =>
                                  Container(color: Colors.transparent),
                            ),
                    )
                  : (category.icon != null
                      ? Icon(
                          category.icon,
                          size: 32,
                          color: AppTheme.primaryColor,
                        )
                      : Container(color: Colors.transparent)),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: 90,
            child: Text(
              category.name,
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: AppTheme.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

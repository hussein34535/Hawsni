import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:hwasi_app/features/home/presentation/widgets/category_card.dart';
import 'package:hwasi_app/core/services/api_service.dart';

class CategoryList extends StatefulWidget {
  const CategoryList({super.key});

  @override
  State<CategoryList> createState() => _CategoryListState();
}

class _CategoryListState extends State<CategoryList> {
  List<dynamic> _categories = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  Future<void> _loadCategories() async {
    try {
      final categories = await ApiService.getCategories();
      // Check if the widget is still mounted before calling setState
      if (mounted) {
        setState(() {
          _categories = categories;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading categories: $e');
      // Check if the widget is still mounted before calling setState
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const SizedBox(
        height: 120,
        child: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return SizedBox(
      height: 120,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: _categories.length,
        itemBuilder: (context, index) {
          final category = _categories[index];

          return Padding(
            padding: EdgeInsets.only(left: index == 0 ? 16.0 : 0, right: 12.0),
            child: CategoryCard(
              name: category['name'],
              image: category['image'],
              onTap: () {
                // Navigate to products screen for this category
              },
            ),
          );
        },
      ),
    );
  }
}

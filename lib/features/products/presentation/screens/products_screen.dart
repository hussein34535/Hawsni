import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hawsni_app/features/home/presentation/widgets/product_card.dart';
import 'package:hawsni_app/core/themes/app_theme.dart';
import 'package:hawsni_app/features/products/bloc/product_bloc.dart';
import 'package:hawsni_app/features/products/bloc/product_event.dart';
import 'package:hawsni_app/features/products/bloc/product_state.dart';
import 'package:hawsni_app/features/products/data/services/product_service.dart';
import 'package:hawsni_app/core/widgets/spinning_loader.dart';

class ProductsScreen extends StatelessWidget {
  final String? categoryName;
  final String? categoryId;
  final String? title;
  final bool isFeatured;

  const ProductsScreen({
    super.key,
    this.categoryName,
    this.categoryId,
    this.title,
    this.isFeatured = false,
  });

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => ProductBloc(ProductService())
        ..add(LoadProducts(categoryId: categoryId, isFeatured: isFeatured)),
      child: Scaffold(
        backgroundColor: Colors.black,
        body: BlocBuilder<ProductBloc, ProductState>(
          builder: (context, state) {
            if (state is ProductLoading) {
              return const Center(child: SpinningLoader());
            } else if (state is ProductError) {
              return Center(
                child: Text(
                  state.message,
                  style: const TextStyle(color: Colors.red),
                ),
              );
            } else if (state is ProductLoaded) {
              final products = state.products;

              if (products.isEmpty) {
                return const Center(
                  child: Text(
                    'No products found.',
                    style: TextStyle(color: Colors.white),
                  ),
                );
              }

              return CustomScrollView(
                slivers: [
                  _buildAppBar(context),
                  SliverPadding(
                    padding: const EdgeInsets.all(16.0),
                    sliver: SliverGrid(
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        crossAxisSpacing: 16.0,
                        mainAxisSpacing: 16.0,
                        childAspectRatio: 0.7,
                      ),
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final product = products[index];
                          return ProductCard(
                            key: ValueKey(product.id),
                            id: product.id,
                            imageUrl: product.imageUrl,
                            name: product.name,
                            price: '\$${product.price}',
                            rating: product.rating,
                            reviewCount: product.reviewCount,
                            screenId: 'products',
                          );
                        },
                        childCount: products.length,
                      ),
                    ),
                  ),
                ],
              );
            }
            return const Center(child: SpinningLoader());
          },
        ),
      ),
    );
  }

  SliverAppBar _buildAppBar(BuildContext context) {
    return SliverAppBar(
      backgroundColor: Colors.black,
      title: Text(
        title ?? categoryName ?? 'Products',
        style: const TextStyle(color: Colors.white),
      ),
      centerTitle: true,
      floating: true,
      snap: true,
      actions: [
        IconButton(
          icon: const Icon(Icons.filter_list, color: AppTheme.primaryColor),
          onPressed: () {
            // Show filter modal
          },
        ),
      ],
    );
  }
}

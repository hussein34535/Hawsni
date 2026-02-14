import 'package:flutter/material.dart';
import 'package:hwasi_app/features/home/presentation/widgets/product_card.dart';
import 'package:hwasi_app/features/products/data/models/product_model.dart';
import 'package:hwasi_app/l10n/generated/app_localizations.dart';

class RelatedProducts extends StatelessWidget {
  final List<ProductModel> products;

  const RelatedProducts({
    super.key,
    required this.products,
  });

  @override
  Widget build(BuildContext context) {
    if (products.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
          child: Text(
            AppLocalizations.of(context)?.relatedProducts ?? 'Related Products',
            style: const TextStyle(
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
            itemCount: products.length,
            itemBuilder: (context, index) {
              final product = products[index];
              return Container(
                width: 180,
                margin: const EdgeInsets.only(right: 12),
                child: ProductCard(
                  id: product.id,
                  name: product.name,
                  price: product.price.toString(),
                  imageUrl: product.imageUrl,
                  rating: product.rating,
                  reviewCount: product.reviewCount,
                  screenId: 'related_${product.id}',
                  colors: product.colors,
                  sizes: product.sizes,
                  images: product.images,
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 32),
      ],
    );
  }
}

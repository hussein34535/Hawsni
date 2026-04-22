import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hwasi_app/features/cart/bloc/cart_bloc.dart';
import 'package:hwasi_app/features/cart/bloc/cart_event.dart';
import 'package:hwasi_app/features/cart/bloc/cart_state.dart';
import 'package:hwasi_app/core/themes/app_theme.dart';
import 'package:hwasi_app/l10n/generated/app_localizations.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_blurhash/flutter_blurhash.dart';

class CartItemCard extends StatelessWidget {
  final CartItem item;

  const CartItemCard({super.key, required this.item});

  @override
  Widget build(BuildContext context) {
    final isRTL = Directionality.of(context) == TextDirection.rtl;

    // Calculate total price including accessories
    double basePrice = double.tryParse(item.price) ?? 0.0;
    double accessoriesPrice = 0.0;
    if (item.accessories != null) {
      for (var acc in item.accessories!) {
        accessoriesPrice +=
            double.tryParse(acc['price']?.toString() ?? '0') ?? 0.0;
      }
    }
    double totalPrice = basePrice + accessoriesPrice;

    return Dismissible(
      key: Key(item.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 24),
        margin: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: AppTheme.errorColor,
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Icon(
          Icons.delete_outline,
          color: Colors.white,
          size: 28,
        ),
      ),
      onDismissed: (direction) {
        context.read<CartBloc>().add(RemoveFromCart(item.id));
      },
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 6),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.grey.withValues(alpha: 0.1)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: Container(
                width: 80,
                height: 80,
                color: const Color(0xFFF9F9F9),
                child: CachedNetworkImage(
                  imageUrl: item.imageUrl,
                  fit: BoxFit.cover,
                  placeholder: (context, url) {
                    if (item.blurHash != null && item.blurHash!.isNotEmpty) {
                      return BlurHash(
                        hash: item.blurHash!,
                        imageFit: BoxFit.cover,
                      );
                    }
                    return Container(color: Colors.grey[100]);
                  },
                  errorWidget: (context, url, error) =>
                      Container(color: Colors.grey[100]),
                ),
              ),
            ),
            const SizedBox(width: 14),

            // Details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          item.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontFamily: 'Cairo',
                            fontSize: 15,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF1A1A1A),
                          ),
                        ),
                      ),
                      GestureDetector(
                        onTap: () => context
                            .read<CartBloc>()
                            .add(RemoveFromCart(item.id)),
                        child: const Icon(Icons.close_rounded,
                            size: 16, color: Colors.grey),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),

                  // Variation Details
                  if (item.size != null || item.color != null)
                    Text(
                      [
                        if (item.color != null)
                          '${isRTL ? "اللون" : "Color"}: ${item.color}',
                        if (item.size != null)
                          '${isRTL ? "المقاس" : "Size"}: ${item.size}',
                      ].join(' • '),
                      style: const TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: Colors.grey,
                        letterSpacing: -0.2,
                      ),
                    ),
                  const SizedBox(height: 8),

                  // Accessories Chips
                  if (item.accessories != null && item.accessories!.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 10.0),
                      child: Wrap(
                        spacing: 4,
                        runSpacing: 4,
                        children: item.accessories!.map((acc) {
                          return Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFF0E4435)
                                  .withValues(alpha: 0.05),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(
                                  color: const Color(0xFF0E4435)
                                      .withValues(alpha: 0.1)),
                            ),
                            child: Text(
                              '+ ${acc['name']}',
                              style: const TextStyle(
                                fontFamily: 'Cairo',
                                fontSize: 9,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFF0E4435),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${totalPrice.toStringAsFixed(0)} ${AppLocalizations.of(context)?.currencySymbol ?? "EGP"}',
                            style: const TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 15,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF0E4435),
                            ),
                          ),
                          if (item.accessories != null &&
                              item.accessories!.isNotEmpty)
                            Text(
                              isRTL ? 'شامل الإضافات' : 'Inc. accessories',
                              style: const TextStyle(
                                fontFamily: 'Cairo',
                                fontSize: 8,
                                fontWeight: FontWeight.bold,
                                color: Colors.grey,
                              ),
                            ),
                        ],
                      ),

                      // Quantity Controls (Web Style)
                      Container(
                        padding: const EdgeInsets.all(2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF5F5F5),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFFEEEEEE)),
                        ),
                        child: Row(
                          children: [
                            _QuantityButton(
                              icon: Icons.remove,
                              onTap: () {
                                if (item.quantity > 1) {
                                  context.read<CartBloc>().add(UpdateQuantity(
                                      item.id, item.quantity - 1));
                                } else {
                                  context
                                      .read<CartBloc>()
                                      .add(RemoveFromCart(item.id));
                                }
                              },
                            ),
                            SizedBox(
                              width: 24,
                              child: Text(
                                '${item.quantity}',
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  fontFamily: 'Cairo',
                                  fontWeight: FontWeight.w900,
                                  fontSize: 12,
                                  color: Color(0xFF1A1A1A),
                                ),
                              ),
                            ),
                            _QuantityButton(
                              icon: Icons.add,
                              onTap: () {
                                context.read<CartBloc>().add(
                                    UpdateQuantity(item.id, item.quantity + 1));
                              },
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QuantityButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _QuantityButton({
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 26,
        height: 26,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 2,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: Icon(
          icon,
          size: 14,
          color: const Color(0xFF1A1A1A),
        ),
      ),
    );
  }
}

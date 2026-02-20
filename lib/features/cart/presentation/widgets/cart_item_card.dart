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
    return Dismissible(
      key: Key(item.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 24),
        margin: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: AppTheme.errorColor,
          borderRadius: BorderRadius.circular(AppTheme.radiusLarge),
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
        margin: const EdgeInsets.symmetric(vertical: 8),
        child: Stack(
          children: [
            // Main Ticket Body
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(AppTheme.radiusLarge),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.03),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
                border: Border.all(color: Colors.grey.withValues(alpha: 0.1)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Image
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      width: 100,
                      height: 100,
                      color: AppTheme.scaffoldBackgroundColor,
                      child: CachedNetworkImage(
                        imageUrl: item.imageUrl,
                        fit: BoxFit.cover,
                        memCacheWidth: 300,
                        placeholder: (context, url) {
                          if (item.blurHash != null &&
                              item.blurHash!.isNotEmpty) {
                            return BlurHash(
                              hash: item.blurHash!,
                              imageFit: BoxFit.cover,
                            );
                          }
                          return const Icon(
                            Icons.image_outlined,
                            size: 32,
                            color: AppTheme.textTertiary,
                          );
                        },
                        errorWidget: (context, error, stackTrace) {
                          return const Icon(
                            Icons.image_outlined,
                            size: 32,
                            color: AppTheme.textTertiary,
                          );
                        },
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),

                  // Details
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.name,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: AppTheme.textTheme.bodyLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        if (item.size != null || item.color != null)
                          Text(
                            [
                              if (item.size != null) 'Size: ${item.size}',
                              if (item.color != null) 'Color: ${item.color}',
                            ].join(' • '),
                            style: AppTheme.textTheme.bodySmall?.copyWith(
                              color: AppTheme.textSecondary,
                            ),
                          ),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              '${item.price} ${AppLocalizations.of(context)?.currencySymbol ?? 'EGP'}',
                              style: AppTheme.textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: AppTheme.primaryColor,
                              ),
                            ),
                            // Quantity Controls
                            Container(
                              decoration: BoxDecoration(
                                color: AppTheme.surfaceColor,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                children: [
                                  _QuantityButton(
                                    icon: Icons.remove,
                                    onTap: () {
                                      if (item.quantity > 1) {
                                        context.read<CartBloc>().add(
                                            UpdateQuantity(
                                                item.id, item.quantity - 1));
                                      } else {
                                        context
                                            .read<CartBloc>()
                                            .add(RemoveFromCart(item.id));
                                      }
                                    },
                                  ),
                                  Padding(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 8),
                                    child: Text(
                                      '${item.quantity}',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 14,
                                      ),
                                    ),
                                  ),
                                  _QuantityButton(
                                    icon: Icons.add,
                                    onTap: () {
                                      context.read<CartBloc>().add(
                                          UpdateQuantity(
                                              item.id, item.quantity + 1));
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

            // Ticket Notches (Left and Right)
            Positioned(
              left: -10,
              top: 60,
              child: CircleAvatar(
                radius: 10,
                backgroundColor: AppTheme.scaffoldBackgroundColor,
              ),
            ),
            Positioned(
              right: -10,
              top: 60,
              child: CircleAvatar(
                radius: 10,
                backgroundColor: AppTheme.scaffoldBackgroundColor,
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
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.all(6),
        child: Icon(
          icon,
          size: 16,
          color: AppTheme.textPrimary,
        ),
      ),
    );
  }
}

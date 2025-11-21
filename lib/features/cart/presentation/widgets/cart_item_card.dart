import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hawsni_app/features/cart/bloc/cart_bloc.dart';
import 'package:hawsni_app/features/cart/bloc/cart_event.dart';
import 'package:hawsni_app/features/cart/bloc/cart_state.dart';
import 'package:hawsni_app/core/themes/app_theme.dart';

class CartItemCard extends StatelessWidget {
  final CartItem item;

  const CartItemCard({super.key, required this.item});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          decoration: AppTheme.glassDecoration,
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              // Image
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.network(
                  item.imageUrl,
                  width: 80,
                  height: 80,
                  fit: BoxFit.cover,
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
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.price,
                      style: const TextStyle(
                        fontSize: 16,
                        color: AppTheme.primaryColor,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),

              // Quantity Controls
              Container(
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    InkWell(
                      onTap: () {
                        if (item.quantity > 1) {
                          context
                              .read<CartBloc>()
                              .add(UpdateQuantity(item.id, item.quantity - 1));
                        } else {
                          context.read<CartBloc>().add(RemoveFromCart(item.id));
                        }
                      },
                      child: const Padding(
                        padding: EdgeInsets.all(8.0),
                        child:
                            Icon(Icons.remove, size: 16, color: Colors.white),
                      ),
                    ),
                    Text(
                      '${item.quantity}',
                      style: const TextStyle(
                          fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                    InkWell(
                      onTap: () {
                        context
                            .read<CartBloc>()
                            .add(UpdateQuantity(item.id, item.quantity + 1));
                      },
                      child: const Padding(
                        padding: EdgeInsets.all(8.0),
                        child: Icon(Icons.add, size: 16, color: Colors.white),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

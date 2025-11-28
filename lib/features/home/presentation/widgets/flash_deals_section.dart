import 'dart:async';
import 'package:flutter/material.dart';
import 'package:hawsni_app/features/products/data/models/product_model.dart';
import 'package:hawsni_app/features/home/presentation/widgets/product_card.dart';

class FlashDealsSection extends StatefulWidget {
  final List<ProductModel> products;
  final VoidCallback? onViewAll;
  final DateTime? endTime;

  const FlashDealsSection({
    super.key,
    required this.products,
    this.onViewAll,
    this.endTime,
  });

  @override
  State<FlashDealsSection> createState() => _FlashDealsSectionState();
}

class _FlashDealsSectionState extends State<FlashDealsSection> {
  Timer? _timer;
  Duration _timeRemaining = Duration.zero;

  @override
  void initState() {
    super.initState();
    _startCountdown();
  }

  void _startCountdown() {
    if (widget.endTime != null) {
      _updateTimeRemaining();
      _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
        _updateTimeRemaining();
      });
    }
  }

  void _updateTimeRemaining() {
    if (widget.endTime != null) {
      final now = DateTime.now();
      final remaining = widget.endTime!.difference(now);

      if (mounted) {
        setState(() {
          _timeRemaining = remaining.isNegative ? Duration.zero : remaining;
        });
      }

      if (remaining.isNegative) {
        _timer?.cancel();
      }
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String _formatDuration(Duration duration) {
    final hours = duration.inHours.toString().padLeft(2, '0');
    final minutes = (duration.inMinutes % 60).toString().padLeft(2, '0');
    final seconds = (duration.inSeconds % 60).toString().padLeft(2, '0');
    return '$hours:$minutes:$seconds';
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header with countdown
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Row(
                  children: [
                    const Icon(
                      Icons.flash_on,
                      color: Color(0xFFFFD700),
                      size: 24,
                    ),
                    const SizedBox(width: 8),
                    const Flexible(
                      child: Text(
                        'Flash Deals',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          fontFamily: 'Playfair Display',
                          letterSpacing: 0.5,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (widget.endTime != null) ...[
                      const SizedBox(width: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFF4444).withOpacity(0.2),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: const Color(0xFFFF4444).withOpacity(0.5),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.timer_outlined,
                              color: Color(0xFFFF4444),
                              size: 16,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              _formatDuration(_timeRemaining),
                              style: const TextStyle(
                                color: Color(0xFFFF4444),
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                                fontFamily: 'monospace',
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              if (widget.onViewAll != null)
                TextButton(
                  onPressed: widget.onViewAll,
                  style: TextButton.styleFrom(
                    foregroundColor: const Color(0xFFD4AF37),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                  ),
                  child: Row(
                    children: [
                      Text(
                        'View All',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFFD4AF37).withOpacity(0.9),
                        ),
                      ),
                      const SizedBox(width: 4),
                      Icon(
                        Icons.arrow_forward_ios,
                        size: 12,
                        color: const Color(0xFFD4AF37).withOpacity(0.9),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
        // Horizontal scrollable products
        SizedBox(
          height: 280,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: widget.products.length,
            itemBuilder: (context, index) {
              final product = widget.products[index];
              return Container(
                width: 160,
                margin: const EdgeInsets.only(right: 12),
                child: ProductCard(
                  id: product.id,
                  imageUrl: product.imageUrl,
                  name: product.name,
                  price: product.price.toString(),
                  rating: product.rating,
                  reviewCount: product.reviewCount,
                  screenId: 'flash_deals',
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

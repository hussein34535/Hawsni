import 'dart:async';
import 'package:flutter/material.dart';

/// Premium animated free-delivery countdown banner.
/// The countdown resets to midnight (next full 24h window) every day.
class FreeDeliveryBanner extends StatefulWidget {
  const FreeDeliveryBanner({super.key});

  @override
  State<FreeDeliveryBanner> createState() => _FreeDeliveryBannerState();
}

class _FreeDeliveryBannerState extends State<FreeDeliveryBanner>
    with SingleTickerProviderStateMixin {
  late Timer _timer;
  Duration _remaining = _timeUntilMidnight();

  late final AnimationController _pulse;
  late final Animation<double> _scale;

  static Duration _timeUntilMidnight() {
    final now = DateTime.now();
    final midnight =
        DateTime(now.year, now.month, now.day).add(const Duration(days: 1));
    return midnight.difference(now);
  }

  @override
  void initState() {
    super.initState();

    // Tick every second
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      final next = _timeUntilMidnight();
      if (mounted) setState(() => _remaining = next);
    });

    // Subtle pulse animation on the icon
    _pulse = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 900))
      ..repeat(reverse: true);
    _scale = Tween<double>(begin: 1.0, end: 1.18)
        .animate(CurvedAnimation(parent: _pulse, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _timer.cancel();
    _pulse.dispose();
    super.dispose();
  }

  String _pad(int n) => n.toString().padLeft(2, '0');

  @override
  Widget build(BuildContext context) {
    final h = _pad(_remaining.inHours);
    final m = _pad(_remaining.inMinutes.remainder(60));
    final s = _pad(_remaining.inSeconds.remainder(60));

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF1DBF73), Color(0xFF0AA65B)],
            begin: Alignment.centerRight,
            end: Alignment.centerLeft,
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF1DBF73).withValues(alpha: 0.35),
              blurRadius: 14,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Row(
          children: [
            // Pulsing truck icon
            ScaleTransition(
              scale: _scale,
              child: const Icon(Icons.local_shipping_rounded,
                  color: Colors.white, size: 26),
            ),
            const SizedBox(width: 12),

            // Text block
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '🎉 توصيل مجاني لمدة 24 ساعة!',
                    style: TextStyle(
                      fontFamily: 'Cairo',
                      fontWeight: FontWeight.w900,
                      fontSize: 13.5,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 1),
                  const Text(
                    'العرض ينتهي في منتصف الليل',
                    style: TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 11,
                      color: Colors.white70,
                    ),
                  ),
                ],
              ),
            ),

            // Countdown pill
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                '$h:$m:$s',
                style: const TextStyle(
                  fontFamily: 'Cairo',
                  fontWeight: FontWeight.w900,
                  fontSize: 15,
                  color: Colors.white,
                  letterSpacing: 1,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

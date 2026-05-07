import 'dart:async';
import 'package:flutter/material.dart';
import 'package:hwasi_app/core/services/api_service.dart';

/// Fetches `free_delivery_enabled` from the backend settings API.
/// Shows nothing when the setting is OFF.
class FreeDeliveryBanner extends StatefulWidget {
  const FreeDeliveryBanner({super.key});

  @override
  State<FreeDeliveryBanner> createState() => _FreeDeliveryBannerState();
}

class _FreeDeliveryBannerState extends State<FreeDeliveryBanner>
    with SingleTickerProviderStateMixin {
  bool? _enabled; // null = still loading
  Duration _remaining = _timeUntilMidnight();
  Timer? _timer;

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

    // Pulse animation
    _pulse = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 900))
      ..repeat(reverse: true);
    _scale = Tween<double>(begin: 1.0, end: 1.18)
        .animate(CurvedAnimation(parent: _pulse, curve: Curves.easeInOut));

    _fetchSetting();
  }

  Future<void> _fetchSetting() async {
    try {
      final data = await ApiService.get('/settings/public', includeAuth: false);
      final enabled = data?['data']?['free_delivery_enabled'] == true;
      if (!mounted) return;
      setState(() => _enabled = enabled);
      if (enabled) _startTimer();
    } catch (_) {
      if (mounted) setState(() => _enabled = false);
    }
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _remaining = _timeUntilMidnight());
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pulse.dispose();
    super.dispose();
  }

  String _pad(int n) => n.toString().padLeft(2, '0');

  @override
  Widget build(BuildContext context) {
    // Hidden when loading or disabled
    if (_enabled != true) return const SizedBox.shrink();

    final h = _pad(_remaining.inHours);
    final m = _pad(_remaining.inMinutes.remainder(60));
    final s = _pad(_remaining.inSeconds.remainder(60));

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 0),
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
            ScaleTransition(
              scale: _scale,
              child: const Icon(Icons.local_shipping_rounded,
                  color: Colors.white, size: 26),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '🎉 توصيل مجاني لمدة 24 ساعة!',
                    style: TextStyle(
                      fontFamily: 'Cairo',
                      fontWeight: FontWeight.w900,
                      fontSize: 13.5,
                      color: Colors.white,
                    ),
                  ),
                  SizedBox(height: 1),
                  Text(
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

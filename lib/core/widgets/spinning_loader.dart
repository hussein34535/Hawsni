import 'package:flutter/material.dart';
import 'dart:math' as math;

class SpinningLoader extends StatefulWidget {
  final double size;
  final Color? color;

  const SpinningLoader({
    super.key,
    this.size = 50.0,
    this.color,
  });

  @override
  State<SpinningLoader> createState() => _SpinningLoaderState();
}

class _SpinningLoaderState extends State<SpinningLoader>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: AnimatedBuilder(
        animation: _controller,
        builder: (_, child) {
          return Transform.rotate(
            angle: _controller.value * 2 * math.pi,
            child: child,
          );
        },
        child: SizedBox(
          width: widget.size,
          height: widget.size,
          child: Image.asset(
            'assets/images/logo.png',
            fit: BoxFit.contain,
            color: widget.color, // Optional: tint the icon if needed
          ),
        ),
      ),
    );
  }
}

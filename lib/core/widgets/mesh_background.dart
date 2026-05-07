import 'dart:math';
import 'dart:ui';
import 'package:flutter/material.dart';

class MeshBackground extends StatefulWidget {
  final Widget? child;
  const MeshBackground({super.key, this.child});

  @override
  State<MeshBackground> createState() => _MeshBackgroundState();
}

class _MeshBackgroundState extends State<MeshBackground>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 30),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Stack(
      children: [
        // Base Background
        Positioned.fill(
          child: Container(color: const Color(0xFFFAFAFA)),
        ),

        // Animated Blobs
        AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            return Stack(
              children: [
                // Blob 1: Greenish (Top-Left)
                _buildBlob(
                  color: const Color(0xFF0E4435).withValues(alpha: 0.1),
                  size: size.width * 0.8,
                  left: -size.width * 0.2 + (sin(_controller.value * 2 * pi) * 40),
                  top: -size.height * 0.1 + (cos(_controller.value * 2 * pi) * -60),
                  scale: 1.0 + (sin(_controller.value * 2 * pi) * 0.1),
                  blur: 120,
                ),

                // Blob 2: Golden (Bottom-Right)
                _buildBlob(
                  color: const Color(0xFFD4AF37).withValues(alpha: 0.05),
                  size: size.width * 0.9,
                  right: -size.width * 0.1 + (sin((_controller.value + 0.3) * 2 * pi) * -50),
                  bottom: -size.height * 0.1 + (cos((_controller.value + 0.3) * 2 * pi) * 80),
                  scale: 1.0 + (cos((_controller.value + 0.3) * 2 * pi) * 0.15),
                  blur: 140,
                ),

                // Blob 3: White (Top-Right)
                _buildBlob(
                  color: Colors.white.withValues(alpha: 0.6),
                  size: size.width * 0.6,
                  right: size.width * 0.1 + (sin((_controller.value + 0.7) * 2 * pi) * 100),
                  top: size.height * 0.2 + (cos((_controller.value + 0.7) * 2 * pi) * -100),
                  scale: 1.0,
                  blur: 100,
                ),
              ],
            );
          },
        ),

        // Grid Pattern (Subtle)
        Positioned.fill(
          child: Opacity(
            opacity: 0.02,
            child: CustomPaint(
              painter: GridPainter(),
            ),
          ),
        ),

        // The actual content
        if (widget.child != null) Positioned.fill(child: widget.child!),
      ],
    );
  }

  Widget _buildBlob({
    required Color color,
    required double size,
    double? left,
    double? top,
    double? right,
    double? bottom,
    required double scale,
    required double blur,
  }) {
    return Positioned(
      left: left,
      top: top,
      right: right,
      bottom: bottom,
      child: ImageFiltered(
        imageFilter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
        child: Transform.scale(
          scale: scale,
          child: Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
            ),
          ),
        ),
      ),
    );
  }
}

class GridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.black
      ..strokeWidth = 0.5;

    const step = 40.0;
    for (double i = 0; i < size.width; i += step) {
      canvas.drawLine(Offset(i, 0), Offset(i, size.height), paint);
    }
    for (double i = 0; i < size.height; i += step) {
      canvas.drawLine(Offset(0, i), Offset(size.width, i), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

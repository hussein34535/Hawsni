import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

class SvgImage extends StatelessWidget {
  final String url;
  final double width;
  final double height;
  final BoxFit fit;

  const SvgImage({
    super.key,
    required this.url,
    this.width = 40,
    this.height = 40,
    this.fit = BoxFit.cover,
  });

  @override
  Widget build(BuildContext context) {
    // Check if it's an SVG file
    if (url.toLowerCase().endsWith('.svg')) {
      return SvgPicture.network(
        url,
        width: width,
        height: height,
        fit: fit,
        placeholderBuilder: (context) => const CircularProgressIndicator(),
      );
    } else {
      // For regular images
      return Image.network(
        url,
        width: width,
        height: height,
        fit: fit,
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return const CircularProgressIndicator();
        },
        errorBuilder: (context, error, stackTrace) {
          // Fallback to transparent container if image fails to load
          return Container(color: Colors.transparent);
        },
      );
    }
  }
}

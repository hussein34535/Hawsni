import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';

class HeroCarousel extends StatefulWidget {
  final List<Map<String, dynamic>> banners;
  final Duration autoPlayDuration;

  const HeroCarousel({
    super.key,
    required this.banners,
    this.autoPlayDuration = const Duration(seconds: 4),
  });

  @override
  State<HeroCarousel> createState() => _HeroCarouselState();
}

class _HeroCarouselState extends State<HeroCarousel> {
  final PageController _pageController = PageController();
  Timer? _autoPlayTimer;
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    _startAutoPlay();
  }

  void _startAutoPlay() {
    if (widget.banners.isEmpty) return;

    _autoPlayTimer = Timer.periodic(widget.autoPlayDuration, (timer) {
      if (widget.banners.isEmpty) return;

      if (_currentPage < widget.banners.length - 1) {
        _currentPage++;
      } else {
        _currentPage = 0;
      }

      if (_pageController.hasClients) {
        _pageController.animateToPage(
          _currentPage,
          duration: const Duration(milliseconds: 600),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _autoPlayTimer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  Color _parseColor(String? colorString) {
    if (colorString == null || colorString.isEmpty) {
      return const Color(0xFFD4AF37); // Default gold color
    }

    try {
      final hexString = colorString.replaceAll('#', '');
      return Color(int.parse('FF$hexString', radix: 16));
    } catch (e) {
      return const Color(0xFFD4AF37);
    }
  }

  BorderRadius _getButtonBorderRadius(String? style) {
    switch (style) {
      case 'square':
        return BorderRadius.circular(4);
      case 'pill':
        return BorderRadius.circular(50);
      case 'rounded':
      default:
        return BorderRadius.circular(12);
    }
  }

  EdgeInsets _getButtonPadding(String? size) {
    switch (size) {
      case 'small':
        return const EdgeInsets.symmetric(horizontal: 16, vertical: 8);
      case 'large':
        return const EdgeInsets.symmetric(horizontal: 28, vertical: 16);
      case 'medium':
      default:
        return const EdgeInsets.symmetric(horizontal: 20, vertical: 12);
    }
  }

  (MainAxisAlignment, CrossAxisAlignment) _getAlignment(String? position) {
    switch (position) {
      case 'top-left':
        return (MainAxisAlignment.start, CrossAxisAlignment.start);
      case 'top-center':
        return (MainAxisAlignment.start, CrossAxisAlignment.center);
      case 'top-right':
        return (MainAxisAlignment.start, CrossAxisAlignment.end);
      case 'center-left':
        return (MainAxisAlignment.center, CrossAxisAlignment.start);
      case 'center':
        return (MainAxisAlignment.center, CrossAxisAlignment.center);
      case 'center-right':
        return (MainAxisAlignment.center, CrossAxisAlignment.end);
      case 'bottom-left':
        return (MainAxisAlignment.end, CrossAxisAlignment.start);
      case 'bottom-center':
        return (MainAxisAlignment.end, CrossAxisAlignment.center);
      case 'bottom-right':
      default:
        return (MainAxisAlignment.end, CrossAxisAlignment.end);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.banners.isEmpty) {
      return Container(
        height: 260,
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.grey[900],
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Center(
          child: Icon(Icons.image, color: Colors.white24, size: 48),
        ),
      );
    }

    return Container(
      height: 200,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Stack(
        children: [
          // Page View
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: PageView.builder(
              controller: _pageController,
              onPageChanged: (index) {
                setState(() {
                  _currentPage = index;
                });
              },
              itemCount: widget.banners.length,
              itemBuilder: (context, index) {
                final banner = widget.banners[index];
                final imageUrl = banner['image_url'] as String?;
                final headingText = banner['heading_text'] as String?;
                final subheadingText = banner['subheading_text'] as String?;
                final buttonText =
                    banner['button_text'] as String? ?? 'Shop Now';
                final buttonColor =
                    _parseColor(banner['button_color'] as String?);
                final buttonStyle = banner['button_style'] as String?;
                final buttonSize = banner['button_size'] as String?;
                final buttonPosition = banner['button_position'] as String?;
                final buttonLink = banner['button_link'] as String?;
                final buttonOpacity =
                    (banner['button_opacity'] as num?)?.toDouble() ?? 1.0;
                final imageBlur =
                    (banner['image_blur'] as num?)?.toDouble() ?? 0.0;

                return Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        const Color(0xFFD4AF37).withOpacity(0.3),
                        const Color(0xFF000000).withOpacity(0.7),
                      ],
                    ),
                  ),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      // Background Image with Blur
                      if (imageUrl != null)
                        imageBlur > 0
                            ? ImageFiltered(
                                imageFilter: ImageFilter.blur(
                                    sigmaX: imageBlur, sigmaY: imageBlur),
                                child: Image.network(
                                  imageUrl,
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) {
                                    return Container(color: Colors.black);
                                  },
                                ),
                              )
                            : Image.network(
                                imageUrl,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) {
                                  return Container(color: Colors.black);
                                },
                              ),
                      // Overlay
                      Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.transparent,
                              Colors.black.withOpacity(0.7),
                            ],
                          ),
                        ),
                      ),
                      // Content
                      Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: _getAlignment(buttonPosition).$2,
                          mainAxisAlignment: _getAlignment(buttonPosition).$1,
                          children: [
                            // Heading Text
                            if (headingText != null && headingText.isNotEmpty)
                              Text(
                                headingText,
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color:
                                      const Color(0xFFD4AF37).withOpacity(0.9),
                                  letterSpacing: 2,
                                ),
                                textAlign: buttonPosition == 'left'
                                    ? TextAlign.left
                                    : buttonPosition == 'center'
                                        ? TextAlign.center
                                        : TextAlign.right,
                              ),
                            if (headingText != null && headingText.isNotEmpty)
                              const SizedBox(height: 4),
                            // Subheading Text
                            if (subheadingText != null &&
                                subheadingText.isNotEmpty)
                              Text(
                                subheadingText,
                                style: const TextStyle(
                                  fontSize: 28,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                  fontFamily: 'Playfair Display',
                                  height: 1.1,
                                ),
                                textAlign: buttonPosition == 'left'
                                    ? TextAlign.left
                                    : buttonPosition == 'center'
                                        ? TextAlign.center
                                        : TextAlign.right,
                              ),
                            if (subheadingText != null &&
                                subheadingText.isNotEmpty)
                              const SizedBox(height: 12),
                            // Button
                            if (buttonText.isNotEmpty)
                              Opacity(
                                opacity: buttonOpacity,
                                child: ElevatedButton(
                                  onPressed: () {
                                    // Handle button navigation
                                    if (buttonLink != null &&
                                        buttonLink.isNotEmpty) {
                                      // Navigate based on link
                                      print('Navigate to: $buttonLink');
                                    }
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: buttonColor,
                                    foregroundColor: Colors.black,
                                    padding: _getButtonPadding(buttonSize),
                                    shape: RoundedRectangleBorder(
                                      borderRadius:
                                          _getButtonBorderRadius(buttonStyle),
                                    ),
                                    elevation: 4,
                                    shadowColor: buttonColor.withOpacity(0.5),
                                  ),
                                  child: Text(
                                    buttonText,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                    ),
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          // Page Indicator
          if (widget.banners.length > 1)
            Positioned(
              bottom: 16,
              left: 0,
              right: 0,
              child: Center(
                child: SmoothPageIndicator(
                  controller: _pageController,
                  count: widget.banners.length,
                  effect: ExpandingDotsEffect(
                    activeDotColor: const Color(0xFFD4AF37),
                    dotColor: Colors.white.withOpacity(0.5),
                    dotHeight: 8,
                    dotWidth: 8,
                    expansionFactor: 3,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

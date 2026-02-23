import 'dart:async';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:hwasi_app/core/themes/app_theme.dart';
import 'package:hwasi_app/l10n/generated/app_localizations.dart';
import 'package:hwasi_app/core/utils/responsive_layout.dart';

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

  @override
  Widget build(BuildContext context) {
    if (widget.banners.isEmpty) {
      return const SizedBox.shrink();
    }

    return RepaintBoundary(
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Page View
          PageView.builder(
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
              final buttonText = banner['button_text'] as String? ??
                  AppLocalizations.of(context)!.shopNow;
              final buttonLink = banner['button_link'] as String?;
              final buttonOpacity =
                  (banner['button_opacity'] as num?)?.toDouble() ?? 1.0;

              return RepaintBoundary(
                  child: Stack(
                fit: StackFit.expand,
                children: [
                  // Background Image
                  if (imageUrl != null)
                    kIsWeb
                        ? Image.network(
                            imageUrl,
                            fit: BoxFit.cover,
                            width: double.infinity,
                            height: double.infinity,
                            filterQuality: FilterQuality.none,
                            errorBuilder: (context, error, stackTrace) =>
                                Container(color: Colors.grey[100]),
                          )
                        : CachedNetworkImage(
                            imageUrl: imageUrl,
                            fit: BoxFit.cover,
                            memCacheWidth:
                                1000, // Quality/Performance balance for large banners
                            memCacheHeight: 500,
                            filterQuality: FilterQuality.none,
                            placeholder: (context, url) =>
                                Container(color: Colors.white),
                            errorWidget: (context, url, error) =>
                                Container(color: Colors.grey[100]),
                          ),

                  // Subtle bottom-weighted gradient overlay
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Colors.black.withValues(alpha: 0.3),
                          Colors.black.withValues(alpha: 0.6),
                        ],
                        stops: const [0.3, 0.7, 1.0],
                      ),
                    ),
                  ),

                  // Content - Magazine style (bottom-left)
                  Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        // Heading Text (Small Label)
                        if (headingText != null && headingText.isNotEmpty)
                          Text(
                            headingText.toUpperCase(),
                            style: TextStyle(
                              fontSize:
                                  ResponsiveLayout.isDesktop(context) ? 14 : 10,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                              letterSpacing:
                                  ResponsiveLayout.isDesktop(context) ? 2 : 1.5,
                            ),
                          ),
                        if (headingText != null && headingText.isNotEmpty)
                          SizedBox(
                              height:
                                  ResponsiveLayout.isDesktop(context) ? 12 : 8),

                        // Subheading Text (Main Title)
                        if (subheadingText != null && subheadingText.isNotEmpty)
                          Text(
                            subheadingText,
                            style: TextStyle(
                              fontSize:
                                  ResponsiveLayout.isDesktop(context) ? 42 : 28,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                              height: 1.1,
                              letterSpacing: -0.5,
                            ),
                          ),
                        if (subheadingText != null && subheadingText.isNotEmpty)
                          SizedBox(
                              height: ResponsiveLayout.isDesktop(context)
                                  ? 32
                                  : 20),

                        // Button
                        if (buttonText.isNotEmpty)
                          Opacity(
                            opacity: buttonOpacity,
                            child: ElevatedButton(
                              onPressed: () {
                                if (buttonLink != null &&
                                    buttonLink.isNotEmpty) {
                                  print('Navigate to: $buttonLink');
                                }
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primaryColor,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 32, vertical: 16),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(30),
                                ),
                                elevation: 0,
                              ),
                              child: Text(
                                buttonText,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),
                          ),
                        const SizedBox(height: 16),
                      ],
                    ),
                  ),
                ],
              ));
            },
          ),

          // Page Indicator
          if (widget.banners.length > 1)
            Positioned(
              bottom: 24,
              left: 32,
              child: SmoothPageIndicator(
                controller: _pageController,
                count: widget.banners.length,
                effect: const ExpandingDotsEffect(
                  activeDotColor: Colors.white,
                  dotColor: Colors.white54,
                  dotHeight: 6,
                  dotWidth: 6,
                  expansionFactor: 4,
                  spacing: 8,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

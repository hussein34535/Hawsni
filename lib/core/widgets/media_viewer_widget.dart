import 'dart:ui' as ui;
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_blurhash/flutter_blurhash.dart';
import 'package:video_player/video_player.dart';
import 'package:hwasi_app/core/themes/app_theme.dart';

class MediaViewerWidget extends StatefulWidget {
  final String url;
  final String? blurHash;

  final bool autoPlay;
  final bool showControls;
  final BoxFit fit;

  const MediaViewerWidget({
    super.key,
    required this.url,
    this.blurHash,
    this.autoPlay = true,
    this.showControls = false,
    this.fit = BoxFit.cover,
  });

  @override
  State<MediaViewerWidget> createState() => _MediaViewerWidgetState();
}

class _MediaViewerWidgetState extends State<MediaViewerWidget> {
  VideoPlayerController? _videoController;
  bool _isVideo = false;
  bool _isVideoInitialized = false;

  @override
  void initState() {
    super.initState();
    _checkAndInitVideo();
  }

  void _checkAndInitVideo() {
    final lowerUrl = widget.url.toLowerCase();
    if (lowerUrl.contains('.mp4') ||
        lowerUrl.contains('.webm') ||
        lowerUrl.contains('.mov') ||
        lowerUrl.contains('/video/upload/')) {
      _isVideo = true;
      _videoController = VideoPlayerController.networkUrl(Uri.parse(widget.url))
        ..initialize().then((_) {
          if (mounted) {
            setState(() {
              _isVideoInitialized = true;
            });
            if (widget.showControls) {
              _videoController?.setVolume(1.0); // Sound on for full screen
              _videoController?.setLooping(false);
            } else {
              _videoController?.setVolume(0.0); // Muted by default like IG/Web
              _videoController?.setLooping(true);
            }
            if (widget.autoPlay) {
              _videoController?.play();
            }
          }
        });
    }
  }

  @override
  void dispose() {
    _videoController?.dispose();
    super.dispose();
  }

  Widget _buildWithCinematicBackground(Widget foreground) {
    if (widget.fit != BoxFit.contain) {
      return foreground;
    }

    return Stack(
      fit: StackFit.expand,
      children: [
        // Background Layer
        Positioned.fill(
          child: Container(
            color: Colors.white,
            child: widget.blurHash != null && widget.blurHash!.isNotEmpty
                ? ImageFiltered(
                    imageFilter: ui.ImageFilter.blur(sigmaX: 30, sigmaY: 30),
                    child: Transform.scale(
                      scale: 1.1,
                      child: BlurHash(
                        hash: widget.blurHash!,
                        imageFit: BoxFit.cover,
                      ),
                    ),
                  )
                : (!_isVideo
                    ? ImageFiltered(
                        imageFilter:
                            ui.ImageFilter.blur(sigmaX: 30, sigmaY: 30),
                        child: Transform.scale(
                          scale: 1.1,
                          child: CachedNetworkImage(
                            imageUrl: widget.url,
                            fit: BoxFit.cover,
                          ),
                        ),
                      )
                    : const SizedBox()),
          ),
        ),
        // Overlay to wash it out elegantly
        Positioned.fill(
          child: Container(color: Colors.white.withValues(alpha: 0.5)),
        ),
        // Foreground focused item
        foreground,
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isVideo) {
      if (_isVideoInitialized && _videoController != null) {
        final videoOutput = SizedBox.expand(
          child: FittedBox(
            fit: widget.fit,
            child: SizedBox(
              width: _videoController!.value.size.width,
              height: _videoController!.value.size.height,
              child: VideoPlayer(_videoController!),
            ),
          ),
        );

        if (widget.showControls) {
          return Stack(
            fit: StackFit.expand,
            children: [
              videoOutput,
              GestureDetector(
                onTap: () {
                  setState(() {
                    _videoController!.value.isPlaying
                        ? _videoController!.pause()
                        : _videoController!.play();
                  });
                },
                child: Container(
                  color: Colors.transparent, // Capture taps
                  child: Center(
                    child: AnimatedOpacity(
                      opacity: _videoController!.value.isPlaying ? 0.0 : 1.0,
                      duration: const Duration(milliseconds: 200),
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: const BoxDecoration(
                          color: Colors.black45,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.play_arrow_rounded,
                            color: Colors.white, size: 56),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          );
        }

        return _buildWithCinematicBackground(videoOutput);
      } else {
        return Container(
          color: Colors.black12,
          child: const Center(
            child: CircularProgressIndicator(
              color: AppTheme.primaryColor,
              strokeWidth: 2,
            ),
          ),
        );
      }
    }

    // Fallback to Image
    final imageOutput = CachedNetworkImage(
      imageUrl: widget.url,
      fit: widget.fit,
      alignment: Alignment.center,
      memCacheWidth: 800,
      placeholder: (_, __) {
        if (widget.blurHash != null && widget.blurHash!.isNotEmpty) {
          return BlurHash(
            hash: widget.blurHash!,
            imageFit: BoxFit.cover,
          );
        }
        return Container(color: Colors.grey[100]);
      },
      errorWidget: (_, __, ___) => Container(color: Colors.grey[100]),
    );

    return _buildWithCinematicBackground(imageOutput);
  }
}

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_blurhash/flutter_blurhash.dart';
import 'package:video_player/video_player.dart';
import 'package:hwasi_app/core/themes/app_theme.dart';

class MediaViewerWidget extends StatefulWidget {
  final String url;
  final String? blurHash;

  const MediaViewerWidget({
    super.key,
    required this.url,
    this.blurHash,
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
            _videoController?.setLooping(true);
            _videoController?.setVolume(0.0); // Muted by default like IG/Web
            _videoController?.play();
          }
        });
    }
  }

  @override
  void dispose() {
    _videoController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isVideo) {
      if (_isVideoInitialized && _videoController != null) {
        return SizedBox.expand(
          child: FittedBox(
            fit: BoxFit.cover,
            child: SizedBox(
              width: _videoController!.value.size.width,
              height: _videoController!.value.size.height,
              child: VideoPlayer(_videoController!),
            ),
          ),
        );
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
    return CachedNetworkImage(
      imageUrl: widget.url,
      fit: BoxFit.cover,
      alignment: Alignment.topCenter,
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
  }
}

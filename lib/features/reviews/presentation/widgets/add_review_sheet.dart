import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';

import 'package:hwasi_app/core/themes/app_theme.dart';
import 'package:hwasi_app/features/reviews/bloc/review_bloc.dart';
import 'package:hwasi_app/features/reviews/bloc/review_event.dart';
import 'package:hwasi_app/l10n/generated/app_localizations.dart';

class AddReviewSheet extends StatefulWidget {
  final String productId;
  final ReviewBloc reviewBloc;

  const AddReviewSheet({
    super.key,
    required this.productId,
    required this.reviewBloc,
  });

  @override
  State<AddReviewSheet> createState() => _AddReviewSheetState();
}

class _AddReviewSheetState extends State<AddReviewSheet>
    with SingleTickerProviderStateMixin {
  final TextEditingController _commentController = TextEditingController();
  double _rating = 0.0;
  bool _isSubmitted = false;
  bool _isUploadingImages = false;

  final List<XFile> _selectedImages = [];
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  // ─── Cloudinary config ──────────────────────────────────────────────────────
  static const _cloudName = 'dqczqsvpj'; // same one used for products
  static const _uploadPreset = 'hawsni_reviews'; // unsigned preset

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 400));
    _scaleAnimation =
        CurvedAnimation(parent: _controller, curve: Curves.elasticOut);
    _controller.forward();
  }

  @override
  void dispose() {
    _commentController.dispose();
    _controller.dispose();
    super.dispose();
  }

  Future<void> _pickImages() async {
    final picker = ImagePicker();
    final picked = await picker.pickMultiImage(imageQuality: 75, limit: 4);
    if (picked.isNotEmpty) {
      setState(() {
        _selectedImages.addAll(picked);
        // Cap at 4 images
        if (_selectedImages.length > 4) {
          _selectedImages.removeRange(4, _selectedImages.length);
        }
      });
    }
  }

  Future<List<String>> _uploadImages() async {
    final urls = <String>[];
    for (final img in _selectedImages) {
      final req = http.MultipartRequest(
        'POST',
        Uri.parse('https://api.cloudinary.com/v1_1/$_cloudName/image/upload'),
      );
      req.fields['upload_preset'] = _uploadPreset;
      req.files.add(await http.MultipartFile.fromPath('file', img.path));
      final res = await req.send();
      if (res.statusCode == 200) {
        final body = json.decode(await res.stream.bytesToString());
        urls.add(body['secure_url']);
      }
    }
    return urls;
  }

  Future<void> _submit() async {
    if (_rating == 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(AppLocalizations.of(context)!.pleaseSelectRating)),
      );
      return;
    }

    setState(() {
      _isSubmitted = true;
      _isUploadingImages = _selectedImages.isNotEmpty;
    });

    List<String> imageUrls = [];
    if (_selectedImages.isNotEmpty) {
      try {
        imageUrls = await _uploadImages();
      } catch (_) {
        // If upload fails, submit without images
      }
    }

    if (!mounted) return;
    setState(() => _isUploadingImages = false);

    Navigator.pop(context);

    widget.reviewBloc.add(AddReview(
      productId: widget.productId,
      rating: _rating,
      comment: _commentController.text,
      images: imageUrls,
    ));

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(AppLocalizations.of(context)!.yourReviewWasSubmitted),
        backgroundColor: AppTheme.primaryColor,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding:
          EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Handle bar
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 24),

              // Title
              SlideTransition(
                position:
                    Tween<Offset>(begin: const Offset(0, 0.2), end: Offset.zero)
                        .animate(CurvedAnimation(
                            parent: _controller, curve: Curves.easeOut)),
                child: Text(
                  AppLocalizations.of(context)!.howWasYourExperience,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                    fontFamily: 'Playfair Display',
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // Stars
              ScaleTransition(
                scale: _scaleAnimation,
                child: RatingBar.builder(
                  initialRating: 0,
                  minRating: 1,
                  direction: Axis.horizontal,
                  allowHalfRating: false,
                  itemCount: 5,
                  itemSize: 48,
                  unratedColor: Colors.grey[200],
                  itemPadding: const EdgeInsets.symmetric(horizontal: 4.0),
                  itemBuilder: (context, _) => const Icon(
                    Icons.star_rounded,
                    color: Color(0xFFFFD700),
                  ),
                  onRatingUpdate: (rating) => setState(() => _rating = rating),
                ),
              ),
              const SizedBox(height: 24),

              // Text input
              Container(
                decoration: BoxDecoration(
                  color: Colors.grey[50],
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.03),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: TextField(
                  controller: _commentController,
                  style: const TextStyle(color: AppTheme.textPrimary),
                  maxLines: 4,
                  decoration: InputDecoration(
                    hintText: AppLocalizations.of(context)!.shareYourThoughts,
                    hintStyle: TextStyle(color: Colors.grey[400]),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(20),
                      borderSide: BorderSide.none,
                    ),
                    filled: true,
                    fillColor: Colors.transparent,
                    contentPadding: const EdgeInsets.all(20),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // ── Image picker row ───────────────────────────────────────────
              SizedBox(
                height: 90,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: [
                    // "Add image" button
                    if (_selectedImages.length < 4)
                      GestureDetector(
                        onTap: _pickImages,
                        child: Container(
                          width: 80,
                          height: 80,
                          margin: const EdgeInsets.only(right: 10),
                          decoration: BoxDecoration(
                            color:
                                AppTheme.primaryColor.withValues(alpha: 0.07),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                                color: AppTheme.primaryColor
                                    .withValues(alpha: 0.3),
                                style: BorderStyle.solid),
                          ),
                          child: const Icon(Icons.add_photo_alternate_rounded,
                              color: AppTheme.primaryColor, size: 32),
                        ),
                      ),
                    // Thumbnails
                    ..._selectedImages.map((img) {
                      final idx = _selectedImages.indexOf(img);
                      return Stack(
                        children: [
                          Container(
                            width: 80,
                            height: 80,
                            margin: const EdgeInsets.only(right: 10),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(16),
                              image: DecorationImage(
                                image: FileImage(File(img.path)),
                                fit: BoxFit.cover,
                              ),
                            ),
                          ),
                          Positioned(
                            top: 2,
                            right: 12,
                            child: GestureDetector(
                              onTap: () =>
                                  setState(() => _selectedImages.removeAt(idx)),
                              child: Container(
                                width: 20,
                                height: 20,
                                decoration: const BoxDecoration(
                                  color: Colors.red,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.close,
                                    color: Colors.white, size: 14),
                              ),
                            ),
                          ),
                        ],
                      );
                    }),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Submit Button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _isSubmitted ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryColor,
                    foregroundColor: Colors.white,
                    elevation: 8,
                    shadowColor: AppTheme.primaryColor.withValues(alpha: 0.3),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20)),
                  ),
                  child: _isUploadingImages
                      ? const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                    color: Colors.white, strokeWidth: 2)),
                            SizedBox(width: 12),
                            Text('جاري رفع الصور...',
                                style: TextStyle(
                                    fontSize: 16, fontWeight: FontWeight.bold)),
                          ],
                        )
                      : _isSubmitted
                          ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(
                                  color: Colors.white, strokeWidth: 2))
                          : Text(
                              AppLocalizations.of(context)!.submitReview,
                              style: const TextStyle(
                                  fontSize: 18, fontWeight: FontWeight.bold),
                            ),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}

import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:hwasi_app/core/services/api_service.dart';
import 'package:hwasi_app/core/themes/app_theme.dart';

class WriteReviewScreen extends StatefulWidget {
  final String productId;
  final String productName;

  const WriteReviewScreen({
    super.key,
    required this.productId,
    required this.productName,
  });

  @override
  State<WriteReviewScreen> createState() => _WriteReviewScreenState();
}

class _WriteReviewScreenState extends State<WriteReviewScreen> {
  final TextEditingController _commentController = TextEditingController();
  int _rating = 0;
  bool _isLoading = false;
  final List<XFile> _selectedImages = [];
  final ImagePicker _picker = ImagePicker();

  Future<void> _pickImages() async {
    try {
      final List<XFile> images = await _picker.pickMultiImage(
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 80,
      );
      if (images.isNotEmpty) {
        setState(() {
          // Max 5 images
          final remaining = 5 - _selectedImages.length;
          _selectedImages.addAll(images.take(remaining));
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('فشل اختيار الصور: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _takePhoto() async {
    try {
      final XFile? photo = await _picker.pickImage(
        source: ImageSource.camera,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 80,
      );
      if (photo != null && _selectedImages.length < 5) {
        setState(() {
          _selectedImages.add(photo);
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('فشل التقاط الصورة: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _removeImage(int index) {
    setState(() {
      _selectedImages.removeAt(index);
    });
  }

  Future<void> _submitReview() async {
    if (_rating == 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('يرجى اختيار التقييم', style: GoogleFonts.cairo()),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    if (_commentController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('يرجى كتابة تقييمك', style: GoogleFonts.cairo()),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final review = await ApiService.createReview(
        productId: widget.productId,
        rating: _rating,
        comment: _commentController.text.trim(),
      );

      if (review != null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content:
                  Text('تم إرسال التقييم بنجاح ✅', style: GoogleFonts.cairo()),
              backgroundColor: Colors.green,
            ),
          );
          Navigator.pop(context, true);
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('فشل إرسال التقييم', style: GoogleFonts.cairo()),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('خطأ: ${e.toString()}', style: GoogleFonts.cairo()),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text(
          'كتابة تقييم',
          style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Product info card
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.shopping_bag_outlined,
                        color: AppTheme.primaryColor, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      widget.productName,
                      style: GoogleFonts.cairo(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),

            // Rating section
            Text(
              'تقييمك',
              style: GoogleFonts.cairo(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Center(
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.amber.withValues(alpha: 0.1),
                      blurRadius: 10,
                    ),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: List.generate(5, (index) {
                    return GestureDetector(
                      onTap: () => setState(() => _rating = index + 1),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: AnimatedScale(
                          scale: index < _rating ? 1.2 : 1.0,
                          duration: const Duration(milliseconds: 200),
                          child: Icon(
                            index < _rating
                                ? Icons.star_rounded
                                : Icons.star_outline_rounded,
                            color: index < _rating
                                ? Colors.amber
                                : Colors.grey[300],
                            size: 40,
                          ),
                        ),
                      ),
                    );
                  }),
                ),
              ),
            ),
            if (_rating > 0)
              Center(
                child: Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    _ratingLabel(_rating),
                    style: GoogleFonts.cairo(
                      fontSize: 14,
                      color: Colors.amber[700],
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            const SizedBox(height: 28),

            // Comment section
            Text(
              'رأيك',
              style: GoogleFonts.cairo(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 10,
                  ),
                ],
              ),
              child: TextField(
                controller: _commentController,
                maxLines: 5,
                style: GoogleFonts.cairo(fontSize: 14),
                decoration: InputDecoration(
                  hintText: 'شاركنا رأيك عن المنتج...',
                  hintStyle: GoogleFonts.cairo(color: Colors.grey[400]),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(color: Colors.grey[200]!),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(color: Colors.grey[200]!),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: AppTheme.primaryColor),
                  ),
                  contentPadding: const EdgeInsets.all(16),
                ),
              ),
            ),
            const SizedBox(height: 28),

            // Photo section
            Row(
              children: [
                Text(
                  'أضف صور',
                  style: GoogleFonts.cairo(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '(${_selectedImages.length}/5)',
                  style: GoogleFonts.cairo(
                    fontSize: 14,
                    color: Colors.grey[500],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Image thumbnails + add button
            SizedBox(
              height: 100,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  // Existing selected images
                  ..._selectedImages.asMap().entries.map((entry) {
                    return Padding(
                      padding: const EdgeInsets.only(right: 10),
                      child: Stack(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Image.file(
                              File(entry.value.path),
                              width: 100,
                              height: 100,
                              fit: BoxFit.cover,
                            ),
                          ),
                          Positioned(
                            top: 4,
                            right: 4,
                            child: GestureDetector(
                              onTap: () => _removeImage(entry.key),
                              child: Container(
                                padding: const EdgeInsets.all(2),
                                decoration: const BoxDecoration(
                                  color: Colors.red,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  Icons.close,
                                  color: Colors.white,
                                  size: 14,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                  // Add button
                  if (_selectedImages.length < 5)
                    GestureDetector(
                      onTap: () => _showImageSourceSheet(context),
                      child: Container(
                        width: 100,
                        height: 100,
                        decoration: BoxDecoration(
                          color: Colors.grey[100],
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: Colors.grey[300]!,
                            style: BorderStyle.solid,
                          ),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.add_a_photo_outlined,
                                color: Colors.grey[500], size: 28),
                            const SizedBox(height: 4),
                            Text(
                              'أضف صورة',
                              style: GoogleFonts.cairo(
                                fontSize: 11,
                                color: Colors.grey[500],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 36),

            // Submit button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _submitReview,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  elevation: 0,
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 22,
                        width: 22,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : Text(
                        'إرسال التقييم',
                        style: GoogleFonts.cairo(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  void _showImageSourceSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'اختر مصدر الصورة',
                style: GoogleFonts.cairo(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              ListTile(
                leading: const Icon(Icons.photo_library_outlined),
                title: Text('المعرض', style: GoogleFonts.cairo()),
                onTap: () {
                  Navigator.pop(context);
                  _pickImages();
                },
              ),
              ListTile(
                leading: const Icon(Icons.camera_alt_outlined),
                title: Text('الكاميرا', style: GoogleFonts.cairo()),
                onTap: () {
                  Navigator.pop(context);
                  _takePhoto();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _ratingLabel(int rating) {
    switch (rating) {
      case 1:
        return 'سيء 😞';
      case 2:
        return 'مقبول 😐';
      case 3:
        return 'جيد 🙂';
      case 4:
        return 'جيد جداً 😊';
      case 5:
        return 'ممتاز 🤩';
      default:
        return '';
    }
  }
}

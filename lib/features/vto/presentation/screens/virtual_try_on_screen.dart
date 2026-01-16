import 'dart:io';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:hawsni_app/core/themes/app_theme.dart';
import 'package:hawsni_app/core/widgets/spinning_loader.dart';
import 'package:hawsni_app/features/vto/data/services/vto_service.dart';
import 'package:hawsni_app/l10n/generated/app_localizations.dart';

class VirtualTryOnScreen extends StatefulWidget {
  final String productImageUrl;
  final String productId;

  const VirtualTryOnScreen({
    super.key,
    required this.productImageUrl,
    required this.productId,
  });

  @override
  State<VirtualTryOnScreen> createState() => _VirtualTryOnScreenState();
}

class _VirtualTryOnScreenState extends State<VirtualTryOnScreen> {
  File? _userImage;
  String? _resultImageUrl;
  String _status = 'idle'; // idle, uploading, processing, succeeded, failed
  String _errorMessage = '';
  final ImagePicker _picker = ImagePicker();
  Timer? _pollingTimer;

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? pickedFile = await _picker.pickImage(source: source);
      if (pickedFile != null) {
        setState(() {
          _userImage = File(pickedFile.path);
          _status = 'idle';
          _resultImageUrl = null;
        });
      }
    } catch (e) {
      // Handle permission errors etc
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error picking image: $e')),
      );
    }
  }

  Future<void> _startTryOn() async {
    if (_userImage == null) return;

    setState(() {
      _status = 'uploading';
      _errorMessage = '';
    });

    try {
      // In a real app with file upload, we would upload _userImage first.
      // Since our backend expects a URL (and Node middleware might handle upload),
      // BUT our VTO controller currently expects 'human_image' URL in body.
      // WE NEED TO UPLOAD THE IMAGE FIRST.
      // For this MVP, we will assume image upload is handled or we pass a placeholder/demo URL
      // Wait, standard `ApiService` doesn't support file upload easily to return URL.
      // I will implement a quick Base64 or assume the backend middleware handles 'multipart/form-data'.
      //
      // REVISION: The VTO Backend controller expects JSON body with URLs.
      // I need to update VTO Controller to handle multipart/form-data OR
      // I need an upload endpoint. 
      //
      // FOR NOW, to allow progress, I will use a simple "Upload to Cloudinary" or similar logic IF I had it.
      // Since I don't, I will use `ApiService.uploadFile` if it exists, or create one.
      //
      // Let's assume there is an upload endpoint. I will check `server.js` for `upload` middleware usage.
      //
      // Wait, `server.js` has `app.use('/api/users', userRoutes);` which uses upload.
      // I will create a temporary helper to upload the image to my server (public folder) and get a URL.
      
      // TEMPORARY FIX: I'll convert image to Base64 and send it if Replicate supports it? 
      // Replicate supports data URIs! `data:image/jpeg;base64,...`
      
      final bytes = await _userImage!.readAsBytes();
      final String base64Image = "data:image/jpeg;base64,${base64Encode(bytes)}";

      final response = await VtoService.startTryOn(
        humanImageUrl: base64Image,
        garmentImageUrl: widget.productImageUrl,
      );

      final String predictionId = response['id'];
      _pollStatus(predictionId);
       setState(() {
        _status = 'processing';
      });

    } catch (e) {
      setState(() {
        _status = 'failed';
        _errorMessage = e.toString();
      });
    }
  }
    
  import 'dart:convert'; // Added for base64Encode

  void _pollStatus(String id) {
    _pollingTimer = Timer.periodic(const Duration(seconds: 2), (timer) async {
      try {
        final statusResponse = await VtoService.checkStatus(id);
        final status = statusResponse['status'];
        
        if (status == 'succeeded') {
          timer.cancel();
          setState(() {
            _status = 'succeeded';
            _resultImageUrl = statusResponse['output'];
          });
        } else if (status == 'failed' || status == 'canceled') {
          timer.cancel();
          setState(() {
            _status = 'failed';
            _errorMessage = 'Generation failed.';
          });
        }
        // else still processing/starting
      } catch (e) {
        timer.cancel();
         setState(() {
          _status = 'failed';
          _errorMessage = e.toString();
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(AppLocalizations.of(context)!.vtoTitle, style: const TextStyle(color: Colors.black)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            // Instructions
            Text(
              AppLocalizations.of(context)!.vtoInstruction,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppTheme.textSecondary, fontSize: 16),
            ),
            const SizedBox(height: 24),

            // Image Selection Area
            GestureDetector(
              onTap: _status == 'processing' ? null : () => _showImageSourceSheet(),
              child: Container(
                height: 400,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                child: _resultImageUrl != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(20),
                        child: Image.network(_resultImageUrl!, fit: BoxFit.cover),
                      )
                    : _userImage != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(20),
                            child: Image.file(_userImage!, fit: BoxFit.cover),
                          )
                        : Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.camera_alt_outlined, size: 64, color: Colors.grey),
                              const SizedBox(height: 16),
                              Text(AppLocalizations.of(context)!.vtoUpload, style: const TextStyle(color: Colors.grey)),
                            ],
                          ),
              ),
            ),
            const SizedBox(height: 32),

            // Status / Action Button
            if (_status == 'processing' || _status == 'uploading') ...[
              const SpinningLoader(),
              const SizedBox(height: 16),
              Text(AppLocalizations.of(context)!.vtoProcessing),
            ] else if (_status == 'succeeded') ...[
              Row(
                children: [
                   Expanded(
                    child: OutlinedButton(
                      onPressed: () => _pickImage(ImageSource.gallery),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        side: const BorderSide(color: AppTheme.primaryColor),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text(AppLocalizations.of(context)!.vtoTryAnother, style: const TextStyle(color: AppTheme.primaryColor)),
                    ),
                  ),
                ],
              )
            ] else ...[
               if (_errorMessage.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Text(_errorMessage, style: const TextStyle(color: Colors.red)),
                  ),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _userImage == null ? null : _startTryOn,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryColor,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
                  ),
                  child: Text(AppLocalizations.of(context)!.vtoButton, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _showImageSourceSheet() {
      showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Camera'),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Gallery'),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.gallery);
              },
            ),
          ],
        ),
      ),
    );
  }
}

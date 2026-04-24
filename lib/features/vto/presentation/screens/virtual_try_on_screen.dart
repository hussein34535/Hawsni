import 'dart:io';
import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:share_plus/share_plus.dart';
import 'package:http/http.dart' as http; // Add http for downloading
import 'package:path_provider/path_provider.dart'; // Add path_provider
import 'package:hwasi_app/core/themes/app_theme.dart';
import 'package:hwasi_app/core/widgets/spinning_loader.dart';
import 'package:hwasi_app/features/vto/data/services/vto_service.dart';
import 'package:hwasi_app/l10n/generated/app_localizations.dart';
import 'package:hwasi_app/core/services/auth_service.dart';
import 'package:hwasi_app/features/auth/presentation/screens/login_screen.dart';

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
  void initState() {
    super.initState();
    // Auth safety check
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!AuthService.isAuthenticated()) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const LoginScreen()),
        );
      }
    });
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? pickedFile = await _picker.pickImage(
        source: source,
        maxWidth: 2048,
        maxHeight: 2048,
        imageQuality: 100,
      );
      if (pickedFile != null) {
        final length = await pickedFile.length();
        if (length > 20 * 1024 * 1024) {
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('Image too large. Please choose a smaller one.')),
          );
          return;
        }
        if (!mounted) return;
        setState(() {
          _userImage = File(pickedFile.path);
          _status = 'idle';
          _resultImageUrl = null;
        });
      }
    } catch (e) {
      if (!mounted) return;
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
      // Encode image to Base64
      final bytes = await _userImage!.readAsBytes();
      final String base64Image =
          "data:image/jpeg;base64,${base64Encode(bytes)}";

      // Call Backend API
      final response = await VtoService.startTryOn(
        humanImageUrl: base64Image,
        garmentImageUrl: widget.productImageUrl,
      );

      final String predictionId = response['id'];

      setState(() {
        _status = 'processing';
      });

      // Start Polling
      _pollStatus(predictionId);
    } catch (e) {
      setState(() {
        _status = 'failed';
        _errorMessage = e.toString();
      });
    }
  }

  void _pollStatus(String id) {
    _pollingTimer = Timer.periodic(const Duration(seconds: 3), (timer) async {
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
            _errorMessage = 'Generation failed. Please try again.';
          });
        }
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
    final localizations = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(localizations.vtoTitle,
            style: const TextStyle(
                color: Colors.black, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              // Instructions (Compact)
              if (_status == 'idle' && _userImage == null) ...[
                Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.05),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                    border: Border.all(color: Colors.grey[200]!),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _buildStepItem('assets/images/vto_step_1.png',
                              localizations.vtoStep1),
                          const Icon(Icons.arrow_forward_rounded,
                              color: Colors.grey, size: 16),
                          _buildStepItem('assets/images/vto_step_2.png',
                              localizations.vtoStep2),
                          const Icon(Icons.arrow_forward_rounded,
                              color: Colors.grey, size: 16),
                          _buildStepItem('assets/images/vto_step_3.png',
                              localizations.vtoStep3),
                        ],
                      ),
                    ],
                  ),
                ),
              ],

              // Image Area (Responsive)
              Expanded(
                child: GestureDetector(
                  onTap: (_status == 'processing' || _status == 'uploading')
                      ? null
                      : () {
                          if (_resultImageUrl != null) {
                            _openFullScreenImage();
                          } else {
                            _showImageSourceSheet();
                          }
                        },
                  child: Container(
                    // height: 500 removed to allow Expanded to control size
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.grey[300]!),
                    ),
                    child: _resultImageUrl != null
                        ? Stack(
                            children: [
                              Positioned.fill(
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(20),
                                  child: InteractiveViewer(
                                    minScale: 1.0,
                                    maxScale: 4.0,
                                    child: Image.network(_resultImageUrl!,
                                        fit: BoxFit
                                            .contain), // Already contained
                                  ),
                                ),
                              ),
                              Positioned(
                                  bottom: 12,
                                  right: 12,
                                  child: Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                        color: Colors.black54,
                                        borderRadius: BorderRadius.circular(8)),
                                    child: const Icon(Icons.zoom_in,
                                        color: Colors.white),
                                  ))
                            ],
                          )
                        : _userImage != null
                            ? ClipRRect(
                                borderRadius: BorderRadius.circular(20),
                                child: Image.file(_userImage!,
                                    fit: BoxFit.contain), // Changed to contain
                              )
                            : Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const SizedBox(
                                      height:
                                          0), // Reduced spacing since expanded centers it
                                  const Icon(Icons.add_a_photo_outlined,
                                      size: 48,
                                      color: Colors.grey), // Reduced size
                                  const SizedBox(height: 12),
                                  Text(localizations.vtoUpload,
                                      style: const TextStyle(
                                          color: Colors.grey,
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold)),
                                ],
                              ),
                  ),
                ),
              ),
              // Spacer removed
              const SizedBox(height: 16),

              // Actions (Fixed at bottom)
              if (_status == 'processing' || _status == 'uploading') ...[
                const SpinningLoader(),
                const SizedBox(height: 16),
                Text(localizations.vtoProcessing,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 14)),
              ] else if (_status == 'succeeded') ...[
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          setState(() {
                            _userImage = null;
                            _resultImageUrl = null;
                            _status = 'idle';
                          });
                        },
                        icon: const Icon(Icons.refresh,
                            color: AppTheme.primaryColor),
                        label: Text(localizations.vtoTryAnother,
                            style:
                                const TextStyle(color: AppTheme.primaryColor)),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          side: const BorderSide(color: AppTheme.primaryColor),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => _shareImage(),
                        icon: const Icon(Icons.share, color: Colors.white),
                        label: Text(localizations.shareImage,
                            style: const TextStyle(color: Colors.white)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryColor,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                          elevation: 0,
                        ),
                      ),
                    ),
                  ],
                )
              ] else ...[
                if (_errorMessage.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Text(_errorMessage,
                        style: const TextStyle(color: Colors.red, fontSize: 12),
                        textAlign: TextAlign.center),
                  ),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _userImage == null ? null : _startTryOn,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      disabledBackgroundColor: Colors.grey[300],
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                      elevation: 5,
                      shadowColor: AppTheme.primaryColor.withValues(alpha: 0.4),
                    ),
                    child: Text(
                      localizations.vtoButton,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  void _openFullScreenImage() {
    if (_resultImageUrl == null) return;
    showDialog(
      context: context,
      builder: (_) => Dialog(
        insetPadding: EdgeInsets.zero,
        backgroundColor: Colors.black,
        child: Stack(
          alignment: Alignment.center,
          children: [
            Column(
              children: [
                Expanded(
                  child: InteractiveViewer(
                    child: Image.network(_resultImageUrl!, fit: BoxFit.contain),
                  ),
                ),
                SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text(
                          "Save Image",
                          style: TextStyle(color: Colors.white70, fontSize: 12),
                        ),
                        const SizedBox(height: 8),
                        FloatingActionButton(
                          onPressed: _shareImage,
                          backgroundColor: Colors.white,
                          child:
                              const Icon(Icons.download, color: Colors.black),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            Positioned(
              top: 40,
              right: 20,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white, size: 30),
                onPressed: () => Navigator.pop(context),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _shareImage() async {
    if (_resultImageUrl == null) return;
    try {
      final response = await http.get(Uri.parse(_resultImageUrl!));
      final documentDirectory = await getTemporaryDirectory();
      final file = File('${documentDirectory.path}/try_on_result.jpg');
      file.writeAsBytesSync(response.bodyBytes);

      await SharePlus.instance.share(ShareParams(
          files: [XFile(file.path)],
          text: 'Check out my new look with hwasi AI! 👗✨'));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error sharing image: $e')),
      );
    }
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

  Widget _buildStepItem(String imagePath, String label) {
    return Column(
      children: [
        Container(
          padding: EdgeInsets.zero, // Removed padding to maximize image
          decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey[200]!, width: 2),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                )
              ]),
          child: Image.asset(imagePath, width: 85, height: 85),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ),
      ],
    );
  }
}

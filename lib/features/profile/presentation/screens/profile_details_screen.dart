import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:hwasi_app/core/services/api_service.dart';
import 'package:hwasi_app/core/services/auth_service.dart';
import 'package:hwasi_app/core/themes/app_theme.dart';
import 'package:hwasi_app/l10n/generated/app_localizations.dart';
import 'package:hwasi_app/core/widgets/spinning_loader.dart';

class ProfileDetailsScreen extends StatefulWidget {
  const ProfileDetailsScreen({super.key});

  @override
  State<ProfileDetailsScreen> createState() => _ProfileDetailsScreenState();
}

class _ProfileDetailsScreenState extends State<ProfileDetailsScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _emailController;
  late TextEditingController _phoneController;
  late TextEditingController _dateOfBirthController;
  bool _isEditing = false;
  File? _profileImage;
  Map<String, dynamic>? _userProfile;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController();
    _emailController = TextEditingController();
    _phoneController = TextEditingController();
    _dateOfBirthController = TextEditingController();
    _loadUserProfile();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _dateOfBirthController.dispose();
    super.dispose();
  }

  Future<void> _loadUserProfile() async {
    try {
      final profile = await ApiService.getUserProfile();
      if (mounted) {
        setState(() {
          _userProfile = profile;
          _nameController.text = profile?['name'] ?? '';
          _emailController.text = profile?['email'] ?? '';
          _phoneController.text = profile?['phone'] ?? '';
          _dateOfBirthController.text = profile?['dateOfBirth'] ?? '';
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Error loading user profile: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _toggleEditing() {
    setState(() {
      _isEditing = !_isEditing;
    });
  }

  Future<void> _pickProfileImage() async {
    final ImagePicker picker = ImagePicker();
    final XFile? pickedFile =
        await picker.pickImage(source: ImageSource.gallery);

    if (pickedFile != null) {
      setState(() {
        _profileImage = File(pickedFile.path);
      });
    }
  }

  void _saveProfile() async {
    if (_formKey.currentState!.validate()) {
      setState(() => _isLoading = true);
      try {
        // Note: Actual image upload would go here if backend supported it.
        // For now we just update text fields.

        final success = await ApiService.updateUserProfile(
          _nameController.text,
          _phoneController.text,
        );

        if (success && mounted) {
          await _loadUserProfile();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('Profile updated successfully!',
                    style: TextStyle(color: Colors.white)),
                backgroundColor: AppTheme.successColor),
          );
          setState(() {
            _isEditing = false;
            _isLoading = false;
          });
        } else if (mounted) {
          setState(() => _isLoading = false);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('Failed to update profile',
                    style: TextStyle(color: Colors.white)),
                backgroundColor: AppTheme.errorColor),
          );
        }
      } catch (e) {
        if (mounted) {
          setState(() => _isLoading = false);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('Error updating profile',
                    style: TextStyle(color: Colors.white)),
                backgroundColor: AppTheme.errorColor),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('Profile Details',
            style: TextStyle(
                fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
        backgroundColor: AppTheme.scaffoldBackgroundColor,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppTheme.textPrimary),
        actions: [
          IconButton(
            icon: Icon(_isEditing ? Icons.check : Icons.edit,
                color: AppTheme.primaryColor),
            onPressed: _isEditing ? _saveProfile : _toggleEditing,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: SpinningLoader())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Form(
                key: _formKey,
                child: Column(
                  children: [
                    Stack(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppTheme.primaryColor,
                          ),
                          child: CircleAvatar(
                            radius: 50,
                            backgroundColor: Colors.white,
                            backgroundImage: _profileImage != null
                                ? FileImage(_profileImage!)
                                : (_userProfile?['avatar_url'] != null
                                    ? NetworkImage(_userProfile!['avatar_url'])
                                    : null) as ImageProvider?,
                            child: _profileImage == null &&
                                    _userProfile?['avatar_url'] == null
                                ? const Icon(Icons.person,
                                    size: 50, color: AppTheme.textTertiary)
                                : null,
                          ),
                        ),
                        if (_isEditing)
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: GestureDetector(
                              onTap: _pickProfileImage,
                              child: Container(
                                padding: const EdgeInsets.all(8),
                                decoration: const BoxDecoration(
                                  color: AppTheme.primaryColor,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.camera_alt,
                                    size: 16, color: Colors.white),
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 40),
                    _buildTextField(
                      controller: _nameController,
                      label: AppLocalizations.of(context)!.fullName,
                      icon: Icons.person_outline,
                      enabled: _isEditing,
                      validator: (value) =>
                          value!.isEmpty ? 'Please enter your name' : null,
                    ),
                    const SizedBox(height: 20),
                    _buildTextField(
                      controller: _emailController,
                      label: AppLocalizations.of(context)!.emailAddressLabel,
                      icon: Icons.email_outlined,
                      enabled: false,
                    ),
                    const SizedBox(height: 20),
                    _buildTextField(
                      controller: _phoneController,
                      label: AppLocalizations.of(context)!.phoneNumber,
                      icon: Icons.phone_outlined,
                      enabled: _isEditing,
                      keyboardType: TextInputType.phone,
                      validator: (value) => value!.isEmpty
                          ? 'Please enter your phone number'
                          : null,
                    ),
                    const SizedBox(height: 20),
                    _buildTextField(
                      controller: _dateOfBirthController,
                      label: AppLocalizations.of(context)!.dateOfBirth,
                      icon: Icons.calendar_today_outlined,
                      enabled: _isEditing,
                      readOnly: true,
                      onTap: _isEditing
                          ? () async {
                              final DateTime? picked = await showDatePicker(
                                context: context,
                                initialDate: DateTime.now(),
                                firstDate: DateTime(1900),
                                lastDate: DateTime.now(),
                                builder: (context, child) {
                                  return Theme(
                                    data: Theme.of(context).copyWith(
                                      colorScheme: const ColorScheme.light(
                                        primary: AppTheme.primaryColor,
                                        onPrimary: Colors.white,
                                        surface: Colors.white,
                                        onSurface: AppTheme.textPrimary,
                                      ),
                                    ),
                                    child: child!,
                                  );
                                },
                              );
                              if (picked != null) {
                                setState(() {
                                  _dateOfBirthController.text =
                                      "${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}";
                                });
                              }
                            }
                          : null,
                    ),
                    const SizedBox(height: 32),
                    if (_isEditing)
                      SizedBox(
                        width: double.infinity,
                        height: 56,
                        child: ElevatedButton(
                          onPressed: _saveProfile,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primaryColor,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(30)),
                          ),
                          child: const Text('Save Changes',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold)),
                        ),
                      ),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool enabled = true,
    String? Function(String?)? validator,
    TextInputType? keyboardType,
    bool readOnly = false,
    VoidCallback? onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.borderColor),
      ),
      child: TextFormField(
        controller: controller,
        enabled: enabled,
        readOnly: readOnly,
        onTap: onTap,
        keyboardType: keyboardType,
        style: const TextStyle(color: AppTheme.textPrimary),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: const TextStyle(color: AppTheme.textSecondary),
          prefixIcon: Icon(icon, color: AppTheme.primaryColor),
          border: InputBorder.none,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        ),
        validator: validator,
      ),
    );
  }
}

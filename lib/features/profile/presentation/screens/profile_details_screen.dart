import 'dart:ui';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:hawsni_app/features/orders/presentation/screens/orders_screen.dart';
import 'package:image_picker/image_picker.dart';
import 'package:hawsni_app/core/services/api_service.dart';
import 'package:hawsni_app/core/themes/app_theme.dart';
import 'package:hawsni_app/core/widgets/spinning_loader.dart';

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

  void _saveProfile() async {
    if (_formKey.currentState!.validate()) {
      try {
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
          });
        } else if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('Failed to update profile',
                    style: TextStyle(color: Colors.white)),
                backgroundColor: AppTheme.errorColor),
          );
        }
      } catch (e) {
        if (mounted) {
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text('Profile Details',
            style: TextStyle(
                fontFamily: 'Playfair Display', fontWeight: FontWeight.bold)),
        backgroundColor: Colors.black,
        elevation: 0,
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
              padding: const EdgeInsets.all(16.0),
              child: Form(
                key: _formKey,
                child: Column(
                  children: [
                    Stack(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                                color: AppTheme.primaryColor, width: 2),
                            boxShadow: [
                              BoxShadow(
                                color: AppTheme.primaryColor.withOpacity(0.2),
                                blurRadius: 15,
                                spreadRadius: 2,
                              ),
                            ],
                          ),
                          child: CircleAvatar(
                            radius: 50,
                            backgroundColor: Colors.grey[900],
                            backgroundImage: _profileImage != null
                                ? FileImage(_profileImage!)
                                : null,
                            child: _profileImage == null
                                ? const Icon(Icons.person,
                                    size: 50, color: Colors.white54)
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
                                    size: 16, color: Colors.black),
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 32),
                    _buildGlassTextField(
                      controller: _nameController,
                      label: 'Full Name',
                      icon: Icons.person_outline,
                      enabled: _isEditing,
                      validator: (value) =>
                          value!.isEmpty ? 'Please enter your name' : null,
                    ),
                    const SizedBox(height: 16),
                    _buildGlassTextField(
                      controller: _emailController,
                      label: 'Email Address',
                      icon: Icons.email_outlined,
                      enabled: false,
                    ),
                    const SizedBox(height: 16),
                    _buildGlassTextField(
                      controller: _phoneController,
                      label: 'Phone Number',
                      icon: Icons.phone_outlined,
                      enabled: _isEditing,
                      keyboardType: TextInputType.phone,
                      validator: (value) => value!.isEmpty
                          ? 'Please enter your phone number'
                          : null,
                    ),
                    const SizedBox(height: 16),
                    _buildGlassTextField(
                      controller: _dateOfBirthController,
                      label: 'Date of Birth',
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
                                      colorScheme: const ColorScheme.dark(
                                        primary: AppTheme.primaryColor,
                                        onPrimary: Colors.black,
                                        surface: Color(0xFF1E1E1E),
                                        onSurface: Colors.white,
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
                        height: 50,
                        child: ElevatedButton(
                          onPressed: _saveProfile,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primaryColor,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12)),
                          ),
                          child: const Text('Save Changes',
                              style: TextStyle(
                                  color: Colors.black,
                                  fontWeight: FontWeight.bold)),
                        ),
                      ),
                    const SizedBox(height: 32),
                    const Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'Recent Activity',
                        style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                            fontFamily: 'Playfair Display'),
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildOrderCard(
                        'Order #12345', 'Processing', '\$125.99', '2023-06-15'),
                    const SizedBox(height: 12),
                    _buildOrderCard(
                        'Order #12344', 'Delivered', '\$89.50', '2023-06-10'),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed: () => Navigator.of(context).push(
                            MaterialPageRoute(
                                builder: (context) => const OrdersScreen())),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: AppTheme.primaryColor),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: const Text('View All Orders',
                            style: TextStyle(color: AppTheme.primaryColor)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildGlassTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool enabled = true,
    String? Function(String?)? validator,
    TextInputType? keyboardType,
    bool readOnly = false,
    VoidCallback? onTap,
  }) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white.withOpacity(0.1)),
          ),
          child: TextFormField(
            controller: controller,
            enabled: enabled,
            readOnly: readOnly,
            onTap: onTap,
            keyboardType: keyboardType,
            style: TextStyle(color: enabled ? Colors.white : Colors.white54),
            decoration: InputDecoration(
              labelText: label,
              labelStyle: TextStyle(color: Colors.white.withOpacity(0.6)),
              prefixIcon: Icon(icon,
                  color: enabled ? AppTheme.primaryColor : Colors.grey),
              border: InputBorder.none,
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            ),
            validator: validator,
          ),
        ),
      ),
    );
  }

  Widget _buildOrderCard(
      String orderId, String status, String amount, String date) {
    Color statusColor = status == 'Delivered'
        ? AppTheme.successColor
        : (status == 'Processing' ? Colors.orange : AppTheme.errorColor);

    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white.withOpacity(0.1)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(orderId,
                      style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white)),
                  const SizedBox(height: 4),
                  Text(date,
                      style: const TextStyle(fontSize: 14, color: Colors.grey)),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(amount,
                      style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.primaryColor)),
                  const SizedBox(height: 4),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(status,
                        style: TextStyle(
                            fontSize: 12,
                            color: statusColor,
                            fontWeight: FontWeight.w500)),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

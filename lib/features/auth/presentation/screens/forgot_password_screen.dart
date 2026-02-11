import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:hwasi_app/core/services/auth_service.dart';
import 'package:hwasi_app/core/themes/app_theme.dart';
import 'package:hwasi_app/core/widgets/spinning_loader.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailFormKey = GlobalKey<FormState>();
  final _resetFormKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _codeController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isLoading = false;
  int _step = 0; // 0 = email input, 1 = code + new password, 2 = success

  Future<void> _sendResetCode() async {
    if (!_emailFormKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final result = await AuthService.forgotPassword(
        _emailController.text.trim(),
      );

      if (result != null && result['success'] == true) {
        setState(() => _step = 1);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('تم إرسال رمز إعادة التعيين إلى بريدك الإلكتروني',
                  style: TextStyle(color: Colors.white)),
              backgroundColor: AppTheme.successColor,
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result?['message'] ?? 'فشل إرسال رمز إعادة التعيين',
                  style: const TextStyle(color: Colors.white)),
              backgroundColor: AppTheme.errorColor,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('خطأ: ${e.toString()}',
                style: const TextStyle(color: Colors.white)),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _resetPassword() async {
    if (!_resetFormKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final result = await AuthService.resetPassword(
        _codeController.text.trim(),
        _passwordController.text,
      );

      if (result != null && result['success'] == true) {
        setState(() => _step = 2);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('تم تغيير كلمة المرور بنجاح!',
                  style: TextStyle(color: Colors.white)),
              backgroundColor: AppTheme.successColor,
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result?['message'] ?? 'فشل إعادة تعيين كلمة المرور',
                  style: const TextStyle(color: Colors.white)),
              backgroundColor: AppTheme.errorColor,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('خطأ: ${e.toString()}',
                style: const TextStyle(color: Colors.white)),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _codeController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Widget _buildGlassField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool obscureText = false,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.05),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
          ),
          child: TextFormField(
            controller: controller,
            style: const TextStyle(color: Colors.white),
            obscureText: obscureText,
            keyboardType: keyboardType,
            decoration: InputDecoration(
              labelText: label,
              labelStyle: TextStyle(color: Colors.white.withValues(alpha: 0.6)),
              prefixIcon: Icon(icon, color: AppTheme.primaryColor),
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text('استعادة كلمة المرور',
            style: TextStyle(
                fontFamily: 'Playfair Display', fontWeight: FontWeight.bold)),
        backgroundColor: Colors.black,
        elevation: 0,
        centerTitle: true,
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.lock_reset,
                size: 80,
                color: AppTheme.primaryColor,
              ),
              const SizedBox(height: 24),
              Text(
                _step == 2 ? 'تم بنجاح!' : 'إعادة تعيين كلمة المرور',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                  fontFamily: 'Playfair Display',
                ),
              ),
              const SizedBox(height: 16),

              // ── Step 0: Email Input ──
              if (_step == 0) ...[
                const Text(
                  'أدخل بريدك الإلكتروني وسنرسل لك رمز إعادة تعيين كلمة المرور.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 16, color: Colors.grey),
                ),
                const SizedBox(height: 40),
                Form(
                  key: _emailFormKey,
                  child: Column(
                    children: [
                      _buildGlassField(
                        controller: _emailController,
                        label: 'البريد الإلكتروني',
                        icon: Icons.email,
                        keyboardType: TextInputType.emailAddress,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'الرجاء إدخال البريد الإلكتروني';
                          }
                          if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$')
                              .hasMatch(value)) {
                            return 'الرجاء إدخال بريد إلكتروني صحيح';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 30),
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: ElevatedButton(
                          onPressed: _isLoading ? null : _sendResetCode,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primaryColor,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            disabledBackgroundColor: Colors.grey[800],
                          ),
                          child: _isLoading
                              ? const SpinningLoader(
                                  size: 24, color: Colors.black)
                              : const Text(
                                  'إرسال رمز التعيين',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.black,
                                  ),
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              // ── Step 1: Code + New Password ──
              if (_step == 1) ...[
                Text(
                  'تم إرسال رمز إلى ${_emailController.text}',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                      fontSize: 15, color: AppTheme.successColor),
                ),
                const SizedBox(height: 30),
                Form(
                  key: _resetFormKey,
                  child: Column(
                    children: [
                      _buildGlassField(
                        controller: _codeController,
                        label: 'رمز إعادة التعيين',
                        icon: Icons.pin,
                        keyboardType: TextInputType.number,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'الرجاء إدخال الرمز';
                          }
                          if (value.length != 6) {
                            return 'الرمز يتكون من 6 أرقام';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      _buildGlassField(
                        controller: _passwordController,
                        label: 'كلمة المرور الجديدة',
                        icon: Icons.lock,
                        obscureText: true,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'الرجاء إدخال كلمة المرور الجديدة';
                          }
                          if (value.length < 6) {
                            return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      _buildGlassField(
                        controller: _confirmPasswordController,
                        label: 'تأكيد كلمة المرور',
                        icon: Icons.lock_outline,
                        obscureText: true,
                        validator: (value) {
                          if (value != _passwordController.text) {
                            return 'كلمتا المرور غير متطابقتين';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 30),
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: ElevatedButton(
                          onPressed: _isLoading ? null : _resetPassword,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primaryColor,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            disabledBackgroundColor: Colors.grey[800],
                          ),
                          child: _isLoading
                              ? const SpinningLoader(
                                  size: 24, color: Colors.black)
                              : const Text(
                                  'تغيير كلمة المرور',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.black,
                                  ),
                                ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      TextButton(
                        onPressed: _isLoading ? null : _sendResetCode,
                        child: const Text('إعادة إرسال الرمز؟',
                            style: TextStyle(color: AppTheme.primaryColor)),
                      ),
                    ],
                  ),
                ),
              ],

              // ── Step 2: Success ──
              if (_step == 2) ...[
                const Icon(
                  Icons.check_circle,
                  size: 60,
                  color: AppTheme.successColor,
                ),
                const SizedBox(height: 16),
                const Text(
                  'تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 16, color: AppTheme.successColor),
                ),
                const SizedBox(height: 30),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'العودة لتسجيل الدخول',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                      ),
                    ),
                  ),
                ),
              ],

              const SizedBox(height: 20),
              if (_step != 2)
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('العودة لتسجيل الدخول',
                      style: TextStyle(color: AppTheme.primaryColor)),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

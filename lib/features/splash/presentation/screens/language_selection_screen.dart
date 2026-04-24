import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:hwasi_app/core/providers/settings_provider.dart';
import 'package:hwasi_app/core/themes/app_theme.dart';

class LanguageSelectionScreen extends StatefulWidget {
  const LanguageSelectionScreen({super.key});

  @override
  State<LanguageSelectionScreen> createState() =>
      _LanguageSelectionScreenState();
}

class _LanguageSelectionScreenState extends State<LanguageSelectionScreen> {
  // Use a simple variable instead of state for selection to avoid full rebuilds during scroll
  int _selectedIndex = 0;

  final List<Map<String, String>> _languages = [
    {'code': 'ar', 'name': 'العربية'},
    {'code': 'en', 'name': 'English'},
  ];

  Future<void> _onContinue() async {
    final languageCode = _languages[_selectedIndex]['code']!;
    if (!mounted) return;

    final settings = Provider.of<SettingsProvider>(context, listen: false);
    await settings.setLanguage(languageCode);

    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('isFirstLaunch', false);

    if (mounted) {
      context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            const Spacer(),
            // Header Icon with subtle pulse animation
            TweenAnimationBuilder<double>(
              tween: Tween(begin: 0.9, end: 1.0),
              duration: const Duration(seconds: 2),
              curve: Curves.easeInOut,
              builder: (context, value, child) {
                return Transform.scale(
                  scale: value,
                  child: Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.primaryColor.withValues(alpha: 0.2),
                          blurRadius: 20 * value,
                          spreadRadius: 5 * value,
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.language,
                      size: 48,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 32),

            // Title
            const Text(
              'Choose Your Language',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'اختر اللغة المفضلة',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 20,
                color: AppTheme.textSecondary,
                fontFamily: 'Cairo',
              ),
            ),

            const Spacer(),

            // High-Performance iOS Picker
            // Key to smoothness:
            // 1. Avoid setState in onSelectedItemChanged
            // 2. Use native magnification for "selected" look
            SizedBox(
              height: 250,
              child: CupertinoPicker(
                itemExtent: 50,
                magnification: 1.22, // iOS default
                useMagnifier:
                    true, // This creates the "lens" effect without rebuilding widgets
                diameterRatio: 1.1, // Standard iOS feel
                squeeze: 1.2,
                backgroundColor: Colors.transparent,
                onSelectedItemChanged: (int index) {
                  // Only update the variable, do NOT call setState()
                  // This prevents the whole screen from rebuilding 60 times a second
                  _selectedIndex = index;

                  // Haptic Feedback restored
                  HapticFeedback.selectionClick();
                },
                children: _languages.map((lang) {
                  return Center(
                    child: Text(
                      lang['name']!,
                      style: TextStyle(
                        fontSize: 21,
                        fontWeight: FontWeight.w500,
                        color: AppTheme.textPrimary,
                        fontFamily: lang['code'] == 'ar' ? 'Cairo' : null,
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),

            const Spacer(),

            // Continue Button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
              child: ElevatedButton(
                onPressed: _onContinue,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  minimumSize: const Size(double.infinity, 56),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  elevation: 0,
                ),
                child: const Text(
                  'Continue / متابعة',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    fontFamily: 'Cairo',
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

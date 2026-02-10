import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:hwasi_app/core/providers/settings_provider.dart';
import 'package:hwasi_app/core/themes/app_theme.dart';
import 'package:hwasi_app/features/main/presentation/screens/main_screen.dart';

class LanguageSelectionScreen extends StatelessWidget {
  const LanguageSelectionScreen({super.key});

  Future<void> _selectLanguage(
      BuildContext context, String languageCode) async {
    // 1. Set Language in Provider (persists to storage)
    if (!context.mounted) return;

    // 1. Set Language in Provider (persists to storage)
    // Note: Provider.of with listen:false is safe to call, but to be 100% safe
    // we can ensure context is mounted before using it if it was after an await.
    // However, here it is at the start. The issue reported might be a false positive
    // or related to how we use it.
    // Actually, linter says: "Don't use 'BuildContext's across async gaps".
    // The previous code had `Provider.of` at the top (safe) but `Navigator.of` at the bottom (guarded).
    // Let's refactor to be extra safe.

    final settings = Provider.of<SettingsProvider>(context, listen: false);
    await settings.setLanguage(languageCode);

    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('isFirstLaunch', false);

    if (context.mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (context) => const MainScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),
              // Logo or Icon
              Center(
                child: Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.language,
                    size: 64,
                    color: AppTheme.primaryColor,
                  ),
                ),
              ),
              const SizedBox(height: 40),

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
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                  fontFamily:
                      'Cairo', // Assuming Cairo or similar exists, fallback is fine
                ),
              ),

              const Spacer(),

              // English Button
              _buildLanguageButton(
                context,
                title: 'English',
                subtitle: 'United States',
                flagEmoji: '🇺🇸',
                onTap: () => _selectLanguage(context, 'en'),
              ),

              const SizedBox(height: 16),

              // Arabic Button
              _buildLanguageButton(
                context,
                title: 'العربية',
                subtitle: 'مصر',
                flagEmoji: '🇪🇬',
                onTap: () => _selectLanguage(context, 'ar'),
              ),

              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLanguageButton(
    BuildContext context, {
    required String title,
    required String subtitle,
    required String flagEmoji,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade200),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Text(
              flagEmoji,
              style: const TextStyle(fontSize: 32),
            ),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.arrow_forward_ios,
              color: AppTheme.textTertiary,
              size: 20,
            ),
          ],
        ),
      ),
    );
  }
}

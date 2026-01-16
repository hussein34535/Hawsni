import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:hawsni_app/core/providers/settings_provider.dart';
import 'package:hawsni_app/core/services/app_settings_service.dart';
import 'package:hawsni_app/features/onboarding/presentation/screens/onboarding_screen.dart';

class LanguageSelectionScreen extends StatefulWidget {
  const LanguageSelectionScreen({super.key});

  @override
  State<LanguageSelectionScreen> createState() =>
      _LanguageSelectionScreenState();
}

class _LanguageSelectionScreenState extends State<LanguageSelectionScreen> {
  String _selectedLanguage = 'en';

  final List<Map<String, String>> _languages = [
    {
      'code': 'en',
      'name': 'English',
      'nativeName': 'English',
    },
    {
      'code': 'ar',
      'name': 'Arabic',
      'nativeName': 'العربية',
    },
  ];

  void _selectLanguage(String languageCode) {
    setState(() {
      _selectedLanguage = languageCode;
    });
  }

  void _continueToOnboarding(BuildContext context) async {
    // Save the selected language using the settings provider
    final settingsProvider =
        Provider.of<SettingsProvider>(context, listen: false);
    await settingsProvider.setLanguage(_selectedLanguage);

    // Mark first launch as completed
    await AppSettingsService().setFirstLaunchCompleted();

    // Navigate to onboarding screen
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (context) => const OnboardingScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Colors.blue[600]!, Colors.purple[600]!],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // App logo and title
                const Icon(
                  Icons.language,
                  size: 80,
                  color: Colors.white,
                ),
                const SizedBox(height: 24),
                const Text(
                  'Select Language',
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'اختر اللغة',
                  style: TextStyle(
                    fontSize: 24,
                    color: Colors.white70,
                  ),
                ),
                const SizedBox(height: 48),

                // Language options
                ..._languages.map((language) => _buildLanguageOption(language)),

                const SizedBox(height: 48),

                // Continue button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => _continueToOnboarding(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: Colors.blue[700],
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 2,
                    ),
                    child: const Text(
                      'Continue',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLanguageOption(Map<String, String> language) {
    final bool isSelected = _selectedLanguage == language['code'];

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        tileColor: isSelected
            ? Colors.white.withValues(alpha: 0.9)
            : Colors.white.withValues(alpha: 0.2),
        onTap: () => _selectLanguage(language['code']!),
        leading: Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(25),
            border: Border.all(color: Colors.white, width: 2),
          ),
          child: Center(
            child: Text(
              language['code']!.toUpperCase(),
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: isSelected ? Colors.blue[700] : Colors.white,
              ),
            ),
          ),
        ),
        title: Text(
          language['name']!,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w500,
            color: isSelected ? Colors.blue[700] : Colors.white,
          ),
        ),
        subtitle: Text(
          language['nativeName']!,
          style: TextStyle(
            fontSize: 16,
            color: isSelected ? Colors.blue[400] : Colors.white70,
          ),
        ),
        trailing: isSelected
            ? const Icon(
                Icons.check_circle,
                color: Colors.green,
                size: 28,
              )
            : const Icon(
                Icons.circle_outlined,
                color: Colors.white70,
                size: 28,
              ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:hwasi_app/core/themes/app_theme.dart';
import 'package:hwasi_app/l10n/generated/app_localizations.dart';

class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    // For a real app, you might fetch this from an API or use a WebView.
    // Here we provide a standard template.

    return Scaffold(
      backgroundColor: AppTheme.scaffoldBackgroundColor,
      appBar: AppBar(
        title: Text(
          AppLocalizations.of(context)?.privacyPolicy ??
              'Privacy Policy', // Fallback if key missing
          style: AppTheme.textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.bold,
            color: AppTheme.textPrimary,
          ),
        ),
        centerTitle: true,
        backgroundColor: AppTheme.scaffoldBackgroundColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppTheme.textPrimary),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSection(
              title: "1. Introduction",
              content:
                  "Welcome to Hwasi. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website or use our mobile application.",
            ),
            _buildSection(
              title: "2. Data We Collect",
              content:
                  "We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:\n- Identity Data includes first name, last name, username or similar identifier.\n- Contact Data includes billing address, delivery address, email address and telephone numbers.",
            ),
            _buildSection(
              title: "3. How We Use Your Data",
              content:
                  "We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:\n- Where we need to perform the contract we are about to enter into or have entered into with you.\n- Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.",
            ),
            _buildSection(
              title: "4. Data Security",
              content:
                  "We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed.",
            ),
            _buildSection(
              title: "5. Contact Us",
              content:
                  "If you have any questions about this privacy policy or our privacy practices, please contact us at support@hwasi.com.",
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection({required String title, required String content}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24.0),
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
          const SizedBox(height: 8),
          Text(
            content,
            style: const TextStyle(
              fontSize: 15,
              height: 1.5,
              color: AppTheme.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

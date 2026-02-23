import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:hwasi_app/core/providers/settings_provider.dart';
import 'package:hwasi_app/core/themes/app_theme.dart';
import 'package:hwasi_app/l10n/generated/app_localizations.dart';
import 'package:hwasi_app/features/profile/presentation/screens/change_password_screen.dart';
import 'package:hwasi_app/features/profile/presentation/screens/privacy_policy_screen.dart';
import 'package:hwasi_app/features/checkout/presentation/screens/address_management_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _notificationsEnabled = true;
  bool _emailNotifications = true;
  bool _pushNotifications = true;

  @override
  Widget build(BuildContext context) {
    return Consumer<SettingsProvider>(
      builder: (context, settingsProvider, child) {
        return Scaffold(
          backgroundColor: AppTheme.scaffoldBackgroundColor,
          appBar: AppBar(
            title: Text(
              'Settings',
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
          body: ListView(
            padding: const EdgeInsets.all(24),
            children: [
              _buildSectionHeader('Notifications'),
              _buildSettingsIsland([
                _buildSwitchTile(
                  icon: Icons.notifications_outlined,
                  title: AppLocalizations.of(context)!.enableNotifications,
                  value: _notificationsEnabled,
                  onChanged: (val) =>
                      setState(() => _notificationsEnabled = val),
                ),
                _buildDivider(),
                _buildSwitchTile(
                  icon: Icons.email_outlined,
                  title: AppLocalizations.of(context)!.emailNotifications,
                  value: _emailNotifications,
                  onChanged: (val) => setState(() => _emailNotifications = val),
                ),
                _buildDivider(),
                _buildSwitchTile(
                  icon: Icons.message_outlined,
                  title: AppLocalizations.of(context)!.pushNotifications,
                  value: _pushNotifications,
                  onChanged: (val) => setState(() => _pushNotifications = val),
                ),
              ]),
              const SizedBox(height: 32),
              _buildSectionHeader('Preferences'),
              _buildSettingsIsland([
                _buildListTile(
                  icon: Icons.language,
                  title: AppLocalizations.of(context)!.language,
                  subtitle:
                      settingsProvider.language == 'en' ? 'English' : 'العربية',
                  onTap: () => _showLanguageDialog(context, settingsProvider),
                ),
                _buildDivider(),
                _buildListTile(
                  icon: Icons.attach_money,
                  title: AppLocalizations.of(context)!.currency,
                  subtitle: _getCurrencyName(settingsProvider.currency),
                  onTap: () => _showCurrencyDialog(context, settingsProvider),
                ),
              ]),
              const SizedBox(height: 32),
              _buildSectionHeader('Account'),
              _buildSettingsIsland([
                _buildListTile(
                  icon: Icons.lock_outline,
                  title: AppLocalizations.of(context)!.changePassword,
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (context) => const ChangePasswordScreen(),
                      ),
                    );
                  },
                ),
                _buildDivider(),
                _buildListTile(
                  icon: Icons.location_on_outlined,
                  title: AppLocalizations.of(context)!.shippingAddress,
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (context) => const AddressManagementScreen(),
                      ),
                    );
                  },
                ),
              ]),
              const SizedBox(height: 32),
              _buildSectionHeader('About'),
              _buildSettingsIsland([
                _buildListTile(
                  icon: Icons.info_outline,
                  title: AppLocalizations.of(context)!.aboutApp,
                  onTap: () {
                    showAboutDialog(
                      context: context,
                      applicationName: 'hwasi',
                      applicationVersion: '1.0.0',
                      applicationIcon: const Icon(Icons.shopping_bag,
                          size: 48, color: AppTheme.primaryColor),
                      children: [
                        const Text('Your Style, Your Choice'),
                        const SizedBox(height: 16),
                        const Text('An e-commerce app for fashion lovers.'),
                      ],
                    );
                  },
                ),
                _buildDivider(),
                _buildListTile(
                  icon: Icons.privacy_tip_outlined,
                  title: AppLocalizations.of(context)!.privacyPolicy,
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (context) => const PrivacyPolicyScreen(),
                      ),
                    );
                  },
                ),
              ]),
              const SizedBox(height: 40),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 8, bottom: 12),
      child: Text(
        title,
        style: AppTheme.textTheme.titleMedium?.copyWith(
          fontWeight: FontWeight.bold,
          color: AppTheme.textPrimary,
        ),
      ),
    );
  }

  Widget _buildSettingsIsland(List<Widget> children) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: AppTheme.shadowSoft,
      ),
      child: Column(
        children: children,
      ),
    );
  }

  Widget _buildSwitchTile({
    required IconData icon,
    required String title,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppTheme.primaryColor.withValues(alpha: 0.1),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: AppTheme.primaryColor, size: 20),
      ),
      title: Text(title,
          style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimary)),
      trailing: Switch(
        value: value,
        onChanged: onChanged,
        activeThumbColor: AppTheme.primaryColor,
        activeTrackColor: AppTheme.primaryColor.withValues(alpha: 0.3),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
    );
  }

  Widget _buildListTile({
    required IconData icon,
    required String title,
    String? subtitle,
    VoidCallback? onTap,
  }) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppTheme.primaryColor.withValues(alpha: 0.1),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: AppTheme.primaryColor, size: 20),
      ),
      title: Text(title,
          style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimary)),
      subtitle: subtitle != null
          ? Text(subtitle,
              style:
                  const TextStyle(fontSize: 14, color: AppTheme.textSecondary))
          : null,
      trailing: const Icon(Icons.arrow_forward_ios,
          size: 14, color: AppTheme.textTertiary),
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
    );
  }

  Widget _buildDivider() {
    return const Divider(
        height: 1, color: AppTheme.dividerColor, indent: 64, endIndent: 24);
  }

  void _showLanguageDialog(
      BuildContext context, SettingsProvider settingsProvider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: const Text('Select Language',
            style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildRadioTile('English', 'en', settingsProvider.language, (val) {
              settingsProvider.setLanguage(val!);
              Navigator.pop(context);
            }),
            _buildRadioTile('العربية', 'ar', settingsProvider.language, (val) {
              settingsProvider.setLanguage(val!);
              Navigator.pop(context);
            }),
          ],
        ),
      ),
    );
  }

  void _showCurrencyDialog(
      BuildContext context, SettingsProvider settingsProvider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: const Text('Select Currency',
            style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildRadioTile('USD (\$)', 'USD', settingsProvider.currency,
                (val) {
              settingsProvider.setCurrency(val!);
              Navigator.pop(context);
            }),
            _buildRadioTile('EUR (€)', 'EUR', settingsProvider.currency, (val) {
              settingsProvider.setCurrency(val!);
              Navigator.pop(context);
            }),
            _buildRadioTile('EGP (E£)', 'EGP', settingsProvider.currency,
                (val) {
              settingsProvider.setCurrency(val!);
              Navigator.pop(context);
            }),
          ],
        ),
      ),
    );
  }

  Widget _buildRadioTile(String title, String value, String groupValue,
      ValueChanged<String?> onChanged) {
    return RadioListTile<String>(
      title: Text(title,
          style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: AppTheme.textPrimary)),
      value: value,
      groupValue: groupValue,
      onChanged: onChanged,
      activeColor: AppTheme.primaryColor,
      contentPadding: EdgeInsets.zero,
    );
  }

  String _getCurrencyName(String currencyCode) {
    switch (currencyCode) {
      case 'USD':
        return 'USD (\$)';
      case 'EUR':
        return 'EUR (€)';
      case 'EGP':
        return 'EGP (E£)';
      default:
        return currencyCode;
    }
  }
}

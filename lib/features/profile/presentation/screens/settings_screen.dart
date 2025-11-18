import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:hawsni_app/core/providers/settings_provider.dart';
import 'package:hawsni_app/core/services/app_settings_service.dart';

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
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<SettingsProvider>(
      builder: (context, settingsProvider, child) {
        return Scaffold(
          appBar: AppBar(
            title: const Text(
              'Settings',
              style: TextStyle(
                fontWeight: FontWeight.bold,
              ),
            ),
            backgroundColor: Theme.of(context).appBarTheme.backgroundColor,
            elevation: 2,
          ),
          body: ListView(
            children: [
              // Notifications section
              _buildSectionHeader('Notifications'),
              _buildSwitchTile(
                icon: Icons.notifications_outlined,
                title: 'Enable Notifications',
                subtitle: 'Receive notifications about orders and offers',
                value: _notificationsEnabled,
                onChanged: (value) {
                  setState(() {
                    _notificationsEnabled = value;
                  });
                },
              ),
              _buildSwitchTile(
                icon: Icons.email_outlined,
                title: 'Email Notifications',
                subtitle: 'Receive updates via email',
                value: _emailNotifications,
                onChanged: (value) {
                  setState(() {
                    _emailNotifications = value;
                  });
                },
              ),
              _buildSwitchTile(
                icon: Icons.message_outlined,
                title: 'Push Notifications',
                subtitle: 'Receive push notifications',
                value: _pushNotifications,
                onChanged: (value) {
                  setState(() {
                    _pushNotifications = value;
                  });
                },
              ),

              const SizedBox(height: 16),

              // Preferences section
              _buildSectionHeader('Preferences'),
              _buildListTile(
                icon: Icons.language,
                title: 'Language',
                subtitle:
                    settingsProvider.language == 'en' ? 'English' : 'العربية',
                onTap: () => _showLanguageDialog(context, settingsProvider),
              ),
              _buildListTile(
                icon: Icons.attach_money,
                title: 'Currency',
                subtitle: _getCurrencyName(settingsProvider.currency),
                onTap: () => _showCurrencyDialog(context, settingsProvider),
              ),
              _buildSwitchTile(
                icon: Icons.dark_mode_outlined,
                title: 'Dark Mode',
                subtitle: 'Enable dark theme',
                value: settingsProvider.isDarkMode,
                onChanged: (value) {
                  settingsProvider.setDarkMode(value);
                },
              ),

              const SizedBox(height: 16),

              // Account section
              _buildSectionHeader('Account'),
              _buildListTile(
                icon: Icons.lock_outlined,
                title: 'Change Password',
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                        content: Text('Change password feature coming soon!')),
                  );
                },
              ),
              _buildListTile(
                icon: Icons.location_on_outlined,
                title: 'Shipping Address',
                subtitle: 'Manage delivery addresses',
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                        content: Text('Shipping address feature coming soon!')),
                  );
                },
              ),

              const SizedBox(height: 16),

              // About section
              _buildSectionHeader('About'),
              _buildListTile(
                icon: Icons.info_outline,
                title: 'About App',
                onTap: () {
                  showAboutDialog(
                    context: context,
                    applicationName: 'Hawsni',
                    applicationVersion: '1.0.0',
                    applicationIcon: const Icon(Icons.shopping_bag, size: 48),
                    children: [
                      const Text('Your Style, Your Choice'),
                      const SizedBox(height: 16),
                      const Text('An e-commerce app for fashion lovers.'),
                    ],
                  );
                },
              ),
              _buildListTile(
                icon: Icons.privacy_tip_outlined,
                title: 'Privacy Policy',
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                        content: Text('Privacy Policy coming soon!')),
                  );
                },
              ),
              _buildListTile(
                icon: Icons.description_outlined,
                title: 'Terms & Conditions',
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                        content: Text('Terms & Conditions coming soon!')),
                  );
                },
              ),

              const SizedBox(height: 24),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: Theme.of(context).textTheme.titleLarge?.color,
        ),
      ),
    );
  }

  Widget _buildSwitchTile({
    required IconData icon,
    required String title,
    String? subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Theme.of(context).brightness == Brightness.dark
              ? Colors.blue.withOpacity(0.3)
              : Colors.blue.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: Colors.blue[700]),
      ),
      title: Text(
        title,
        style: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w500,
          color: Theme.of(context).textTheme.titleMedium?.color,
        ),
      ),
      subtitle: subtitle != null
          ? Text(
              subtitle,
              style: TextStyle(
                fontSize: 14,
                color: Theme.of(context).textTheme.bodyMedium?.color,
              ),
            )
          : null,
      trailing: Switch(
        value: value,
        onChanged: onChanged,
        activeColor: Colors.blue,
      ),
    );
  }

  Widget _buildListTile({
    required IconData icon,
    required String title,
    String? subtitle,
    Widget? trailing,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Theme.of(context).brightness == Brightness.dark
              ? Colors.blue.withOpacity(0.3)
              : Colors.blue.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: Colors.blue[700]),
      ),
      title: Text(
        title,
        style: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w500,
          color: Theme.of(context).textTheme.titleMedium?.color,
        ),
      ),
      subtitle: subtitle != null
          ? Text(
              subtitle,
              style: TextStyle(
                fontSize: 14,
                color: Theme.of(context).textTheme.bodyMedium?.color,
              ),
            )
          : null,
      trailing: trailing ?? const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }

  void _showLanguageDialog(
      BuildContext context, SettingsProvider settingsProvider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Select Language'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            RadioListTile<String>(
              title: const Text('English'),
              value: 'en',
              groupValue: settingsProvider.language,
              onChanged: (value) {
                if (value != null) {
                  settingsProvider.setLanguage(value);
                  Navigator.pop(context);
                }
              },
            ),
            RadioListTile<String>(
              title: const Text('العربية'),
              value: 'ar',
              groupValue: settingsProvider.language,
              onChanged: (value) {
                if (value != null) {
                  settingsProvider.setLanguage(value);
                  Navigator.pop(context);
                }
              },
            ),
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
        title: const Text('Select Currency'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            RadioListTile<String>(
              title: const Text('USD (\$)'),
              value: 'USD',
              groupValue: settingsProvider.currency,
              onChanged: (value) {
                if (value != null) {
                  settingsProvider.setCurrency(value);
                  Navigator.pop(context);
                }
              },
            ),
            RadioListTile<String>(
              title: const Text('EUR (€)'),
              value: 'EUR',
              groupValue: settingsProvider.currency,
              onChanged: (value) {
                if (value != null) {
                  settingsProvider.setCurrency(value);
                  Navigator.pop(context);
                }
              },
            ),
            RadioListTile<String>(
              title: const Text('EGP (E£)'),
              value: 'EGP',
              groupValue: settingsProvider.currency,
              onChanged: (value) {
                if (value != null) {
                  settingsProvider.setCurrency(value);
                  Navigator.pop(context);
                }
              },
            ),
          ],
        ),
      ),
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
        return '$currencyCode';
    }
  }
}

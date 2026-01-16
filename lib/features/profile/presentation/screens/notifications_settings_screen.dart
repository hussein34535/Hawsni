import 'package:flutter/material.dart';
import 'package:hawsni_app/core/themes/app_theme.dart';
import 'package:hawsni_app/l10n/generated/app_localizations.dart';

class NotificationsSettingsScreen extends StatefulWidget {
  const NotificationsSettingsScreen({super.key});

  @override
  State<NotificationsSettingsScreen> createState() =>
      _NotificationsSettingsScreenState();
}

class _NotificationsSettingsScreenState
    extends State<NotificationsSettingsScreen> {
  // Local state for UI toggle simulation if Provider doesn't have these fields yet
  // Ideally these should be in SettingsProvider
  bool _notificationsEnabled = true;
  bool _emailNotifications = true;
  bool _pushNotifications = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('Notifications',
            style: TextStyle(
                fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
        backgroundColor: AppTheme.scaffoldBackgroundColor,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppTheme.textPrimary),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: AppTheme.shadowSoft,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildSwitchTile(
                icon: Icons.notifications_active_outlined,
                title: AppLocalizations.of(context)!.enableNotifications,
                value: _notificationsEnabled,
                onChanged: (val) => setState(() => _notificationsEnabled = val),
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
            ],
          ),
        ),
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
        activeColor: AppTheme.primaryColor,
        activeTrackColor: AppTheme.primaryColor.withValues(alpha: 0.3),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
    );
  }

  Widget _buildDivider() {
    return const Divider(
        height: 1, color: AppTheme.dividerColor, indent: 64, endIndent: 24);
  }
}

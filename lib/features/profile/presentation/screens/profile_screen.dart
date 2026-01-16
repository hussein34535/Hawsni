import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:hawsni_app/core/services/auth_service.dart';
import 'package:hawsni_app/core/themes/app_theme.dart';
import 'package:hawsni_app/features/auth/presentation/screens/login_screen.dart';
import 'package:hawsni_app/features/orders/presentation/screens/orders_screen.dart';
import 'package:hawsni_app/features/wishlist/presentation/screens/wishlist_screen.dart';
import 'package:hawsni_app/features/profile/presentation/screens/settings_screen.dart';
import 'package:hawsni_app/features/profile/presentation/screens/profile_details_screen.dart';
import 'package:hawsni_app/features/coupons/presentation/screens/coupons_screen.dart';
import 'package:hawsni_app/core/services/api_service.dart';
import 'package:hawsni_app/features/checkout/presentation/screens/address_management_screen.dart';
import 'package:hawsni_app/core/widgets/spinning_loader.dart';
import 'package:provider/provider.dart';
import 'package:hawsni_app/core/providers/settings_provider.dart';
import 'package:hawsni_app/features/profile/presentation/screens/notifications_settings_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _userProfile;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadUserProfile();
  }

  Future<void> _loadUserProfile() async {
    if (AuthService.isGuest) return; // Don't load profile for guests

    setState(() {
      _userProfile = AuthService.userData;
    });

    try {
      final profile = await ApiService.getUserProfile();
      if (profile != null && mounted) {
        setState(() {
          _userProfile = profile;
        });
      }
    } catch (e) {
      print('Error refreshing user profile: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    // Check for Guest Mode
    if (AuthService.isGuest) {
      return Scaffold(
        backgroundColor: AppTheme.scaffoldBackgroundColor,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: AppTheme.shadowSoft,
                  ),
                  child: const Icon(
                    Icons.person_outline,
                    size: 64,
                    color: AppTheme.primaryColor,
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'Welcome Guest',
                  style: AppTheme.textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Sign in to access your profile, orders, and more.',
                  textAlign: TextAlign.center,
                  style: AppTheme.textTheme.bodyMedium?.copyWith(
                    color: AppTheme.textSecondary,
                  ),
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => const LoginScreen(),
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(32),
                      ),
                      elevation: 0,
                    ),
                    child: const Text(
                      'LOGIN / SIGN UP',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                        letterSpacing: 1,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Settings Section for Guests (Language/Currency)
                _buildSectionTitle('App Settings'),
                Consumer<SettingsProvider>(
                  builder: (context, settingsProvider, child) {
                    return _buildMenuIsland([
                      _buildMenuItem(
                        icon: Icons.language,
                        title: 'Language',
                        subtitle: settingsProvider.language == 'en'
                            ? 'English'
                            : 'العربية',
                        onTap: () =>
                            _showLanguageDialog(context, settingsProvider),
                      ),
                      _buildDivider(),
                      _buildMenuItem(
                        icon: Icons.attach_money,
                        title: 'Currency',
                        subtitle: _getCurrencyName(settingsProvider.currency),
                        onTap: () =>
                            _showCurrencyDialog(context, settingsProvider),
                      ),
                    ]);
                  },
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppTheme.scaffoldBackgroundColor,
      body: _isLoading
          ? const Center(child: SpinningLoader())
          : CustomScrollView(
              slivers: [
                // Curved Header with Profile Info
                SliverToBoxAdapter(
                  child: Stack(
                    clipBehavior: Clip.none,
                    children: [
                      // Green Curved Background
                      Container(
                        padding: EdgeInsets.fromLTRB(24,
                            MediaQuery.of(context).padding.top + 20, 24, 80),
                        decoration: const BoxDecoration(
                          color: AppTheme.primaryColor,
                          borderRadius: BorderRadius.vertical(
                              bottom: Radius.circular(32)),
                        ),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'My Profile',
                                  style: AppTheme.textTheme.headlineMedium
                                      ?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.settings_outlined,
                                      color: Colors.white),
                                  onPressed: () async {
                                    await Navigator.of(context).push(
                                      MaterialPageRoute(
                                          builder: (context) =>
                                              const SettingsScreen()),
                                    );
                                    _loadUserProfile();
                                  },
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),

                      // Floating Profile Card
                      Positioned(
                        top: 100,
                        left: 24,
                        right: 24,
                        child: Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: AppTheme.shadowFloating,
                          ),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(2),
                                decoration: const BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: AppTheme.primaryColor,
                                ),
                                child: CircleAvatar(
                                  radius: 36,
                                  backgroundColor: Colors.white,
                                  backgroundImage:
                                      _userProfile?['avatar_url'] != null
                                          ? NetworkImage(
                                              _userProfile!['avatar_url'])
                                          : null,
                                  child: _userProfile?['avatar_url'] == null
                                      ? const Icon(Icons.person,
                                          size: 36,
                                          color: AppTheme.textTertiary)
                                      : null,
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      _userProfile?['name'] ?? 'John Doe',
                                      style: AppTheme.textTheme.titleLarge
                                          ?.copyWith(
                                        fontWeight: FontWeight.bold,
                                        color: AppTheme.textPrimary,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      _userProfile?['email'] ??
                                          'john.doe@email.com',
                                      style: AppTheme.textTheme.bodyMedium
                                          ?.copyWith(
                                        color: AppTheme.textSecondary,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 12, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: AppTheme.primaryColor
                                            .withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        'Premium Member',
                                        style: AppTheme.textTheme.labelSmall
                                            ?.copyWith(
                                          color: AppTheme.primaryColor,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Spacing for the floating card overlap
                const SliverToBoxAdapter(child: SizedBox(height: 80)),

                // Menu Islands
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  sliver: SliverList(
                    delegate: SliverChildListDelegate([
                      _buildSectionTitle('Account'),
                      _buildMenuIsland([
                        _buildMenuItem(
                          icon: Icons.person_outline,
                          title: 'Profile Details',
                          onTap: () async {
                            await Navigator.push(
                                context,
                                MaterialPageRoute(
                                    builder: (_) =>
                                        const ProfileDetailsScreen()));
                            _loadUserProfile();
                          },
                        ),
                        _buildDivider(),
                        _buildMenuItem(
                          icon: Icons.lock_outline,
                          title: 'Change Password',
                          onTap: () {}, // TODO: Implement Change Password
                        ),
                        _buildDivider(),
                        _buildMenuItem(
                          icon: Icons.notifications_outlined,
                          title: 'Notifications',
                          onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) =>
                                      const NotificationsSettingsScreen())),
                        ),
                      ]),
                      const SizedBox(height: 24),
                      _buildSectionTitle('App Settings'),
                      Consumer<SettingsProvider>(
                        builder: (context, settingsProvider, child) {
                          return _buildMenuIsland([
                            _buildMenuItem(
                              icon: Icons.language,
                              title: 'Language',
                              subtitle: settingsProvider.language == 'en'
                                  ? 'English'
                                  : 'العربية',
                              onTap: () => _showLanguageDialog(
                                  context, settingsProvider),
                            ),
                            _buildDivider(),
                            _buildMenuItem(
                              icon: Icons.attach_money,
                              title: 'Currency',
                              subtitle:
                                  _getCurrencyName(settingsProvider.currency),
                              onTap: () => _showCurrencyDialog(
                                  context, settingsProvider),
                            ),
                          ]);
                        },
                      ),
                      const SizedBox(height: 24),
                      _buildSectionTitle('My Activity'),
                      _buildMenuIsland([
                        _buildMenuItem(
                          icon: Icons.shopping_bag_outlined,
                          title: 'My Orders',
                          onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) => const OrdersScreen())),
                        ),
                        _buildDivider(),
                        _buildMenuItem(
                          icon: Icons.favorite_border,
                          title: 'Wishlist',
                          onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) => const WishlistScreen())),
                        ),
                        _buildDivider(),
                        _buildMenuItem(
                          icon: Icons.location_on_outlined,
                          title: 'Addresses',
                          onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) =>
                                      const AddressManagementScreen())),
                        ),
                        _buildDivider(),
                        _buildMenuItem(
                          icon: Icons.local_offer_outlined,
                          title: 'My Coupons',
                          onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) => const CouponsScreen())),
                        ),
                      ]),
                      const SizedBox(height: 24),
                      _buildMenuIsland([
                        _buildMenuItem(
                          icon: Icons.logout,
                          title: 'Logout',
                          textColor: AppTheme.errorColor,
                          iconColor: AppTheme.errorColor,
                          onTap: _handleLogout,
                          showArrow: false,
                        ),
                      ]),
                      const SizedBox(height: 32),
                    ]),
                  ),
                ),
              ],
            ),
    );
  }

  Future<void> _handleLogout() async {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title:
            const Text('Logout', style: TextStyle(fontWeight: FontWeight.bold)),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: Colors.black)),
          ),
          TextButton(
            onPressed: () async {
              await AuthService.logout();
              if (mounted) {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (context) => const LoginScreen()),
                  (route) => false,
                );
              }
            },
            child: const Text('Logout',
                style: TextStyle(color: AppTheme.errorColor)),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
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

  Widget _buildMenuIsland(List<Widget> children) {
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

  Widget _buildMenuItem({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    Color? textColor,
    Color? iconColor,
    bool showArrow = true,
    String? subtitle,
  }) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: (iconColor ?? AppTheme.primaryColor).withOpacity(0.1),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: iconColor ?? AppTheme.primaryColor, size: 20),
      ),
      title: Text(
        title,
        style: TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 16,
          color: textColor ?? AppTheme.textPrimary,
        ),
      ),
      subtitle: subtitle != null
          ? Text(subtitle,
              style:
                  const TextStyle(fontSize: 14, color: AppTheme.textSecondary))
          : null,
      trailing: showArrow
          ? const Icon(Icons.arrow_forward_ios,
              size: 14, color: AppTheme.textTertiary)
          : null,
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
    );
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

  Widget _buildDivider() {
    return const Divider(
      height: 1,
      indent: 64,
      endIndent: 24,
      color: AppTheme.dividerColor,
    );
  }
}

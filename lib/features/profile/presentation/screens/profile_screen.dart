import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:hwasi_app/core/services/auth_service.dart';
import 'package:hwasi_app/core/themes/app_theme.dart';
import 'package:hwasi_app/features/auth/presentation/screens/login_screen.dart';
import 'package:hwasi_app/features/orders/presentation/screens/orders_screen.dart';
import 'package:hwasi_app/features/wishlist/presentation/screens/wishlist_screen.dart';
import 'package:hwasi_app/features/profile/presentation/screens/settings_screen.dart';
import 'package:hwasi_app/features/profile/presentation/screens/profile_details_screen.dart';
import 'package:hwasi_app/features/coupons/presentation/screens/coupons_screen.dart';
import 'package:hwasi_app/core/services/api_service.dart';
import 'package:hwasi_app/features/checkout/presentation/screens/address_management_screen.dart';
import 'package:hwasi_app/core/widgets/spinning_loader.dart';
import 'package:provider/provider.dart';
import 'package:hwasi_app/core/providers/settings_provider.dart';
import 'package:hwasi_app/features/profile/presentation/screens/notifications_settings_screen.dart';
import 'package:hwasi_app/features/profile/presentation/screens/change_password_screen.dart';
import 'package:hwasi_app/l10n/generated/app_localizations.dart';
import 'package:hwasi_app/features/orders/presentation/screens/guest_track_order_screen.dart';
import 'package:hwasi_app/core/utils/responsive_layout.dart';

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
    final l10n = AppLocalizations.of(context)!;

    if (ResponsiveLayout.isDesktop(context)) {
      return _buildDesktopLayout(context, l10n);
    }

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
                  l10n.welcomeGuest,
                  style: AppTheme.textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  l10n.accessProfileMessage,
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
                    child: Text(
                      l10n.loginSignup,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                        letterSpacing: 1,
                      ),
                    ),
                  ),
                ),
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: OutlinedButton(
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => const GuestTrackOrderScreen(),
                        ),
                      );
                    },
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: AppTheme.primaryColor),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(32),
                      ),
                      elevation: 0,
                    ),
                    child: const Text(
                      'Track Order',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primaryColor,
                        letterSpacing: 1,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Settings Section for Guests (Language/Currency)
                _buildSectionTitle(l10n.appSettings),
                Consumer<SettingsProvider>(
                  builder: (context, settingsProvider, child) {
                    return _buildMenuIsland([
                      _buildMenuItem(
                        icon: Icons.language,
                        title: l10n.language,
                        subtitle: settingsProvider.language == 'en'
                            ? 'English'
                            : 'العربية',
                        onTap: () =>
                            _showLanguageDialog(context, settingsProvider),
                      ),
                      _buildDivider(),
                      _buildMenuItem(
                        icon: Icons.attach_money,
                        title: l10n.currency,
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
                                  l10n.myProfile,
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
                                            .withValues(alpha: 0.1),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        l10n.premiumMember,
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
                      _buildSectionTitle(l10n.account),
                      _buildMenuIsland([
                        _buildMenuItem(
                          icon: Icons.person_outline,
                          title: l10n.profileDetails,
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
                          title: l10n.changePassword,
                          onTap: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (context) =>
                                    const ChangePasswordScreen(),
                              ),
                            );
                          },
                        ),
                        _buildDivider(),
                        _buildMenuItem(
                          icon: Icons.notifications_outlined,
                          title: l10n.notifications,
                          onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) =>
                                      const NotificationsSettingsScreen())),
                        ),
                      ]),
                      const SizedBox(height: 24),
                      _buildSectionTitle(l10n.appSettings),
                      Consumer<SettingsProvider>(
                        builder: (context, settingsProvider, child) {
                          return _buildMenuIsland([
                            _buildMenuItem(
                              icon: Icons.language,
                              title: l10n.language,
                              subtitle: settingsProvider.language == 'en'
                                  ? 'English'
                                  : 'العربية',
                              onTap: () => _showLanguageDialog(
                                  context, settingsProvider),
                            ),
                            _buildDivider(),
                            _buildMenuItem(
                              icon: Icons.attach_money,
                              title: l10n.currency,
                              subtitle:
                                  _getCurrencyName(settingsProvider.currency),
                              onTap: () => _showCurrencyDialog(
                                  context, settingsProvider),
                            ),
                          ]);
                        },
                      ),
                      const SizedBox(height: 24),
                      _buildSectionTitle(l10n.myActivity),
                      _buildMenuIsland([
                        _buildMenuItem(
                          icon: Icons.shopping_bag_outlined,
                          title: l10n.myOrders,
                          onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) => const OrdersScreen())),
                        ),
                        _buildDivider(),
                        _buildMenuItem(
                          icon: Icons.favorite_border,
                          title: l10n.wishlist,
                          onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) => const WishlistScreen())),
                        ),
                        _buildDivider(),
                        _buildMenuItem(
                          icon: Icons.location_on_outlined,
                          title: l10n.addresses,
                          onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) =>
                                      const AddressManagementScreen())),
                        ),
                        _buildDivider(),
                        _buildMenuItem(
                          icon: Icons.local_offer_outlined,
                          title: l10n.myCoupons,
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
                          title: l10n.logout,
                          textColor: AppTheme.errorColor,
                          iconColor: AppTheme.errorColor,
                          onTap: () => _handleLogout(context),
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

  Future<void> _handleLogout(BuildContext context) async {
    final l10n = AppLocalizations.of(context)!;
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: Text(l10n.logout,
            style: const TextStyle(fontWeight: FontWeight.bold)),
        content: Text(l10n.confirmLogout),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child:
                Text(l10n.cancel, style: const TextStyle(color: Colors.black)),
          ),
          TextButton(
            onPressed: () async {
              await AuthService.logout();
              if (context.mounted) {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (context) => const LoginScreen()),
                  (route) => false,
                );
              }
            },
            child: Text(l10n.logout,
                style: const TextStyle(color: AppTheme.errorColor)),
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
          color: (iconColor ?? AppTheme.primaryColor).withValues(alpha: 0.1),
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
    final l10n = AppLocalizations.of(context)!;
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: Text(l10n.selectLanguage, // Used key
            style: const TextStyle(
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
    final l10n = AppLocalizations.of(context)!;
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: Text(l10n.selectCurrency, // Used key
            style: const TextStyle(
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

  Widget _buildDesktopLayout(BuildContext context, AppLocalizations l10n) {
    if (AuthService.isGuest) {
      return Scaffold(
        backgroundColor: AppTheme.scaffoldBackgroundColor,
        body: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 600),
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
                        boxShadow: AppTheme.shadowSoft),
                    child: const Icon(Icons.person_outline,
                        size: 64, color: AppTheme.primaryColor),
                  ),
                  const SizedBox(height: 24),
                  Text(l10n.welcomeGuest,
                      style: AppTheme.textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary)),
                  const SizedBox(height: 8),
                  Text(l10n.accessProfileMessage,
                      textAlign: TextAlign.center,
                      style: AppTheme.textTheme.bodyMedium
                          ?.copyWith(color: AppTheme.textSecondary)),
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: () => Navigator.of(context).push(
                          MaterialPageRoute(
                              builder: (context) => const LoginScreen())),
                      style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryColor,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(32)),
                          elevation: 0),
                      child: Text(l10n.loginSignup,
                          style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                              letterSpacing: 1)),
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: OutlinedButton(
                      onPressed: () => Navigator.of(context).push(
                          MaterialPageRoute(
                              builder: (context) =>
                                  const GuestTrackOrderScreen())),
                      style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: AppTheme.primaryColor),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(32)),
                          elevation: 0),
                      child: const Text('Track Order',
                          style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.primaryColor,
                              letterSpacing: 1)),
                    ),
                  ),
                  const SizedBox(height: 24),
                  _buildSectionTitle(l10n.appSettings),
                  Consumer<SettingsProvider>(
                    builder: (context, settingsProvider, child) {
                      return _buildMenuIsland([
                        _buildMenuItem(
                          icon: Icons.language,
                          title: l10n.language,
                          subtitle: settingsProvider.language == 'en'
                              ? 'English'
                              : 'العربية',
                          onTap: () =>
                              _showLanguageDialog(context, settingsProvider),
                        ),
                        _buildDivider(),
                        _buildMenuItem(
                          icon: Icons.attach_money,
                          title: l10n.currency,
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
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppTheme.scaffoldBackgroundColor,
      body: _isLoading
          ? const Center(child: SpinningLoader())
          : Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1200),
                child: Padding(
                  padding: const EdgeInsets.all(32.0),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Left Column: Profile Card
                      Expanded(
                        flex: 1,
                        child: Column(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(32),
                              decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(24),
                                  boxShadow: AppTheme.shadowFloating),
                              child: Column(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(4),
                                    decoration: const BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: AppTheme.primaryColor),
                                    child: CircleAvatar(
                                      radius: 64,
                                      backgroundColor: Colors.white,
                                      backgroundImage:
                                          _userProfile?['avatar_url'] != null
                                              ? NetworkImage(
                                                  _userProfile!['avatar_url'])
                                              : null,
                                      child: _userProfile?['avatar_url'] == null
                                          ? const Icon(Icons.person,
                                              size: 64,
                                              color: AppTheme.textTertiary)
                                          : null,
                                    ),
                                  ),
                                  const SizedBox(height: 24),
                                  Text(_userProfile?['name'] ?? 'John Doe',
                                      style: AppTheme.textTheme.headlineSmall
                                          ?.copyWith(
                                              fontWeight: FontWeight.bold,
                                              color: AppTheme.textPrimary)),
                                  const SizedBox(height: 8),
                                  Text(
                                      _userProfile?['email'] ??
                                          'john.doe@email.com',
                                      style: AppTheme.textTheme.bodyMedium
                                          ?.copyWith(
                                              color: AppTheme.textSecondary)),
                                  const SizedBox(height: 16),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 16, vertical: 8),
                                    decoration: BoxDecoration(
                                        color: AppTheme.primaryColor
                                            .withValues(alpha: 0.1),
                                        borderRadius:
                                            BorderRadius.circular(12)),
                                    child: Text(l10n.premiumMember,
                                        style: AppTheme.textTheme.labelMedium
                                            ?.copyWith(
                                                color: AppTheme.primaryColor,
                                                fontWeight: FontWeight.bold)),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 32),
                      // Right Column: Settings
                      Expanded(
                        flex: 2,
                        child: SingleChildScrollView(
                          child: Column(
                            children: [
                              _buildSectionTitle(l10n.account),
                              _buildMenuIsland([
                                _buildMenuItem(
                                  icon: Icons.person_outline,
                                  title: l10n.profileDetails,
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
                                  title: l10n.changePassword,
                                  onTap: () => Navigator.of(context).push(
                                      MaterialPageRoute(
                                          builder: (context) =>
                                              const ChangePasswordScreen())),
                                ),
                                _buildDivider(),
                                _buildMenuItem(
                                  icon: Icons.notifications_outlined,
                                  title: l10n.notifications,
                                  onTap: () => Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                          builder: (_) =>
                                              const NotificationsSettingsScreen())),
                                ),
                              ]),
                              const SizedBox(height: 24),
                              _buildSectionTitle(l10n.appSettings),
                              Consumer<SettingsProvider>(
                                builder: (context, settingsProvider, child) {
                                  return _buildMenuIsland([
                                    _buildMenuItem(
                                      icon: Icons.language,
                                      title: l10n.language,
                                      subtitle:
                                          settingsProvider.language == 'en'
                                              ? 'English'
                                              : 'العربية',
                                      onTap: () => _showLanguageDialog(
                                          context, settingsProvider),
                                    ),
                                    _buildDivider(),
                                    _buildMenuItem(
                                      icon: Icons.attach_money,
                                      title: l10n.currency,
                                      subtitle: _getCurrencyName(
                                          settingsProvider.currency),
                                      onTap: () => _showCurrencyDialog(
                                          context, settingsProvider),
                                    ),
                                  ]);
                                },
                              ),
                              const SizedBox(height: 24),
                              _buildSectionTitle(l10n.myActivity),
                              _buildMenuIsland([
                                _buildMenuItem(
                                  icon: Icons.shopping_bag_outlined,
                                  title: l10n.myOrders,
                                  onTap: () => Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                          builder: (_) =>
                                              const OrdersScreen())),
                                ),
                                _buildDivider(),
                                _buildMenuItem(
                                  icon: Icons.favorite_border,
                                  title: l10n.wishlist,
                                  onTap: () => Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                          builder: (_) =>
                                              const WishlistScreen())),
                                ),
                                _buildDivider(),
                                _buildMenuItem(
                                  icon: Icons.location_on_outlined,
                                  title: l10n.addresses,
                                  onTap: () => Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                          builder: (_) =>
                                              const AddressManagementScreen())),
                                ),
                                _buildDivider(),
                                _buildMenuItem(
                                  icon: Icons.local_offer_outlined,
                                  title: l10n.myCoupons,
                                  onTap: () => Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                          builder: (_) =>
                                              const CouponsScreen())),
                                ),
                              ]),
                              const SizedBox(height: 24),
                              _buildMenuIsland([
                                _buildMenuItem(
                                  icon: Icons.logout,
                                  title: l10n.logout,
                                  textColor: AppTheme.errorColor,
                                  iconColor: AppTheme.errorColor,
                                  onTap: () => _handleLogout(context),
                                  showArrow: false,
                                ),
                              ]),
                              const SizedBox(height: 32),
                            ],
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
}

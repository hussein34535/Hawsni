import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:hwasi_app/core/widgets/spinning_loader.dart';
import 'package:hwasi_app/core/themes/app_theme.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _navigateToHome();
  }

  _navigateToHome() async {
    // await Future.delayed(const Duration(seconds: 3)); // Removed for speed

    final prefs = await SharedPreferences.getInstance();

    if (!mounted) return;

    final isFirstLaunch = prefs.getBool('isFirstLaunch') ?? true;

    if (isFirstLaunch) {
      context.go('/language');
    } else {
      // Always navigate to MainScreen (Guest is default)
      context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.surfaceColor, // Pure white
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Emerald loader
            const SpinningLoader(
              size: 80,
              color: AppTheme.primaryColor,
            ),
            const SizedBox(height: 40),
            // Bold brand name
            Text(
              'HWASI',
              style: TextStyle(
                fontSize: 56,
                fontWeight: FontWeight.w900,
                color: AppTheme.primaryColor,
                letterSpacing: 2,
              ),
            ),
            const SizedBox(height: 12),
            // Simple tagline
            Text(
              'Your Style, Your Way',
              style: TextStyle(
                fontSize: 16,
                color: AppTheme.textSecondary,
                letterSpacing: 1,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

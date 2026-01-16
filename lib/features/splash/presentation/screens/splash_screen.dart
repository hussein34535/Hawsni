import 'package:flutter/material.dart';
import 'package:hawsni_app/core/services/auth_service.dart';
import 'package:hawsni_app/core/widgets/spinning_loader.dart';
import 'package:hawsni_app/features/auth/presentation/screens/login_screen.dart';
import 'package:hawsni_app/features/main/presentation/screens/main_screen.dart';
import 'package:hawsni_app/core/themes/app_theme.dart';

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
    await Future.delayed(const Duration(seconds: 3));

    if (mounted) {
      // Always navigate to MainScreen (Guest is default)
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => const MainScreen(),
        ),
      );
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
              'HAWSNI',
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

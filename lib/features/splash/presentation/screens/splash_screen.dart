import 'package:flutter/material.dart';
import 'package:hawsni_app/core/services/auth_service.dart';
import 'package:hawsni_app/core/widgets/spinning_loader.dart';
import 'package:hawsni_app/features/auth/presentation/screens/login_screen.dart';
import 'package:hawsni_app/features/main/presentation/screens/main_screen.dart';

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
      // Check if user is authenticated
      final isAuthenticated = AuthService.isAuthenticated();

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) =>
              isAuthenticated ? const MainScreen() : const LoginScreen(),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const SpinningLoader(size: 100),
            const SizedBox(height: 30),
            const Text(
              'HAWSNI',
              style: TextStyle(
                fontSize: 40,
                fontWeight: FontWeight.bold,
                color: Color(0xFFD4AF37), // Gold
                letterSpacing: 5,
                fontFamily: 'Playfair Display',
              ),
            ),
            const SizedBox(height: 10),
            Text(
              'Luxury Redefined',
              style: TextStyle(
                fontSize: 16,
                color: Colors.white.withOpacity(0.7),
                letterSpacing: 2,
                fontFamily: 'Poppins',
              ),
            ),
          ],
        ),
      ),
    );
  }
}

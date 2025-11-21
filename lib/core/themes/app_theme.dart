import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Colors - Midnight Gold Luxury
  static const Color primaryColor = Color(0xFFD4AF37); // Gold
  static const Color scaffoldBackgroundColor = Color(0xFF000000); // Deep Black
  static const Color surfaceColor =
      Color(0xFF121212); // Slightly lighter black for cards
  static const Color errorColor = Color(0xFFCF6679);
  static const Color successColor = Color(0xFF03DAC6);
  static const Color textPrimary = Colors.white;
  static const Color textSecondary = Color(0xFFB0B0B0); // Light Grey

  // Text Styles
  static final TextTheme _textTheme = GoogleFonts.playfairDisplayTextTheme(
    const TextTheme(
      displayLarge: TextStyle(
          fontSize: 36, fontWeight: FontWeight.bold, color: primaryColor),
      displayMedium: TextStyle(
          fontSize: 28, fontWeight: FontWeight.bold, color: textPrimary),
      displaySmall: TextStyle(
          fontSize: 24, fontWeight: FontWeight.w600, color: textPrimary),
      headlineMedium: TextStyle(
          fontSize: 20, fontWeight: FontWeight.w600, color: textPrimary),
      bodyLarge:
          TextStyle(fontSize: 16, color: textPrimary, fontFamily: 'Poppins'),
      bodyMedium:
          TextStyle(fontSize: 14, color: textSecondary, fontFamily: 'Poppins'),
      labelLarge: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          color: Colors.black,
          fontFamily: 'Poppins'),
    ),
  );

  // Glassmorphism Decoration
  static BoxDecoration glassDecoration = BoxDecoration(
    color: Colors.white.withOpacity(0.05),
    borderRadius: BorderRadius.circular(16),
    border: Border.all(color: Colors.white.withOpacity(0.1)),
    boxShadow: [
      BoxShadow(
        color: Colors.black.withOpacity(0.2),
        blurRadius: 10,
        spreadRadius: 1,
      ),
    ],
  );

  static final ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    primaryColor: primaryColor,
    scaffoldBackgroundColor: scaffoldBackgroundColor,
    colorScheme: const ColorScheme.dark(
      primary: primaryColor,
      secondary: primaryColor,
      surface: surfaceColor,
      error: errorColor,
      onPrimary: Colors.black,
      onSecondary: Colors.black,
      onSurface: textPrimary,
    ),
    textTheme: _textTheme,
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      centerTitle: true,
      iconTheme: IconThemeData(color: textPrimary),
      titleTextStyle: TextStyle(
        color: primaryColor,
        fontSize: 24,
        fontWeight: FontWeight.bold,
        fontFamily: 'Playfair Display',
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryColor,
        foregroundColor: Colors.black,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(30),
        ),
        textStyle: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.bold,
          fontFamily: 'Poppins',
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: primaryColor,
        side: const BorderSide(color: primaryColor, width: 1.5),
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(30),
        ),
        textStyle: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.bold,
          fontFamily: 'Poppins',
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: surfaceColor,
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: primaryColor, width: 1),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: errorColor),
      ),
      labelStyle: const TextStyle(color: textSecondary),
      hintStyle: TextStyle(color: textSecondary.withOpacity(0.5)),
    ),
    cardTheme: CardThemeData(
      color: surfaceColor,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Colors.white.withOpacity(0.05)),
      ),
      margin: const EdgeInsets.all(8),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor:
          Colors.black, // Will be transparent/glass in implementation
      selectedItemColor: primaryColor,
      unselectedItemColor: Colors.grey,
      type: BottomNavigationBarType.fixed,
      elevation: 0,
    ),
  );

  // We only support dark theme for this concept
  static final ThemeData lightTheme = darkTheme;
}

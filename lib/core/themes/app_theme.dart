import 'package:flutter/material.dart';

class AppTheme {
  // Colors - VUMNIA Light Theme
  static const Color primaryColor =
      Color(0xFF1B4D3E); // Emerald Green (Primary Action)
  static const Color secondaryColor = Color(0xFFF5F5F5); // Light Gray
  static const Color accentColor = Color(0xFFD4AF37); // Gold (Secondary Accent)
  static const Color scaffoldBackgroundColor = Color(0xFFFAFAFA); // Off-White
  static const Color surfaceColor = Colors.white; // White for cards
  static const Color errorColor = Color(0xFFCF6679);
  static const Color successColor = Color(0xFF03DAC6);

  // Text Colors
  static const Color textPrimary = Color(0xFF1A1A1A); // Black (Main Text)
  static const Color textSecondary = Color(0xFF757575); // Dark Grey
  static const Color textTertiary = Color(0xFFBDBDBD); // Light Grey

  // Borders & Dividers
  static const Color borderColor = Color(0xFFEEEEEE); // Light border
  static const Color dividerColor = Color(0xFFEEEEEE); // Light divider

  // Radius values
  static const double radiusSmall = 12.0;
  static const double radiusMedium = 16.0;
  static const double radiusLarge = 20.0;
  static const double radiusXLarge = 24.0;

  // Shadows
  static List<BoxShadow> get shadowSoft => [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.08), // Increased from 0.05
          blurRadius: 10,
          offset: const Offset(0, 4),
        ),
      ];

  static List<BoxShadow> get shadowMedium => [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.12), // Increased from 0.08
          blurRadius: 16,
          offset: const Offset(0, 6),
        ),
      ];

  static List<BoxShadow> get shadowFloating => [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.15), // Increased from 0.1
          blurRadius: 24,
          offset: const Offset(0, 8),
        ),
      ];

  // Card Decoration
  static BoxDecoration get cardDecoration => BoxDecoration(
        color: surfaceColor,
        borderRadius: BorderRadius.circular(radiusLarge),
        boxShadow: shadowSoft,
      );

  // Text Styles
  static final TextTheme textTheme = const TextTheme(
    displayLarge: TextStyle(
        fontSize: 28, // Reduced from 36
        fontWeight: FontWeight.bold,
        color: primaryColor,
        fontFamily: 'Cairo', // Use local font
        fontStyle: FontStyle.normal),
    displayMedium: TextStyle(
        fontSize: 24, // Reduced from 28
        fontWeight: FontWeight.bold,
        color: textPrimary,
        fontFamily: 'Cairo', // Use local font
        fontStyle: FontStyle.normal),
    displaySmall: TextStyle(
        fontSize: 20, // Reduced from 24
        fontWeight: FontWeight.w600,
        color: textPrimary,
        fontFamily: 'Cairo', // Use local font
        fontStyle: FontStyle.normal),
    headlineMedium: TextStyle(
        fontSize: 18, // Reduced from 20
        fontWeight: FontWeight.w600,
        color: textPrimary,
        fontFamily: 'Cairo', // Use local font
        fontStyle: FontStyle.normal),
    bodyLarge: TextStyle(
        fontSize: 15, // Reduced from 16
        color: textPrimary,
        fontFamily: 'Cairo', // Use local font
        fontStyle: FontStyle.normal),
    bodyMedium: TextStyle(
        fontSize: 13, // Reduced from 14
        color: textSecondary,
        fontFamily: 'Cairo', // Use local font
        fontStyle: FontStyle.normal),
    labelLarge: TextStyle(
        fontSize: 13, // Reduced from 14
        fontWeight: FontWeight.bold,
        color: Colors.white,
        fontFamily: 'Cairo', // Use local font
        fontStyle: FontStyle.normal),
  );

  static final ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    primaryColor: primaryColor,
    scaffoldBackgroundColor: scaffoldBackgroundColor,
    colorScheme: const ColorScheme.light(
      primary: primaryColor,
      secondary: accentColor,
      surface: surfaceColor,
      error: errorColor,
      onPrimary: Colors.white,
      onSecondary: Colors.white,
      onSurface: textPrimary,
    ),
    textTheme: textTheme,
    fontFamily: 'Cairo', // Set Cairo as the default global font
    appBarTheme: const AppBarTheme(
      backgroundColor: scaffoldBackgroundColor,
      elevation: 0,
      centerTitle: true,
      iconTheme: IconThemeData(color: textPrimary),
      titleTextStyle: TextStyle(
        color: textPrimary,
        fontSize: 20,
        fontWeight: FontWeight.bold,
        fontFamily: 'Cairo',
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(30),
        ),
        textStyle: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.bold,
          fontFamily: 'Cairo',
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
          fontFamily: 'Cairo',
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey[400]!),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey[400]!),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: primaryColor, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: errorColor),
      ),
      labelStyle: const TextStyle(
        color: textSecondary,
        fontWeight: FontWeight.w500,
      ),
      floatingLabelStyle: const TextStyle(
        color: primaryColor,
        fontWeight: FontWeight.bold,
      ),
      hintStyle: TextStyle(
        color: textSecondary.withValues(alpha: 0.5),
        fontStyle: FontStyle.normal,
      ),
    ),
    cardTheme: CardThemeData(
      color: surfaceColor,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: borderColor),
      ),
      margin: const EdgeInsets.all(8),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: Colors.white,
      selectedItemColor: primaryColor,
      unselectedItemColor: textTertiary,
      type: BottomNavigationBarType.fixed,
      elevation: 8,
    ),
    pageTransitionsTheme: const PageTransitionsTheme(
      builders: {
        TargetPlatform.android: FadeUpwardsPageTransitionsBuilder(),
        TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
        TargetPlatform.windows: FadeUpwardsPageTransitionsBuilder(),
        TargetPlatform.macOS: FadeUpwardsPageTransitionsBuilder(),
        TargetPlatform.linux: FadeUpwardsPageTransitionsBuilder(),
      },
    ),
  );

  // Dark theme is not supported in this design language anymore
  static final ThemeData darkTheme = lightTheme;
}

class WebScrollBehavior extends ScrollBehavior {
  @override
  ScrollPhysics getScrollPhysics(BuildContext context) {
    return const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics());
  }
}

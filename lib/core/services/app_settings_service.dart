import 'package:shared_preferences/shared_preferences.dart';

class AppSettingsService {
  static const String _languageKey = 'app_language';
  static const String _currencyKey = 'app_currency';
  static const String _darkModeKey = 'dark_mode';
  static const String _firstLaunchKey = 'first_launch';

  // Default values
  static const String defaultLanguage = 'en';
  static const String defaultCurrency = 'EGP'; // Egyptian Pound
  static const bool defaultDarkMode = false;

  static final AppSettingsService _instance = AppSettingsService._internal();

  factory AppSettingsService() => _instance;

  AppSettingsService._internal();

  Future<void> setFirstLaunchCompleted() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_firstLaunchKey, false);
  }

  Future<bool> isFirstLaunch() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_firstLaunchKey) ?? true;
  }

  Future<void> setLanguage(String languageCode) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_languageKey, languageCode);
  }

  Future<String> getLanguage() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_languageKey) ?? defaultLanguage;
  }

  Future<void> setCurrency(String currencyCode) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_currencyKey, currencyCode);
  }

  Future<String> getCurrency() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_currencyKey) ?? defaultCurrency;
  }

  Future<void> setDarkMode(bool isDarkMode) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_darkModeKey, isDarkMode);
  }

  Future<bool> getDarkMode() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_darkModeKey) ?? defaultDarkMode;
  }
}

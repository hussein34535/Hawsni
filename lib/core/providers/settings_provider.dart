import 'package:flutter/material.dart';
import 'package:hawsni_app/core/services/app_settings_service.dart';

class SettingsProvider with ChangeNotifier {
  bool _isDarkMode = AppSettingsService.defaultDarkMode;
  String _language = AppSettingsService.defaultLanguage;
  String _currency = AppSettingsService.defaultCurrency;

  bool get isDarkMode => _isDarkMode;
  String get language => _language;
  String get currency => _currency;

  SettingsProvider() {
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    _language = await AppSettingsService().getLanguage();
    _currency = await AppSettingsService().getCurrency();
    _isDarkMode = await AppSettingsService().getDarkMode();
    notifyListeners();
  }

  Future<void> setDarkMode(bool value) async {
    _isDarkMode = value;
    await AppSettingsService().setDarkMode(value);
    notifyListeners();
  }

  Future<void> setLanguage(String value) async {
    _language = value;
    await AppSettingsService().setLanguage(value);
    notifyListeners();
  }

  Future<void> setCurrency(String value) async {
    _currency = value;
    await AppSettingsService().setCurrency(value);
    notifyListeners();
  }
}

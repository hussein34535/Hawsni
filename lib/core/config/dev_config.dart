import 'package:hawsni_app/core/config/app_config.dart';

class DevConfig implements AppConfig {
  @override
  String get baseUrl => 'http://192.168.100.8:5000/api';
}
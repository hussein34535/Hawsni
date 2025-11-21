import 'package:hawsni_app/core/config/app_config.dart';

class ProdConfig implements AppConfig {
  @override
  String get baseUrl => 'https://hawsnibackend.vercel.app/api';
}
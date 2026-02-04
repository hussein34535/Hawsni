import 'package:hwasi_app/core/config/app_config.dart';

class ProdConfig implements AppConfig {
  @override
  String get baseUrl => 'https://hwasibackend.vercel.app/api';
}

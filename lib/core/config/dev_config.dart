import 'package:hwasi_app/core/config/app_config.dart';

class DevConfig implements AppConfig {
  @override
  // 10.0.2.2 is the Android emulator's alias for host machine's localhost
  String get baseUrl => 'http://10.0.2.2:5000/api';
}

import 'package:hwasi_app/core/config/app_config.dart';

class ProdConfig implements AppConfig {
  @override
  String get baseUrl => 'https://hwasibackend.vercel.app/api';

  @override
  String get supabaseUrl => 'https://bdgwkcenzmeuvwmcjhfi.supabase.co';

  @override
  String get supabaseAnonKey => 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkZ3drY2Vuem1ldXZ3bWNqaGZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NjMyMDYsImV4cCI6MjA3ODQzOTIwNn0.Vf5GkDYYRu1enu1NX44cSC1-1SI1gS_-wdKPdyk7TJg';
}

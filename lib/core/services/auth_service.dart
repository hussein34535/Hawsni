import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class AuthService {
  static const String baseUrl = 'https://hawsnibackend.vercel.app/api';
  static String? _token;
  static Map<String, dynamic>? _userData;

  // Get token
  static String? get token => _token;

  // Get user data
  static Map<String, dynamic>? get userData => _userData;

  // Get user name
  static String? get userName => _userData?['name'];

  // Get user email
  static String? get userEmail => _userData?['email'];

  // Get user id
  static String? get userId => _userData?['id'];

  // Login user
  static Future<Map<String, dynamic>?> login(
      String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'email': email,
          'password': password,
        }),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        _token = data['token'];
        _userData = data['user'];

        // Save token and user data to shared preferences
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', _token!);
        await prefs.setString('userData', json.encode(_userData));

        print('Login successful, token saved: $_token');
        print('User data saved: $_userData');
        return data;
      } else {
        final errorData = json.decode(response.body);
        throw Exception(errorData['message'] ?? 'Login failed');
      }
    } catch (e) {
      print('Error logging in: $e');
      return null;
    }
  }

  // Register user
  static Future<Map<String, dynamic>?> register(
      String name, String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'name': name,
          'email': email,
          'password': password,
        }),
      );

      if (response.statusCode == 201) {
        final data = json.decode(response.body);
        _token = data['token'];
        _userData = data['user'];

        // Save token and user data to shared preferences
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', _token!);
        await prefs.setString('userData', json.encode(_userData));

        print('Registration successful, token saved: $_token');
        print('User data saved: $_userData');
        return data;
      } else {
        final errorData = json.decode(response.body);
        throw Exception(errorData['message'] ?? 'Registration failed');
      }
    } catch (e) {
      print('Error registering: $e');
      return null;
    }
  }

  // Forgot password
  static Future<Map<String, dynamic>?> forgotPassword(String email) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/forgot-password'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'email': email,
        }),
      );

      final data = json.decode(response.body);

      if (response.statusCode == 200) {
        print('Password reset email sent successfully');
        return data;
      } else {
        throw Exception(data['message'] ?? 'Failed to send reset email');
      }
    } catch (e) {
      print('Error sending password reset email: $e');
      return null;
    }
  }

  // Reset password
  static Future<Map<String, dynamic>?> resetPassword(
      String token, String password) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/auth/reset-password/$token'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'password': password,
        }),
      );

      final data = json.decode(response.body);

      if (response.statusCode == 200) {
        print('Password reset successfully');
        return data;
      } else {
        throw Exception(data['message'] ?? 'Failed to reset password');
      }
    } catch (e) {
      print('Error resetting password: $e');
      return null;
    }
  }

  // Logout user
  static Future<void> logout() async {
    _token = null;
    _userData = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('userData');
    print('User logged out, token and data cleared');
  }

  // Load token and user data from shared preferences
  static Future<void> loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('token');
    final userDataString = prefs.getString('userData');

    if (userDataString != null) {
      try {
        _userData = json.decode(userDataString);
      } catch (e) {
        print('Error decoding user data: $e');
        _userData = null;
      }
    }

    print('Token loaded from storage: $_token');
    print('User data loaded from storage: $_userData');
  }

  // Check if user is authenticated
  static bool isAuthenticated() {
    print('Checking authentication status: ${_token != null}');
    return _token != null;
  }
}

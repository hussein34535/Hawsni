import 'dart:convert';
import 'dart:io';
import 'dart:async';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class AuthService {
  static const String baseUrl = 'https://hawsnibackend.vercel.app/api';
  static String? _token;
  static Map<String, dynamic>? _userData;

  // Auth State Stream
  static final StreamController<bool> _authStateController =
      StreamController<bool>.broadcast();
  static Stream<bool> get authStateChanges => _authStateController.stream;

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
        _authStateController.add(true);
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
      String name, String email, String password, String phone) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'name': name,
          'email': email,
          'password': password,
          'phone': phone,
        }),
      );

      if (response.statusCode == 201) {
        final data = json.decode(response.body);
        // Note: Token might not be returned here if OTP is required
        if (data['token'] != null) {
          _token = data['token'];
          _userData = data['user'];
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('token', _token!);
          await prefs.setString('userData', json.encode(_userData));
          _authStateController.add(true);
        }
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

  // Verify OTP
  static Future<Map<String, dynamic>?> verifyOtp(
      String email, String code) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/verify-otp'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'email': email,
          'code': code,
        }),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        _token = data['token'];
        _userData = data['user'];

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', _token!);
        await prefs.setString('userData', json.encode(_userData));
        _authStateController.add(true);

        return data;
      } else {
        final errorData = json.decode(response.body);
        throw Exception(errorData['message'] ?? 'OTP verification failed');
      }
    } catch (e) {
      print('Error verifying OTP: $e');
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

  // Upload profile picture
  static Future<Map<String, dynamic>?> uploadProfilePicture(
      File imageFile) async {
    try {
      var request = http.MultipartRequest(
        'POST',
        Uri.parse('$baseUrl/users/profile/avatar'),
      );

      request.headers.addAll({
        'Authorization': 'Bearer $_token',
      });

      request.files.add(
        await http.MultipartFile.fromPath(
          'avatar',
          imageFile.path,
        ),
      );

      var streamedResponse = await request.send();
      var response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        // Update local user data with new avatar URL
        if (data['user'] != null) {
          _userData = data['user'];
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('userData', json.encode(_userData));
        }
        return data;
      } else {
        final errorData = json.decode(response.body);
        throw Exception(errorData['message'] ?? 'Failed to upload image');
      }
    } catch (e) {
      print('Error uploading profile picture: $e');
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
    _authStateController.add(false);
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
    _authStateController.add(_token != null);
  }

  // Check if user is authenticated
  static bool isAuthenticated() {
    print('Checking authentication status: ${_token != null}');
    return _token != null;
  }
}

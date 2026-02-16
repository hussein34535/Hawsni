import 'dart:convert';
import 'dart:io';
import 'dart:async';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class AuthService {
  static const String baseUrl = 'https://hwasibackend.vercel.app/api';
  static String? _token;
  static Map<String, dynamic>? _userData;

  // Auth State Stream
  static final StreamController<bool> _authStateController =
      StreamController<bool>.broadcast();
  static Stream<bool> get authStateChanges => _authStateController.stream;

  // Get token
  static String? get token => _token;

  static Future<String?> getToken() async {
    // If token is in memory, return it.
    // If not, maybe fetch from SharedPreferences (if you have persistence logic)
    // For now returning the memory token.
    return _token;
  }

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
        _isGuest = false; // Clear guest flag

        // Save token and user data to shared preferences
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', _token!);
        await prefs.setString('userData', json.encode(_userData));
        await prefs.remove('isGuest'); // Remove guest persistence

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
      rethrow; // Rethrow to let UI handle it
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
          _isGuest = false;
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('token', _token!);
          await prefs.setString('userData', json.encode(_userData));
          await prefs.remove('isGuest');
          _authStateController.add(true);
        }
        return data;
      } else {
        final errorData = json.decode(response.body);
        throw Exception(errorData['message'] ?? 'Registration failed');
      }
    } catch (e) {
      print('Error registering: $e');
      rethrow; // Rethrow to let UI handle it
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
        _isGuest = false;

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', _token!);
        await prefs.setString('userData', json.encode(_userData));
        await prefs.remove('isGuest');
        _authStateController.add(true);

        return data;
      } else {
        final errorData = json.decode(response.body);
        throw Exception(errorData['message'] ?? 'OTP verification failed');
      }
    } catch (e) {
      print('Error verifying OTP: $e');
      rethrow;
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

  // Reset password with code
  static Future<Map<String, dynamic>?> resetPassword(
      String code, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/reset-password'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'code': code,
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

  // Change password
  static Future<Map<String, dynamic>?> changePassword(
      String oldPassword, String newPassword) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/change-password'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_token',
        },
        body: json.encode({
          'oldPassword': oldPassword,
          'newPassword': newPassword,
        }),
      );

      final data = json.decode(response.body);

      if (response.statusCode == 200) {
        print('Password changed successfully');
        return data;
      } else {
        throw Exception(data['message'] ?? 'Failed to change password');
      }
    } catch (e) {
      print('Error changing password: $e');
      rethrow;
    }
  }

  // Logout user
  static Future<void> logout() async {
    _token = null;
    _userData = null;

    // Switch to guest mode
    _isGuest = true;

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('userData');
    await prefs.setBool('isGuest', true); // Persist guest mode

    print('User logged out, switched to guest mode');
    _authStateController
        .add(false); // Notify app of logout (optional, depending on nav)
    // Actually, if we switch to guest, maybe we should emit true?
    // But usually logout implies clearing state.
    // If the app listens to this to show LoginScreen, then false is correct.
    // If the app allows guest usage, it might check isGuest.
  }

  // Load token and user data from shared preferences
  static Future<void> loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('token');
    final userDataString = prefs.getString('userData');
    _isGuest = prefs.getBool('isGuest') ?? false;

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
    print('Guest Mode: $_isGuest');

    // Auth is true if we have a token OR we are a guest
    if (_token == null && !_isGuest) {
      print('No token found, defaulting to Guest Mode');
      _isGuest = true;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('isGuest', true);
    }

    _authStateController.add(true); // Always return true (Guest or User)
  }

  // Check if user is authenticated
  static bool isAuthenticated() {
    print('Checking authentication status: ${_token != null}');
    return _token != null;
  }

  // --- GUEST MODE LOGIC ---
  static bool _isGuest = false;
  static bool get isGuest => _isGuest;

  static Future<void> guestLogin() async {
    _isGuest = true;
    _token = null; // No token for guests
    _userData = null;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('isGuest', true);
    // Ensure we don't have old tokens confusing things
    await prefs.remove('token');
    await prefs.remove('userData');

    _authStateController
        .add(true); // Treat as "logged in" for navigation purposes
    print('Guest login successful');
  }

  static Future<void> loadGuestStatus() async {
    final prefs = await SharedPreferences.getInstance();
    _isGuest = prefs.getBool('isGuest') ?? false;
    if (_isGuest) {
      print('Guest session loaded');
      // If guest, we might want to emit true to authState?
      // Usually loadToken handles the initial state.
      // We can combine logic in loadToken.
    }
  }
}

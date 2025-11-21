import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:hawsni_app/core/services/api_service.dart';
import 'package:hawsni_app/core/services/auth_service.dart';
import 'package:hawsni_app/features/reviews/data/models/review_model.dart';

class ReviewService {
  Future<List<ReviewModel>> getProductReviews(String productId) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiService.baseUrl}/reviews/product/$productId'),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> reviewsJson = data['reviews'] ?? [];
        return reviewsJson.map((json) => ReviewModel.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load reviews');
      }
    } catch (e) {
      print('Error fetching reviews: $e');
      throw e;
    }
  }

  Future<ReviewModel> createReview(
      String productId, double rating, String comment) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiService.baseUrl}/reviews'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${AuthService.token}',
        },
        body: json.encode({
          'productId': productId,
          'rating': rating,
          'comment': comment,
        }),
      );

      if (response.statusCode == 201) {
        final data = json.decode(response.body);
        return ReviewModel.fromJson(data['review']);
      } else {
        final errorData = json.decode(response.body);
        throw Exception(errorData['message'] ?? 'Failed to create review');
      }
    } catch (e) {
      print('Error creating review: $e');
      throw e;
    }
  }
}

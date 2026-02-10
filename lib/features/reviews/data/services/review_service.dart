import 'package:hwasi_app/core/services/api_service.dart';
import 'package:hwasi_app/features/reviews/data/models/review_model.dart';

class ReviewService {
  Future<List<ReviewModel>> getProductReviews(String productId) async {
    try {
      final data = await ApiService.get('/reviews/product/$productId',
          includeAuth: false);
      final List<dynamic> reviewsJson = data['reviews'] ?? [];
      return reviewsJson.map((json) => ReviewModel.fromJson(json)).toList();
    } catch (e) {
      print('Error fetching reviews: $e');
      rethrow;
    }
  }

  Future<ReviewModel> createReview(
      String productId, double rating, String comment) async {
    try {
      final data = await ApiService.post(
        '/reviews',
        {
          'productId': productId,
          'rating': rating,
          'comment': comment,
        },
      );
      return ReviewModel.fromJson(data['review']);
    } catch (e) {
      print('Error creating review: $e');
      rethrow;
    }
  }

  Future<void> deleteReview(String reviewId) async {
    try {
      await ApiService.delete('/reviews/$reviewId');
    } catch (e) {
      print('Error deleting review: $e');
      rethrow;
    }
  }
}

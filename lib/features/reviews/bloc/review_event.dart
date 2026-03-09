import 'package:equatable/equatable.dart';
// import 'package:hwasi_app/features/reviews/bloc/review_state.dart';

abstract class ReviewEvent extends Equatable {
  const ReviewEvent();

  @override
  List<Object> get props => [];
}

class LoadReviews extends ReviewEvent {
  final String productId;

  const LoadReviews(this.productId);

  @override
  List<Object> get props => [productId];
}

class AddReview extends ReviewEvent {
  final String productId;
  final double rating;
  final String comment;
  final List<String> images;

  const AddReview({
    required this.productId,
    required this.rating,
    required this.comment,
    this.images = const [],
  });

  @override
  List<Object> get props => [productId, rating, comment, images];
}

class DeleteReview extends ReviewEvent {
  final String reviewId;
  final String productId;

  const DeleteReview({required this.reviewId, required this.productId});

  @override
  List<Object> get props => [reviewId, productId];
}

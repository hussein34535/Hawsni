import 'package:equatable/equatable.dart';
import 'package:hwasi_app/features/reviews/data/models/review_model.dart';

abstract class ReviewState extends Equatable {
  const ReviewState();

  @override
  List<Object> get props => [];
}

class ReviewInitial extends ReviewState {}

class ReviewLoading extends ReviewState {}

class ReviewLoaded extends ReviewState {
  final List<ReviewModel> reviews;

  const ReviewLoaded(this.reviews);

  @override
  List<Object> get props => [reviews];
}

class ReviewError extends ReviewState {
  final String message;

  const ReviewError(this.message);

  @override
  List<Object> get props => [message];
}

class ReviewAdding extends ReviewState {}

class ReviewAdded extends ReviewState {
  final ReviewModel review;

  const ReviewAdded(this.review);

  @override
  List<Object> get props => [review];
}

import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hwasi_app/features/reviews/bloc/review_event.dart';
import 'package:hwasi_app/features/reviews/bloc/review_state.dart';
import 'package:hwasi_app/features/reviews/data/services/review_service.dart';

class ReviewBloc extends Bloc<ReviewEvent, ReviewState> {
  final ReviewService _reviewService;

  ReviewBloc(this._reviewService) : super(ReviewInitial()) {
    on<LoadReviews>(_onLoadReviews);
    on<AddReview>(_onAddReview);
    on<DeleteReview>(_onDeleteReview);
  }

  Future<void> _onLoadReviews(
      LoadReviews event, Emitter<ReviewState> emit) async {
    emit(ReviewLoading());
    try {
      final reviews = await _reviewService.getProductReviews(event.productId);
      emit(ReviewLoaded(reviews));
    } catch (e) {
      emit(ReviewError(e.toString()));
    }
  }

  Future<void> _onAddReview(AddReview event, Emitter<ReviewState> emit) async {
    try {
      await _reviewService.createReview(
          event.productId, event.rating, event.comment,
          images: event.images);
      add(LoadReviews(event.productId));
    } catch (e) {
      emit(ReviewError(e.toString()));
    }
  }

  Future<void> _onDeleteReview(
      DeleteReview event, Emitter<ReviewState> emit) async {
    try {
      await _reviewService.deleteReview(event.reviewId);
      add(LoadReviews(event.productId));
    } catch (e) {
      emit(ReviewError(e.toString()));
    }
  }
}

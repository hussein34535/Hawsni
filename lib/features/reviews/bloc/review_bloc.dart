import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hawsni_app/features/reviews/bloc/review_event.dart';
import 'package:hawsni_app/features/reviews/bloc/review_state.dart';
import 'package:hawsni_app/features/reviews/data/services/review_service.dart';

class ReviewBloc extends Bloc<ReviewEvent, ReviewState> {
  final ReviewService _reviewService;

  ReviewBloc(this._reviewService) : super(ReviewInitial()) {
    on<LoadReviews>(_onLoadReviews);
    on<AddReview>(_onAddReview);
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
    // We don't want to replace the list with loading state if we are just adding
    // But for simplicity, let's just emit adding state or handle it in UI
    // emit(ReviewAdding()); // This might clear the list if UI listens to it exclusively

    try {
      await _reviewService.createReview(
          event.productId, event.rating, event.comment);
      // Reload reviews to get the fresh list including the new one (and updated user info)
      add(LoadReviews(event.productId));
    } catch (e) {
      emit(ReviewError(e.toString()));
      // After error, we might want to reload or revert to loaded state
      // For now, error state is terminal until reload
    }
  }
}

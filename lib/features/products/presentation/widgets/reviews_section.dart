import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import 'package:hawsni_app/core/themes/app_theme.dart';
import 'package:hawsni_app/features/reviews/bloc/review_bloc.dart';
import 'package:hawsni_app/features/reviews/bloc/review_event.dart';
import 'package:hawsni_app/features/reviews/bloc/review_state.dart';
import 'package:intl/intl.dart';

class ReviewsSection extends StatelessWidget {
  final String productId;

  const ReviewsSection({super.key, required this.productId});

  void _showAddReviewDialog(BuildContext context) {
    final commentController = TextEditingController();
    double rating = 5.0;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (dialogContext) => Padding(
        padding:
            EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.9),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            border: Border(
                top: BorderSide(color: AppTheme.primaryColor.withOpacity(0.3))),
          ),
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text("Write a Review",
                  style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      fontFamily: 'Playfair Display')),
              const SizedBox(height: 20),
              Center(
                child: RatingBar.builder(
                  initialRating: 5,
                  minRating: 1,
                  direction: Axis.horizontal,
                  itemCount: 5,
                  itemPadding: const EdgeInsets.symmetric(horizontal: 4.0),
                  itemBuilder: (context, _) =>
                      const Icon(Icons.star, color: AppTheme.primaryColor),
                  onRatingUpdate: (value) => rating = value,
                ),
              ),
              const SizedBox(height: 20),
              TextField(
                controller: commentController,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: "Share your thoughts...",
                  hintStyle: const TextStyle(color: Colors.grey),
                  filled: true,
                  fillColor: Colors.white.withOpacity(0.1),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(dialogContext);
                    context.read<ReviewBloc>().add(AddReview(
                          productId: productId,
                          rating: rating,
                          comment: commentController.text,
                        ));
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryColor,
                    padding: const EdgeInsets.symmetric(vertical: 15),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text("Submit Review",
                      style: TextStyle(
                          color: Colors.black, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<ReviewBloc, ReviewState>(
      listener: (context, state) {
        if (state is ReviewError) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
              content: Text(state.message,
                  style: const TextStyle(color: Colors.white)),
              backgroundColor: AppTheme.errorColor));
        }
      },
      builder: (context, state) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text("Reviews",
                    style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                        fontFamily: 'Playfair Display')),
                TextButton.icon(
                  onPressed: () => _showAddReviewDialog(context),
                  icon: const Icon(Icons.edit,
                      size: 16, color: AppTheme.primaryColor),
                  label: const Text("Write Review",
                      style: TextStyle(color: AppTheme.primaryColor)),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (state is ReviewLoading)
              const Center(
                  child:
                      CircularProgressIndicator(color: AppTheme.primaryColor))
            else if (state is ReviewLoaded)
              if (state.reviews.isEmpty)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(20.0),
                    child: Text("No reviews yet. Be the first!",
                        style: TextStyle(color: Colors.grey)),
                  ),
                )
              else
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: state.reviews.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final review = state.reviews[index];
                    return ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.05),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                                color: Colors.white.withOpacity(0.1)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  CircleAvatar(
                                    backgroundColor:
                                        AppTheme.primaryColor.withOpacity(0.2),
                                    child: Text(
                                      (review.userName.isNotEmpty
                                              ? review.userName
                                              : 'U')[0]
                                          .toUpperCase(),
                                      style: const TextStyle(
                                          color: AppTheme.primaryColor,
                                          fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                            review.userName.isNotEmpty
                                                ? review.userName
                                                : 'User',
                                            style: const TextStyle(
                                                fontWeight: FontWeight.bold,
                                                color: Colors.white)),
                                        Text(
                                          DateFormat('MMM d, yyyy')
                                              .format(review.createdAt),
                                          style: const TextStyle(
                                              color: Colors.grey, fontSize: 12),
                                        ),
                                      ],
                                    ),
                                  ),
                                  RatingBarIndicator(
                                    rating: review.rating,
                                    itemBuilder: (context, index) => const Icon(
                                        Icons.star,
                                        color: AppTheme.primaryColor),
                                    itemCount: 5,
                                    itemSize: 14.0,
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Text(review.comment,
                                  style:
                                      const TextStyle(color: Colors.white70)),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                )
            else
              const Center(child: Text("Something went wrong"))
          ],
        );
      },
    );
  }
}

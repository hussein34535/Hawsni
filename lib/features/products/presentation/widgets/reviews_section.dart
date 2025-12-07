import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import 'package:hawsni_app/core/themes/app_theme.dart';
import 'package:hawsni_app/features/reviews/bloc/review_bloc.dart';
import 'package:hawsni_app/features/reviews/bloc/review_state.dart';
import 'package:intl/intl.dart';
import 'package:hawsni_app/features/reviews/presentation/widgets/add_review_sheet.dart';

class ReviewsSection extends StatelessWidget {
  final String productId;

  const ReviewsSection({super.key, required this.productId});

  void _showAddReviewDialog(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => AddReviewSheet(productId: productId),
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
                Text("Reviews",
                    style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                        fontFamily: 'Playfair Display')),
                TextButton.icon(
                  onPressed: () => _showAddReviewDialog(context),
                  icon: const Icon(Icons.edit,
                      size: 16, color: AppTheme.primaryColor),
                  label: Text("Write Review",
                      style: TextStyle(color: AppTheme.primaryColor)),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (state is ReviewLoading)
              Center(
                  child:
                      CircularProgressIndicator(color: AppTheme.primaryColor))
            else if (state is ReviewLoaded)
              if (state.reviews.isEmpty)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(20.0),
                    child: Text("No reviews yet. Be the first!",
                        style: TextStyle(color: AppTheme.textSecondary)),
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
                    return Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppTheme.borderColor),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.05),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          )
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
                                backgroundColor:
                                    AppTheme.primaryColor.withOpacity(0.1),
                                child: Text(
                                  (review.userName.isNotEmpty
                                          ? review.userName
                                          : 'U')[0]
                                      .toUpperCase(),
                                  style: TextStyle(
                                      color: AppTheme.primaryColor,
                                      fontWeight: FontWeight.bold),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                        review.userName.isNotEmpty
                                            ? review.userName
                                            : 'User',
                                        style: TextStyle(
                                            fontWeight: FontWeight.bold,
                                            color: AppTheme.textPrimary)),
                                    Text(
                                      DateFormat('MMM d, yyyy')
                                          .format(review.createdAt),
                                      style: TextStyle(
                                          color: AppTheme.textSecondary,
                                          fontSize: 12),
                                    ),
                                  ],
                                ),
                              ),
                              RatingBarIndicator(
                                rating: review.rating,
                                itemBuilder: (context, index) => const Icon(
                                    Icons.star,
                                    color: Color(0xFFFFD700)),
                                itemCount: 5,
                                itemSize: 16.0,
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(review.comment,
                              style: TextStyle(
                                  color: AppTheme.textPrimary, height: 1.5)),
                        ],
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

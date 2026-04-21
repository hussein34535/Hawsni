import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import 'package:hwasi_app/core/themes/app_theme.dart';
import 'package:hwasi_app/features/reviews/bloc/review_bloc.dart';
import 'package:hwasi_app/features/reviews/bloc/review_state.dart';
import 'package:intl/intl.dart';
import 'package:hwasi_app/l10n/generated/app_localizations.dart';
import 'package:hwasi_app/features/reviews/presentation/widgets/add_review_sheet.dart';
import 'package:hwasi_app/core/services/auth_service.dart';
import 'package:hwasi_app/features/reviews/bloc/review_event.dart';

class ReviewsSection extends StatelessWidget {
  final String productId;

  const ReviewsSection({super.key, required this.productId});

  void _showAddReviewDialog(BuildContext context) {
    final reviewBloc = context.read<ReviewBloc>();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => AddReviewSheet(
        productId: productId,
        reviewBloc: reviewBloc,
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
                Text(AppLocalizations.of(context)?.reviews ?? 'Reviews',
                    style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                        fontFamily: 'Playfair Display')),
                if (state is ReviewLoaded) ...[
                  if (!state.reviews.any((r) =>
                      r.userId.toString().trim() ==
                      AuthService.userId.toString().trim()))
                    TextButton.icon(
                      onPressed: () => _showAddReviewDialog(context),
                      icon: const Icon(Icons.edit,
                          size: 16, color: AppTheme.primaryColor),
                      label: Text(
                          AppLocalizations.of(context)?.writeReview ??
                              'Write Review',
                          style: const TextStyle(color: AppTheme.primaryColor)),
                    )
                  else
                    Text(
                      AppLocalizations.of(context)?.youSuccessfullyReviewed ??
                          'تتم مراجعتك بنجاح',
                      style: const TextStyle(
                          color: AppTheme.primaryColor,
                          fontWeight: FontWeight.w500,
                          fontSize: 12),
                    ),
                ] else if (state is! ReviewLoading) ...[
                  TextButton.icon(
                    onPressed: () => _showAddReviewDialog(context),
                    icon: const Icon(Icons.edit,
                        size: 16, color: AppTheme.primaryColor),
                    label: Text(
                        AppLocalizations.of(context)?.writeReview ??
                            'Write Review',
                        style: const TextStyle(color: AppTheme.primaryColor)),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 16),
            if (state is ReviewLoading)
              const Center(
                  child:
                      CircularProgressIndicator(color: AppTheme.primaryColor))
            else if (state is ReviewLoaded)
              if (state.reviews.isEmpty)
                Center(
                  child: Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Text(
                        AppLocalizations.of(context)?.noReviewsYet ??
                            'لا توجد مراجعات بعد',
                        style: const TextStyle(color: AppTheme.textSecondary)),
                  ),
                )
              else ...[
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount:
                      state.reviews.length > 3 ? 3 : state.reviews.length,
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
                            color: Colors.black.withValues(alpha: 0.05),
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
                                backgroundColor: AppTheme.primaryColor
                                    .withValues(alpha: 0.1),
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
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                        review.userName.isNotEmpty
                                            ? review.userName
                                            : 'User',
                                        style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            color: AppTheme.textPrimary)),
                                    Text(
                                      DateFormat('MMM d, yyyy')
                                          .format(review.createdAt),
                                      style: const TextStyle(
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
                              if (review.userId.toString().trim() ==
                                  AuthService.userId.toString().trim())
                                IconButton(
                                  icon: const Icon(Icons.delete,
                                      color: Colors.red, size: 20),
                                  padding: EdgeInsets.zero,
                                  constraints: const BoxConstraints(),
                                  onPressed: () {
                                    showDialog(
                                      context: context,
                                      builder: (context) => AlertDialog(
                                        title: Text(AppLocalizations.of(context)
                                                ?.deleteReview ??
                                            'Delete Review'),
                                        content: Text(
                                            AppLocalizations.of(context)
                                                    ?.areYouSureDeleteReview ??
                                                'هل أنت متأكد من الحذف؟'),
                                        actions: [
                                          TextButton(
                                            onPressed: () =>
                                                Navigator.pop(context),
                                            child: Text(
                                                AppLocalizations.of(context)
                                                        ?.cancel ??
                                                    'Cancel'),
                                          ),
                                          TextButton(
                                            onPressed: () {
                                              Navigator.pop(context);
                                              context.read<ReviewBloc>().add(
                                                  DeleteReview(
                                                      reviewId: review.id,
                                                      productId: productId));
                                            },
                                            child: Text(
                                                AppLocalizations.of(context)
                                                        ?.delete ??
                                                    'Delete',
                                                style: const TextStyle(
                                                    color: Colors.red)),
                                          ),
                                        ],
                                      ),
                                    );
                                  },
                                ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(review.comment,
                              maxLines: 3,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                  color: AppTheme.textPrimary, height: 1.5)),
                          // Review images
                          if (review.images.isNotEmpty) ...[
                            const SizedBox(height: 10),
                            SizedBox(
                              height: 80,
                              child: ListView.separated(
                                scrollDirection: Axis.horizontal,
                                itemCount: review.images.length,
                                separatorBuilder: (_, __) =>
                                    const SizedBox(width: 8),
                                itemBuilder: (ctx, i) => ClipRRect(
                                  borderRadius: BorderRadius.circular(12),
                                  child: Image.network(
                                    review.images[i],
                                    width: 80,
                                    height: 80,
                                    fit: BoxFit.cover,
                                    errorBuilder: (_, __, ___) =>
                                        const SizedBox.shrink(),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    );
                  },
                ),
                if (state.reviews.length > 3)
                  Padding(
                    padding: const EdgeInsets.only(top: 16.0),
                    child: SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed: () {
                          // Ideally navigate to a full reviews page
                          // For now, expand or show bottom sheet could be future work
                          // Or just show full list in a modal
                          showModalBottomSheet(
                            context: context,
                            isScrollControlled: true,
                            backgroundColor: Colors.transparent,
                            builder: (ctx) => Container(
                              height: MediaQuery.of(context).size.height * 0.8,
                              decoration: const BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.vertical(
                                    top: Radius.circular(20)),
                              ),
                              child: Column(
                                children: [
                                  Padding(
                                    padding: const EdgeInsets.all(16.0),
                                    child: Text(
                                        AppLocalizations.of(context)?.reviews ??
                                            'Reviews',
                                        style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 18)),
                                  ),
                                  Expanded(
                                    child: ListView.separated(
                                        padding: const EdgeInsets.all(16),
                                        itemCount: state.reviews.length,
                                        separatorBuilder: (_, __) =>
                                            const SizedBox(height: 16),
                                        itemBuilder: (ctx, i) {
                                          final r = state.reviews[i];
                                          return Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Row(
                                                children: [
                                                  Text(
                                                      r.userName.isNotEmpty
                                                          ? r.userName
                                                          : 'User',
                                                      style: const TextStyle(
                                                          fontWeight:
                                                              FontWeight.bold)),
                                                  const Spacer(),
                                                  RatingBarIndicator(
                                                      rating: r.rating,
                                                      itemBuilder: (context,
                                                              index) =>
                                                          const Icon(Icons.star,
                                                              color: Color(
                                                                  0xFFFFD700)),
                                                      itemCount: 5,
                                                      itemSize: 14.0),
                                                ],
                                              ),
                                              const SizedBox(height: 4),
                                              Text(r.comment),
                                            ],
                                          );
                                        }),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          side: const BorderSide(color: AppTheme.primaryColor),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                        child: Text(
                          '${AppLocalizations.of(context)?.viewAll ?? "عرض الكل"} (${state.reviews.length})',
                          style: const TextStyle(
                              color: AppTheme.primaryColor,
                              fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ),
              ]
            else
              const Center(child: Text("Something went wrong"))
          ],
        );
      },
    );
  }
}

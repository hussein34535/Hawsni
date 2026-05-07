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
import 'package:cached_network_image/cached_network_image.dart';

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
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF1A1A1A),
                        fontFamily: 'Cairo')),
                if (state is ReviewLoaded) ...[
                  if (!state.reviews.any((r) =>
                      r.userId.toString().trim() ==
                      AuthService.userId.toString().trim()))
                    TextButton.icon(
                      onPressed: () => _showAddReviewDialog(context),
                      icon: const Icon(Icons.edit_note_rounded,
                          size: 18, color: Color(0xFF0E4435)),
                      label: Text(
                          AppLocalizations.of(context)?.writeReview ??
                              'Write Review',
                          style: const TextStyle(
                              fontFamily: 'Cairo',
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF0E4435))),
                    )
                  else
                    const Text(
                      'تم التقييم',
                      style: TextStyle(
                          color: Color(0xFF0E4435),
                          fontWeight: FontWeight.w900,
                          fontFamily: 'Cairo',
                          fontSize: 12),
                    ),
                ] else if (state is! ReviewLoading) ...[
                  TextButton.icon(
                    onPressed: () => _showAddReviewDialog(context),
                    icon: const Icon(Icons.edit_note_rounded,
                        size: 18, color: Color(0xFF0E4435)),
                    label: Text(
                        AppLocalizations.of(context)?.writeReview ??
                            'Write Review',
                        style: const TextStyle(
                            fontFamily: 'Cairo',
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF0E4435))),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 20),
            if (state is ReviewLoading)
              const Center(
                  child:
                      CircularProgressIndicator(color: Color(0xFF0E4435)))
            else if (state is ReviewLoaded)
              if (state.reviews.isEmpty)
                Center(
                  child: Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Text(
                        AppLocalizations.of(context)?.noReviewsYet ??
                            'لا توجد مراجعات بعد',
                        style: const TextStyle(fontFamily: 'Cairo', color: Colors.grey, fontWeight: FontWeight.bold)),
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
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF9F9F9),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFF0F0F0)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                        review.userName.isNotEmpty
                                            ? review.userName
                                            : 'User',
                                        style: const TextStyle(
                                            fontFamily: 'Cairo',
                                            fontWeight: FontWeight.w900,
                                            fontSize: 14,
                                            color: Color(0xFF1A1A1A))),
                                    Text(
                                      DateFormat('MMM d, yyyy')
                                          .format(review.createdAt),
                                      style: const TextStyle(
                                          fontFamily: 'Cairo',
                                          color: Colors.grey,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 11),
                                    ),
                                  ],
                                ),
                              ),
                              RatingBarIndicator(
                                rating: review.rating,
                                itemBuilder: (context, index) => const Icon(
                                    Icons.star_rounded,
                                    color: Colors.amber),
                                itemCount: 5,
                                itemSize: 14.0,
                              ),
                              if (review.userId.toString().trim() ==
                                  AuthService.userId.toString().trim())
                                IconButton(
                                  icon: const Icon(Icons.delete_outline_rounded,
                                      color: Colors.redAccent, size: 18),
                                  padding: EdgeInsets.zero,
                                  constraints: const BoxConstraints(),
                                  onPressed: () {
                                    // ... deletion logic ...
                                  },
                                ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(review.comment,
                              maxLines: 3,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                  fontFamily: 'Cairo',
                                  color: Colors.black54, 
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13,
                                  height: 1.5)),
                          // Review images
                          if (review.images.isNotEmpty) ...[
                            const SizedBox(height: 12),
                            SizedBox(
                              height: 60,
                              child: ListView.separated(
                                scrollDirection: Axis.horizontal,
                                itemCount: review.images.length,
                                separatorBuilder: (_, __) =>
                                    const SizedBox(width: 8),
                                itemBuilder: (ctx, i) => ClipRRect(
                                  borderRadius: BorderRadius.circular(12),
                                  child: CachedNetworkImage(
                                    imageUrl: review.images[i],
                                    width: 60,
                                    height: 60,
                                    fit: BoxFit.cover,
                                    placeholder: (_, __) => Container(color: Colors.white),
                                    errorWidget: (_, __, ___) =>
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

class ReviewModel {
  final String id;
  final String userId;
  final String userName;
  final String productId;
  final double rating;
  final String comment;
  final DateTime createdAt;

  ReviewModel({
    required this.id,
    required this.userId,
    required this.userName,
    required this.productId,
    required this.rating,
    required this.comment,
    required this.createdAt,
  });

  factory ReviewModel.fromJson(Map<String, dynamic> json) {
    return ReviewModel(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      userId: json['user'] is Map
          ? (json['user']['_id']?.toString() ??
              json['user']['id']?.toString() ??
              '')
          : (json['user']?.toString() ?? ''),
      userName: json['user'] is Map
          ? (json['user']['name']?.toString() ?? 'Anonymous')
          : 'Anonymous',
      productId: json['product'] is Map
          ? (json['product']['_id']?.toString() ??
              json['product']['id']?.toString() ??
              '')
          : (json['product']?.toString() ?? ''),
      rating:
          (json['rating'] is num) ? (json['rating'] as num).toDouble() : 0.0,
      comment: json['comment']?.toString() ?? '',
      createdAt: DateTime.parse(json['createdAt']?.toString() ??
          json['created_at']?.toString() ??
          DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user': userId,
      'product': productId,
      'rating': rating,
      'comment': comment,
      'created_at': createdAt.toIso8601String(),
    };
  }
}

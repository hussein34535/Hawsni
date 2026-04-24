class ReviewModel {
  final String id;
  final String userId;
  final String userName;
  final String productId;
  final double rating;
  final String comment;
  final List<String> images;
  final int helpfulCount;
  final int notHelpfulCount;
  final DateTime createdAt;

  ReviewModel({
    required this.id,
    required this.userId,
    required this.userName,
    required this.productId,
    required this.rating,
    required this.comment,
    this.images = const [],
    this.helpfulCount = 0,
    this.notHelpfulCount = 0,
    required this.createdAt,
  });

  factory ReviewModel.fromJson(Map<String, dynamic> json) {
    String parsedUserId = '';
    // Try explicit user_id first
    if (json['user_id'] != null) {
      parsedUserId = json['user_id'].toString();
    }
    // Try user object if map
    else if (json['user'] is Map) {
      final userMap = json['user'] as Map;
      parsedUserId =
          userMap['id']?.toString() ?? userMap['_id']?.toString() ?? '';
    }
    // Try user as string (if it's just the ID)
    else if (json['user'] is String) {
      parsedUserId = json['user'];
    }

    String parsedUserName = 'Anonymous';
    if (json['user'] is Map) {
      parsedUserName = json['user']['name']?.toString() ?? 'Anonymous';
    }

    return ReviewModel(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      userId: parsedUserId,
      userName: parsedUserName,
      productId: json['product'] is Map
          ? (json['product']['_id']?.toString() ??
              json['product']['id']?.toString() ??
              '')
          : (json['product']?.toString() ?? ''),
      rating:
          (json['rating'] is num) ? (json['rating'] as num).toDouble() : 0.0,
      comment: json['comment']?.toString() ?? '',
      images:
          json['images'] != null ? List<String>.from(json['images']) : const [],
      helpfulCount: json['helpfulCount'] ?? json['helpful_count'] ?? 0,
      notHelpfulCount:
          json['notHelpfulCount'] ?? json['not_helpful_count'] ?? 0,
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
      'images': images,
      'helpfulCount': helpfulCount,
      'notHelpfulCount': notHelpfulCount,
      'created_at': createdAt.toIso8601String(),
    };
  }
}

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
    print('ReviewModel Parsing JSON: $json'); // Debug print

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

    print(
        'Parsed UserId: $parsedUserId, UserName: $parsedUserName'); // Debug result

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

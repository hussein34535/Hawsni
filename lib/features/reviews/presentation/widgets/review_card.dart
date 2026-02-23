import 'package:flutter/material.dart';


class ReviewCard extends StatelessWidget {
  final String userName;
  final int rating;
  final String comment;
  final String date;
  final List<String> images;
  final int helpfulCount;
  final int notHelpfulCount;
  final VoidCallback? onHelpful;
  final VoidCallback? onNotHelpful;

  const ReviewCard({
    super.key,
    required this.userName,
    required this.rating,
    required this.comment,
    required this.date,
    this.images = const [],
    this.helpfulCount = 0,
    this.notHelpfulCount = 0,
    this.onHelpful,
    this.onNotHelpful,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16.0),
      margin: const EdgeInsets.only(bottom: 12.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withValues(alpha: 0.08),
            spreadRadius: 1,
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // User info row
          Row(
            children: [
              // Avatar
              CircleAvatar(
                radius: 18,
                backgroundColor: _avatarColor(userName),
                child: Text(
                  userName.isNotEmpty ? userName[0].toUpperCase() : '?',
                  style: TextStyle(fontFamily: 'Cairo',
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              // Name + date
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      userName,
                      style: TextStyle(fontFamily: 'Cairo',
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    Text(
                      date,
                      style: TextStyle(fontFamily: 'Cairo',
                        color: Colors.grey[500],
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              // Stars
              Row(
                children: List.generate(5, (index) {
                  return Icon(
                    index < rating
                        ? Icons.star_rounded
                        : Icons.star_outline_rounded,
                    color: index < rating ? Colors.amber : Colors.grey[300],
                    size: 18,
                  );
                }),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Comment
          Text(
            comment,
            style: TextStyle(fontFamily: 'Cairo',
              fontSize: 14,
              height: 1.6,
              color: Colors.grey[800],
            ),
          ),
          // Photo gallery
          if (images.isNotEmpty) ...[
            const SizedBox(height: 12),
            SizedBox(
              height: 80,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: images.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  return GestureDetector(
                    onTap: () => _showImageFullScreen(context, images[index]),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: Image.network(
                        images[index],
                        width: 80,
                        height: 80,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          width: 80,
                          height: 80,
                          color: Colors.grey[200],
                          child: const Icon(Icons.broken_image,
                              color: Colors.grey),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
          // Helpful / Not-helpful voting
          const SizedBox(height: 12),
          Row(
            children: [
              Text(
                'هل كان هذا مفيداً؟',
                style: TextStyle(fontFamily: 'Cairo',
                  fontSize: 12,
                  color: Colors.grey[500],
                ),
              ),
              const Spacer(),
              // Helpful button
              _VoteButton(
                icon: Icons.thumb_up_outlined,
                count: helpfulCount,
                onTap: onHelpful,
              ),
              const SizedBox(width: 12),
              // Not helpful button
              _VoteButton(
                icon: Icons.thumb_down_outlined,
                count: notHelpfulCount,
                onTap: onNotHelpful,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Color _avatarColor(String name) {
    final colors = [
      Colors.blue,
      Colors.teal,
      Colors.indigo,
      Colors.purple,
      Colors.orange,
      Colors.deepOrange,
      Colors.pink,
      Colors.cyan,
    ];
    return colors[name.hashCode.abs() % colors.length];
  }

  void _showImageFullScreen(BuildContext context, String imageUrl) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(16),
        child: Stack(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Image.network(
                imageUrl,
                fit: BoxFit.contain,
              ),
            ),
            Positioned(
              top: 8,
              right: 8,
              child: CircleAvatar(
                radius: 18,
                backgroundColor: Colors.black54,
                child: IconButton(
                  icon: const Icon(Icons.close, color: Colors.white, size: 18),
                  onPressed: () => Navigator.pop(context),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _VoteButton extends StatelessWidget {
  final IconData icon;
  final int count;
  final VoidCallback? onTap;

  const _VoteButton({
    required this.icon,
    required this.count,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey[300]!),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: Colors.grey[600]),
            if (count > 0) ...[
              const SizedBox(width: 4),
              Text(
                '$count',
                style: TextStyle(fontFamily: 'Cairo',
                  fontSize: 12,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

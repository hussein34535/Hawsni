import 'package:flutter/material.dart';

class OnboardingPage extends StatelessWidget {
  final String image;
  final String title;
  final String description;

  const OnboardingPage({
    super.key,
    required this.image,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    final icons = {
      'Placeholder for Image 1': Icons.storefront_outlined,
      'Placeholder for Image 2': Icons.shopping_bag_outlined,
      'Placeholder for Image 3': Icons.verified_user_outlined,
    };

    final colors = {
      'Placeholder for Image 1': [Colors.blue[400]!, Colors.purple[400]!],
      'Placeholder for Image 2': [Colors.pink[400]!, Colors.orange[400]!],
      'Placeholder for Image 3': [Colors.green[400]!, Colors.teal[400]!],
    };

    // Using SingleChildScrollView to solve the overflow issue
    return SingleChildScrollView(
      child: Container(
        padding: const EdgeInsets.all(24.0),
        // Use constraints to ensure content takes at least the full screen height
        constraints: BoxConstraints(
          minHeight: MediaQuery.of(context).size.height -
              100, // Leave space for bottom buttons
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Illustration
            Container(
              height: 280,
              width: 280,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors:
                      colors[image] ?? [Colors.blue[400]!, Colors.purple[400]!],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(140),
                boxShadow: [
                  BoxShadow(
                    color: (colors[image] ??
                            [Colors.blue[400]!, Colors.purple[400]!])
                        .first
                        .withOpacity(0.3),
                    spreadRadius: 5,
                    blurRadius: 15,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),
              child: Icon(
                icons[image] ?? Icons.shopping_cart,
                size: 140,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 48),

            // Title
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.bold,
                height: 1.2,
              ),
            ),
            const SizedBox(height: 16),

            // Description
            Text(
              description,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 18,
                color: Colors.grey,
                height: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

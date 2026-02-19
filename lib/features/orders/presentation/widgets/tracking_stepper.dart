import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hwasi_app/core/themes/app_theme.dart';

class TrackingStep {
  final String title;
  final String subtitle;
  final IconData icon;
  final String status; // 'completed', 'current', 'pending'
  final String? timestamp;

  TrackingStep({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.status,
    this.timestamp,
  });
}

class TrackingStepper extends StatelessWidget {
  final List<TrackingStep> steps;

  const TrackingStepper({super.key, required this.steps});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(steps.length, (index) {
        final step = steps[index];
        final isLast = index == steps.length - 1;
        final isCompleted = step.status == 'completed';
        final isCurrent = step.status == 'current';

        return IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Timeline line and dot
              SizedBox(
                width: 40,
                child: Column(
                  children: [
                    // Top line (if not first)
                    if (index > 0)
                      Expanded(
                        child: Container(
                          width: 2,
                          color: steps[index - 1].status == 'completed'
                              ? AppTheme.primaryColor
                              : Colors.grey[200],
                        ),
                      ),

                    // Dot/Icon
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: isCompleted || isCurrent
                            ? AppTheme.primaryColor
                            : Colors.grey[100],
                        shape: BoxShape.circle,
                        border: isCurrent
                            ? Border.all(
                                color: AppTheme.primaryColor.withOpacity(0.3),
                                width: 4)
                            : null,
                      ),
                      child: Icon(
                        isCompleted ? Icons.check : step.icon,
                        size: 16,
                        color: isCompleted || isCurrent
                            ? Colors.white
                            : Colors.grey[400],
                      ),
                    ),

                    // Bottom line (if not last)
                    if (!isLast)
                      Expanded(
                        child: Container(
                          width: 2,
                          color: isCompleted
                              ? AppTheme.primaryColor
                              : Colors.grey[200],
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(width: 16),

              // Content
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 32.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment:
                        MainAxisAlignment.center, // Center vertically with dot
                    children: [
                      Text(
                        step.title,
                        style: GoogleFonts.cairo(
                          fontSize: 16,
                          fontWeight: isCompleted || isCurrent
                              ? FontWeight.bold
                              : FontWeight.w500,
                          color: isCompleted || isCurrent
                              ? Colors.black
                              : Colors.grey[500],
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        step.subtitle,
                        style: GoogleFonts.cairo(
                          fontSize: 13,
                          color: Colors.grey[500],
                          height: 1.2,
                        ),
                      ),
                      if (step.timestamp != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          step.timestamp!,
                          style: GoogleFonts.cairo(
                            fontSize: 12,
                            color: AppTheme.primaryColor,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      }),
    );
  }
}

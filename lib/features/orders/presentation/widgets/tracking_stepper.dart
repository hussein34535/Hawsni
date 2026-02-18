import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hwasi_app/core/themes/app_theme.dart';

/// A step in the order tracking stepper.
class TrackingStep {
  final String title;
  final String subtitle;
  final IconData icon;
  final String status; // 'completed', 'current', 'pending'
  final String? timestamp;

  const TrackingStep({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.status,
    this.timestamp,
  });
}

/// An animated stepper widget for order tracking.
class TrackingStepper extends StatefulWidget {
  final List<TrackingStep> steps;

  const TrackingStepper({super.key, required this.steps});

  @override
  State<TrackingStepper> createState() => _TrackingStepperState();
}

class _TrackingStepperState extends State<TrackingStepper>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _progressAnim;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _progressAnim = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeInOut,
    );
    _animController.forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _progressAnim,
      builder: (context, _) {
        return Column(
          children: List.generate(widget.steps.length, (index) {
            final step = widget.steps[index];
            final isCompleted = step.status == 'completed';
            final isCurrent = step.status == 'current';
            final isLast = index == widget.steps.length - 1;

            // Animate items sequentially
            final delay = index / widget.steps.length;
            final itemProgress = (_progressAnim.value - delay)
                    .clamp(0.0, 1.0 / widget.steps.length) *
                widget.steps.length;

            return Opacity(
              opacity: itemProgress.clamp(0.0, 1.0),
              child: Transform.translate(
                offset: Offset(0, 20 * (1 - itemProgress.clamp(0.0, 1.0))),
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 0),
                  child: IntrinsicHeight(
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Step indicator column
                        SizedBox(
                          width: 48,
                          child: Column(
                            children: [
                              // Icon circle
                              AnimatedContainer(
                                duration: const Duration(milliseconds: 400),
                                width: isCurrent ? 48 : 40,
                                height: isCurrent ? 48 : 40,
                                decoration: BoxDecoration(
                                  color: isCompleted
                                      ? Colors.green
                                      : isCurrent
                                          ? AppTheme.primaryColor
                                          : Colors.grey[800],
                                  shape: BoxShape.circle,
                                  boxShadow: isCurrent
                                      ? [
                                          BoxShadow(
                                            color: AppTheme.primaryColor
                                                .withValues(alpha: 0.4),
                                            blurRadius: 12,
                                            spreadRadius: 2,
                                          ),
                                        ]
                                      : null,
                                ),
                                child: Icon(
                                  isCompleted ? Icons.check : step.icon,
                                  color: isCompleted || isCurrent
                                      ? Colors.white
                                      : Colors.grey[600],
                                  size: isCurrent ? 24 : 20,
                                ),
                              ),
                              // Connector line
                              if (!isLast)
                                Expanded(
                                  child: Container(
                                    width: 3,
                                    margin:
                                        const EdgeInsets.symmetric(vertical: 4),
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(2),
                                      gradient: isCompleted
                                          ? const LinearGradient(
                                              begin: Alignment.topCenter,
                                              end: Alignment.bottomCenter,
                                              colors: [
                                                Colors.green,
                                                Colors.green,
                                              ],
                                            )
                                          : LinearGradient(
                                              begin: Alignment.topCenter,
                                              end: Alignment.bottomCenter,
                                              colors: [
                                                isCurrent
                                                    ? AppTheme.primaryColor
                                                    : Colors.grey[800]!,
                                                Colors.grey[800]!,
                                              ],
                                            ),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 16),
                        // Step content
                        Expanded(
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 20),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: isCurrent
                                  ? AppTheme.primaryColor
                                      .withValues(alpha: 0.08)
                                  : Colors.white.withValues(alpha: 0.03),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: isCurrent
                                    ? AppTheme.primaryColor
                                        .withValues(alpha: 0.3)
                                    : Colors.white.withValues(alpha: 0.06),
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        step.title,
                                        style: GoogleFonts.cairo(
                                          fontSize: 15,
                                          fontWeight: isCurrent
                                              ? FontWeight.bold
                                              : FontWeight.w600,
                                          color: isCurrent
                                              ? AppTheme.primaryColor
                                              : isCompleted
                                                  ? Colors.white
                                                  : Colors.grey[500],
                                        ),
                                      ),
                                    ),
                                    if (isCompleted)
                                      const Icon(
                                        Icons.check_circle,
                                        color: Colors.green,
                                        size: 18,
                                      ),
                                    if (isCurrent)
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 8,
                                          vertical: 2,
                                        ),
                                        decoration: BoxDecoration(
                                          color: AppTheme.primaryColor
                                              .withValues(alpha: 0.2),
                                          borderRadius:
                                              BorderRadius.circular(8),
                                        ),
                                        child: Text(
                                          'الحالي',
                                          style: GoogleFonts.cairo(
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                            color: AppTheme.primaryColor,
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  step.subtitle,
                                  style: GoogleFonts.cairo(
                                    fontSize: 13,
                                    color: Colors.grey[500],
                                  ),
                                ),
                                if (step.timestamp != null) ...[
                                  const SizedBox(height: 6),
                                  Row(
                                    children: [
                                      Icon(
                                        Icons.access_time,
                                        size: 14,
                                        color: Colors.grey[600],
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        step.timestamp!,
                                        style: GoogleFonts.poppins(
                                          fontSize: 12,
                                          color: Colors.grey[600],
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          }),
        );
      },
    );
  }
}

import 'package:flutter/material.dart';
import 'package:hwasi_app/core/themes/app_theme.dart';
import 'package:hwasi_app/features/orders/presentation/screens/order_tracking_screen.dart';
import 'package:hwasi_app/l10n/generated/app_localizations.dart';

class GuestTrackOrderScreen extends StatefulWidget {
  const GuestTrackOrderScreen({super.key});

  @override
  State<GuestTrackOrderScreen> createState() => _GuestTrackOrderScreenState();
}

class _GuestTrackOrderScreenState extends State<GuestTrackOrderScreen> {
  final _formKey = GlobalKey<FormState>();
  final _orderIdController = TextEditingController();

  void _trackOrder() {
    if (_formKey.currentState!.validate()) {
      final orderId = _orderIdController.text.trim();
      // Navigate to OrderTrackingScreen with a constructed order object
      // explicitly passing the ID content.
      // Since we don't have the full order object, we pass what we have.
      // OrderTrackingScreen handles fetching tracking events.
      // It might show N/A for address/status initially but will load events.
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => OrderTrackingScreen(
            order: {
              'id': orderId,
              'status': 'Tracking...', // Placeholder
              'shippingAddress': null, // Unknown
            },
          ),
        ),
      );
    }
  }

  @override
  void dispose() {
    _orderIdController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.trackOrderTitle),
        backgroundColor: AppTheme.scaffoldBackgroundColor,
        elevation: 0,
        foregroundColor: AppTheme.textPrimary,
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 600),
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    l10n.enterOrderId,
                    style: AppTheme.textTheme.headlineSmall,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    l10n.trackOrderHint,
                    style: AppTheme.textTheme.bodyMedium?.copyWith(
                      color: AppTheme.textSecondary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 32),
                  TextFormField(
                    controller: _orderIdController,
                    decoration: InputDecoration(
                      labelText: l10n.orderIdLabel,
                      hintText: l10n.orderIdPlaceholder,
                      prefixIcon: const Icon(Icons.receipt_long),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      filled: true,
                      fillColor: AppTheme.surfaceColor,
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return l10n.enterOrderIdError;
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: _trackOrder,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      backgroundColor: AppTheme.primaryColor,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text(
                      l10n.trackOrderTitle,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

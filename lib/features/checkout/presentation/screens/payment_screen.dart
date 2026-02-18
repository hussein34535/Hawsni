import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:hwasi_app/core/services/paymob_service.dart';

class PaymentScreen extends StatefulWidget {
  final String paymentKey;

  const PaymentScreen({super.key, required this.paymentKey});

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();

    // Construct the payment URL
    final String paymentUrl = PaymobService().getIframeUrl(widget.paymentKey);

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0x00000000))
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            // Update loading bar.
          },
          onPageStarted: (String url) {},
          onPageFinished: (String url) {
            setState(() {
              _isLoading = false;
            });
          },
          onWebResourceError: (WebResourceError error) {},
          onNavigationRequest: (NavigationRequest request) {
            // Handle success/failure callbacks from Paymob
            if (request.url.contains('success=true')) {
              Navigator.pop(context, true); // Payment successful
              return NavigationDecision.prevent;
            } else if (request.url.contains('success=false')) {
              Navigator.pop(context, false); // Payment failed
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(paymentUrl));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Payment'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.pop(context, null), // Cancelled
        ),
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isLoading)
            const Center(
              child: CircularProgressIndicator(),
            ),
        ],
      ),
    );
  }
}

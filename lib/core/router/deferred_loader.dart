import 'package:flutter/material.dart';

class DeferredLoader extends StatelessWidget {
  final Future<void> loader;
  final Widget Function() builder;

  const DeferredLoader(
      {required this.loader, required this.builder, super.key});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
      future: loader,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.done) {
          return builder();
        }
        return const Scaffold(
          body: Center(
            child: CircularProgressIndicator(),
          ),
        );
      },
    );
  }
}

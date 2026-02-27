import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'package:hwasi_app/core/providers/settings_provider.dart';
import 'package:hwasi_app/core/themes/app_theme.dart';

import 'package:hwasi_app/l10n/generated/app_localizations.dart';
import 'package:hwasi_app/core/router/app_router.dart';

/// Forces LTR direction even for Arabic locale
class _LTRWidgetsLocalizations extends DefaultWidgetsLocalizations {
  @override
  TextDirection get textDirection => TextDirection.ltr;
}

class _LTRWidgetsDelegate extends LocalizationsDelegate<WidgetsLocalizations> {
  const _LTRWidgetsDelegate();

  @override
  bool isSupported(Locale locale) => true;

  @override
  Future<WidgetsLocalizations> load(Locale locale) async =>
      _LTRWidgetsLocalizations();

  @override
  bool shouldReload(
          covariant LocalizationsDelegate<WidgetsLocalizations> old) =>
      false;
}

class App extends StatefulWidget {
  const App({super.key});

  @override
  State<App> createState() => _AppState();
}

class _AppState extends State<App> {
  @override
  Widget build(BuildContext context) {
    return Consumer<SettingsProvider>(
      builder: (context, settingsProvider, child) {
        return MaterialApp.router(
          title: 'HWASI',
          locale: Locale(settingsProvider.language),
          localizationsDelegates: [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            const _LTRWidgetsDelegate(), // Force LTR layout
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: AppLocalizations.supportedLocales,
          themeMode:
              settingsProvider.isDarkMode ? ThemeMode.dark : ThemeMode.light,
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.darkTheme,
          scrollBehavior: WebScrollBehavior(),
          routerConfig: AppRouter.router,
          builder: (context, child) {
            return Directionality(
              textDirection: TextDirection.ltr,
              child: child!,
            );
          },
        );
      },
    );
  }
}

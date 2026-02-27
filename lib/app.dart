import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'package:hwasi_app/core/providers/settings_provider.dart';
import 'package:hwasi_app/core/themes/app_theme.dart';

import 'package:hwasi_app/l10n/generated/app_localizations.dart';
import 'package:hwasi_app/core/router/app_router.dart';

// ── Force LTR globally ──────────────────────────────────────────
// Override the WidgetsLocalizations to always return LTR
// This prevents Flutter from flipping the entire layout for Arabic.

class _ForceLTRWidgetsLocalizations extends DefaultWidgetsLocalizations {
  const _ForceLTRWidgetsLocalizations();

  @override
  TextDirection get textDirection => TextDirection.ltr;
}

class _ForceLTRWidgetsDelegate
    extends LocalizationsDelegate<WidgetsLocalizations> {
  const _ForceLTRWidgetsDelegate();

  @override
  bool isSupported(Locale locale) => true;

  @override
  Future<WidgetsLocalizations> load(Locale locale) async =>
      const _ForceLTRWidgetsLocalizations();

  @override
  bool shouldReload(
          covariant LocalizationsDelegate<WidgetsLocalizations> old) =>
      false;
}

// ─────────────────────────────────────────────────────────────────

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
            // IMPORTANT: our LTR delegate MUST come BEFORE the globals
            // so it wins the resolution for WidgetsLocalizations
            const _ForceLTRWidgetsDelegate(),
            GlobalMaterialLocalizations.delegate,
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
            // Belt-and-suspenders: also force the direction in the builder
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

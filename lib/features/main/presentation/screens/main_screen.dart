import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hwasi_app/core/themes/app_theme.dart';
import 'package:hwasi_app/features/cart/bloc/cart_bloc.dart';
import 'package:hwasi_app/features/cart/bloc/cart_event.dart';
import 'package:hwasi_app/features/cart/bloc/cart_state.dart';
import 'package:hwasi_app/features/cart/presentation/screens/cart_screen.dart';
import 'package:hwasi_app/features/profile/presentation/screens/profile_screen.dart';
import 'package:hwasi_app/features/wishlist/presentation/screens/wishlist_screen.dart';
import 'package:hwasi_app/features/home/presentation/screens/home_screen.dart';
import 'package:hwasi_app/l10n/generated/app_localizations.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const HomeScreen(),
    const WishlistScreen(),
    const CartScreen(),
    const ProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    // Load cart after user is authenticated
    context.read<CartBloc>().add(CartStarted());
  }

  @override
  Widget build(BuildContext context) {
    final isDesktop = MediaQuery.of(context).size.width >= 900;

    if (isDesktop) {
      return Scaffold(
        backgroundColor: AppTheme.scaffoldBackgroundColor,
        body: Column(
          children: [
            _buildDesktopHeader(context),
            Expanded(
              child: IndexedStack(
                index: _currentIndex,
                children: _screens,
              ),
            ),
          ],
        ),
      );
    }

    final l10n = AppLocalizations.of(context);
    if (l10n == null) return const SizedBox.shrink();

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children:
            _screens.map((screen) => RepaintBoundary(child: screen)).toList(),
      ),
      bottomNavigationBar: BottomNavigationBar(
        backgroundColor: Colors.white,
        elevation: 8,
        type: BottomNavigationBarType.fixed,
        currentIndex: _currentIndex,
        selectedItemColor: AppTheme.primaryColor,
        unselectedItemColor: Colors.grey[400],
        showSelectedLabels: true,
        showUnselectedLabels: false,
        selectedFontSize: 12,
        unselectedFontSize: 12,
        selectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600),
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        items: [
          BottomNavigationBarItem(
            icon: const Icon(Icons.home_outlined),
            activeIcon: const Icon(Icons.home),
            label: l10n.home,
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.favorite_border),
            activeIcon: const Icon(Icons.favorite),
            label: l10n.wishlist,
          ),
          BottomNavigationBarItem(
            icon: BlocBuilder<CartBloc, CartState>(
              builder: (context, state) {
                int count = 0;
                if (state is CartLoaded) {
                  count = state.items.length;
                }
                return Stack(
                  clipBehavior: Clip.none,
                  children: [
                    const Icon(Icons.shopping_bag_outlined),
                    if (count > 0)
                      Positioned(
                        right: -4,
                        top: -4,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: Colors.red,
                            shape: BoxShape.circle,
                          ),
                          constraints: const BoxConstraints(
                            minWidth: 16,
                            minHeight: 16,
                          ),
                          child: Text(
                            count.toString(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ),
                  ],
                );
              },
            ),
            activeIcon: BlocBuilder<CartBloc, CartState>(
              builder: (context, state) {
                int count = 0;
                if (state is CartLoaded) {
                  count = state.items.length;
                }
                return Stack(
                  clipBehavior: Clip.none,
                  children: [
                    const Icon(Icons.shopping_bag),
                    if (count > 0)
                      Positioned(
                        right: -4,
                        top: -4,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: Colors.red,
                            shape: BoxShape.circle,
                          ),
                          constraints: const BoxConstraints(
                            minWidth: 16,
                            minHeight: 16,
                          ),
                          child: Text(
                            count.toString(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ),
                  ],
                );
              },
            ),
            label: l10n.cart,
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.person_outline),
            activeIcon: const Icon(Icons.person),
            label: l10n.profile,
          ),
        ],
      ),
    );
  }

  Widget _buildDesktopHeader(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    if (l10n == null) return const SizedBox.shrink();
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Colors.grey[200]!, width: 1)),
      ),
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 24),
      child: Row(
        children: [
          // Logo (Start/Right in RTL)
          Image.asset(
            'assets/images/logo.png',
            width: 60,
            fit: BoxFit.contain,
          ),

          const Spacer(),

          // Centered Navigation Items
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildDesktopNavItem(
                  0, l10n.home, Icons.home_outlined, Icons.home),
              const SizedBox(width: 32),
              _buildDesktopNavItem(
                  1, l10n.wishlist, Icons.favorite_border, Icons.favorite),
              const SizedBox(width: 32),
              _buildDesktopNavItem(
                  2, l10n.cart, Icons.shopping_bag_outlined, Icons.shopping_bag,
                  isCart: true),
            ],
          ),

          const Spacer(),

          // Profile Icon (End/Left in RTL)
          InkWell(
            onTap: () => setState(() => _currentIndex = 3),
            borderRadius: BorderRadius.circular(50),
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _currentIndex == 3
                    ? AppTheme.primaryColor.withValues(alpha: 0.1)
                    : Colors.transparent,
              ),
              child: Icon(
                _currentIndex == 3 ? Icons.person : Icons.person_outline,
                color: _currentIndex == 3
                    ? AppTheme.primaryColor
                    : Colors.grey[600],
                size: 28,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDesktopNavItem(
      int index, String label, IconData icon, IconData activeIcon,
      {bool isCart = false}) {
    final isSelected = _currentIndex == index;
    return InkWell(
      onTap: () => setState(() => _currentIndex = index),
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isCart)
              BlocBuilder<CartBloc, CartState>(
                builder: (context, state) {
                  int count = 0;
                  if (state is CartLoaded) count = state.items.length;
                  return Badge(
                    isLabelVisible: count > 0,
                    label: Text('$count'),
                    child: Icon(
                      isSelected ? activeIcon : icon,
                      color:
                          isSelected ? AppTheme.primaryColor : Colors.grey[600],
                      size: 24,
                    ),
                  );
                },
              )
            else
              Icon(
                isSelected ? activeIcon : icon,
                color: isSelected ? AppTheme.primaryColor : Colors.grey[600],
                size: 24,
              ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? AppTheme.primaryColor : Colors.grey[600],
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                fontSize: 16,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

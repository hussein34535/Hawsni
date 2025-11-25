import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hawsni_app/core/themes/app_theme.dart';
import 'package:hawsni_app/features/cart/bloc/cart_bloc.dart';
import 'package:hawsni_app/features/cart/bloc/cart_event.dart';
import 'package:hawsni_app/features/cart/presentation/screens/cart_screen.dart';
import 'package:hawsni_app/features/profile/presentation/screens/profile_screen.dart';
import 'package:hawsni_app/features/wishlist/presentation/screens/wishlist_screen.dart';

import 'package:hawsni_app/features/home/presentation/screens/home_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;

  List<Widget> get _screens => [
        const HomeScreen(), // Updated to use the new HomeScreen
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
    return Scaffold(
      backgroundColor: Colors.black,
      extendBody: true, // Important for glassmorphism over body
      body: _screens[_currentIndex],
      bottomNavigationBar: ClipRRect(
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.7),
              border: Border(
                top: BorderSide(
                  color: AppTheme.primaryColor.withOpacity(0.3),
                  width: 0.5,
                ),
              ),
            ),
            child: BottomNavigationBar(
              backgroundColor: Colors.transparent,
              elevation: 0,
              type: BottomNavigationBarType.fixed,
              currentIndex: _currentIndex,
              onTap: (index) {
                setState(() {
                  _currentIndex = index;
                });
              },
              selectedItemColor: AppTheme.primaryColor,
              unselectedItemColor: Colors.grey,
              showSelectedLabels: true,
              showUnselectedLabels: false,
              selectedLabelStyle: const TextStyle(
                fontFamily: 'Poppins',
                fontWeight: FontWeight.w600,
                fontSize: 12,
              ),
              items: const [
                BottomNavigationBarItem(
                  icon: Icon(Icons.home_outlined),
                  activeIcon: Icon(Icons.home),
                  label: 'Home',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.favorite_border),
                  activeIcon: Icon(Icons.favorite),
                  label: 'Wishlist',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.shopping_cart_outlined),
                  activeIcon: Icon(Icons.shopping_cart),
                  label: 'Cart',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.person_outline),
                  activeIcon: Icon(Icons.person),
                  label: 'Profile',
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

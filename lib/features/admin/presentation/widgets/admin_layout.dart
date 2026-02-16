import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/services/auth_service.dart';

class AdminLayout extends StatelessWidget {
  final Widget child;
  final String currentPath;

  const AdminLayout({
    super.key,
    required this.child,
    required this.currentPath,
  });

  @override
  Widget build(BuildContext context) {
    if (!AuthService.isAdmin) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.lock, size: 64, color: Colors.grey),
              const SizedBox(height: 16),
              const Text(
                'Access Denied',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text('You do not have permission to view this page.'),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => context.go('/'),
                child: const Text('Go Home'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      body: Row(
        children: [
          // Sidebar (Desktop/Tablet)
          if (MediaQuery.of(context).size.width >= 800)
            _AdminSidebar(currentPath: currentPath),

          // Main Content
          Expanded(
            child: Column(
              children: [
                // Mobile Header
                if (MediaQuery.of(context).size.width < 800) _MobileHeader(),

                Expanded(child: child),
              ],
            ),
          ),
        ],
      ),
      drawer: MediaQuery.of(context).size.width < 800
          ? Drawer(child: _AdminSidebar(currentPath: currentPath))
          : null,
    );
  }
}

class _MobileHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return AppBar(
      title: const Text('Admin Panel'),
      leading: Builder(
        builder: (context) => IconButton(
          icon: const Icon(Icons.menu),
          onPressed: () => Scaffold.of(context).openDrawer(),
        ),
      ),
    );
  }
}

class _AdminSidebar extends StatelessWidget {
  final String currentPath;

  const _AdminSidebar({required this.currentPath});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 250,
      color: Colors.grey[900], // Dark sidebar
      child: Column(
        children: [
          const SizedBox(height: 24),
          const Text(
            'HAWSNI ADMIN',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 48),
          _SidebarItem(
            icon: Icons.dashboard,
            label: 'Dashboard',
            path: '/admin/dashboard',
            isSelected: currentPath == '/admin/dashboard',
          ),
          _SidebarItem(
            icon: Icons.shopping_bag,
            label: 'Products',
            path: '/admin/products',
            isSelected: currentPath.startsWith('/admin/products'),
          ),
          _SidebarItem(
            icon: Icons.shopping_cart,
            label: 'Orders',
            path: '/admin/orders',
            isSelected: currentPath.startsWith('/admin/orders'),
          ),
          _SidebarItem(
            icon: Icons.people,
            label: 'Users',
            path: '/admin/users',
            isSelected: currentPath.startsWith('/admin/users'),
          ),
          const Spacer(),
          const Divider(color: Colors.grey),
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.redAccent),
            title:
                const Text('Logout', style: TextStyle(color: Colors.redAccent)),
            onTap: () async {
              await AuthService.logout();
              if (context.mounted) context.go('/');
            },
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _SidebarItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String path;
  final bool isSelected;

  const _SidebarItem({
    required this.icon,
    required this.label,
    required this.path,
    required this.isSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: isSelected
          ? BoxDecoration(
              color: Colors.blueAccent.withOpacity(0.2),
              borderRadius: BorderRadius.circular(8),
            )
          : null,
      child: ListTile(
        leading: Icon(
          icon,
          color: isSelected ? Colors.blueAccent : Colors.grey[400],
        ),
        title: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.blueAccent : Colors.grey[400],
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
        onTap: () => context.go(path),
      ),
    );
  }
}

import 'package:flutter/material.dart';

class UserManagementScreen extends StatefulWidget {
  const UserManagementScreen({super.key});

  @override
  State<UserManagementScreen> createState() => _UserManagementScreenState();
}

class _UserManagementScreenState extends State<UserManagementScreen> {
  final List<Map<String, dynamic>> _users = [
    {
      'id': '1',
      'name': 'Ahmed Hassan',
      'email': 'ahmed@example.com',
      'role': 'Customer',
      'status': 'Active',
      'joinDate': '2023-01-15',
    },
    {
      'id': '2',
      'name': 'Fatima Ali',
      'email': 'fatima@example.com',
      'role': 'Customer',
      'status': 'Active',
      'joinDate': '2023-02-20',
    },
    {
      'id': '3',
      'name': 'Mohamed Khalid',
      'email': 'mohamed@example.com',
      'role': 'Admin',
      'status': 'Active',
      'joinDate': '2022-11-10',
    },
    {
      'id': '4',
      'name': 'Sara Mahmoud',
      'email': 'sara@example.com',
      'role': 'Customer',
      'status': 'Inactive',
      'joinDate': '2023-03-05',
    },
    {
      'id': '5',
      'name': 'Omar Farouk',
      'email': 'omar@example.com',
      'role': 'Customer',
      'status': 'Active',
      'joinDate': '2023-04-12',
    },
  ];

  bool _isLoading = false;

  void _addUser() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Add user feature coming soon!'),
      ),
    );
  }

  void _editUser(String userId) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Edit user feature coming soon!'),
      ),
    );
  }

  void _deleteUser(String userId) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete User'),
        content: const Text('Are you sure you want to delete this user?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              setState(() {
                _users.removeWhere((user) => user['id'] == userId);
              });
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('User deleted successfully!'),
                  backgroundColor: Colors.green,
                ),
              );
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  void _changeUserRole(String userId) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Change user role feature coming soon!'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('User Management'),
        backgroundColor: Colors.blue[700],
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: _addUser,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Search and filter bar
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          decoration: InputDecoration(
                            hintText: 'Search users...',
                            prefixIcon: const Icon(Icons.search),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Container(
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.grey),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: PopupMenuButton<String>(
                          icon: const Icon(Icons.filter_list),
                          onSelected: (String result) {
                            // Handle filter selection
                          },
                          itemBuilder: (BuildContext context) =>
                              <PopupMenuEntry<String>>[
                            const PopupMenuItem<String>(
                              value: 'all',
                              child: Text('All Users'),
                            ),
                            const PopupMenuItem<String>(
                              value: 'active',
                              child: Text('Active'),
                            ),
                            const PopupMenuItem<String>(
                              value: 'inactive',
                              child: Text('Inactive'),
                            ),
                            const PopupMenuItem<String>(
                              value: 'admin',
                              child: Text('Admins'),
                            ),
                            const PopupMenuItem<String>(
                              value: 'customer',
                              child: Text('Customers'),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // Users list
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _users.length,
                    itemBuilder: (context, index) {
                      final user = _users[index];
                      return _buildUserCard(user);
                    },
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildUserCard(Map<String, dynamic> user) {
    Color statusColor = user['status'] == 'Active' ? Colors.green : Colors.grey;
    Color roleColor = user['role'] == 'Admin' ? Colors.blue : Colors.orange;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 5,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            color: Colors.grey[200],
            borderRadius: BorderRadius.circular(25),
          ),
          child: Icon(
            user['role'] == 'Admin' ? Icons.admin_panel_settings : Icons.person,
            color: Colors.grey,
          ),
        ),
        title: Text(
          user['name'],
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              user['email'],
              style: const TextStyle(
                fontSize: 14,
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: roleColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    user['role'],
                    style: TextStyle(
                      color: roleColor,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    user['status'],
                    style: TextStyle(
                      color: statusColor,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              'Joined: ${user['joinDate']}',
              style: const TextStyle(
                fontSize: 12,
                color: Colors.grey,
              ),
            ),
          ],
        ),
        trailing: PopupMenuButton<String>(
          icon: const Icon(Icons.more_vert),
          onSelected: (String result) {
            switch (result) {
              case 'edit':
                _editUser(user['id']);
                break;
              case 'delete':
                _deleteUser(user['id']);
                break;
              case 'change_role':
                _changeUserRole(user['id']);
                break;
            }
          },
          itemBuilder: (BuildContext context) => <PopupMenuEntry<String>>[
            const PopupMenuItem<String>(
              value: 'edit',
              child: Text('Edit'),
            ),
            if (user['role'] != 'Admin')
              const PopupMenuItem<String>(
                value: 'change_role',
                child: Text('Make Admin'),
              ),
            const PopupMenuItem<String>(
              value: 'delete',
              child: Text('Delete'),
            ),
          ],
        ),
      ),
    );
  }
}

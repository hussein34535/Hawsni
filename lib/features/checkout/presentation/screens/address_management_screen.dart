import 'package:flutter/material.dart';
import 'package:hawsni_app/features/checkout/models/address.dart';
import 'package:hawsni_app/core/services/api_service.dart';

class AddressManagementScreen extends StatefulWidget {
  final List<Address> addresses;
  final Address? selectedAddress;

  const AddressManagementScreen({
    super.key,
    this.addresses = const [],
    this.selectedAddress,
  });

  @override
  State<AddressManagementScreen> createState() =>
      _AddressManagementScreenState();
}

class _AddressManagementScreenState extends State<AddressManagementScreen> {
  List<Address> _addresses = [];
  Address? _selectedAddress;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _selectedAddress = widget.selectedAddress;
    _loadAddresses();
  }

  // دالة لجلب العناوين من السيرفر
  Future<void> _loadAddresses() async {
    setState(() => _isLoading = true);
    try {
      final addressesData = await ApiService.getAddresses();

      setState(() {
        _addresses = addressesData
            .map((data) => Address(
                  id: data['_id'] ??
                      data['id'] ??
                      '', // التعامل مع MongoDB أو Supabase
                  title: data['title'] ?? 'Home',
                  fullName: data['fullName'] ??
                      '', // قد تحتاج لتعديل الباك اند ليحفظ الاسم مع العنوان
                  address: data['address'] ?? '',
                  city: data['city'] ?? '',
                  country: data['country'] ?? '',
                  phone: data['phone'] ?? '',
                  isDefault: data['isDefault'] ?? false,
                ))
            .toList();
        _isLoading = false;
      });
    } catch (e) {
      print("Error loading addresses: $e");
      setState(() => _isLoading = false);
    }
  }

  void _addNewAddress() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AddressFormScreen(
          onAddressSaved: (newAddress) async {
            // تحويل كائن Address إلى Map للسيرفر
            final addressMap = {
              'title': newAddress.title,
              'address': newAddress.address,
              'city': newAddress.city,
              'country': newAddress.country,
              'phone': newAddress.phone,
              'isDefault': newAddress.isDefault
              // 'fullName': newAddress.fullName // تأكد من إضافة هذا الحقل في Schema الباك اند إذا أردت حفظه
            };

            final success = await ApiService.addAddress(addressMap);
            if (success) {
              _loadAddresses(); // إعادة تحميل القائمة
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Address added successfully')),
              );
            } else {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                    content: Text('Failed to add address'),
                    backgroundColor: Colors.red),
              );
            }
          },
        ),
      ),
    );
  }

  void _deleteAddress(Address address) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Address'),
        content: const Text('Are you sure?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              final success = await ApiService.deleteAddress(address.id);
              if (success) {
                _loadAddresses();
              }
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  // ... (باقي الدوال مثل _editAddress, _selectAddress, _setAsDefault تبقى كما هي أو تعدل بنفس المنطق)

  void _selectAddress(Address address) {
    setState(() {
      _selectedAddress = address;
    });
  }

  void _editAddress(Address address) {
    // Implementation for edit (requires PUT endpoint on backend)
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Edit feature requires backend update')),
    );
  }

  void _setAsDefault(Address address) {
    // Implementation for set default
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Shipping Addresses'),
        actions: [
          IconButton(onPressed: _addNewAddress, icon: const Icon(Icons.add)),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _addresses.isEmpty
              ? _buildEmptyState()
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _addresses.length,
                  itemBuilder: (context, index) {
                    return _buildAddressCard(_addresses[index]);
                  },
                ),
      bottomNavigationBar: _addresses.isNotEmpty
          ? Container(
              padding: const EdgeInsets.all(16),
              child: ElevatedButton(
                onPressed: _selectedAddress != null
                    ? () => Navigator.pop(context, _selectedAddress)
                    : null,
                style: ElevatedButton.styleFrom(
                    minimumSize: const Size(double.infinity, 50)),
                child: const Text('Continue'),
              ),
            )
          : null,
    );
  }

  // ... (Widgets _buildEmptyState & _buildAddressCard remain the same as your original code)
  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.location_on_outlined, size: 80, color: Colors.grey[300]),
          const SizedBox(height: 24),
          const Text('No addresses yet',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          const Text('Add your first shipping address',
              style: TextStyle(fontSize: 16, color: Colors.grey)),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _addNewAddress,
            child: const Text('Add Address'),
          ),
        ],
      ),
    );
  }

  Widget _buildAddressCard(Address address) {
    final isSelected = _selectedAddress?.id == address.id;
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: isSelected ? Colors.blue[50] : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
            color: isSelected ? Colors.blue : Colors.grey[300]!,
            width: isSelected ? 2 : 1),
        boxShadow: [
          BoxShadow(
              color: Colors.grey.withOpacity(0.1),
              spreadRadius: 1,
              blurRadius: 5,
              offset: const Offset(0, 2))
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(address.title,
                          style: const TextStyle(
                              fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text(address.fullName,
                          style: const TextStyle(
                              fontSize: 16, fontWeight: FontWeight.w500)),
                    ],
                  ),
                ),
                if (isSelected)
                  const Icon(Icons.check_circle, color: Colors.blue),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
                '${address.address}, ${address.city}, ${address.country}',
                style: const TextStyle(fontSize: 14, color: Colors.grey)),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(address.phone,
                style: const TextStyle(fontSize: 14, color: Colors.grey)),
          ),
          const Divider(height: 24),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                TextButton.icon(
                  onPressed: () => _selectAddress(address),
                  icon: const Icon(Icons.check, size: 18),
                  label: const Text('Select'),
                ),
                TextButton.icon(
                  onPressed: () => _deleteAddress(address),
                  icon: const Icon(Icons.delete, size: 18),
                  label: const Text('Delete'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ... existing AddressFormScreen code ...
class AddressFormScreen extends StatefulWidget {
  final Address? address;
  final Function(Address) onAddressSaved;

  const AddressFormScreen({
    super.key,
    this.address,
    required this.onAddressSaved,
  });

  @override
  State<AddressFormScreen> createState() => _AddressFormScreenState();
}

class _AddressFormScreenState extends State<AddressFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _titleController;
  late TextEditingController _fullNameController;
  late TextEditingController _addressController;
  late TextEditingController _cityController;
  late TextEditingController _countryController;
  late TextEditingController _phoneController;
  bool _isDefault = false;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.address?.title ?? '');
    _fullNameController =
        TextEditingController(text: widget.address?.fullName ?? '');
    _addressController =
        TextEditingController(text: widget.address?.address ?? '');
    _cityController = TextEditingController(text: widget.address?.city ?? '');
    _countryController =
        TextEditingController(text: widget.address?.country ?? '');
    _phoneController = TextEditingController(text: widget.address?.phone ?? '');
    _isDefault = widget.address?.isDefault ?? false;
  }

  @override
  void dispose() {
    _titleController.dispose();
    _fullNameController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    _countryController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  void _saveAddress() {
    if (_formKey.currentState!.validate()) {
      final address = Address(
        id: widget.address?.id ?? DateTime.now().toString(),
        title: _titleController.text,
        fullName: _fullNameController.text,
        address: _addressController.text,
        city: _cityController.text,
        country: _countryController.text,
        phone: _phoneController.text,
        isDefault: _isDefault,
      );

      widget.onAddressSaved(address);
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.address == null ? 'Add Address' : 'Edit Address'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(
                labelText: 'Address Title (e.g., Home, Work)',
                border: OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter an address title';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _fullNameController,
              decoration: const InputDecoration(
                labelText: 'Full Name',
                border: OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter your full name';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _addressController,
              decoration: const InputDecoration(
                labelText: 'Street Address',
                border: OutlineInputBorder(),
              ),
              maxLines: 2,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter your street address';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _cityController,
              decoration: const InputDecoration(
                labelText: 'City',
                border: OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter your city';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _countryController,
              decoration: const InputDecoration(
                labelText: 'Country',
                border: OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter your country';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _phoneController,
              decoration: const InputDecoration(
                labelText: 'Phone Number',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.phone,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter your phone number';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            CheckboxListTile(
              title: const Text('Set as default address'),
              value: _isDefault,
              onChanged: (value) {
                setState(() {
                  _isDefault = value ?? false;
                });
              },
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _saveAddress,
              style: ElevatedButton.styleFrom(
                minimumSize: const Size(double.infinity, 50),
              ),
              child:
                  Text(widget.address == null ? 'Add Address' : 'Save Address'),
            ),
          ],
        ),
      ),
    );
  }
}

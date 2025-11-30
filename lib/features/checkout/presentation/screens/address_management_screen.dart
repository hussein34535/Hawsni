import 'package:flutter/material.dart';
import 'package:hawsni_app/features/checkout/models/address.dart';
import 'package:hawsni_app/core/services/api_service.dart';
import 'package:hawsni_app/core/themes/app_theme.dart';
import 'package:hawsni_app/core/widgets/spinning_loader.dart';

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

  Future<void> _loadAddresses() async {
    setState(() => _isLoading = true);
    try {
      final addressesData = await ApiService.getAddresses();

      setState(() {
        _addresses = addressesData
            .map((data) => Address(
                  id: data['_id'] ?? data['id'] ?? '',
                  title: data['title'] ?? 'Home',
                  fullName: data['fullName'] ?? '',
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
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AddressFormScreen(
          onAddressSaved: (newAddress) async {
            final addressMap = {
              'title': newAddress.title,
              'address': newAddress.address,
              'city': newAddress.city,
              'country': newAddress.country,
              'phone': newAddress.phone,
              'isDefault': newAddress.isDefault
            };

            final success = await ApiService.addAddress(addressMap);
            if (success) {
              _loadAddresses();
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                    content: Text('Address added successfully',
                        style: AppTheme.textTheme.bodyMedium
                            ?.copyWith(color: Colors.white)),
                    backgroundColor: AppTheme.successColor),
              );
            } else {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                    content: Text('Failed to add address',
                        style: AppTheme.textTheme.bodyMedium
                            ?.copyWith(color: Colors.white)),
                    backgroundColor: AppTheme.errorColor),
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
        backgroundColor: AppTheme.surfaceColor,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: Text('Delete Address',
            style: AppTheme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
        content: Text('Are you sure you want to delete this address?',
            style: AppTheme.textTheme.bodyMedium),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Cancel', style: AppTheme.textTheme.bodyMedium)),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              final success = await ApiService.deleteAddress(address.id);
              if (success) {
                _loadAddresses();
              }
            },
            child: const Text('Delete',
                style: TextStyle(color: AppTheme.errorColor)),
          ),
        ],
      ),
    );
  }

  void _selectAddress(Address address) {
    setState(() {
      _selectedAddress = address;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.scaffoldBackgroundColor,
      appBar: AppBar(
        title: Text('Shipping Addresses',
            style: const TextStyle(
                fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
        centerTitle: true,
        backgroundColor: AppTheme.scaffoldBackgroundColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppTheme.textPrimary),
          onPressed: () => Navigator.of(context).pop(),
        ),
        actions: [
          IconButton(
              onPressed: _addNewAddress,
              icon: const Icon(Icons.add, color: AppTheme.primaryColor)),
        ],
      ),
      body: _isLoading
          ? const Center(child: SpinningLoader())
          : _addresses.isEmpty
              ? _buildEmptyState()
              : ListView.separated(
                  padding: const EdgeInsets.all(24),
                  itemCount: _addresses.length,
                  separatorBuilder: (context, index) =>
                      const SizedBox(height: 16),
                  itemBuilder: (context, index) {
                    return _buildAddressCard(_addresses[index]);
                  },
                ),
      bottomNavigationBar: _addresses.isNotEmpty
          ? Container(
              padding: const EdgeInsets.all(24),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: AppTheme.borderColor)),
              ),
              child: ElevatedButton(
                onPressed: _selectedAddress != null
                    ? () => Navigator.pop(context, _selectedAddress)
                    : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  minimumSize: const Size(double.infinity, 56),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30)),
                  disabledBackgroundColor: AppTheme.textTertiary,
                  elevation: 0,
                ),
                child: const Text('Continue',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold)),
              ),
            )
          : null,
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: const Icon(Icons.location_on_outlined,
                size: 64, color: AppTheme.textTertiary),
          ),
          const SizedBox(height: 24),
          const Text('No addresses yet',
              style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary)),
          const SizedBox(height: 12),
          const Text('Add your first shipping address',
              style: TextStyle(fontSize: 16, color: AppTheme.textSecondary)),
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: _addNewAddress,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryColor,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30)),
              elevation: 0,
            ),
            child: const Text('Add Address',
                style: TextStyle(
                    color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildAddressCard(Address address) {
    final isSelected = _selectedAddress?.id == address.id;
    return GestureDetector(
      onTap: () => _selectAddress(address),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
          border: Border.all(
              color: isSelected ? AppTheme.primaryColor : AppTheme.borderColor,
              width: isSelected ? 2 : 1),
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
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.textPrimary)),
                        const SizedBox(height: 4),
                        Text(address.fullName,
                            style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                                color: AppTheme.textSecondary)),
                      ],
                    ),
                  ),
                  if (isSelected)
                    const Icon(Icons.check_circle,
                        color: AppTheme.primaryColor),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                  '${address.address}, ${address.city}, ${address.country}',
                  style: const TextStyle(
                      fontSize: 14, color: AppTheme.textSecondary)),
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(address.phone,
                  style: const TextStyle(
                      fontSize: 14, color: AppTheme.textSecondary)),
            ),
            const Divider(height: 24, color: AppTheme.dividerColor),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton.icon(
                    onPressed: () => _deleteAddress(address),
                    icon: const Icon(Icons.delete,
                        size: 18, color: AppTheme.errorColor),
                    label: const Text('Delete',
                        style: TextStyle(color: AppTheme.errorColor)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

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
      backgroundColor: AppTheme.scaffoldBackgroundColor,
      appBar: AppBar(
        title: Text(widget.address == null ? 'Add Address' : 'Edit Address',
            style: const TextStyle(
                fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
        centerTitle: true,
        backgroundColor: AppTheme.scaffoldBackgroundColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppTheme.textPrimary),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            _buildTextField(
                controller: _titleController,
                label: 'Address Title (e.g., Home, Work)',
                icon: Icons.label_outline),
            const SizedBox(height: 20),
            _buildTextField(
                controller: _fullNameController,
                label: 'Full Name',
                icon: Icons.person_outline),
            const SizedBox(height: 20),
            _buildTextField(
                controller: _addressController,
                label: 'Street Address',
                icon: Icons.home_outlined,
                maxLines: 2),
            const SizedBox(height: 20),
            _buildTextField(
                controller: _cityController,
                label: 'City',
                icon: Icons.location_city_outlined),
            const SizedBox(height: 20),
            _buildTextField(
                controller: _countryController,
                label: 'Country',
                icon: Icons.flag_outlined),
            const SizedBox(height: 20),
            _buildTextField(
                controller: _phoneController,
                label: 'Phone Number',
                icon: Icons.phone_outlined,
                keyboardType: TextInputType.phone),
            const SizedBox(height: 20),
            CheckboxListTile(
              title: const Text('Set as default address',
                  style: TextStyle(color: AppTheme.textPrimary)),
              value: _isDefault,
              onChanged: (value) => setState(() => _isDefault = value ?? false),
              activeColor: AppTheme.primaryColor,
              checkColor: Colors.white,
              contentPadding: EdgeInsets.zero,
              controlAffinity: ListTileControlAffinity.leading,
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: _saveAddress,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                minimumSize: const Size(double.infinity, 56),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30)),
                elevation: 0,
              ),
              child: Text(
                  widget.address == null ? 'Add Address' : 'Save Address',
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    int maxLines = 1,
    TextInputType? keyboardType,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(color: AppTheme.borderColor),
      ),
      child: TextFormField(
        controller: controller,
        maxLines: maxLines,
        keyboardType: keyboardType,
        style: const TextStyle(color: AppTheme.textPrimary),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: const TextStyle(color: AppTheme.textSecondary),
          prefixIcon: Icon(icon, color: AppTheme.textTertiary),
          border: InputBorder.none,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        ),
        validator: (value) =>
            value == null || value.isEmpty ? 'This field is required' : null,
      ),
    );
  }
}

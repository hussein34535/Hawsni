import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hwasi_app/features/cart/bloc/cart_bloc.dart';
import 'package:hwasi_app/features/cart/bloc/cart_state.dart';
import 'package:hwasi_app/features/cart/bloc/cart_event.dart';
import 'package:hwasi_app/features/orders/bloc/order_bloc.dart';
import 'package:hwasi_app/features/orders/bloc/order_event.dart';
import 'package:hwasi_app/features/orders/bloc/order_state.dart';
import 'package:hwasi_app/features/address/bloc/address_bloc.dart';
import 'package:hwasi_app/features/address/bloc/address_event.dart';
import 'package:hwasi_app/features/address/bloc/address_state.dart';
import 'package:hwasi_app/features/address/data/models/address_model.dart';
import 'package:hwasi_app/core/themes/app_theme.dart';
import 'package:hwasi_app/core/widgets/spinning_loader.dart';
import 'package:hwasi_app/l10n/generated/app_localizations.dart';
import 'package:hwasi_app/core/services/auth_service.dart';
import 'package:google_fonts/google_fonts.dart';

final List<String> egyptGovernorates = [
  'القاهرة',
  'الجيزة',
  'الأسكندرية',
  'الدقهلية',
  'البحر الأحمر',
  'البحيرة',
  'الفيوم',
  'الغربية',
  'الإسماعيلية',
  'المنوفية',
  'المنيا',
  'القليوبية',
  'السويس',
  'أسوان',
  'أسيوط',
  'بني سويف',
  'بور سعيد',
  'دمياط',
  'الشرقية',
  'جنوب سيناء',
  'كفر الشيخ',
  'مطروح',
  'الأقصر',
  'قنا',
  'سوهاج',
  'الساحل الشمالي',
];

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  bool _isLoading = false;
  final _formKey = GlobalKey<FormState>();

  // Guest Controllers
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();

  // Address Controllers
  final _streetController = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _zipController = TextEditingController();

  // State
  bool _isAddingAddress = false;

  bool get _isGuest => AuthService.token == null;

  @override
  void initState() {
    super.initState();
    if (!_isGuest) {
      context.read<AddressBloc>().add(LoadAddresses());
    } else {
      _isAddingAddress = true; // Guests must enter address
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _streetController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _zipController.dispose();
    super.dispose();
  }

  void _saveAddress() {
    if (_streetController.text.isEmpty || _cityController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppLocalizations.of(context)!.fillAddressDetails),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final newAddress = AddressModel(
      title: 'Home', // Default label
      name: AuthService.userName ?? 'User',
      phone: AuthService.userData?['phone'] ?? '',
      addressLine1: _streetController.text,
      city: _cityController.text,
      state: _stateController.text,
      zipCode: _zipController.text,
      country: 'Egypt',
    );

    context.read<AddressBloc>().add(AddAddress(newAddress));
    setState(() {
      _isAddingAddress = false;
      // Clear controllers? Maybe keep them populated in case of edit?
      // For now clear to show fresh state
      _streetController.clear();
      _cityController.clear();
      _stateController.clear();
      _zipController.clear();
    });
  }

  // Payment Method
  // Currently only Cash on Delivery is supported as per user request.

  void _processCheckout(List<CartItem> cartItems, double subtotal) {
    if (_isGuest && !_formKey.currentState!.validate()) {
      return;
    }

    // Auth User Validation
    AddressModel? selectedAddress;
    if (!_isGuest) {
      final addressState = context.read<AddressBloc>().state;
      selectedAddress = addressState.selectedAddress;

      if (selectedAddress == null && !_isAddingAddress) {
        // If no address selected and not adding one, prompt to add or select
        if (addressState.addresses.isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(AppLocalizations.of(context)!.pleaseAddAddress),
              backgroundColor: AppTheme.errorColor,
            ),
          );
          setState(() => _isAddingAddress = true);
          return;
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Please select a shipping address'),
              backgroundColor: AppTheme.errorColor,
            ),
          );
          return;
        }
      }
    }

    if (_isAddingAddress && (!_isGuest)) {
      // If adding address, user must save it first (or we auto-save?)
      // Better to force save for consistency
      if (_streetController.text.isNotEmpty) {
        _saveAddress();
        // Return and ask user to click Place Order again?
        // Or await the saving? Awaiting bloc is tricky here.
        // Let's ask user to click place order again after saving.
        return;
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppLocalizations.of(context)!.fillAddressDetails),
            backgroundColor: AppTheme.errorColor,
          ),
        );
        return;
      }
    }

    // Construct Address String
    String fullAddress;
    if (_isGuest) {
      fullAddress =
          '${_streetController.text}, ${_cityController.text}, ${_stateController.text}';
    } else {
      if (selectedAddress != null) {
        fullAddress =
            '${selectedAddress.addressLine1}, ${selectedAddress.city}, ${selectedAddress.state}';
      } else {
        // Fallback (should be covered by validation above)
        fullAddress = '${_streetController.text}, ${_cityController.text}';
      }
    }

    // Direct Cash on Delivery Submission
    _submitOrder(cartItems, subtotal, fullAddress, 'Cash on Delivery');
  }

  void _submitOrder(
    List<CartItem> cartItems,
    double subtotal,
    String fullAddress,
    String paymentMethod,
  ) {
    final orderData = {
      'shippingAddress': fullAddress,
      'paymentMethod': paymentMethod,
      'subtotal': subtotal,
      'discount': 0.0,
      'couponCode': null,
      if (_isGuest) ...{
        'guestName': _nameController.text,
        'guestPhone': _phoneController.text,
        'guestEmail': '',
      },
    };

    final items = cartItems
        .map(
          (item) => {
            'product': item.productId,
            'name': item.name,
            'quantity': item.quantity,
            'price': double.parse(
              item.price.replaceAll(RegExp(r'[^0-9.]'), ''),
            ),
          },
        )
        .toList();

    context.read<OrderBloc>().add(
          CreateOrder(orderData: orderData, items: items),
        );
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<OrderBloc, OrderState>(
      listener: (context, state) {
        if (state is OrderCreating) {
          setState(() => _isLoading = true);
        } else if (state is OrderCreated) {
          setState(() => _isLoading = false);
          context.read<CartBloc>().add(ClearCart());
          _showSuccessDialog();
        } else if (state is OrderError) {
          setState(() => _isLoading = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.message),
              backgroundColor: AppTheme.errorColor,
            ),
          );
        }
      },
      child: Scaffold(
        backgroundColor: AppTheme.scaffoldBackgroundColor,
        body: _isLoading
            ? const Center(child: SpinningLoader())
            : BlocBuilder<CartBloc, CartState>(
                builder: (context, state) {
                  if (state is CartLoaded) {
                    double subtotal = state.items.fold(
                      0,
                      (sum, item) =>
                          sum +
                          (double.parse(
                                item.price.replaceAll(RegExp(r'[^0-9.]'), ''),
                              ) *
                              item.quantity),
                    );

                    return Column(
                      children: [
                        Expanded(
                          child: CustomScrollView(
                            slivers: [
                              // Legendary AppBar
                              SliverAppBar(
                                floating: true,
                                pinned: true,
                                elevation: 0,
                                backgroundColor:
                                    AppTheme.scaffoldBackgroundColor,
                                leading: IconButton(
                                  icon: Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      shape: BoxShape.circle,
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.black
                                              .withValues(alpha: 0.05),
                                          blurRadius: 10,
                                          offset: const Offset(0, 4),
                                        ),
                                      ],
                                    ),
                                    child: const Icon(
                                      Icons.arrow_back,
                                      color: Colors.black,
                                      size: 20,
                                    ),
                                  ),
                                  onPressed: () => Navigator.of(context).pop(),
                                ),
                                title: Text(
                                  AppLocalizations.of(context)!.checkout,
                                  style: GoogleFonts.cairo(
                                    fontSize: 24,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.black,
                                  ),
                                ),
                                centerTitle: true,
                              ),

                              SliverPadding(
                                padding: const EdgeInsets.all(20),
                                sliver: SliverList(
                                  delegate: SliverChildListDelegate([
                                    // 1. Guest Info (Only if Guest)
                                    if (_isGuest) ...[
                                      _buildSectionTitle(
                                        'Guest Information',
                                        Icons.person_outline,
                                      ),
                                      _buildGuestForm(),
                                      const SizedBox(height: 32),
                                    ],

                                    // 2. Shipping Address
                                    _buildSectionTitle(
                                      AppLocalizations.of(context)!
                                          .shippingAddress,
                                      Icons.location_on_outlined,
                                    ),
                                    if (!_isGuest)
                                      BlocBuilder<AddressBloc, AddressState>(
                                        builder: (context, addressState) {
                                          if (addressState.status ==
                                              AddressStatus.loading) {
                                            return const Center(
                                              child: Padding(
                                                padding: EdgeInsets.all(8.0),
                                                child:
                                                    CircularProgressIndicator(),
                                              ),
                                            );
                                          }
                                          return _buildSavedAddressesList(
                                            addressState,
                                          );
                                        },
                                      ),

                                    if (_isGuest || _isAddingAddress)
                                      _buildAddressForm(),

                                    if (!_isGuest && !_isAddingAddress)
                                      Padding(
                                        padding: const EdgeInsets.only(top: 16),
                                        child: TextButton.icon(
                                          onPressed: () => setState(
                                              () => _isAddingAddress = true),
                                          icon: const Icon(
                                            Icons.add,
                                            color: AppTheme.primaryColor,
                                          ),
                                          label: Text(
                                            AppLocalizations.of(
                                              context,
                                            )!
                                                .addNewAddress,
                                            style: GoogleFonts.cairo(
                                              color: AppTheme.primaryColor,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                          style: TextButton.styleFrom(
                                            padding: const EdgeInsets.symmetric(
                                              vertical: 16,
                                              horizontal: 24,
                                            ),
                                            backgroundColor: AppTheme
                                                .primaryColor
                                                .withValues(alpha: 0.05),
                                            shape: RoundedRectangleBorder(
                                              borderRadius:
                                                  BorderRadius.circular(12),
                                            ),
                                          ),
                                        ),
                                      ),
                                    const SizedBox(height: 32),

                                    // 3. Payment Method
                                    _buildSectionTitle(
                                      AppLocalizations.of(context)!
                                          .paymentMethod,
                                      Icons.payment,
                                    ),
                                    _buildPaymentMethodSelector(context),
                                    const SizedBox(height: 32),

                                    // 4. Order Summary
                                    _buildSectionTitle(
                                      AppLocalizations.of(context)!
                                          .orderSummary,
                                      Icons.receipt_long,
                                    ),
                                    _buildOrderSummary(context, subtotal),
                                    const SizedBox(height: 40),
                                  ]),
                                ),
                              ),
                            ],
                          ),
                        ),
                        // Sticky Bottom Bar
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.05),
                                blurRadius: 10,
                                offset: const Offset(0, -5),
                              ),
                            ],
                          ),
                          child: SafeArea(
                            child: SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: () =>
                                    _processCheckout(state.items, subtotal),
                                style: ElevatedButton.styleFrom(
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 18),
                                  backgroundColor:
                                      Colors.black, // Premium Black
                                  elevation: 0,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      AppLocalizations.of(context)!.placeOrder,
                                      style: GoogleFonts.cairo(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    const Icon(
                                      Icons.arrow_forward_rounded,
                                      color: Colors.white,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    );
                  }
                  return const Center(child: Text("Cart is empty"));
                },
              ),
      ),
    );
  }

  Widget _buildSectionTitle(String title, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16, left: 4),
      child: Row(
        children: [
          Icon(icon, color: AppTheme.primaryColor, size: 24),
          const SizedBox(width: 8),
          Text(
            title,
            style: GoogleFonts.cairo(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: AppTheme.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGuestForm() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Form(
        key: _formKey,
        child: Column(
          children: [
            _buildTextField(
              controller: _nameController,
              label: AppLocalizations.of(context)!.fullName,
              icon: Icons.person_outline,
              validator: (v) => v?.isEmpty == true ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            _buildTextField(
              controller: _phoneController,
              label: AppLocalizations.of(context)!.phoneNumber,
              icon: Icons.phone_outlined,
              validator: (v) => v?.isEmpty == true ? 'Required' : null,
              keyboardType: TextInputType.phone,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAddressForm() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!_isGuest)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Text(
                AppLocalizations.of(context)!.addNewAddress,
                style: GoogleFonts.cairo(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ),
          _buildTextField(
            controller: _streetController,
            label: AppLocalizations.of(context)!.streetAddress,
            icon: Icons.home_outlined,
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildTextField(
                  controller: _cityController,
                  label: AppLocalizations.of(context)!.city,
                  icon: Icons.location_city,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _stateController.text.isNotEmpty &&
                          egyptGovernorates.contains(_stateController.text)
                      ? _stateController.text
                      : null,
                  decoration: InputDecoration(
                    labelText: AppLocalizations.of(context)!.state,
                    labelStyle: GoogleFonts.cairo(color: Colors.grey[600]),
                    prefixIcon: Icon(
                      Icons.map,
                      color: AppTheme.primaryColor.withValues(alpha: 0.7),
                    ),
                    filled: true,
                    fillColor: Colors.grey[50],
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey[200]!),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(
                        color: AppTheme.primaryColor,
                        width: 1.5,
                      ),
                    ),
                  ),
                  items: egyptGovernorates.map((String gov) {
                    return DropdownMenuItem<String>(
                      value: gov,
                      child: Text(gov, style: GoogleFonts.cairo(fontSize: 14)),
                    );
                  }).toList(),
                  onChanged: (String? newValue) {
                    setState(() {
                      _stateController.text = newValue ?? '';
                    });
                  },
                  validator: (value) =>
                      value == null || value.isEmpty ? 'Required' : null,
                  icon: const Icon(Icons.keyboard_arrow_down),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (!_isGuest)
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _saveAddress,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text(
                  AppLocalizations.of(context)!.saveAddress,
                  style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSavedAddressesList(AddressState addressState) {
    if (addressState.addresses.isEmpty) return const SizedBox.shrink();

    return Column(
      children: List.generate(addressState.addresses.length, (index) {
        final address = addressState.addresses[index];
        final isSelected = addressState.selectedAddressId == address.id;

        return GestureDetector(
          onTap: () {
            context.read<AddressBloc>().add(SelectAddress(address.id!));
            setState(() => _isAddingAddress = false);
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isSelected
                  ? AppTheme.primaryColor.withValues(alpha: 0.05)
                  : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isSelected ? AppTheme.primaryColor : Colors.grey[200]!,
                width: isSelected ? 2 : 1,
              ),
              boxShadow: isSelected
                  ? [
                      BoxShadow(
                        color: AppTheme.primaryColor.withValues(alpha: 0.1),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ]
                  : null,
            ),
            child: Row(
              children: [
                Icon(
                  isSelected
                      ? Icons.radio_button_checked
                      : Icons.radio_button_off,
                  color: isSelected ? AppTheme.primaryColor : Colors.grey,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        address.title,
                        style: GoogleFonts.cairo(
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${address.addressLine1}, ${address.city}, ${address.state}',
                        style: GoogleFonts.cairo(
                          color: AppTheme.textSecondary,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
                if (isSelected)
                  IconButton(
                    icon: const Icon(Icons.delete_outline, color: Colors.grey),
                    onPressed: () {
                      context.read<AddressBloc>().add(
                            DeleteAddress(address.id!),
                          );
                    },
                  ),
              ],
            ),
          ),
        );
      }),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    String? Function(String?)? validator,
    TextInputType? keyboardType,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      validator: validator,
      style: GoogleFonts.cairo(fontSize: 16),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: GoogleFonts.cairo(color: Colors.grey[600]),
        prefixIcon: Icon(
          icon,
          color: AppTheme.primaryColor.withValues(alpha: 0.7),
        ),
        filled: true,
        fillColor: Colors.grey[50],
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey[200]!),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(
            color: AppTheme.primaryColor,
            width: 1.5,
          ),
        ),
      ),
    );
  }

  Widget _buildPaymentMethodSelector(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: Colors.green.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.money, color: Colors.green),
        ),
        title: Text(
          AppLocalizations.of(context)!.cashOnDelivery,
          style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        subtitle: Text(
          AppLocalizations.of(context)!.payOnDeliverySubtitle,
          style: GoogleFonts.cairo(color: Colors.grey[500], fontSize: 12),
        ),
        trailing: const Icon(Icons.check_circle, color: AppTheme.primaryColor),
      ),
    );
  }

  Widget _buildOrderSummary(BuildContext context, double subtotal) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.grey[100]!),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        children: [
          _buildSummaryRow(
            AppLocalizations.of(context)!.subtotal,
            '${subtotal.toStringAsFixed(2)} EGP',
          ),
          const SizedBox(height: 12),
          _buildSummaryRow(
              AppLocalizations.of(context)!.shipping, '100.00 EGP'),
          const SizedBox(height: 12),
          _buildSummaryRow(
            AppLocalizations.of(context)!.tax,
            '${(subtotal * 0.05).toStringAsFixed(2)} EGP',
          ),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 20),
            child: Divider(color: Colors.grey[200]),
          ),
          _buildSummaryRow(
            AppLocalizations.of(context)!.total,
            '${(subtotal + 100 + (subtotal * 0.05)).toStringAsFixed(2)} EGP', // Using 100 EGP as base shipping
            isTotal: true,
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value, {bool isTotal = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.cairo(
            color: isTotal ? Colors.black : Colors.grey[600],
            fontWeight: isTotal ? FontWeight.bold : FontWeight.w500,
            fontSize: isTotal ? 18 : 16,
          ),
        ),
        Text(
          value,
          style: GoogleFonts.poppins(
            color: isTotal ? AppTheme.primaryColor : Colors.black,
            fontWeight: FontWeight.bold,
            fontSize: isTotal ? 22 : 16,
          ),
        ),
      ],
    );
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        contentPadding: const EdgeInsets.all(32),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.green.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.check_rounded,
                color: Colors.green,
                size: 48,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              AppLocalizations.of(context)!.orderPlacedSuccess,
              textAlign: TextAlign.center,
              style: GoogleFonts.cairo(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.black,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              AppLocalizations.of(context)!.orderConfirmationMessage,
              textAlign: TextAlign.center,
              style: GoogleFonts.cairo(color: Colors.grey[600], fontSize: 16),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.of(context).popUntil((route) => route.isFirst);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: Text(
                  AppLocalizations.of(context)!.continueShopping,
                  style: GoogleFonts.cairo(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

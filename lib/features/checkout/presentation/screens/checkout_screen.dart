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
import 'package:hwasi_app/core/widgets/spinning_loader.dart';
import 'package:hwasi_app/core/services/auth_service.dart';
import 'package:hwasi_app/core/services/coupon_service.dart';
import 'package:hwasi_app/core/services/api_service.dart';
import 'package:hwasi_app/features/checkout/presentation/screens/order_success_screen.dart';

final List<String> egyptGovernorates = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر',
  'البحيرة', 'الفيوم', 'الغربية', 'الإسماعيلية', 'المنوفية',
  'المنيا', 'القليوبية', 'السويس', 'أسوان', 'أسيوط', 'بني سويف',
  'بورسعيد', 'دمياط', 'الشرقية', 'جنوب سيناء', 'كفر الشيخ',
  'مطروح', 'الأقصر', 'قنا', 'سوهاج', 'الساحل الشمالي',
];

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen>
    with SingleTickerProviderStateMixin {
  bool _isLoading = false;
  final _formKey = GlobalKey<FormState>();

  // Guest Controllers
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();

  // Address Controllers
  final _streetController = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();

  bool _isAddingAddress = false;

  // Coupon State
  final _couponController = TextEditingController();
  bool _isCouponValidating = false;
  bool _isCouponApplied = false;
  String? _couponCode;
  double _couponDiscount = 0.0;
  String _couponType = 'percentage';
  String? _couponError;

  final String _selectedPaymentMethod = 'Cash on Delivery';

  // Shipping
  Map<String, dynamic>? _shippingSettings;

  bool get _isGuest => AuthService.token == null;

  @override
  void initState() {
    super.initState();
    _fetchShippingSettings();
    if (!_isGuest) {
      context.read<AddressBloc>().add(LoadAddresses());
    } else {
      _isAddingAddress = true;
    }
  }

  Future<void> _fetchShippingSettings() async {
    final settings = await ApiService.getShippingSettings();
    if (mounted) setState(() => _shippingSettings = settings);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _streetController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _couponController.dispose();
    super.dispose();
  }

  // ─── Coupon ────────────────────────────────────────────────────────────────

  Future<void> _validateCoupon() async {
    final code = _couponController.text.trim();
    if (code.isEmpty) return;
    setState(() { _isCouponValidating = true; _couponError = null; });
    try {
      final result = await CouponService.validateCoupon(code);
      if (result != null) {
        setState(() {
          _isCouponApplied = true;
          _couponCode = result['code'];
          _couponDiscount = (result['discount'] ?? 0).toDouble();
          _couponType = result['type'] ?? 'percentage';
          _couponError = null;
        });
      } else {
        setState(() { _couponError = 'كوبون غير صالح'; _isCouponApplied = false; });
      }
    } catch (_) {
      setState(() { _couponError = 'كوبون غير صالح أو منتهي الصلاحية'; _isCouponApplied = false; });
    } finally {
      setState(() => _isCouponValidating = false);
    }
  }

  void _removeCoupon() {
    setState(() {
      _isCouponApplied = false;
      _couponCode = null;
      _couponDiscount = 0.0;
      _couponError = null;
      _couponController.clear();
    });
  }

  double _calculateDiscount(double subtotal) {
    if (!_isCouponApplied) return 0.0;
    return _couponType == 'percentage'
        ? subtotal * (_couponDiscount / 100)
        : _couponDiscount;
  }

  // ─── Shipping ──────────────────────────────────────────────────────────────

  Map<String, dynamic> _getShippingDetails(String governorate, double subtotal) {
    if (_shippingSettings == null) return {'cost': 0.0, 'days_min': 3, 'days_max': 7};
    final freeThreshold = (_shippingSettings!['free_shipping_threshold'] ?? 0).toDouble();
    if (freeThreshold > 0 && subtotal >= freeThreshold) {
      return {
        'cost': 0.0,
        'days_min': _shippingSettings!['default_days_min'] ?? 3,
        'days_max': _shippingSettings!['default_days_max'] ?? 7,
      };
    }
    final govSettings = _shippingSettings!['governorate_settings'] as Map<String, dynamic>? ?? {};
    if (governorate.isNotEmpty && govSettings.containsKey(governorate)) {
      final custom = govSettings[governorate] as Map<String, dynamic>;
      return {
        'cost': (custom['cost'] ?? 0).toDouble(),
        'days_min': custom['days_min'] ?? 3,
        'days_max': custom['days_max'] ?? 7,
      };
    }
    return {
      'cost': (_shippingSettings!['delivery_cost'] ?? 0).toDouble(),
      'days_min': _shippingSettings!['default_days_min'] ?? 3,
      'days_max': _shippingSettings!['default_days_max'] ?? 7,
    };
  }

  double _calculateTotal() {
    final state = context.read<CartBloc>().state;
    double subtotal = 0.0;
    if (state is CartLoaded) {
      subtotal = state.items.fold(0, (sum, item) =>
          sum + (double.parse(item.price.replaceAll(RegExp(r'[^0-9.]'), '')) * item.quantity));
    }
    final addressState = context.read<AddressBloc>().state;
    String gov = (!_isGuest && !_isAddingAddress && addressState.selectedAddress != null)
        ? addressState.selectedAddress!.state
        : _stateController.text.trim();
    final discount = _calculateDiscount(subtotal);
    return subtotal - discount + (_getShippingDetails(gov, subtotal)['cost'] as double);
  }

  // ─── Checkout Flow ─────────────────────────────────────────────────────────

  void _processCheckout(List<CartItem> cartItems, double subtotal) {
    if (_isGuest && !_formKey.currentState!.validate()) return;

    AddressModel? selectedAddress;
    if (!_isGuest) {
      final addressState = context.read<AddressBloc>().state;
      selectedAddress = addressState.selectedAddress;
      if (selectedAddress == null && !_isAddingAddress) {
        if (addressState.addresses.isEmpty) {
          setState(() => _isAddingAddress = true);
        }
        _showSnack('برجاء اختيار أو إضافة عنوان الشحن');
        return;
      }
    }

    if (_isAddingAddress && !_isGuest) {
      if (_streetController.text.isNotEmpty && _cityController.text.isNotEmpty && _stateController.text.isNotEmpty) {
        _saveAddress();
      } else {
        _showSnack('برجاء ملء جميع بيانات العنوان');
        return;
      }
    }

    if ((_isGuest || _isAddingAddress) &&
        (_streetController.text.isEmpty || _cityController.text.isEmpty || _stateController.text.isEmpty)) {
      _showSnack('برجاء ملء جميع حقول العنوان');
      return;
    }

    if (_isGuest && (_nameController.text.isEmpty || _phoneController.text.isEmpty)) {
      _showSnack('برجاء ملء بيانات التواصل');
      return;
    }

    // Phone validation
    if (_isGuest || _isAddingAddress) {
      final phone = _isGuest ? _phoneController.text : (AuthService.userData?['phone'] ?? _phoneController.text);
      final clean = phone.replaceAll(RegExp(r'[\s\-+]'), '');
      if (!RegExp(r'^2?(010|011|012|015)\d{8}$').hasMatch(clean) && AuthService.token == null) {
        _showSnack('رقم هاتف مصري غير صحيح (مثال: 01012345678)');
        return;
      }
    }

    // Build address map
    Map<String, dynamic> shippingAddress;
    if (_isGuest || _isAddingAddress) {
      shippingAddress = {
        'name': _isGuest ? _nameController.text : (AuthService.userName ?? 'User'),
        'phone': _isGuest ? _phoneController.text : (AuthService.userData?['phone'] ?? _phoneController.text),
        'street': _streetController.text,
        'city': _cityController.text,
        'state': _stateController.text,
        'address': '${_streetController.text}, ${_cityController.text}, ${_stateController.text}',
      };
    } else {
      shippingAddress = {
        'name': selectedAddress!.name,
        'phone': selectedAddress.phone,
        'street': selectedAddress.addressLine1,
        'city': selectedAddress.city,
        'state': selectedAddress.state,
        'address': '${selectedAddress.addressLine1}, ${selectedAddress.city}, ${selectedAddress.state}',
      };
    }

    _submitOrder(cartItems, subtotal, shippingAddress, 'Cash on Delivery');
  }

  void _saveAddress() {
    if (_streetController.text.isEmpty || _cityController.text.isEmpty || _phoneController.text.isEmpty) {
      _showSnack('برجاء ملء بيانات العنوان');
      return;
    }
    final newAddress = AddressModel(
      title: 'Home',
      name: _isGuest ? _nameController.text : (AuthService.userName ?? 'User'),
      phone: _isGuest ? _phoneController.text : (AuthService.userData?['phone'] ?? _phoneController.text),
      addressLine1: _streetController.text,
      city: _cityController.text,
      state: _stateController.text,
      zipCode: '',
      country: 'Egypt',
    );
    if (!_isGuest) context.read<AddressBloc>().add(AddAddress(newAddress));
    setState(() => _isAddingAddress = false);
  }

  void _submitOrder(List<CartItem> cartItems, double subtotal, dynamic shippingAddress, String paymentMethod) {
    final discount = _calculateDiscount(subtotal);
    final orderData = {
      'shippingAddress': shippingAddress,
      'paymentMethod': paymentMethod,
      'subtotal': subtotal,
      'shippingFee': _calculateTotal() - (subtotal - discount),
      'total': _calculateTotal(),
      'discount': discount,
      'couponCode': _couponCode,
      'guestName': _isGuest ? _nameController.text : (AuthService.userName ?? AuthService.userData?['name'] ?? ''),
      'guestPhone': _isGuest ? _phoneController.text : (AuthService.userData?['phone'] ?? ''),
      'guestEmail': AuthService.userData?['email'] ?? '',
    };
    final items = cartItems.map((item) => {
      'product': item.productId,
      'name': item.name,
      'imageUrl': item.imageUrl,
      'quantity': item.quantity,
      'price': double.parse(item.price.replaceAll(RegExp(r'[^0-9.]'), '')),
    }).toList();
    context.read<OrderBloc>().add(CreateOrder(orderData: orderData, items: items));
  }

  void _showSnack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg, style: const TextStyle(fontFamily: 'Cairo')),
        backgroundColor: Colors.black87,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  void _navigateToSuccessScreen(String? orderId) {
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (context) => OrderSuccessScreen(
          orderDetails: {
            'orderId': orderId ?? 'N/A',
            'total': _calculateTotal().toStringAsFixed(2),
            'paymentMethod': _selectedPaymentMethod,
          },
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  BUILD
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Widget build(BuildContext context) {
    return BlocListener<OrderBloc, OrderState>(
      listener: (context, state) {
        if (state is OrderCreating) {
          setState(() => _isLoading = true);
        } else if (state is OrderCreated) {
          setState(() => _isLoading = false);
          context.read<CartBloc>().add(ClearCart());
          _navigateToSuccessScreen(state.order['id']?.toString() ?? state.order['orderId']?.toString());
        } else if (state is OrderError) {
          setState(() => _isLoading = false);
          _showSnack(state.message);
        }
      },
      child: Scaffold(
        backgroundColor: const Color(0xFFF7F7F7),
        body: _isLoading
            ? const Center(child: SpinningLoader())
            : BlocBuilder<CartBloc, CartState>(
                builder: (context, state) {
                  if (state is CartLoaded) {
                    final subtotal = state.items.fold<double>(0, (sum, item) =>
                        sum + (double.parse(item.price.replaceAll(RegExp(r'[^0-9.]'), '')) * item.quantity));
                    return _buildBody(state.items, subtotal);
                  }
                  return const Center(child: Text('السلة فارغة'));
                },
              ),
      ),
    );
  }

  Widget _buildBody(List<CartItem> cartItems, double subtotal) {
    return Column(
      children: [
        // ── AppBar ──────────────────────────────────────────────────────────
        _buildAppBar(),

        // ── Scrollable Content ──────────────────────────────────────────────
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.only(bottom: 24),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Guest info
                  if (_isGuest) ...[
                    _buildSection(
                      step: '1',
                      title: 'بيانات التواصل',
                      child: _buildContactFields(),
                    ),
                  ],

                  // Shipping address
                  _buildSection(
                    step: _isGuest ? '2' : '1',
                    title: 'عنوان التوصيل',
                    child: _buildAddressSection(),
                  ),

                  // Payment
                  _buildSection(
                    step: _isGuest ? '3' : '2',
                    title: 'طريقة الدفع',
                    child: _buildPaymentCard(),
                  ),

                  // Coupon
                  _buildSection(
                    step: _isGuest ? '4' : '3',
                    title: 'كود الخصم',
                    child: _buildCouponRow(),
                  ),

                  // Summary
                  _buildOrderSummarySection(subtotal),

                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
        ),

        // ── Sticky Bottom Bar ────────────────────────────────────────────────
        _buildBottomBar(cartItems, subtotal),
      ],
    );
  }

  // ─── AppBar ────────────────────────────────────────────────────────────────

  Widget _buildAppBar() {
    return Container(
      color: const Color(0xFFF7F7F7),
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 8,
        bottom: 12,
        left: 16,
        right: 16,
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.of(context).pop(),
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 8, offset: const Offset(0, 2))],
              ),
              child: const Icon(Icons.arrow_back_ios_new, size: 16, color: Colors.black),
            ),
          ),
          const Expanded(
            child: Center(
              child: Text(
                'إتمام الطلب',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontWeight: FontWeight.w800,
                  fontSize: 18,
                  color: Colors.black,
                ),
              ),
            ),
          ),
          const SizedBox(width: 40),
        ],
      ),
    );
  }

  // ─── Section Wrapper ───────────────────────────────────────────────────────

  Widget _buildSection({required String step, required String title, required Widget child}) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: const BoxDecoration(
                  color: Colors.black,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    step,
                    style: const TextStyle(
                      color: Colors.white,
                      fontFamily: 'Cairo',
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Text(
                title,
                style: const TextStyle(
                  fontFamily: 'Cairo',
                  fontWeight: FontWeight.w800,
                  fontSize: 16,
                  color: Colors.black,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 10, offset: const Offset(0, 2))],
            ),
            padding: const EdgeInsets.all(16),
            child: child,
          ),
        ],
      ),
    );
  }

  // ─── Contact Fields (Guest) ────────────────────────────────────────────────

  Widget _buildContactFields() {
    return Column(
      children: [
        _buildCleanField(
          controller: _nameController,
          label: 'الاسم بالكامل',
          icon: Icons.person_outline_rounded,
          validator: (v) => v?.isEmpty == true ? 'مطلوب' : null,
        ),
        const SizedBox(height: 12),
        _buildCleanField(
          controller: _phoneController,
          label: 'رقم الموبايل',
          icon: Icons.phone_outlined,
          keyboardType: TextInputType.phone,
          validator: (v) => v?.isEmpty == true ? 'مطلوب' : null,
        ),
      ],
    );
  }

  // ─── Address Section ───────────────────────────────────────────────────────

  Widget _buildAddressSection() {
    if (_isGuest) return _buildAddressFields();

    return BlocBuilder<AddressBloc, AddressState>(
      builder: (context, state) {
        return Column(
          children: [
            // Saved addresses
            if (state.addresses.isNotEmpty) ...[
              ...state.addresses.map((address) {
                final isSelected = state.selectedAddressId == address.id;
                return GestureDetector(
                  onTap: () {
                    context.read<AddressBloc>().add(SelectAddress(address.id!));
                    setState(() => _isAddingAddress = false);
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      color: isSelected ? Colors.black : const Color(0xFFF7F7F7),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          isSelected ? Icons.check_circle_rounded : Icons.radio_button_off_rounded,
                          color: isSelected ? Colors.white : Colors.grey,
                          size: 20,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                address.title,
                                style: TextStyle(
                                  fontFamily: 'Cairo',
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                  color: isSelected ? Colors.white : Colors.black,
                                ),
                              ),
                              Text(
                                '${address.addressLine1}, ${address.city}, ${address.state}',
                                style: TextStyle(
                                  fontFamily: 'Cairo',
                                  fontSize: 12,
                                  color: isSelected ? Colors.white70 : Colors.grey[600],
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                        if (isSelected)
                          GestureDetector(
                            onTap: () => context.read<AddressBloc>().add(DeleteAddress(address.id!)),
                            child: const Icon(Icons.close, color: Colors.white54, size: 18),
                          ),
                      ],
                    ),
                  ),
                );
              }),
              const SizedBox(height: 4),
            ],

            // "Add address" toggle
            if (!_isAddingAddress)
              GestureDetector(
                onTap: () => setState(() => _isAddingAddress = true),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.black12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.add, size: 18, color: Colors.black54),
                      SizedBox(width: 6),
                      Text(
                        'إضافة عنوان جديد',
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          fontWeight: FontWeight.w600,
                          color: Colors.black54,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            // New address fields
            if (_isAddingAddress) ...[
              if (state.addresses.isNotEmpty) const SizedBox(height: 8),
              _buildAddressFields(showSaveButton: true),
            ],
          ],
        );
      },
    );
  }

  Widget _buildAddressFields({bool showSaveButton = false}) {
    return Column(
      children: [
        _buildCleanField(
          controller: _streetController,
          label: 'الشارع والرقم',
          icon: Icons.home_outlined,
        ),
        const SizedBox(height: 12),
        _buildCleanField(
          controller: _cityController,
          label: 'المدينة / الحي',
          icon: Icons.location_city_outlined,
        ),
        const SizedBox(height: 12),
        // Governorate Dropdown
        DropdownButtonFormField<String>(
          initialValue: _stateController.text.isNotEmpty && egyptGovernorates.contains(_stateController.text)
              ? _stateController.text
              : null,
          isExpanded: true,
          decoration: _inputDecoration('المحافظة', Icons.map_outlined),
          items: egyptGovernorates
              .map((g) => DropdownMenuItem(value: g, child: Text(g, style: const TextStyle(fontFamily: 'Cairo', fontSize: 14))))
              .toList(),
          onChanged: (v) => setState(() => _stateController.text = v ?? ''),
          validator: (v) => v == null || v.isEmpty ? 'اختر المحافظة' : null,
          icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Colors.black54),
        ),
        if (showSaveButton && !_isGuest) ...[
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: TextButton(
              onPressed: _saveAddress,
              style: TextButton.styleFrom(
                backgroundColor: Colors.black,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('حفظ العنوان', style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ],
    );
  }

  // ─── Payment Card ──────────────────────────────────────────────────────────

  Widget _buildPaymentCard() {
    return Row(
      children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(Icons.payments_outlined, color: Colors.white, size: 20),
        ),
        const SizedBox(width: 14),
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('الدفع عند الاستلام', style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold, fontSize: 15, color: Colors.black)),
              Text('Cash on Delivery', style: TextStyle(fontFamily: 'Cairo', fontSize: 12, color: Colors.grey)),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: Colors.green.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(20),
          ),
          child: const Text('محدد', style: TextStyle(fontFamily: 'Cairo', color: Colors.green, fontWeight: FontWeight.bold, fontSize: 12)),
        ),
      ],
    );
  }

  // ─── Coupon Row ────────────────────────────────────────────────────────────

  Widget _buildCouponRow() {
    return Column(
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: TextFormField(
                controller: _couponController,
                enabled: !_isCouponApplied,
                textDirection: TextDirection.ltr,
                style: const TextStyle(fontFamily: 'Cairo', fontSize: 15, letterSpacing: 1),
                decoration: _inputDecoration('أدخل كود الخصم', Icons.confirmation_number_outlined).copyWith(
                  fillColor: _isCouponApplied ? Colors.green.withValues(alpha: 0.05) : Colors.white,
                ),
              ),
            ),
            const SizedBox(width: 10),
            SizedBox(
              height: 50,
              child: ElevatedButton(
                onPressed: _isCouponApplied ? _removeCoupon : (_isCouponValidating ? null : _validateCoupon),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _isCouponApplied ? Colors.red.withValues(alpha: 0.08) : Colors.black,
                  foregroundColor: _isCouponApplied ? Colors.red : Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                ),
                child: _isCouponValidating
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text(
                        _isCouponApplied ? 'إلغاء' : 'تطبيق',
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          fontWeight: FontWeight.bold,
                          color: _isCouponApplied ? Colors.red : Colors.white,
                          fontSize: 14,
                        ),
                      ),
              ),
            ),
          ],
        ),
        if (_couponError != null) ...[
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.info_outline, size: 14, color: Colors.red),
              const SizedBox(width: 6),
              Text(_couponError!, style: const TextStyle(fontFamily: 'Cairo', color: Colors.red, fontSize: 12)),
            ],
          ),
        ],
        if (_isCouponApplied) ...[
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.green.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                const Icon(Icons.check_circle_outline, color: Colors.green, size: 16),
                const SizedBox(width: 8),
                Text(
                  _couponType == 'percentage'
                      ? 'تم تطبيق خصم ${_couponDiscount.toStringAsFixed(0)}%'
                      : 'تم تطبيق خصم ${_couponDiscount.toStringAsFixed(0)} EGP',
                  style: const TextStyle(fontFamily: 'Cairo', color: Colors.green, fontWeight: FontWeight.bold, fontSize: 13),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  // ─── Order Summary ─────────────────────────────────────────────────────────

  Widget _buildOrderSummarySection(double subtotal) {
    return BlocBuilder<AddressBloc, AddressState>(
      builder: (context, addressState) {
        final gov = (!_isGuest && !_isAddingAddress && addressState.selectedAddress != null)
            ? addressState.selectedAddress!.state
            : _stateController.text.trim();
        final shippingDetails = _getShippingDetails(gov, subtotal);
        final shipping = shippingDetails['cost'] as double;
        final daysMin = shippingDetails['days_min'];
        final daysMax = shippingDetails['days_max'];
        final discount = _calculateDiscount(subtotal);
        final total = subtotal - discount + shipping;

        return Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 10, offset: const Offset(0, 2))],
            ),
            child: Column(
              children: [
                // Header
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  decoration: const BoxDecoration(
                    color: Colors.black,
                    borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.receipt_long_outlined, color: Colors.white, size: 18),
                      SizedBox(width: 8),
                      Text('ملخص الطلب', style: TextStyle(fontFamily: 'Cairo', color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                    ],
                  ),
                ),

                // Rows
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _summaryRow('المجموع الفرعي', '${subtotal.toStringAsFixed(2)} EGP'),
                      if (_isCouponApplied) ...[
                        const SizedBox(height: 10),
                        _summaryRow('خصم ($_couponCode)', '- ${discount.toStringAsFixed(2)} EGP', color: Colors.green),
                      ],
                      const SizedBox(height: 10),
                      _summaryRow(
                        'الشحن',
                        shipping == 0 ? '🎉 مجاني' : '${shipping.toStringAsFixed(0)} EGP',
                        sub: 'توصيل خلال $daysMin - $daysMax أيام',
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 14),
                        child: Divider(height: 1, color: Color(0xFFEEEEEE)),
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('الإجمالي', style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w800, fontSize: 16, color: Colors.black)),
                          Text(
                            '${total.toStringAsFixed(2)} EGP',
                            style: const TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w900, fontSize: 22, color: Colors.black),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _summaryRow(String label, String value, {Color? color, String? sub}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: TextStyle(fontFamily: 'Cairo', fontSize: 14, color: color ?? Colors.grey[600], fontWeight: FontWeight.w600)),
            if (sub != null)
              Text(sub, style: TextStyle(fontFamily: 'Cairo', fontSize: 11, color: Colors.grey[400])),
          ],
        ),
        Text(value, style: TextStyle(fontFamily: 'Cairo', fontSize: 14, fontWeight: FontWeight.bold, color: color ?? Colors.black)),
      ],
    );
  }

  // ─── Bottom Bar ────────────────────────────────────────────────────────────

  Widget _buildBottomBar(List<CartItem> cartItems, double subtotal) {
    return BlocBuilder<AddressBloc, AddressState>(
      builder: (context, addressState) {
        final gov = (!_isGuest && !_isAddingAddress && addressState.selectedAddress != null)
            ? addressState.selectedAddress!.state
            : _stateController.text.trim();
        final discount = _calculateDiscount(subtotal);
        final shipping = (_getShippingDetails(gov, subtotal)['cost'] as double);
        final total = subtotal - discount + shipping;

        return Container(
          padding: EdgeInsets.only(
            left: 16,
            right: 16,
            top: 16,
            bottom: MediaQuery.of(context).padding.bottom + 16,
          ),
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 20, offset: const Offset(0, -4))],
          ),
          child: Row(
            children: [
              // Total
              Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('الإجمالي', style: TextStyle(fontFamily: 'Cairo', color: Colors.grey, fontSize: 12)),
                  Text(
                    '${total.toStringAsFixed(2)} EGP',
                    style: const TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w900, fontSize: 20, color: Colors.black),
                  ),
                ],
              ),
              const SizedBox(width: 16),
              // Button
              Expanded(
                child: GestureDetector(
                  onTap: () => _processCheckout(cartItems, subtotal),
                  child: Container(
                    height: 52,
                    decoration: BoxDecoration(
                      color: Colors.black,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('تأكيد الطلب', style: TextStyle(fontFamily: 'Cairo', color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                        SizedBox(width: 8),
                        Icon(Icons.arrow_forward_ios_rounded, color: Colors.white, size: 14),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  Widget _buildCleanField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    String? Function(String?)? validator,
    TextInputType? keyboardType,
  }) {
    return TextFormField(
      controller: controller,
      validator: validator,
      keyboardType: keyboardType,
      style: const TextStyle(fontFamily: 'Cairo', fontSize: 15),
      decoration: _inputDecoration(label, icon),
    );
  }

  InputDecoration _inputDecoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(fontFamily: 'Cairo', color: Colors.grey, fontSize: 14),
      prefixIcon: Icon(icon, color: Colors.black54, size: 20),
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: BorderSide(color: Colors.grey.shade400, width: 1)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: BorderSide(color: Colors.grey.shade300, width: 1)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: const BorderSide(color: Colors.black, width: 1)),
      errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: const BorderSide(color: Colors.red)),
    );
  }
}

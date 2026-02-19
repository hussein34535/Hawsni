import 'dart:math';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hwasi_app/core/services/analytics_service.dart';
import 'package:hwasi_app/core/services/auth_service.dart';
import 'package:hwasi_app/core/services/wishlist_service.dart';
import 'package:hwasi_app/core/themes/app_theme.dart';
import 'package:hwasi_app/core/utils/responsive_layout.dart';
import 'package:hwasi_app/core/widgets/spinning_loader.dart';
import 'package:hwasi_app/features/auth/presentation/screens/login_screen.dart';
import 'package:hwasi_app/features/cart/bloc/cart_bloc.dart';
import 'package:hwasi_app/features/cart/bloc/cart_event.dart';
import 'package:hwasi_app/features/cart/bloc/cart_state.dart';
import 'package:hwasi_app/features/cart/presentation/screens/cart_screen.dart';
import 'package:hwasi_app/features/products/bloc/product_bloc.dart';
import 'package:hwasi_app/features/products/bloc/product_event.dart';
import 'package:hwasi_app/features/products/bloc/product_state.dart';
import 'package:hwasi_app/features/products/data/services/product_service.dart';
import 'package:hwasi_app/features/products/presentation/widgets/related_products.dart';
import 'package:hwasi_app/features/products/presentation/widgets/reviews_section.dart';
import 'package:hwasi_app/features/reviews/bloc/review_bloc.dart';
import 'package:hwasi_app/features/reviews/bloc/review_event.dart';
import 'package:hwasi_app/features/reviews/data/services/review_service.dart';
import 'package:hwasi_app/features/vto/presentation/screens/virtual_try_on_screen.dart';
import 'package:hwasi_app/l10n/generated/app_localizations.dart';
import 'package:provider/provider.dart';

// ─────────────────────────────────────────────────────────────────────────────
// EXTENSIONS (Safe Color Parsing)
// ─────────────────────────────────────────────────────────────────────────────
extension ColorParsing on String {
  Color toColor() {
    try {
      String hex = replaceAll('#', '').trim();
      if (hex.length == 6) return Color(int.parse(hex, radix: 16) + 0xFF000000);
      if (hex.length == 8) return Color(int.parse(hex, radix: 16));
      const m = <String, Color>{
        'red': Colors.red,
        'blue': Colors.blue,
        'green': Colors.green,
        'black': Colors.black,
        'white': Colors.white,
        'grey': Colors.grey,
        'yellow': Colors.yellow,
        'orange': Colors.orange,
        'purple': Colors.purple,
        'pink': Colors.pink,
        'brown': Colors.brown,
        'teal': Colors.teal,
      };
      return m[toLowerCase()] ?? Colors.grey;
    } catch (_) {
      return Colors.grey;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA CLASS
// ─────────────────────────────────────────────────────────────────────────────
class DisplayData {
  final String name;
  final String price;
  final String imageUrl;
  final String description;
  final double rating;
  final int reviewCount;
  final List<String> images;
  final List<String> sizes;
  final List<dynamic> colors;
  final String? sizeGuide;

  DisplayData({
    required this.name,
    required this.price,
    required this.imageUrl,
    required this.description,
    required this.rating,
    required this.reviewCount,
    required this.images,
    required this.sizes,
    required this.colors,
    this.sizeGuide,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
class ProductDetailScreen extends StatefulWidget {
  final String? name;
  final String? price;
  final String? imageUrl;
  final String description;
  final double rating;
  final int reviewCount;
  final List<String>? sizes;
  final List<dynamic>? colors;
  final String productId;
  final String screenId;

  const ProductDetailScreen({
    super.key,
    this.name,
    this.price,
    this.imageUrl,
    this.description = '',
    this.rating = 4.5,
    this.reviewCount = 128,
    this.sizes,
    this.colors,
    required this.productId,
    required this.screenId,
  });

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen>
    with TickerProviderStateMixin {
  int _quantity = 1;
  String? _selectedSize;
  String? _selectedColor;
  int _currentImageIndex = 0;

  late final PageController _pageController;
  late final AnimationController _cardEntry;
  late final AnimationController _cartPop;
  late final Animation<Offset> _cardSlide;
  late final Animation<double> _cardFade;

  // Stock
  bool _isLowStock = false;
  int _stockCount = 0;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _cardEntry = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 550));
    _cartPop = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 300));
    _cardSlide = Tween<Offset>(begin: const Offset(0, 0.1), end: Offset.zero)
        .animate(
            CurvedAnimation(parent: _cardEntry, curve: Curves.easeOutCubic));
    _cardFade = CurvedAnimation(parent: _cardEntry, curve: Curves.easeIn);

    _checkStockStatus();

    WidgetsBinding.instance.addPostFrameCallback((_) => _cardEntry.forward());
  }

  void _checkStockStatus() {
    _stockCount = Random().nextInt(15) + 2;
    _isLowStock = _stockCount < 8; // If less than 8, show low stock warning
  }

  @override
  void dispose() {
    _pageController.dispose();
    _cardEntry.dispose();
    _cartPop.dispose();
    super.dispose();
  }

  void _inc() {
    HapticFeedback.lightImpact();
    setState(() => _quantity++);
  }

  void _dec() {
    if (_quantity > 1) {
      HapticFeedback.lightImpact();
      setState(() => _quantity--);
    }
  }

  void _addToCart(BuildContext ctx, DisplayData data) {
    if (data.sizes.isEmpty && data.colors.isEmpty && data.name.isEmpty) {
      _toast(ctx, AppLocalizations.of(ctx)?.loading ?? 'Loading...');
      return;
    }
    if (data.sizes.isNotEmpty && _selectedSize == null) {
      _toast(ctx, AppLocalizations.of(ctx)?.pleaseSelectSize ?? 'Select Size',
          isError: true);
      return;
    }
    if (data.colors.isNotEmpty && _selectedColor == null) {
      _toast(ctx, AppLocalizations.of(ctx)?.pleaseSelectColor ?? 'Select Color',
          isError: true);
      return;
    }
    if (data.name.isEmpty) return;

    final itemId =
        '${widget.productId}${_selectedSize != null ? "_$_selectedSize" : ""}${_selectedColor != null ? "_$_selectedColor" : ""}';

    ctx.read<CartBloc>().add(AddToCart(CartItem(
          id: itemId,
          name: data.name,
          price: data.price,
          imageUrl: data.imageUrl,
          quantity: _quantity,
          productId: widget.productId,
          size: _selectedSize,
          color: _selectedColor,
        )));

    ctx.read<AnalyticsService>().logAddToCart(
        itemId: itemId,
        itemName: data.name,
        itemCategory: 'Fashion',
        price: double.tryParse(data.price) ?? 0);

    HapticFeedback.mediumImpact();
    _cartPop.forward(from: 0);
    _toast(ctx, AppLocalizations.of(ctx)?.addedToCart ?? 'Added to Cart',
        isSuccess: true);
  }

  void _toast(BuildContext ctx, String msg,
      {bool isError = false, bool isSuccess = false}) {
    ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
      content: Row(
        children: [
          Icon(isError ? Icons.error_outline : Icons.check_circle_outline,
              color: Colors.white, size: 20),
          const SizedBox(width: 12),
          Expanded(
              child: Text(msg,
                  style: GoogleFonts.cairo(
                      color: Colors.white, fontWeight: FontWeight.w700))),
        ],
      ),
      backgroundColor: isError
          ? Colors.redAccent.shade400
          : (isSuccess ? AppTheme.primaryColor : Colors.black87),
      behavior: SnackBarBehavior.floating,
      duration: const Duration(seconds: 2),
      margin: const EdgeInsets.fromLTRB(20, 0, 20, 100),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 0,
    ));
  }

  DisplayData _resolveDisplayData(ProductState state) {
    String name = widget.name ?? '';
    String price = widget.price ?? '0';
    String imageUrl = widget.imageUrl ?? '';
    String description = widget.description;
    double rating = widget.rating;
    int reviewCount = widget.reviewCount;
    List<String> images = widget.imageUrl != null ? [widget.imageUrl!] : [];
    List<String> sizes = widget.sizes ?? [];
    List<dynamic> colors = widget.colors ?? [];
    String? sizeGuide;

    if (state is ProductDetailsLoaded) {
      name = state.product.name;
      price = state.product.price.toString();
      description = state.product.description;
      rating = state.product.rating;
      reviewCount = state.product.reviewCount;
      sizes = state.product.sizes ?? [];
      colors = state.product.colors ?? [];
      sizeGuide = state.product.sizeGuide;
      if ((state.product.images ?? []).isNotEmpty) {
        images = state.product.images!;
        imageUrl = images[0];
      }
    }
    if (images.isEmpty) images = [imageUrl];

    return DisplayData(
        name: name,
        price: price,
        imageUrl: imageUrl,
        description: description,
        rating: rating,
        reviewCount: reviewCount,
        images: images,
        sizes: sizes,
        colors: colors,
        sizeGuide: sizeGuide);
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(
            create: (_) => ReviewBloc(ReviewService())
              ..add(LoadReviews(widget.productId))),
        BlocProvider(
            create: (_) => ProductBloc(ProductService())
              ..add(LoadProductDetails(widget.productId))),
      ],
      child: MultiBlocListener(
        listeners: [
          BlocListener<CartBloc, CartState>(
            listener: (ctx, state) {
              if (state is CartAuthError) {
                _showAuthErrorDialog(ctx);
              } else if (state is CartError) {
                _toast(ctx, state.message, isError: true);
              }
            },
          ),
          BlocListener<ProductBloc, ProductState>(
            listener: (ctx, state) {
              if (state is ProductDetailsLoaded) {
                ctx.read<AnalyticsService>().logViewItem(
                    itemId: state.product.id,
                    itemName: state.product.name,
                    itemCategory: state.product.category);
              }
            },
          ),
        ],
        child: ResponsiveLayout.isDesktop(context)
            ? _buildDesktopLayout()
            : _mobileShell(),
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // THE MOBILE SHELL
  // ══════════════════════════════════════════════════════════════════════════
  Widget _mobileShell() {
    return BlocBuilder<ProductBloc, ProductState>(
      builder: (context, state) {
        final data = _resolveDisplayData(state);

        return AnnotatedRegion<SystemUiOverlayStyle>(
          value: SystemUiOverlayStyle.light,
          child: Scaffold(
            backgroundColor: Colors.white,
            extendBodyBehindAppBar: true,
            extendBody: true,
            bottomNavigationBar: _buildGlassActionPill(context, data, state),
            body: CustomScrollView(
              physics: const BouncingScrollPhysics(),
              slivers: [
                _buildImageHeader(data, state),
                SliverToBoxAdapter(
                  child: SlideTransition(
                    position: _cardSlide,
                    child: FadeTransition(
                      opacity: _cardFade,
                      child: _buildDetailsCard(context, data, state),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildImageHeader(DisplayData data, ProductState state) {
    return SliverAppBar(
      expandedHeight:
          MediaQuery.of(context).size.height * 0.65, // Elegant height
      pinned: true,
      stretch: true,
      backgroundColor: Colors.white,
      elevation: 0,
      leading: Center(
          child: _glassIcon(Icons.arrow_back_ios_new_rounded,
              () => Navigator.of(context).pop())),
      actions: [
        Center(child: _wishlistIcon(context, data)),
        const SizedBox(width: 12),
        Center(child: _cartIcon(context)),
        const SizedBox(width: 16),
      ],
      flexibleSpace: FlexibleSpaceBar(
        stretchModes: const [StretchMode.zoomBackground],
        background: Stack(
          fit: StackFit.expand,
          children: [
            PageView.builder(
              controller: _pageController,
              itemCount: data.images.length,
              physics: const BouncingScrollPhysics(),
              onPageChanged: (i) => setState(() => _currentImageIndex = i),
              itemBuilder: (_, i) => Hero(
                tag: i == 0
                    ? 'product_${widget.productId}_${widget.screenId}'
                    : 'product_${widget.productId}_image_$i',
                child: CachedNetworkImage(
                  imageUrl: data.images[i],
                  fit: BoxFit.cover,
                  alignment: Alignment.topCenter,
                  memCacheWidth: 800, // Optimize memory usage
                  placeholder: (_, __) => Container(color: Colors.grey[100]),
                  errorWidget: (_, __, ___) =>
                      Container(color: Colors.grey[100]),
                ),
              ),
            ),

            // Top Gradient for Status Bar & Icons
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              height: 140,
              child: DecoratedBox(
                  decoration: BoxDecoration(
                      gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                    Colors.black.withOpacity(0.35),
                    Colors.transparent
                  ]))),
            ),

            // Premium Image Indicator
            if (data.images.length > 1)
              Positioned(
                bottom: 40,
                left: 0,
                right: 0,
                child: Center(
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.5),
                      borderRadius: BorderRadius.circular(100),
                      border: Border.all(
                          color: Colors.white.withOpacity(0.15), width: 0.5),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Dots row
                        ...List.generate(data.images.length, (i) {
                          final active = _currentImageIndex == i;
                          return AnimatedContainer(
                            duration: const Duration(milliseconds: 400),
                            curve: Curves.easeOutCubic,
                            margin: EdgeInsets.only(
                                right: i < data.images.length - 1 ? 6 : 0),
                            width: active ? 20 : 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: active
                                  ? Colors.white
                                  : Colors.white.withOpacity(0.35),
                              borderRadius: BorderRadius.circular(100),
                            ),
                          );
                        }),
                        const SizedBox(width: 10),
                        // Counter text
                        Text(
                          '${_currentImageIndex + 1}/${data.images.length}',
                          style: GoogleFonts.poppins(
                            color: Colors.white.withOpacity(0.8),
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailsCard(
      BuildContext context, DisplayData data, ProductState state,
      {bool isDesktop = false}) {
    if (data.name.isEmpty &&
        state is! ProductDetailsLoaded &&
        state is! ProductError) {
      return const SizedBox(
          height: 300, child: Center(child: SpinningLoader()));
    }
    if (state is ProductError) {
      return Center(
          child:
              Text(state.message, style: const TextStyle(color: Colors.red)));
    }

    final currency = AppLocalizations.of(context)?.currencySymbol ?? 'EGP';

    // تم إزالة المارجن السالب من الـ Container لحل مشكلة الـ Assertion Failed في الويب
    Widget cardContent = Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: isDesktop
            ? BorderRadius.circular(24)
            : const BorderRadius.vertical(top: Radius.circular(32)),
        boxShadow: isDesktop
            ? [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 20)]
            : [
                BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 20,
                    offset: const Offset(0, -5))
              ],
      ),
      padding: EdgeInsets.fromLTRB(24, 32, 24, isDesktop ? 36 : 140),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Title & Price (Big Brand Style) ──
          Text(data.name,
              style: GoogleFonts.cairo(
                  fontSize: isDesktop ? 32 : 26,
                  fontWeight: FontWeight.w900,
                  height: 1.2,
                  color: Colors.black87)),
          const SizedBox(height: 8),
          Text('${data.price} $currency',
              style: GoogleFonts.poppins(
                fontSize: isDesktop ? 26 : 22,
                fontWeight: FontWeight.bold,
                color: AppTheme.primaryColor,
              )),
          const SizedBox(height: 32),

          // Try On Banner
          GestureDetector(
            onTap: () => Navigator.push(
                context,
                MaterialPageRoute(
                    builder: (_) => VirtualTryOnScreen(
                        productImageUrl: data.imageUrl,
                        productId: widget.productId))),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                  gradient: LinearGradient(colors: [
                    const Color(0xFF9C4AF7).withValues(alpha: 0.1),
                    const Color(0xFFE94E8F).withValues(alpha: 0.1)
                  ]),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                      color: const Color(0xFF9C4AF7).withValues(alpha: 0.2))),
              child: Row(
                children: [
                  Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                          gradient: const LinearGradient(
                              colors: [Color(0xFF9C4AF7), Color(0xFFE94E8F)]),
                          borderRadius: BorderRadius.circular(12)),
                      child: const Icon(Icons.auto_awesome_rounded,
                          color: Colors.white, size: 18)),
                  const SizedBox(width: 16),
                  Expanded(
                      child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                        Text('جرب هذه القطعة الآن',
                            style: GoogleFonts.cairo(
                                fontWeight: FontWeight.bold, fontSize: 14)),
                        Text('شاهد كيف تبدو عليك بالذكاء الاصطناعي',
                            style: GoogleFonts.cairo(
                                fontSize: 12, color: Colors.black54))
                      ])),
                ],
              ),
            ),
          ),
          const SizedBox(height: 32),

          // Colors
          if (data.colors.isNotEmpty) ...[
            Text('اللون',
                style: GoogleFonts.cairo(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87)),
            const SizedBox(height: 16),
            _colorRow(data.colors),
            const SizedBox(height: 32),
          ],

          // Sizes
          if (data.sizes.isNotEmpty) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('المقاس',
                    style: GoogleFonts.cairo(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87)),
                GestureDetector(
                  onTap: () => _showSizeGuidePopup(context, data.sizeGuide),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.straighten_rounded,
                          size: 16, color: AppTheme.primaryColor),
                      const SizedBox(width: 4),
                      Text('دليل المقاسات',
                          style: GoogleFonts.cairo(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.primaryColor,
                              decoration: TextDecoration.underline)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _sizeRow(data.sizes),
            const SizedBox(height: 32),
          ],

          // Stock Indicator
          if (_isLowStock) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                  color: Colors.orange.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(12),
                  border:
                      Border.all(color: Colors.orange.withValues(alpha: 0.2))),
              child: Row(
                children: [
                  const Icon(Icons.local_fire_department_rounded,
                      color: Colors.orange, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                      child: Text('الكمية محدودة! باقِ $_stockCount قطع فقط',
                          style: GoogleFonts.cairo(
                              color: Colors.orange.shade800,
                              fontWeight: FontWeight.bold,
                              fontSize: 13))),
                ],
              ),
            ),
            const SizedBox(height: 32),
          ],

          // Quantity
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('الكمية',
                  style: GoogleFonts.cairo(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87)),
              Container(
                height: 44,
                decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border.all(color: Colors.grey.shade300),
                    borderRadius: BorderRadius.circular(12)),
                child: Row(
                  children: [
                    IconButton(
                        icon: Icon(Icons.remove_rounded,
                            color: _quantity > 1
                                ? Colors.black
                                : Colors.grey.shade300,
                            size: 20),
                        onPressed: _dec),
                    SizedBox(
                        width: 32,
                        child: Text('$_quantity',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.poppins(
                                color: Colors.black,
                                fontWeight: FontWeight.bold,
                                fontSize: 16))),
                    IconButton(
                        icon: const Icon(Icons.add_rounded,
                            color: Colors.black, size: 20),
                        onPressed: _inc),
                  ],
                ),
              ),
            ],
          ),

          // Desktop specific Add To Cart Button
          if (isDesktop) ...[
            const SizedBox(height: 40),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton.icon(
                onPressed: () => _addToCart(context, data),
                icon: const Icon(Icons.shopping_bag_rounded),
                label: Text(
                    AppLocalizations.of(context)?.addToCart ?? 'إضافة للسلة',
                    style: GoogleFonts.cairo(
                        fontWeight: FontWeight.bold, fontSize: 18)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                ),
              ),
            ),
          ],

          const SizedBox(height: 40),

          // Description
          Text('التفاصيل',
              style: GoogleFonts.cairo(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87)),
          const SizedBox(height: 12),
          Text(data.description,
              style: GoogleFonts.cairo(
                  fontSize: 15,
                  height: 1.8,
                  color: Colors.black87,
                  fontWeight: FontWeight.w500)),
          const SizedBox(height: 40),

          const Divider(color: Color(0xFFF0F0F0), thickness: 1),
          const SizedBox(height: 24),
          ReviewsSection(productId: widget.productId),
          const SizedBox(height: 40),
          if (state is ProductDetailsLoaded)
            RelatedProducts(products: state.relatedProducts),
        ],
      ),
    );

    if (isDesktop) {
      return cardContent;
    }

    // عملنا التداخل للموبايل بـ Transform بدل الـ margin عشان نتجنب الكراش
    return Transform.translate(
      offset: const Offset(0, -28),
      child: cardContent,
    );
  }

  // ── Glass Action Pill (Bottom) ─────────────────────────────────────────────
  Widget _buildGlassActionPill(
      BuildContext context, DisplayData data, ProductState state) {
    final currency = AppLocalizations.of(context)?.currencySymbol ?? 'EGP';
    final addToCartStr =
        AppLocalizations.of(context)?.addToCart ?? 'Add to Cart';

    // Calculate total price
    final unitPrice = double.tryParse(data.price) ?? 0;
    final totalPrice = unitPrice * _quantity;
    final formattedTotal = totalPrice == totalPrice.roundToDouble()
        ? totalPrice.toInt().toString()
        : totalPrice.toStringAsFixed(2);

    final pillContent = Container(
      height: 76,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      decoration: BoxDecoration(
          color: const Color(0xFF1A1A1A).withValues(alpha: 0.95),
          borderRadius: BorderRadius.circular(100),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withValues(alpha: 0.2),
                blurRadius: 20,
                offset: const Offset(0, 5))
          ],
          border:
              Border.all(color: Colors.white.withValues(alpha: 0.1), width: 1)),
      child: Row(
        children: [
          // Price Area
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (_quantity > 1)
                  Text('$_quantity × ${data.price} $currency',
                      style: GoogleFonts.cairo(
                          fontSize: 10, color: Colors.white54, height: 1)),
                Text('$formattedTotal $currency',
                    style: GoogleFonts.poppins(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                        height: 1.3)),
              ],
            ),
          ),

          // Add To Cart Button
          AnimatedBuilder(
            animation: _cartPop,
            builder: (_, child) {
              final t = _cartPop.value;
              final s = 1.0 + 0.05 * (t < 0.5 ? t * 2 : (1 - t) * 2);
              return Transform.scale(scale: s, child: child);
            },
            child: GestureDetector(
              onTap: () => _addToCart(context, data),
              child: Container(
                height: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 28),
                decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(100)),
                child: Row(
                  children: [
                    const Icon(Icons.shopping_bag_rounded,
                        color: Colors.black, size: 20),
                    const SizedBox(width: 8),
                    Text(addToCartStr,
                        style: GoogleFonts.cairo(
                            color: Colors.black,
                            fontWeight: FontWeight.bold,
                            fontSize: 14)),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );

    return SafeArea(
      child: Container(
        margin: const EdgeInsets.fromLTRB(20, 0, 20, 20),
        child: pillContent,
      ),
    );
  }

  // ── Selectors (Colors & Sizes) ────────────────────────────────────────────

  Widget _colorRow(List<dynamic> colors) {
    return Wrap(
      spacing: 16,
      runSpacing: 16,
      children: colors.map((cd) {
        String name = '';
        int? linked;
        if (cd is Map) {
          name = cd['color']?.toString() ?? '';
          final v = cd['imageIndex'];
          linked =
              v is int ? v : (v != null ? int.tryParse(v.toString()) : null);
        } else if (cd is String && cd.trim().startsWith('{')) {
          try {
            name =
                RegExp(r'"color"\s*:\s*"([^"]+)"').firstMatch(cd)?.group(1) ??
                    cd;
            linked = int.tryParse(
                RegExp(r'"imageIndex"\s*:\s*(\d+)').firstMatch(cd)?.group(1) ??
                    '');
          } catch (_) {
            name = cd;
          }
        } else {
          name = cd.toString();
        }

        final isSel = _selectedColor == name;
        final color = name.toColor();

        return GestureDetector(
          onTap: () {
            HapticFeedback.selectionClick();
            setState(() {
              _selectedColor = isSel ? null : name;
              if (!isSel && linked != null && _pageController.hasClients) {
                _pageController.animateToPage(linked,
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeInOut);
              }
            });
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: 44,
            height: 44,
            padding: EdgeInsets.all(isSel ? 3 : 0),
            decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                    color: isSel ? Colors.black : Colors.transparent,
                    width: 2)),
            child: DecoratedBox(
                decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                    border: Border.all(
                        color: Colors.black.withValues(alpha: 0.1)))),
          ),
        );
      }).toList(),
    );
  }

  Widget _sizeRow(List<String> sizes) {
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: sizes.map((s) {
        final isSel = _selectedSize == s;
        return GestureDetector(
          onTap: () {
            HapticFeedback.selectionClick();
            setState(() => _selectedSize = isSel ? null : s);
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            decoration: BoxDecoration(
                color: isSel ? Colors.black : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                    color: isSel ? Colors.black : Colors.grey.shade300,
                    width: 1.5)),
            child: Text(s,
                style: GoogleFonts.poppins(
                    color: isSel ? Colors.white : Colors.black,
                    fontWeight: isSel ? FontWeight.w700 : FontWeight.w500,
                    fontSize: 14)),
          ),
        );
      }).toList(),
    );
  }

  // ── App-bar icon buttons (PREMIUM GLASS EFFECT) ───────────────────────────
  Widget _glassIcon(IconData icon, VoidCallback fn,
      {Color iconColor = Colors.white}) {
    return GestureDetector(
      onTap: fn,
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: const Color(0xFF1A1A1A)
              .withValues(alpha: 0.8), // Fast, premium dark
          shape: BoxShape.circle,
          border: Border.all(
              color: Colors.white.withValues(alpha: 0.2), width: 0.5),
        ),
        child: Icon(icon, color: iconColor, size: 20),
      ),
    );
  }

  Widget _wishlistIcon(BuildContext context, DisplayData data) {
    return Consumer<WishlistService>(
      builder: (ctx, wishlist, _) {
        final isIn = wishlist.isItemInWishlist(widget.productId);
        return _glassIcon(
          isIn ? Icons.favorite_rounded : Icons.favorite_border_rounded,
          iconColor: isIn ? Colors.redAccent : Colors.white,
          () {
            if (AuthService.token == null) {
              _toast(
                  ctx, AppLocalizations.of(ctx)?.pleaseLogin ?? 'Please Login',
                  isError: true);
              return;
            }
            if (data.name.isEmpty) return;
            HapticFeedback.lightImpact();
            if (isIn) {
              wishlist.removeFromWishlist(widget.productId);
            } else {
              wishlist.addToWishlist(WishlistItem(
                  id: widget.productId,
                  name: data.name,
                  price: data.price,
                  imageUrl: data.imageUrl.isNotEmpty ? data.imageUrl : '',
                  description: data.description,
                  rating: data.rating,
                  reviewCount: data.reviewCount));
            }
          },
        );
      },
    );
  }

  Widget _cartIcon(BuildContext context) {
    return BlocBuilder<CartBloc, CartState>(
      builder: (ctx, state) {
        final count = state is CartLoaded ? state.items.length : 0;
        return Stack(
          clipBehavior: Clip.none,
          children: [
            _glassIcon(
                Icons.shopping_bag_outlined,
                () => Navigator.push(ctx,
                    MaterialPageRoute(builder: (_) => const CartScreen()))),
            if (count > 0)
              Positioned(
                  right: -2,
                  top: -2,
                  child: Container(
                      padding: const EdgeInsets.all(5),
                      decoration: BoxDecoration(
                          color: AppTheme.primaryColor,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 1.5)),
                      child: Text('$count',
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              height: 1)))),
          ],
        );
      },
    );
  }

  void _showSizeGuidePopup(BuildContext context, String? sizeGuide) {
    final content = (sizeGuide != null && sizeGuide.trim().isNotEmpty)
        ? sizeGuide
        : 'لا يوجد دليل مقاسات حالياً';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.6,
        ),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Drag handle
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(100),
              ),
            ),
            // Title
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 8),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.straighten_rounded,
                        color: AppTheme.primaryColor, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text('دليل المقاسات',
                        style: GoogleFonts.cairo(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.black87)),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(ctx),
                    icon:
                        const Icon(Icons.close_rounded, color: Colors.black45),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            // Content
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Text(
                  content,
                  style: GoogleFonts.cairo(
                    fontSize: 15,
                    height: 1.8,
                    color: Colors.black87,
                  ),
                ),
              ),
            ),
            // Close button
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(ctx),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.black,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 0,
                  ),
                  child: Text('حسناً',
                      style: GoogleFonts.cairo(
                          fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showAuthErrorDialog(BuildContext context) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
            AppLocalizations.of(ctx)?.sessionExpired ?? 'Session Expired',
            style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
        content: Text(
            AppLocalizations.of(ctx)?.sessionExpiredMessage ??
                'Please login again.',
            style: GoogleFonts.cairo()),
        actions: [
          TextButton(
              onPressed: () {
                Navigator.of(ctx).pop();
                Navigator.push(ctx,
                    MaterialPageRoute(builder: (_) => const LoginScreen()));
              },
              child: Text(AppLocalizations.of(ctx)?.ok ?? 'OK',
                  style: GoogleFonts.cairo(
                      fontWeight: FontWeight.bold, color: Colors.black)))
        ],
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DESKTOP
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildDesktopLayout() {
    return BlocBuilder<ProductBloc, ProductState>(
      builder: (context, state) {
        final data = _resolveDisplayData(state);

        return Scaffold(
          backgroundColor: Colors.grey.shade50,
          appBar: AppBar(
            backgroundColor: Colors.white,
            elevation: 0,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded,
                  color: Colors.black),
              onPressed: () => context.pop(),
            ),
            actions: [
              Center(child: _wishlistIcon(context, data)),
              const SizedBox(width: 16),
              Center(child: _cartIcon(context)),
              const SizedBox(width: 32),
            ],
          ),
          body: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1200),
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 32.0, vertical: 40.0),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Left Side: Image Gallery
                      Expanded(
                        flex: 5,
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(24),
                          child: Stack(
                            children: [
                              AspectRatio(
                                aspectRatio: 3 / 4,
                                child: PageView.builder(
                                  controller: _pageController,
                                  itemCount: data.images.length,
                                  onPageChanged: (i) =>
                                      setState(() => _currentImageIndex = i),
                                  itemBuilder: (_, i) => Hero(
                                    tag: 'desktop_img_$i',
                                    child: CachedNetworkImage(
                                      imageUrl: data.images[i],
                                      fit: BoxFit.cover,
                                      memCacheWidth: 800,
                                      errorWidget: (_, __, ___) =>
                                          Container(color: Colors.grey[200]),
                                    ),
                                  ),
                                ),
                              ),
                              if (data.images.length > 1)
                                Positioned(
                                  bottom: 24,
                                  left: 0,
                                  right: 0,
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children:
                                        List.generate(data.images.length, (i) {
                                      final active = _currentImageIndex == i;
                                      return AnimatedContainer(
                                        duration:
                                            const Duration(milliseconds: 300),
                                        margin: const EdgeInsets.symmetric(
                                            horizontal: 4),
                                        width: active ? 24 : 8,
                                        height: 8,
                                        decoration: BoxDecoration(
                                            color: active
                                                ? Colors.black
                                                : Colors.black.withOpacity(0.3),
                                            borderRadius:
                                                BorderRadius.circular(4),
                                            border: Border.all(
                                                color: Colors.white
                                                    .withOpacity(0.5))),
                                      );
                                    }),
                                  ),
                                )
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 48),
                      // Right Side: Product Details
                      Expanded(
                        flex: 6,
                        child: SlideTransition(
                          position: _cardSlide,
                          child: FadeTransition(
                            opacity: _cardFade,
                            child: _buildDetailsCard(context, data, state,
                                isDesktop: true),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

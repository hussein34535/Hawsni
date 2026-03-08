import 'dart:math';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:meta_seo/meta_seo.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import 'package:hwasi_app/core/services/analytics_service.dart';
import 'package:hwasi_app/core/services/auth_service.dart';
import 'package:hwasi_app/core/services/wishlist_service.dart';
import 'package:hwasi_app/core/themes/app_theme.dart';
import 'package:hwasi_app/core/utils/responsive_layout.dart';
import 'package:hwasi_app/core/widgets/spinning_loader.dart';
import 'package:hwasi_app/core/widgets/media_viewer_widget.dart';
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
import 'package:hwasi_app/features/products/presentation/widgets/full_screen_gallery.dart';
import 'package:hwasi_app/l10n/generated/app_localizations.dart';
import 'package:provider/provider.dart';
import 'package:flutter_blurhash/flutter_blurhash.dart';

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
  final String? blurHash;
  final int stock;

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
    this.blurHash,
    required this.stock,
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
  final String? blurHash;

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
    this.blurHash,
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

  final GlobalKey _cartKey = GlobalKey();
  final GlobalKey _imageKey = GlobalKey();

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

    WidgetsBinding.instance.addPostFrameCallback((_) => _cardEntry.forward());
  }

  void _checkStockStatus(int stock) {
    _stockCount = stock;
    _isLowStock = _stockCount > 0 && _stockCount < 50;
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

    // Trigger parabolic animation
    if (data.imageUrl.isNotEmpty) {
      _runAddToCartAnimation(data.imageUrl);
    }

    _toast(ctx, AppLocalizations.of(ctx)?.addedToCart ?? 'Added to Cart',
        isSuccess: true);
  }

  void _runAddToCartAnimation(String imageUrl) {
    if (!mounted) return;

    final RenderBox? cartBox =
        _cartKey.currentContext?.findRenderObject() as RenderBox?;
    final RenderBox? imageBox =
        _imageKey.currentContext?.findRenderObject() as RenderBox?;

    if (cartBox == null || imageBox == null) return;

    final cartPos = cartBox.localToGlobal(Offset.zero);
    final imagePos = imageBox.localToGlobal(Offset.zero);

    final startX = imagePos.dx + imageBox.size.width / 2 - 25;
    final startY = imagePos.dy + imageBox.size.height / 2 - 25;

    final endX = cartPos.dx + cartBox.size.width / 2 - 5;
    final endY = cartPos.dy + cartBox.size.height / 2 - 5;

    final controlPointX = startX + (endX - startX) / 2;
    final controlPointY = min(startY, endY) - 150.0;

    late OverlayEntry overlayEntry;

    final controller = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 700));
    final curvedAnimation =
        CurvedAnimation(parent: controller, curve: Curves.easeInOutSine);

    overlayEntry = OverlayEntry(builder: (context) {
      return AnimatedBuilder(
          animation: curvedAnimation,
          builder: (context, child) {
            final t = curvedAnimation.value;
            final x = pow(1 - t, 2) * startX +
                2 * (1 - t) * t * controlPointX +
                pow(t, 2) * endX;
            final y = pow(1 - t, 2) * startY +
                2 * (1 - t) * t * controlPointY +
                pow(t, 2) * endY;

            final scale = 1.0 - (t * 0.8);
            final opacity = t > 0.8 ? 1.0 - ((t - 0.8) * 5) : 1.0;

            return Positioned(
              left: x.toDouble(),
              top: y.toDouble(),
              child: Transform.scale(
                scale: scale,
                child: Opacity(
                  opacity: opacity,
                  child: Container(
                    width: 50,
                    height: 50,
                    decoration:
                        BoxDecoration(shape: BoxShape.circle, boxShadow: [
                      BoxShadow(
                        color: AppTheme.primaryColor.withValues(alpha: 0.5),
                        blurRadius: 15,
                        spreadRadius: 2,
                      )
                    ]),
                    child: ClipOval(
                      child: CachedNetworkImage(
                        imageUrl: imageUrl,
                        fit: BoxFit.cover,
                        placeholder: (_, __) =>
                            Container(color: AppTheme.primaryColor),
                        errorWidget: (_, __, ___) =>
                            Container(color: AppTheme.primaryColor),
                      ),
                    ),
                  ),
                ),
              ),
            );
          });
    });

    Overlay.of(context).insert(overlayEntry);
    controller.forward().then((_) {
      if (mounted) {
        overlayEntry.remove();
        controller.dispose();
      }
    });
  }

  void _goToCart(BuildContext ctx) {
    Navigator.of(ctx).push(
      MaterialPageRoute(builder: (_) => const CartScreen()),
    );
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
                  style: const TextStyle(
                      fontFamily: 'Cairo',
                      color: Colors.white,
                      fontWeight: FontWeight.w700))),
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
    int stock = 0;

    if (state is ProductDetailsLoaded) {
      name = state.product.name;
      price = state.product.price.toString();
      description = state.product.description;
      rating = state.product.rating;
      reviewCount = state.product.reviewCount;
      stock = state.product.stock;
      sizes = state.product.sizes ?? [];
      colors = state.product.colors ?? [];
      sizeGuide = state.product.sizeGuide;
      if ((state.product.images ?? []).isNotEmpty) {
        images = state.product.images!;
        imageUrl = images[0];
      }
    }
    if (images.isEmpty) images = [imageUrl];

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted && _stockCount != stock) {
        setState(() => _checkStockStatus(stock));
      }
    });

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
        sizeGuide: sizeGuide,
        stock: stock);
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
                final product = state.product;
                ctx.read<AnalyticsService>().logViewItem(
                    itemId: product.id,
                    itemName: product.name,
                    itemCategory: product.category);

                // SEO: Dynamic Meta Tags & Structured Data
                if (kIsWeb && !kIsWasm) {
                  final meta = MetaSEO();

                  // Basic Metas
                  meta.author(author: 'Hawsni');
                  meta.description(
                      description: product.description.length > 150
                          ? '${product.description.substring(0, 147)}...'
                          : product.description);
                  meta.keywords(
                      keywords:
                          '${product.name}, fashion, style, buy online, hawsni, ${product.category}');

                  // Open Graph
                  meta.ogTitle(ogTitle: '${product.name} | Hawsni');
                  meta.ogDescription(
                      ogDescription: product.description.length > 150
                          ? '${product.description.substring(0, 147)}...'
                          : product.description);
                  meta.ogImage(ogImage: product.imageUrl);

                  // Twitter
                  meta.twitterCard(twitterCard: TwitterCard.summaryLargeImage);
                  meta.twitterTitle(twitterTitle: '${product.name} | Hawsni');
                  meta.twitterDescription(
                      twitterDescription: product.description.length > 150
                          ? '${product.description.substring(0, 147)}...'
                          : product.description);
                  meta.twitterImage(twitterImage: product.imageUrl);

                  // JSON-LD Structured Data
                  // Note: Since we don't have a direct way to inject script tags via meta_seo,
                  // we rely on Google's ability to parse the visible content + Open Graph tags
                  // which covers most rich snippet requirements for social sharing.
                  // For full JSON-LD support, we would need 'dart:html' which is discouraged in cross-platform.
                  // The current implementation ensures Social Cards & Basic Indexing work perfectly.
                }

                // Precache images for smooth swiping
                final images = product.images ?? [];
                if (images.length > 1) {
                  precacheImage(CachedNetworkImageProvider(images[1]), ctx);
                }
                if (images.length > 2) {
                  precacheImage(CachedNetworkImageProvider(images[2]), ctx);
                }
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
              key: _imageKey,
              controller: _pageController,
              itemCount: data.images.length,
              physics: const BouncingScrollPhysics(),
              onPageChanged: (i) => setState(() => _currentImageIndex = i),
              itemBuilder: (_, i) => GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => FullScreenGallery(
                        images: data.images,
                        initialIndex: i,
                      ),
                    ),
                  );
                },
                child: Hero(
                  tag: i == 0
                      ? 'product_${widget.productId}_${widget.screenId}'
                      : 'product_${widget.productId}_image_$i',
                  child: MediaViewerWidget(
                    url: data.images[i],
                    blurHash: data.blurHash,
                    fit: BoxFit.contain,
                  ),
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
                    Colors.black.withValues(alpha: 0.15),
                    Colors.transparent
                  ]))),
            ),

            // Bottom Gradient for Indicators (Balances Top Gradient)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              height: 120, // Enough height for the dots to sit on
              child: DecoratedBox(
                  decoration: BoxDecoration(
                      gradient: LinearGradient(
                          begin: Alignment.bottomCenter,
                          end: Alignment.topCenter,
                          colors: [
                    Colors.black.withValues(alpha: 0.15),
                    Colors.transparent
                  ]))),
            ),

            // Premium Image Indicator
            if (data.images.length > 1)
              Positioned(
                bottom: 20, // Lower position
                left: 0,
                right: 0,
                child: Center(
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.black
                          .withValues(alpha: 0.15), // Much more transparent
                      borderRadius: BorderRadius.circular(100),
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
                                right: i < data.images.length - 1 ? 4 : 0),
                            width: active ? 8 : 4, // Smaller dots
                            height: 4,
                            decoration: BoxDecoration(
                              color: active
                                  ? Colors.white
                                  : Colors.white.withValues(alpha: 0.35),
                              borderRadius: BorderRadius.circular(100),
                            ),
                          );
                        }),
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
            ? [
                BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05), blurRadius: 20)
              ]
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
              style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: isDesktop ? 32 : 26,
                  fontWeight: FontWeight.w900,
                  height: 1.2,
                  color: Colors.black87)),
          const SizedBox(height: 8),
          Text('${data.price} $currency',
              style: TextStyle(
                fontFamily: 'Cairo',
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
                  const Expanded(
                      child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                        Text('جرب هذه القطعة الآن',
                            style: TextStyle(
                                fontFamily: 'Cairo',
                                fontWeight: FontWeight.bold,
                                fontSize: 14)),
                        Text('شاهد كيف تبدو عليك بالذكاء الاصطناعي',
                            style: TextStyle(
                                fontFamily: 'Cairo',
                                fontSize: 12,
                                color: Colors.black54))
                      ])),
                ],
              ),
            ),
          ),
          const SizedBox(height: 32),

          // Colors
          if (data.colors.isNotEmpty) ...[
            const Text('اللون',
                style: TextStyle(
                    fontFamily: 'Cairo',
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
                const Text('المقاس',
                    style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87)),
                GestureDetector(
                  onTap: () => _showSizeGuidePopup(context, data.sizeGuide),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.straighten_rounded,
                          size: 16, color: AppTheme.primaryColor),
                      SizedBox(width: 4),
                      Text('دليل المقاسات',
                          style: TextStyle(
                              fontFamily: 'Cairo',
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
                          style: TextStyle(
                              fontFamily: 'Cairo',
                              color: Colors.orange.shade800,
                              fontWeight: FontWeight.bold,
                              fontSize: 13))),
                ],
              ),
            ),
            const SizedBox(height: 32),
          ] else if (data.stock <= 0 && state is ProductDetailsLoaded) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                  color: Colors.red.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.red.withValues(alpha: 0.2))),
              child: Row(
                children: [
                  const Icon(Icons.remove_shopping_cart_rounded,
                      color: Colors.red, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                      child: Text('نفدت الكمية',
                          style: TextStyle(
                              fontFamily: 'Cairo',
                              color: Colors.red.shade800,
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
              const Text('الكمية',
                  style: TextStyle(
                      fontFamily: 'Cairo',
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
                            style: const TextStyle(
                                fontFamily: 'Cairo',
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
            Builder(builder: (ctx) {
              final cartState = ctx.watch<CartBloc>().state;
              bool isAdded = false;
              if (cartState is CartLoaded) {
                final itemId =
                    '${widget.productId}${_selectedSize != null ? "_$_selectedSize" : ""}${_selectedColor != null ? "_$_selectedColor" : ""}';
                isAdded = cartState.items.any((item) => item.id == itemId);
              }
              final isSoldOut =
                  data.stock <= 0 && state is ProductDetailsLoaded;
              final buttonColor = isSoldOut
                  ? Colors.grey.shade400
                  : (isAdded ? Colors.green.shade800 : AppTheme.primaryColor);
              final buttonText = isSoldOut
                  ? 'نفدت الكمية'
                  : (isAdded
                      ? 'اذهب للسلة 🛒'
                      : (AppLocalizations.of(context)?.addToCart ??
                          'إضافة للسلة'));
              final buttonIcon = isSoldOut
                  ? Icons.remove_shopping_cart_rounded
                  : (isAdded
                      ? Icons.arrow_forward_rounded
                      : Icons.shopping_bag_rounded);

              return SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton.icon(
                  onPressed: isSoldOut
                      ? null
                      : () => isAdded
                          ? _goToCart(context)
                          : _addToCart(context, data),
                  icon: Icon(buttonIcon),
                  label: Text(buttonText,
                      style: const TextStyle(
                          fontFamily: 'Cairo',
                          fontWeight: FontWeight.bold,
                          fontSize: 18)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: buttonColor,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16)),
                    elevation: 0,
                  ),
                ),
              );
            }),
          ],

          const SizedBox(height: 40),

          // Description
          const Text('التفاصيل',
              style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87)),
          const SizedBox(height: 12),
          Text(data.description,
              style: const TextStyle(
                  fontFamily: 'Cairo',
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
                      style: const TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 10,
                          color: Colors.white54,
                          height: 1)),
                Text('$formattedTotal $currency',
                    style: const TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                        height: 1.3)),
              ],
            ),
          ),

          // Add To Cart Button
          BlocBuilder<CartBloc, CartState>(builder: (ctx, cartState) {
            bool isAdded = false;
            if (cartState is CartLoaded) {
              isAdded = cartState.items.any((item) =>
                  item.productId == widget.productId &&
                  item.size == _selectedSize &&
                  item.color == _selectedColor);
            }
            final isSoldOut = data.stock <= 0 && state is ProductDetailsLoaded;
            final buttonText = isSoldOut
                ? 'نفدت الكمية'
                : (isAdded ? 'اذهب للسلة 🛒' : addToCartStr);
            final buttonIcon = isSoldOut
                ? Icons.remove_shopping_cart_rounded
                : (isAdded
                    ? Icons.arrow_forward_rounded
                    : Icons.shopping_bag_rounded);
            final buttonBgConfig = isSoldOut
                ? Colors.grey.shade300
                : (isAdded ? Colors.green.shade50 : Colors.white);
            final buttonTextColor =
                isSoldOut ? Colors.grey.shade600 : Colors.black;

            return AnimatedBuilder(
              animation: _cartPop,
              builder: (_, child) {
                final t = _cartPop.value;
                final s = 1.0 + 0.05 * (t < 0.5 ? t * 2 : (1 - t) * 2);
                return Transform.scale(scale: s, child: child);
              },
              child: GestureDetector(
                onTap: isSoldOut
                    ? null
                    : () => isAdded
                        ? _goToCart(context)
                        : _addToCart(context, data),
                child: Container(
                  height: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 28),
                  decoration: BoxDecoration(
                      color: buttonBgConfig,
                      borderRadius: BorderRadius.circular(100)),
                  child: Row(
                    children: [
                      Icon(buttonIcon, color: buttonTextColor, size: 20),
                      const SizedBox(width: 8),
                      Text(buttonText,
                          style: TextStyle(
                              fontFamily: 'Cairo',
                              color: buttonTextColor,
                              fontWeight: FontWeight.bold,
                              fontSize: 14)),
                    ],
                  ),
                ),
              ),
            );
          }),
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
      spacing: 6,
      runSpacing: 6,
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
            width: 36,
            height: 36,
            padding: EdgeInsets.all(isSel ? 2 : 0),
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
      spacing: 6,
      runSpacing: 6,
      children: sizes.map((s) {
        final isSel = _selectedSize == s;
        return GestureDetector(
          onTap: () {
            HapticFeedback.selectionClick();
            setState(() {
              _selectedSize = isSel ? null : s;
            });
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
                color: isSel ? Colors.black : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                    color: isSel ? Colors.black : Colors.grey.shade300,
                    width: 1.5)),
            child: Text(s,
                style: TextStyle(
                    fontFamily: 'Cairo',
                    color: isSel ? Colors.white : Colors.black,
                    fontWeight: isSel ? FontWeight.w700 : FontWeight.w500,
                    fontSize: 13)),
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
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color:
              const Color(0xFF1A1A1A).withValues(alpha: 0.45), // Darker overlay
          shape: BoxShape.circle,
          border: Border.all(
              color: Colors.white.withValues(alpha: 0.1), width: 0.5),
        ),
        child: Icon(icon, color: iconColor, size: 18),
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
                reviewCount: data.reviewCount,
                blurHash: data.blurHash,
              ));
            }
          },
        );
      },
    );
  }

  Widget _cartIcon(BuildContext context) {
    return Container(
      key: _cartKey,
      child: BlocBuilder<CartBloc, CartState>(
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
                            border:
                                Border.all(color: Colors.white, width: 1.5)),
                        child: Text('$count',
                            style: const TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                height: 1)))),
            ],
          );
        },
      ),
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
          maxHeight: MediaQuery.of(context).size.height * 0.9,
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
                      color: AppTheme.primaryColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.straighten_rounded,
                        color: AppTheme.primaryColor, size: 22),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text('دليل المقاسات',
                        style: TextStyle(
                            fontFamily: 'Cairo',
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
                child: Column(
                  children: () {
                    // Split content by comma or newline to separate measurements
                    final items = content
                        .split(RegExp(r'[,،\n]'))
                        .map((e) => e.trim())
                        .where((e) => e.isNotEmpty)
                        .toList();

                    if (items.isEmpty) {
                      return [
                        Text(
                          content,
                          style: const TextStyle(
                            fontFamily: 'Cairo',
                            fontSize: 15,
                            height: 1.8,
                            color: Colors.black87,
                          ),
                        )
                      ];
                    }

                    return items.map((item) {
                      // Check if item contains '=' to split key/value
                      final parts = item.split('=');
                      final hasKeyVal = parts.length > 1;
                      final key = hasKeyVal ? parts[0].trim() : '';
                      final val =
                          hasKeyVal ? parts.sublist(1).join('=').trim() : item;

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 20, vertical: 16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.03),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            )
                          ],
                          border: Border.all(color: const Color(0xFFF0F0F0)),
                        ),
                        child: Row(
                          mainAxisAlignment: hasKeyVal
                              ? MainAxisAlignment.spaceBetween
                              : MainAxisAlignment.start,
                          children: [
                            if (hasKeyVal) ...[
                              // Key (e.g., "S", "M")
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color: AppTheme.primaryColor
                                      .withValues(alpha: 0.08),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  key,
                                  style: const TextStyle(
                                    fontFamily: 'Cairo',
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                    color: AppTheme.primaryColor,
                                  ),
                                ),
                              ),
                              // Dotted Line or Spacer
                              Expanded(
                                child: Container(
                                  margin: const EdgeInsets.symmetric(
                                      horizontal: 16),
                                  height: 1,
                                  color: Colors.grey.shade200,
                                ),
                              ),
                            ],

                            // Value (e.g., "Chest 50cm")
                            Flexible(
                              fit: hasKeyVal ? FlexFit.loose : FlexFit.tight,
                              child: Text(
                                val,
                                style: TextStyle(
                                  fontFamily: 'Cairo',
                                  fontSize: 16,
                                  fontWeight: hasKeyVal
                                      ? FontWeight.w600
                                      : FontWeight.w500,
                                  color: Colors.black87,
                                  height: 1.2,
                                ),
                                textAlign:
                                    hasKeyVal ? TextAlign.end : TextAlign.start,
                              ),
                            ),
                          ],
                        ),
                      );
                    }).toList();
                  }(),
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
                  child: const Text('حسناً',
                      style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 16,
                          fontWeight: FontWeight.bold)),
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
            style: const TextStyle(
                fontFamily: 'Cairo', fontWeight: FontWeight.bold)),
        content: Text(
            AppLocalizations.of(ctx)?.sessionExpiredMessage ??
                'Please login again.',
            style: const TextStyle(
              fontFamily: 'Cairo',
            )),
        actions: [
          TextButton(
              onPressed: () {
                Navigator.of(ctx).pop();
                Navigator.push(ctx,
                    MaterialPageRoute(builder: (_) => const LoginScreen()));
              },
              child: Text(AppLocalizations.of(ctx)?.ok ?? 'OK',
                  style: const TextStyle(
                      fontFamily: 'Cairo',
                      fontWeight: FontWeight.bold,
                      color: Colors.black)))
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
                                  key: _imageKey,
                                  controller: _pageController,
                                  itemCount: data.images.length,
                                  onPageChanged: (i) =>
                                      setState(() => _currentImageIndex = i),
                                  itemBuilder: (_, i) => Hero(
                                    tag: 'desktop_img_$i',
                                    child: MediaViewerWidget(
                                      url: data.images[i],
                                      blurHash: data.blurHash,
                                      fit: BoxFit.contain,
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
                                                : Colors.black
                                                    .withValues(alpha: 0.3),
                                            borderRadius:
                                                BorderRadius.circular(4),
                                            border: Border.all(
                                                color: Colors.white
                                                    .withValues(alpha: 0.5))),
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

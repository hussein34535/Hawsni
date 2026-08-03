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
import 'package:hwasi_app/features/products/data/models/product_model.dart';
import 'package:hwasi_app/features/products/presentation/widgets/related_products.dart';
import 'package:hwasi_app/features/products/presentation/widgets/reviews_section.dart';
import 'package:hwasi_app/features/reviews/bloc/review_bloc.dart';
import 'package:hwasi_app/features/reviews/bloc/review_event.dart';
import 'package:hwasi_app/features/reviews/data/services/review_service.dart';
import 'package:hwasi_app/features/vto/presentation/screens/virtual_try_on_screen.dart';
import 'package:hwasi_app/features/products/presentation/widgets/full_screen_gallery.dart';
import 'package:hwasi_app/l10n/generated/app_localizations.dart';
import 'package:provider/provider.dart';
// import 'package:flutter_blurhash/flutter_blurhash.dart';
import 'package:hwasi_app/features/home/presentation/widgets/free_delivery_banner.dart';

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
  final bool isVtoEnabled;

  final List<ProductVariant>? variants;
  final List<ProductAccessory>? accessories;

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
    required this.isVtoEnabled,
    this.variants,
    this.accessories,
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
  final Map<String, ProductAccessory> _selectedAccessories = {};

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
    if (_selectedSize != null && _isSizeOutOfStock(_selectedSize!, data)) {
      _toast(ctx, 'الكمية نفدت', isError: true);
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

    _finalizeAddToCart(ctx, data, itemId, _selectedAccessories.values.toList());
  }

  void _finalizeAddToCart(BuildContext ctx, DisplayData data, String itemId, List<ProductAccessory> selectedAccessories) {
    // Add Main Product 
    final accessoriesJson = selectedAccessories.map((acc) => {
      'name': acc.name,
      'price': acc.price,
      'image_url': acc.imageUrl,
    }).toList();

    ctx.read<CartBloc>().add(AddToCart(CartItem(
          id: itemId,
          name: data.name,
          price: data.price,
          imageUrl: data.imageUrl,
          quantity: _quantity,
          productId: widget.productId,
          size: _selectedSize,
          color: _selectedColor,
          accessories: accessoriesJson.isNotEmpty ? accessoriesJson : null,
        )));

    ctx.read<AnalyticsService>().logAddToCart(
        itemId: itemId,
        itemName: data.name,
        itemCategory: 'Fashion',
        price: double.tryParse(data.price) ?? 0);

    for (var acc in selectedAccessories) {
      ctx.read<AnalyticsService>().logAddToCart(
          itemId: '${widget.productId}_acc_${acc.name}',
          itemName: '${data.name} - ${acc.name}',
          itemCategory: 'Accessories',
          price: acc.price);
    }

    HapticFeedback.mediumImpact();
    _cartPop.forward(from: 0);

    // Trigger parabolic animation
    if (data.imageUrl.isNotEmpty) {
      _runAddToCartAnimation(data.imageUrl);
    }

    _toast(ctx, AppLocalizations.of(ctx)?.addedToCart ?? 'تمت الإضافة للسلة',
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
    bool isVtoEnabled = true;
    List<ProductVariant>? variants;
    List<ProductAccessory>? accessories;
    String? blurHash = widget.blurHash;

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
      isVtoEnabled = state.product.isVtoEnabled;
      variants = state.product.variants;
      accessories = state.product.accessories;
      blurHash = state.product.blurHash;
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
        blurHash: blurHash,
        stock: stock,
        isVtoEnabled: isVtoEnabled,
        variants: variants,
        accessories: accessories);
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

                // Auto-select if only one option exists
                if (product.sizes != null && product.sizes!.length == 1) {
                  _selectedSize = product.sizes![0];
                }
                if (product.colors != null && product.colors!.length == 1) {
                  final colorObj = product.colors![0];
                  if (colorObj is String) {
                    _selectedColor = colorObj;
                  } else if (colorObj is Map) {
                    _selectedColor = colorObj['color'] as String?;
                  }
                }

                // SEO: Dynamic Meta Tags & Structured Data
                if (kIsWeb && !kIsWasm) {
                  final meta = MetaSEO();

                  // Basic Metas
                  meta.author(author: 'hwasi');
                  meta.description(
                      description: product.description.length > 150
                          ? '${product.description.substring(0, 147)}...'
                          : product.description);
                  meta.keywords(
                      keywords:
                          '${product.name}, fashion, style, buy online, hwasi, ${product.category}');

                  // Open Graph
                  meta.ogTitle(ogTitle: '${product.name} | hwasi');
                  meta.ogDescription(
                      ogDescription: product.description.length > 150
                          ? '${product.description.substring(0, 147)}...'
                          : product.description);
                  meta.ogImage(ogImage: product.imageUrl);

                  // Twitter
                  meta.twitterCard(twitterCard: TwitterCard.summaryLargeImage);
                  meta.twitterTitle(twitterTitle: '${product.name} | hwasi');
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
          MediaQuery.of(context).size.width * 0.8, // Matching aspect-[4/3.2]
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
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    decoration: BoxDecoration(
                      color:
                          Colors.black.withValues(alpha: 0.35), // More visible
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
                                right: i < data.images.length - 1 ? 5 : 0),
                            width: active ? 14 : 7, // Bigger dots
                            height: 7,
                            decoration: BoxDecoration(
                              color: active
                                  ? Colors.white
                                  : Colors.white.withValues(alpha: 0.55),
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
              style: const TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  height: 1.2,
                  color: Color(0xFF1A1A1A))),
          const SizedBox(height: 10),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Price
              Row(
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  Text(
                    double.tryParse(data.price)?.round().toString() ?? data.price,
                    style: const TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    currency,
                    style: const TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey,
                    ),
                  ),
                ],
              ),
              // Rating
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Row(
                    children: [
                      ...List.generate(5, (index) => const Icon(Icons.star_rounded, color: Colors.amber, size: 14)),
                      const SizedBox(width: 4),
                      const Text('0.0', style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w900, fontSize: 14)),
                    ],
                  ),
                  const Text('(0 التقييمات)', style: TextStyle(fontFamily: 'Cairo', color: Colors.grey, fontWeight: FontWeight.bold, fontSize: 12)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Free Delivery Banner
          const FreeDeliveryBanner(),
          const SizedBox(height: 20),

          // Try On Banner
          if (data.isVtoEnabled) ...[
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
          ],

          // Colors
          if (data.colors.length > 1) ...[
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
                        fontSize: 14,
                        fontWeight: FontWeight.w900,
                        color: Colors.black87)),
                GestureDetector(
                  onTap: () => _showSizeGuidePopup(context, data.sizeGuide),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0E4435),
                      borderRadius: BorderRadius.circular(100),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 4, offset: const Offset(0, 2)),
                      ],
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.straighten_rounded, size: 13, color: Colors.white),
                        SizedBox(width: 6),
                        Text('دليل المقاسات',
                            style: TextStyle(
                                fontFamily: 'Cairo',
                                fontSize: 12,
                                fontWeight: FontWeight.w900,
                                color: Colors.white)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (data.sizes.length > 1)
              _sizeRow(data.sizes, data)
            else
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Text(
                  data.sizes[0],
                  style: const TextStyle(
                    fontFamily: 'Cairo',
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: Colors.black87,
                  ),
                ),
              ),
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

          // Accessories Section
          if (data.accessories != null && data.accessories!.isNotEmpty) ...[
            const Text('إضافات مميزة',
                style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 14,
                    fontWeight: FontWeight.w900,
                    color: Colors.black87)),
            const SizedBox(height: 12),
            Column(
              children: data.accessories!.map((acc) {
                final isSelected = _selectedAccessories.containsKey(acc.id);
                return GestureDetector(
                  onTap: () {
                    HapticFeedback.selectionClick();
                    setState(() {
                      if (isSelected) {
                        _selectedAccessories.remove(acc.id);
                      } else {
                        _selectedAccessories[acc.id!] = acc;
                      }
                    });
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isSelected ? const Color(0xFF0E4435).withValues(alpha: 0.05) : Colors.white,
                      border: Border.all(
                        color: isSelected ? const Color(0xFF0E4435).withValues(alpha: 0.3) : Colors.grey.shade200,
                      ),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 20,
                          height: 20,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: isSelected ? const Color(0xFF0E4435) : Colors.transparent,
                            border: Border.all(
                              color: isSelected ? const Color(0xFF0E4435) : Colors.grey.shade300,
                              width: 2,
                            ),
                          ),
                          child: isSelected 
                            ? const Icon(Icons.check, size: 12, color: Colors.white)
                            : null,
                        ),
                        const SizedBox(width: 12),
                        if (acc.imageUrl != null && acc.imageUrl!.isNotEmpty) ...[
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: CachedNetworkImage(
                              imageUrl: acc.imageUrl!,
                              width: 40,
                              height: 40,
                              fit: BoxFit.cover,
                              placeholder: (context, url) => Container(color: Colors.grey.shade50),
                              errorWidget: (context, url, error) => Container(color: Colors.grey.shade50),
                            ),
                          ),
                          const SizedBox(width: 12),
                        ],
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                acc.name ?? '',
                                style: const TextStyle(
                                  fontFamily: 'Cairo',
                                  fontWeight: FontWeight.w900,
                                  fontSize: 14,
                                ),
                              ),
                              if (acc.price > 0)
                                Text(
                                  '+ ${acc.price} $currency',
                                  style: const TextStyle(
                                    fontFamily: 'Cairo',
                                    color: Color(0xFF0E4435),
                                    fontWeight: FontWeight.w900,
                                    fontSize: 12,
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 20),
          ],

          // Quantity
          const Text('الكمية',
              style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 14,
                  fontWeight: FontWeight.w900,
                  color: Colors.black87)),
          const SizedBox(height: 12),
          Row(
            children: [
              GestureDetector(
                onTap: _dec,
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border.all(color: Colors.grey.shade200),
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 2)],
                  ),
                  child: Icon(Icons.remove_rounded, size: 16, color: _quantity > 1 ? Colors.black87 : Colors.grey.shade400),
                ),
              ),
              SizedBox(
                width: 48,
                child: Text('$_quantity', textAlign: TextAlign.center, style: const TextStyle(fontFamily: 'Cairo', fontSize: 16, fontWeight: FontWeight.w900, color: Colors.black87)),
              ),
              GestureDetector(
                onTap: _inc,
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border.all(color: Colors.grey.shade200),
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 2)],
                  ),
                  child: const Icon(Icons.add_rounded, size: 16, color: Colors.black87),
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
          const Row(
            children: [
              Icon(Icons.info_outline_rounded, size: 16, color: Color(0xFF0E4435)),
              SizedBox(width: 8),
              Text('التفاصيل',
                  style: TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      color: Colors.black87)),
            ],
          ),
          const SizedBox(height: 12),
          Text(data.description,
              style: const TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 14,
                  height: 1.8,
                  color: Colors.black54,
                  fontWeight: FontWeight.w600)),
          const SizedBox(height: 40),

          const Divider(color: Color(0xFFF0F0F0), thickness: 1),
          const SizedBox(height: 24),
          _buildFAQSection(context),
          const SizedBox(height: 40),
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

  // ── FAQ SECTION ─────────────────────────────────────────────────────────────
  Widget _buildFAQSection(BuildContext context) {
    final isRTL = Directionality.of(context) == TextDirection.rtl;
    final faqs = [
      {
        'question': isRTL ? 'متى يصل طلبي؟' : 'When will my order arrive?',
        'answer': isRTL 
          ? 'يصل طلبك خلال 2 إلى 5 أيام عمل تقريباً حسب موقعك.' 
          : 'Your order will arrive within 2 to 5 business days depending on your location.'
      },
      {
        'question': isRTL ? 'هل يمكنني إرجاع أو استبدال المنتج؟' : 'Can I return or exchange the product?',
        'answer': isRTL 
          ? 'نعم، نوفر خدمة الاسترجاع والاستبدال خلال 7 أيام من استلام الطلب بشرط بقاء المنتج في حالته الأصلية. مع العلم أنه يتم خصم مبلغ دبوزت لشركة الشحن وليس المبلغ كاملاً.' 
          : 'Yes, we offer returns and exchanges within 7 days of receiving the order, provided the product is in its original condition. Note: a deposit fee for the shipping company is deducted, not the full amount.'
      },
      {
        'question': isRTL ? 'هل يوجد معاينة قبل الاستلام؟' : 'Can I inspect the order upon delivery?',
        'answer': isRTL 
          ? 'نعم، متاح معاينة للمنتج للتأكد من جودته ومطابقته لطلبك. إذا كان هناك أي خطأ أو عيب، لا تتحمل أي رسوم. أما لأي سبب آخر، يتم خصم مصاريف الشحن لشركة التوصيل.' 
          : 'Yes, you can inspect the product upon delivery. If there are any defects or errors, you pay nothing. For any other reason, a 50 EGP shipping fee applies.'
      }
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.info_rounded, size: 18, color: Color(0xFF0E4435)),
            const SizedBox(width: 8),
            Text(
              isRTL ? 'معلومات تهمك' : 'Important Information',
              style: const TextStyle(
                fontFamily: 'Cairo',
                fontSize: 16,
                fontWeight: FontWeight.w900,
                color: Color(0xFF1A1A1A),
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),
        ...faqs.map((faq) => _buildFAQItem(faq['question']!, faq['answer']!)),
      ],
    );
  }

  Widget _buildFAQItem(String question, String answer) {
    return StatefulBuilder(
      builder: (context, setState) {
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: const Color(0xFFF9F9F9),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFF0F0F0)),
          ),
          child: ExpansionTile(
            shape: const RoundedRectangleBorder(side: BorderSide.none),
            collapsedShape: const RoundedRectangleBorder(side: BorderSide.none),
            tilePadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
            title: Text(
              question,
              style: const TextStyle(
                fontFamily: 'Cairo',
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1A1A1A),
              ),
            ),
            trailing: Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFF0F0F0)),
              ),
              child: const Icon(Icons.keyboard_arrow_down_rounded, size: 20, color: Colors.grey),
            ),
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                child: Text(
                  answer,
                  style: const TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 13,
                    color: Colors.grey,
                    fontWeight: FontWeight.bold,
                    height: 1.6,
                  ),
                ),
              ),
            ],
          ),
        );
      }
    );
  }

  // ── Glass Action Pill (Bottom) ─────────────────────────────────────────────
  Widget _buildGlassActionPill(
      BuildContext context, DisplayData data, ProductState state) {
    final currency = AppLocalizations.of(context)?.currencySymbol ?? 'EGP';
    final l10n = AppLocalizations.of(context)!;

    // Calculate total price
    final basePrice = double.tryParse(data.price) ?? 0;
    double accessoriesPrice = 0.0;
    for (var acc in _selectedAccessories.values) {
      accessoriesPrice += acc.price;
    }
    final unitPrice = basePrice + accessoriesPrice;
    final totalPrice = unitPrice * _quantity;
    
    final formattedTotal = totalPrice.round().toString();

    final cartState = context.watch<CartBloc>().state;
    bool isInCart = false;
    if (cartState is CartLoaded) {
      final itemId = '${widget.productId}${_selectedSize != null ? "_$_selectedSize" : ""}${_selectedColor != null ? "_$_selectedColor" : ""}';
      isInCart = cartState.items.any((item) => item.id == itemId);
    }

    final isSoldOut = data.stock <= 0 && state is ProductDetailsLoaded;

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 24),
      height: 84,
      decoration: BoxDecoration(
        color: const Color(0xFF0A0A0A),
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.3),
            blurRadius: 30,
            offset: const Offset(0, 10),
          ),
        ],
        border: Border.all(color: Colors.white.withValues(alpha: 0.1), width: 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Row(
          children: [
            // Price & Quantity Area
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (_quantity > 1)
                      Row(
                        children: [
                          GestureDetector(
                            onTap: _dec,
                            child: const Icon(Icons.remove, size: 14, color: Colors.white38),
                          ),
                          const SizedBox(width: 8),
                          Text('$_quantity', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w900)),
                          const SizedBox(width: 8),
                          GestureDetector(
                            onTap: _inc,
                            child: const Icon(Icons.add, size: 14, color: Colors.white38),
                          ),
                        ],
                      ),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        Text(
                          formattedTotal,
                          style: const TextStyle(
                            fontFamily: 'Cairo',
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          currency,
                          style: const TextStyle(
                            fontFamily: 'Cairo',
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Colors.white54,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            
            // Action Button
            GestureDetector(
              onTap: isSoldOut ? null : (isInCart ? () => _goToCart(context) : () => _addToCart(context, data)),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                height: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 32),
                decoration: BoxDecoration(
                  color: isSoldOut 
                    ? Colors.white10 
                    : (isInCart ? const Color(0xFF0E4435) : Colors.white),
                  borderRadius: BorderRadius.circular(26),
                ),
                child: Center(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        isSoldOut ? Icons.remove_shopping_cart : (isInCart ? Icons.shopping_bag : Icons.shopping_bag_outlined),
                        size: 20,
                        color: isSoldOut ? Colors.white24 : (isInCart ? Colors.white : const Color(0xFF0A0A0A)),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        isSoldOut 
                          ? 'نفدت' 
                          : (isInCart ? (Directionality.of(context) == TextDirection.rtl ? 'للسلة' : 'To Cart') : l10n.addToCart),
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 15,
                          fontWeight: FontWeight.w900,
                          color: isSoldOut ? Colors.white24 : (isInCart ? Colors.white : const Color(0xFF0A0A0A)),
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

  bool _isSizeOutOfStock(String size, DisplayData data) {
    if (data.variants == null || data.variants!.isEmpty) {
      return data.stock <= 0;
    }
    var variantsForSize = data.variants!.where((v) => v.size == size).toList();
    if (_selectedColor != null) {
      variantsForSize = variantsForSize.where((v) => v.color == _selectedColor || v.color == null || v.color!.isEmpty).toList();
    }
    if (variantsForSize.isEmpty) return data.stock <= 0;
    return variantsForSize.every((v) => v.stock <= 0);
  }

  Widget _sizeRow(List<String> sizes, DisplayData data) {
    return Wrap(
      spacing: 6,
      runSpacing: 6,
      children: sizes.map((s) {
        final isSel = _selectedSize == s;
        final outOfStock = _isSizeOutOfStock(s, data);
        
        return GestureDetector(
          onTap: outOfStock ? null : () {
            HapticFeedback.selectionClick();
            setState(() {
              _selectedSize = isSel ? null : s;
            });
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
                color: outOfStock ? Colors.grey.shade100 : (isSel ? const Color(0xFF0E4435) : Colors.white),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                    color: outOfStock ? Colors.grey.shade300 : (isSel ? const Color(0xFF0E4435) : Colors.grey.shade200),
                    width: 1.5),
                boxShadow: isSel ? [BoxShadow(color: Colors.black.withValues(alpha: 0.15), blurRadius: 4, offset: const Offset(0, 2))] : [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 2)],
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                Text(s,
                    style: TextStyle(
                        fontFamily: 'Cairo',
                        color: outOfStock ? Colors.grey.shade400 : (isSel ? Colors.white : Colors.black87),
                        fontWeight: isSel ? FontWeight.w900 : FontWeight.w700,
                        fontSize: 12)),
                if (outOfStock)
                  Positioned.fill(
                    child: Center(
                      child: Transform.rotate(
                        angle: -0.4,
                        child: Container(
                          width: double.infinity,
                          height: 1.5,
                          color: Colors.grey.shade400,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
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

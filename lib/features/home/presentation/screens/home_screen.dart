import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:cached_network_image/cached_network_image.dart';

import 'package:hwasi_app/core/themes/app_theme.dart';
import 'package:hwasi_app/core/widgets/spinning_loader.dart';
import 'package:hwasi_app/features/home/bloc/home_bloc.dart';
import 'package:hwasi_app/features/home/data/services/category_service.dart';
import 'package:hwasi_app/features/home/presentation/widgets/hero_carousel.dart';
import 'package:hwasi_app/features/home/presentation/widgets/product_card.dart';
import 'package:hwasi_app/features/notifications/presentation/screens/notifications_screen.dart';
import 'package:hwasi_app/features/products/data/services/product_service.dart';
import 'package:hwasi_app/features/products/presentation/screens/products_screen.dart';
import 'package:hwasi_app/features/search/presentation/screens/search_screen.dart';
import 'package:hwasi_app/core/utils/responsive_layout.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ScrollController _scrollController = ScrollController();
  String _selectedFilter = 'All';

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => HomeBloc(
        CategoryService(),
        ProductService(),
      )..add(LoadHomeData()),
      child: Scaffold(
        backgroundColor: const Color(0xFFFAFAFA), // Light gray background
        body: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1200),
            child: BlocBuilder<HomeBloc, HomeState>(
              builder: (context, state) {
                if (state is HomeLoading) {
                  return const Center(child: SpinningLoader());
                } else if (state is HomeError) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline,
                            color: Colors.red, size: 48),
                        const SizedBox(height: 16),
                        Text(
                          state.message,
                          style: TextStyle(
                            fontFamily: 'Cairo',
                            color: Colors.black87,
                            fontSize: 16,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: () {
                            context.read<HomeBloc>().add(RefreshHomeData());
                          },
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  );
                } else if (state is HomeLoaded) {
                  return RefreshIndicator(
                    onRefresh: () async {
                      context.read<HomeBloc>().add(RefreshHomeData());
                    },
                    color: AppTheme.primaryColor,
                    child: CustomScrollView(
                      controller: _scrollController,
                      physics: const BouncingScrollPhysics(
                          parent: AlwaysScrollableScrollPhysics()),
                      cacheExtent:
                          1500, // Pre-renders roughly 2-3 viewports of content to prevent white gaps
                      slivers: [
                        // Modern Clean AppBar (Mobile/Tablet only)
                        if (!ResponsiveLayout.isDesktop(context))
                          SliverToBoxAdapter(child: _buildAppBar(context)),

                        // Search Bar
                        SliverToBoxAdapter(child: _buildSearchBar(context)),

                        // Hero Banner
                        SliverToBoxAdapter(
                          child: Padding(
                            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                            child: RepaintBoundary(
                              child: SizedBox(
                                height: ResponsiveLayout.isDesktop(context)
                                    ? 400
                                    : ResponsiveLayout.isTablet(context)
                                        ? 280
                                        : 160,
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(16),
                                  child: HeroCarousel(banners: state.banners),
                                ),
                              ),
                            ),
                          ),
                        ),

                        // Categories Section
                        SliverToBoxAdapter(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Padding(
                                padding:
                                    const EdgeInsets.fromLTRB(20, 24, 20, 12),
                                child: Row(
                                  children: [
                                    Text(
                                      'Shop by Category', // If this is translated, it will use Cairo
                                      style: TextStyle(
                                        fontFamily: 'Cairo',
                                        fontSize: 20,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.black87,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    const Icon(Icons.auto_awesome,
                                        color: AppTheme.accentColor, size: 24),
                                  ],
                                ),
                              ),
                              RepaintBoundary(
                                child: SizedBox(
                                  height: 100,
                                  child: ListView.builder(
                                    scrollDirection: Axis.horizontal,
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 16),
                                    addAutomaticKeepAlives: false,
                                    addRepaintBoundaries: false,
                                    itemCount: state.categories.length,
                                    itemBuilder: (context, index) {
                                      final category = state.categories[index];
                                      return GestureDetector(
                                        onTap: () {
                                          Navigator.push(
                                            context,
                                            MaterialPageRoute(
                                              builder: (context) =>
                                                  ProductsScreen(
                                                categoryName: category.name,
                                                categoryId: category.id,
                                              ),
                                            ),
                                          );
                                        },
                                        child: Container(
                                          width: 80,
                                          margin: const EdgeInsets.symmetric(
                                              horizontal: 4),
                                          child: Column(
                                            children: [
                                              Container(
                                                width: 65,
                                                height: 65,
                                                padding: const EdgeInsets.all(
                                                    2.5), // Gradient border width
                                                decoration: BoxDecoration(
                                                  shape: BoxShape.circle,
                                                  gradient:
                                                      const LinearGradient(
                                                    colors: [
                                                      AppTheme.primaryColor,
                                                      AppTheme.accentColor
                                                    ],
                                                    begin: Alignment.topLeft,
                                                    end: Alignment.bottomRight,
                                                  ),
                                                  boxShadow: [
                                                    BoxShadow(
                                                      color: AppTheme
                                                          .primaryColor
                                                          .withValues(
                                                              alpha: 0.2),
                                                      blurRadius: 12,
                                                      offset:
                                                          const Offset(0, 4),
                                                    ),
                                                  ],
                                                ),
                                                child: Container(
                                                  decoration:
                                                      const BoxDecoration(
                                                    color: Colors.white,
                                                    shape: BoxShape.circle,
                                                  ),
                                                  child: ClipOval(
                                                    child: category.imageUrl !=
                                                            null
                                                        ? (category.imageUrl!
                                                                .toLowerCase()
                                                                .endsWith(
                                                                    '.svg')
                                                            ? Padding(
                                                                padding:
                                                                    const EdgeInsets
                                                                        .all(
                                                                        12.0),
                                                                child: SvgPicture
                                                                    .network(
                                                                  category
                                                                      .imageUrl!,
                                                                  fit: BoxFit
                                                                      .contain,
                                                                  placeholderBuilder:
                                                                      (BuildContext
                                                                          context) {
                                                                    return Container(
                                                                        color: Colors
                                                                            .transparent);
                                                                  },
                                                                ),
                                                              )
                                                            : kIsWeb
                                                                ? Image.network(
                                                                    category
                                                                        .imageUrl!,
                                                                    fit: BoxFit
                                                                        .cover,
                                                                    errorBuilder: (context,
                                                                            error,
                                                                            stackTrace) =>
                                                                        Container(
                                                                            color:
                                                                                Colors.transparent),
                                                                  )
                                                                : CachedNetworkImage(
                                                                    imageUrl:
                                                                        category
                                                                            .imageUrl!,
                                                                    fit: BoxFit
                                                                        .cover,
                                                                    memCacheWidth:
                                                                        200,
                                                                    memCacheHeight:
                                                                        200,
                                                                    placeholder: (context,
                                                                            url) =>
                                                                        Container(
                                                                            color:
                                                                                Colors.transparent),
                                                                    errorWidget: (context,
                                                                            url,
                                                                            error) =>
                                                                        Container(
                                                                            color:
                                                                                Colors.transparent),
                                                                  ))
                                                        : Container(
                                                            color: Colors
                                                                .transparent),
                                                  ),
                                                ),
                                              ),
                                              const SizedBox(height: 8),
                                              Text(
                                                category.name,
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                                textAlign: TextAlign.center,
                                                style: TextStyle(
                                                  fontFamily: 'Cairo',
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w600,
                                                  color: Colors.black87,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                        // Products Grid
                        SliverPadding(
                          padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
                          sliver: SliverGrid(
                            gridDelegate:
                                SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount:
                                  ResponsiveLayout.isDesktop(context)
                                      ? 5
                                      : ResponsiveLayout.isTablet(context)
                                          ? 3
                                          : 2,
                              childAspectRatio:
                                  0.68, // Slightly taller to fit content comfortably without cramping
                              crossAxisSpacing: 16, // More breathing room
                              mainAxisSpacing: 24, // More vertical separation
                            ),
                            delegate: SliverChildBuilderDelegate(
                              (context, index) {
                                final products = _selectedFilter == 'All'
                                    ? state.allProducts
                                    : _selectedFilter == 'Featured'
                                        ? state.featuredProducts
                                        : state.flashDeals;

                                if (index >= products.length) {
                                  return const SizedBox();
                                }

                                final product = products[index];
                                return RepaintBoundary(
                                  child: ProductCard(
                                    key: ValueKey(product.id),
                                    id: product.id,
                                    name: product.name,
                                    price: product.price.toString(),
                                    imageUrl: product.imageUrl,
                                    rating: product.rating,
                                    reviewCount: product.reviewCount,
                                    showBadge: _selectedFilter == 'Discount',
                                    badgeText: '60%',
                                    badgeColor: Colors.red,
                                    screenId: 'home',
                                    colors: product.colors,
                                    sizes: product.sizes,
                                    images: product.images,
                                    blurHash: product.blurHash,
                                  ),
                                );
                              },
                              childCount: _selectedFilter == 'All'
                                  ? state.allProducts.length
                                  : _selectedFilter == 'Featured'
                                      ? state.featuredProducts.length
                                      : state.flashDeals.length,
                              addAutomaticKeepAlives: false,
                              addRepaintBoundaries: false,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }
                return const SizedBox.shrink();
              },
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildAppBar(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 12,
        left: 16,
        right: 16,
        bottom: 12,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Logo
          GestureDetector(
            onTap: () => DefaultTabController.of(context).animateTo(3),
            child: Image.asset(
              'assets/images/logo.png',
              width: 42,
              height: 42,
              fit: BoxFit.contain,
              errorBuilder: (context, error, stackTrace) {
                return const Icon(Icons.store, color: Colors.black87, size: 28);
              },
            ),
          ),

          // Logo/Title - Centered
          Text(
            'Hwasi',
            style: TextStyle(
              fontFamily: 'Cairo',
              fontSize: 26,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.2,
              color: AppTheme.primaryColor,
            ),
          ),

          // Notification with Badge
          Stack(
            clipBehavior: Clip.none,
            children: [
              IconButton(
                icon: const Icon(Icons.notifications_outlined,
                    color: Colors.black87),
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                      builder: (_) => const NotificationsScreen()),
                ),
              ),
              Positioned(
                right: 10,
                top: 10,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: Colors.red,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Row(
        children: [
          // Search Field
          Expanded(
            child: GestureDetector(
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const SearchScreen()),
              ),
              child: Container(
                height: 52,
                decoration: BoxDecoration(
                  color: const Color(0xFFF5F5F5),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  children: [
                    const SizedBox(width: 16),
                    Icon(Icons.search, color: Colors.grey[600], size: 22),
                    const SizedBox(width: 12),
                    Text(
                      'Search Products',
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        color: Colors.grey[600],
                        fontSize: 15,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          const SizedBox(width: 12),

          // Filter Button
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: AppTheme.primaryColor,
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(
              Icons.tune,
              color: Colors.white,
              size: 22,
            ),
          ),
        ],
      ),
    );
  }
}

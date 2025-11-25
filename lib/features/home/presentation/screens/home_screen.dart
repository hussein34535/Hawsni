import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hawsni_app/core/themes/app_theme.dart';
import 'package:hawsni_app/core/widgets/spinning_loader.dart';
import 'package:hawsni_app/features/cart/bloc/cart_bloc.dart';
import 'package:hawsni_app/features/cart/bloc/cart_state.dart';
import 'package:hawsni_app/features/cart/presentation/screens/cart_screen.dart';
import 'package:hawsni_app/features/home/bloc/home_bloc.dart';
import 'package:hawsni_app/features/home/data/services/category_service.dart';
import 'package:hawsni_app/features/home/presentation/widgets/category_grid.dart';
import 'package:hawsni_app/features/home/presentation/widgets/flash_deals_section.dart';
import 'package:hawsni_app/features/home/presentation/widgets/hero_carousel.dart';
import 'package:hawsni_app/features/home/presentation/widgets/section_header.dart';
import 'package:hawsni_app/features/home/presentation/widgets/product_card.dart';
import 'package:hawsni_app/features/notifications/presentation/screens/notifications_screen.dart';
import 'package:hawsni_app/features/products/data/services/product_service.dart';
import 'package:hawsni_app/features/products/presentation/screens/products_screen.dart';
import 'package:hawsni_app/features/search/presentation/screens/search_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ScrollController _scrollController = ScrollController();
  bool _isScrolled = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    if (_scrollController.offset > 50 && !_isScrolled) {
      setState(() => _isScrolled = true);
    } else if (_scrollController.offset <= 50 && _isScrolled) {
      setState(() => _isScrolled = false);
    }
  }

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
        backgroundColor: Colors.black,
        extendBodyBehindAppBar: true,
        appBar: _buildAppBar(),
        body: BlocBuilder<HomeBloc, HomeState>(
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
                      style: const TextStyle(color: Colors.white),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () {
                        context.read<HomeBloc>().add(RefreshHomeData());
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryColor,
                        foregroundColor: Colors.black,
                      ),
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
                backgroundColor: Colors.black,
                edgeOffset: MediaQuery.of(context).padding.top +
                    kToolbarHeight +
                    70, // Offset to show indicator below search bar
                child: CustomScrollView(
                  controller: _scrollController,
                  slivers: [
                    // Hero Carousel
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: EdgeInsets.only(
                            top: MediaQuery.of(context).padding.top + 10),
                        child: HeroCarousel(
                          banners: state.banners,
                        ),
                      ),
                    ),

                    // Categories
                    SliverToBoxAdapter(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SectionHeader(
                              title: 'Categories', icon: Icons.category),
                          CategoryGrid(
                            categories: state.categories
                                .map((c) => CategoryGridItem(
                                      name: c.name,
                                      imageUrl: c.imageUrl,
                                      categoryId: c.id,
                                    ))
                                .toList(),
                            onCategoryTap: (category) {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => ProductsScreen(
                                    categoryName: category.name,
                                    categoryId: category.categoryId,
                                  ),
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                    ),

                    // Flash Deals
                    if (state.flashDeals.isNotEmpty)
                      SliverToBoxAdapter(
                        child: FlashDealsSection(
                          endTime: DateTime.now().add(const Duration(hours: 4)),
                          onViewAll: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => const ProductsScreen(
                                  title: 'Flash Deals',
                                ),
                              ),
                            );
                          },
                          products: state.flashDeals,
                        ),
                      ),

                    // Featured Products Header
                    if (state.featuredProducts.isNotEmpty)
                      SliverToBoxAdapter(
                        child: SectionHeader(
                          title: 'Featured For You',
                          icon: Icons.star,
                          onViewAll: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => const ProductsScreen(
                                  title: 'Featured Products',
                                  isFeatured: true,
                                ),
                              ),
                            );
                          },
                        ),
                      ),

                    // Featured Grid
                    if (state.featuredProducts.isNotEmpty)
                      SliverPadding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        sliver: SliverGrid(
                          gridDelegate:
                              const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            childAspectRatio: 0.65,
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12,
                          ),
                          delegate: SliverChildBuilderDelegate(
                            (context, index) {
                              final product = state.featuredProducts[index];
                              return ProductCard(
                                key: ValueKey(product.id),
                                id: product.id,
                                name: product.name,
                                price: product.price.toString(),
                                imageUrl: product.imageUrl,
                                rating: product.rating,
                                reviewCount: product.reviewCount,
                                showBadge: index % 3 == 0,
                                badgeText: 'NEW',
                                badgeColor: AppTheme.primaryColor,
                                screenId: 'home_featured',
                              );
                            },
                            childCount: state.featuredProducts.length,
                          ),
                        ),
                      ),

                    // All Products Header
                    SliverToBoxAdapter(
                      child: SectionHeader(
                        title: 'New Arrivals',
                        icon: Icons.grid_view, // Changed icon
                        onViewAll: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => const ProductsScreen(
                                title: 'New Arrivals',
                              ),
                            ),
                          );
                        },
                      ),
                    ),

                    // All Products Grid
                    SliverPadding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      sliver: SliverGrid(
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 0.65,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                        ),
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            final product = state.allProducts[index];
                            return ProductCard(
                              key: ValueKey('${product.id}_all'),
                              id: product.id,
                              name: product.name,
                              price: product.price.toString(),
                              imageUrl: product.imageUrl,
                              rating: product.rating,
                              reviewCount: product.reviewCount,
                              showBadge: false,
                              screenId: 'home_all',
                            );
                          },
                          childCount: state.allProducts.length,
                        ),
                      ),
                    ),

                    const SliverToBoxAdapter(child: SizedBox(height: 100)),
                  ],
                ),
              );
            }
            return const SizedBox.shrink();
          },
        ),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor:
          _isScrolled ? Colors.black.withOpacity(0.9) : Colors.transparent,
      elevation: 0,
      centerTitle: false,
      title: Row(
        children: [
          Image.asset(
            'assets/images/logo.png',
            width: 24,
            height: 24,
            color: Colors.white,
          ),
          const SizedBox(width: 12),
          const Text(
            'HAWSNI',
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 24,
              letterSpacing: 1.5,
              fontFamily: 'Playfair Display',
            ),
          ),
        ],
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.notifications_outlined, color: Colors.white),
          onPressed: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const NotificationsScreen()),
          ),
        ),
        BlocBuilder<CartBloc, CartState>(
          builder: (context, state) {
            final itemCount = state is CartLoaded ? state.items.length : 0;
            return Stack(
              children: [
                IconButton(
                  icon: const Icon(Icons.shopping_cart_outlined,
                      color: Colors.white),
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const CartScreen()),
                  ),
                ),
                if (itemCount > 0)
                  Positioned(
                    right: 8,
                    top: 8,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: AppTheme.primaryColor,
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        '$itemCount',
                        style: const TextStyle(
                          color: Colors.black,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
              ],
            );
          },
        ),
        const SizedBox(width: 8),
      ],
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(70),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          child: GestureDetector(
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const SearchScreen()),
            ),
            child: Container(
              height: 50,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 10,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  const Icon(Icons.search, color: Colors.grey),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Search Hawsni...',
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontSize: 16,
                        fontFamily: 'Poppins',
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: Colors.grey[200],
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Icon(Icons.camera_alt_outlined,
                        color: Colors.grey, size: 20),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

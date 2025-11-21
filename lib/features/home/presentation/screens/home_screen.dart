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
                child: CustomScrollView(
                  controller: _scrollController,
                  slivers: [
                    // Hero Carousel
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.only(top: 100),
                        child: HeroCarousel(
                          imageUrls: state.featuredProducts
                              .take(5)
                              .map((p) => p.imageUrl)
                              .toList(),
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
                          onViewAll: () {},
                          products: state.flashDeals,
                        ),
                      ),

                    // Featured Products Header
                    SliverToBoxAdapter(
                      child: SectionHeader(
                        title: 'Featured For You',
                        icon: Icons.star,
                        onViewAll: () {},
                      ),
                    ),

                    // Featured Grid
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
                              id: product.id,
                              name: product.name,
                              price: product.price.toString(),
                              imageUrl: product.imageUrl,
                              rating: product.rating,
                              reviewCount: product.reviewCount,
                              showBadge: index % 3 == 0,
                              badgeText: 'NEW',
                              badgeColor: AppTheme.primaryColor,
                            );
                          },
                          childCount: state.featuredProducts.length,
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
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppTheme.primaryColor,
              borderRadius: BorderRadius.circular(8),
            ),
            child:
                const Icon(Icons.shopping_bag, color: Colors.black, size: 20),
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
          icon: const Icon(Icons.search, color: Colors.white),
          onPressed: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const SearchScreen()),
          ),
        ),
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
    );
  }
}

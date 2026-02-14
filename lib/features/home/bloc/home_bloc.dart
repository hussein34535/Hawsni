import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hwasi_app/features/home/data/models/category_model.dart';
import 'package:hwasi_app/features/home/data/services/category_service.dart';
import 'package:hwasi_app/features/products/data/models/product_model.dart';
import 'package:hwasi_app/features/products/data/services/product_service.dart';
import 'package:hwasi_app/core/services/api_service.dart';

// Events
abstract class HomeEvent {}

class LoadHomeData extends HomeEvent {}

class RefreshHomeData extends HomeEvent {}

// States
abstract class HomeState {}

class HomeInitial extends HomeState {}

class HomeLoading extends HomeState {}

class HomeLoaded extends HomeState {
  final List<CategoryModel> categories;
  final List<ProductModel> featuredProducts;
  final List<ProductModel> flashDeals;
  final List<ProductModel> allProducts;
  final List<Map<String, dynamic>> banners;

  HomeLoaded({
    required this.categories,
    required this.featuredProducts,
    required this.flashDeals,
    required this.allProducts,
    required this.banners,
  });
}

class HomeError extends HomeState {
  final String message;

  HomeError(this.message);
}

// Bloc
class HomeBloc extends Bloc<HomeEvent, HomeState> {
  final CategoryService _categoryService;
  final ProductService _productService;

  HomeBloc(this._categoryService, this._productService) : super(HomeInitial()) {
    on<LoadHomeData>(_onLoadHomeData);
    on<RefreshHomeData>(_onRefreshHomeData);
  }

  Future<void> _onLoadHomeData(
    LoadHomeData event,
    Emitter<HomeState> emit,
  ) async {
    emit(HomeLoading());
    try {
      // Fetch data concurrently
      final results = await Future.wait([
        _categoryService.getCategories(),
        _productService.getFeaturedProducts(),
        _productService.getProducts(),
        ApiService.getBanners(),
      ]);

      final categories = results[0] as List<CategoryModel>;
      final List<ProductModel> fetchedFeaturedProducts =
          results[1] as List<ProductModel>;
      final List<ProductModel> allProducts = results[2] as List<ProductModel>;
      final List<dynamic> bannersData = results[3] as List<dynamic>;

      // Convert banner data to proper format
      final List<Map<String, dynamic>> banners =
          bannersData.map((b) => b as Map<String, dynamic>).toList();

      // Fallback if no banners
      if (banners.isEmpty) {
        // No banners from API
      }

      final Set<String> uniqueProductIds = {};
      final List<ProductModel> featuredProducts = [];

      for (var product in fetchedFeaturedProducts) {
        if (uniqueProductIds.add(product.id)) {
          featuredProducts.add(product);
        }
      }

      // For now, use featured products as flash deals or fetch separately if API exists
      final flashDeals = featuredProducts.take(5).toList();

      emit(HomeLoaded(
        categories: categories,
        featuredProducts: featuredProducts,
        flashDeals: flashDeals,
        allProducts: allProducts,
        banners: banners,
      ));
    } catch (e) {
      emit(HomeError(e.toString()));
    }
  }

  Future<void> _onRefreshHomeData(
    RefreshHomeData event,
    Emitter<HomeState> emit,
  ) async {
    // Re-trigger load data
    add(LoadHomeData());
  }
}

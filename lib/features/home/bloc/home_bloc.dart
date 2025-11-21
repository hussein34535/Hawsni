import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hawsni_app/features/home/data/models/category_model.dart';
import 'package:hawsni_app/features/home/data/services/category_service.dart';
import 'package:hawsni_app/features/products/data/models/product_model.dart';
import 'package:hawsni_app/features/products/data/services/product_service.dart';

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

  HomeLoaded({
    required this.categories,
    required this.featuredProducts,
    required this.flashDeals,
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
      ]);

      final categories = results[0] as List<CategoryModel>;
      final featuredProducts = results[1] as List<ProductModel>;

      // For now, use featured products as flash deals or fetch separately if API exists
      final flashDeals = featuredProducts.take(5).toList();

      emit(HomeLoaded(
        categories: categories,
        featuredProducts: featuredProducts,
        flashDeals: flashDeals,
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

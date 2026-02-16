import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hwasi_app/features/products/bloc/product_event.dart';
import 'package:hwasi_app/features/products/bloc/product_state.dart';
import 'package:hwasi_app/features/products/data/services/product_service.dart';
import 'package:hwasi_app/features/products/data/models/product_model.dart';

class ProductBloc extends Bloc<ProductEvent, ProductState> {
  final ProductService _productService;

  ProductBloc(this._productService) : super(ProductInitial()) {
    on<LoadProducts>(_onLoadProducts);
    on<LoadProductDetails>(_onLoadProductDetails);
    // on<SearchProducts>(_onSearchProducts);
  }

  Future<void> _onLoadProducts(
      LoadProducts event, Emitter<ProductState> emit) async {
    emit(ProductLoading());
    try {
      final products = event.isFeatured
          ? await _productService.getFeaturedProducts()
          : await _productService.getProducts(categoryId: event.categoryId);
      emit(ProductLoaded(products));
    } catch (e) {
      emit(ProductError(e.toString()));
    }
  }

  Future<void> _onLoadProductDetails(
      LoadProductDetails event, Emitter<ProductState> emit) async {
    emit(ProductLoading());
    try {
      final product = await _productService.getProductById(event.productId);

      // Fetch related products (same category)
      List<ProductModel> relatedProducts = [];
      try {
        // Fetch related products (same category)
        final allRelated =
            await _productService.getProducts(categoryId: product.category);
        // Filter out current product
        relatedProducts = allRelated.where((p) => p.id != product.id).toList();
      } catch (e) {
        // Silently fail for related products, don't block main product load
        print('Error fetching related products: $e');
      }

      emit(ProductDetailsLoaded(product, relatedProducts: relatedProducts));
    } catch (e) {
      emit(ProductError(e.toString()));
    }
  }
}

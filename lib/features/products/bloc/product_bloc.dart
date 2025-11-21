import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hawsni_app/features/products/bloc/product_event.dart';
import 'package:hawsni_app/features/products/bloc/product_state.dart';
import 'package:hawsni_app/features/products/data/services/product_service.dart';

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
      final products =
          await _productService.getProducts(category: event.category);
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
      emit(ProductDetailsLoaded(product));
    } catch (e) {
      emit(ProductError(e.toString()));
    }
  }
}

import 'package:equatable/equatable.dart';
import 'package:hwasi_app/features/products/data/models/product_model.dart';

abstract class ProductState extends Equatable {
  const ProductState();

  @override
  List<Object> get props => [];
}

class ProductInitial extends ProductState {}

class ProductLoading extends ProductState {}

class ProductLoaded extends ProductState {
  final List<ProductModel> products;

  const ProductLoaded(this.products);

  @override
  List<Object> get props => [products];
}

class ProductError extends ProductState {
  final String message;

  const ProductError(this.message);

  @override
  List<Object> get props => [message];
}

class ProductDetailsLoaded extends ProductState {
  final ProductModel product;
  final List<ProductModel> relatedProducts;

  const ProductDetailsLoaded(this.product, {this.relatedProducts = const []});

  @override
  List<Object> get props => [product, relatedProducts];
}

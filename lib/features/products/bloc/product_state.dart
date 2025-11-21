import 'package:equatable/equatable.dart';
import 'package:hawsni_app/features/products/data/models/product_model.dart';

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

  const ProductDetailsLoaded(this.product);

  @override
  List<Object> get props => [product];
}

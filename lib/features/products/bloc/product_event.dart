import 'package:equatable/equatable.dart';
// import 'package:hwasi_app/features/products/bloc/product_state.dart';

abstract class ProductEvent extends Equatable {
  const ProductEvent();

  @override
  List<Object> get props => [];
}

class LoadProducts extends ProductEvent {
  final String? categoryId;
  final bool isFeatured;

  const LoadProducts({this.categoryId, this.isFeatured = false});

  @override
  List<Object> get props => [categoryId ?? '', isFeatured];
}

class SearchProducts extends ProductEvent {
  final String query;

  const SearchProducts(this.query);

  @override
  List<Object> get props => [query];
}

class LoadProductDetails extends ProductEvent {
  final String productId;

  const LoadProductDetails(this.productId);

  @override
  List<Object> get props => [productId];
}

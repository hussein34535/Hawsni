import 'package:equatable/equatable.dart';

abstract class ProductEvent extends Equatable {
  const ProductEvent();

  @override
  List<Object> get props => [];
}

class LoadProducts extends ProductEvent {
  final String? categoryId;

  const LoadProducts({this.categoryId});

  @override
  List<Object> get props => [categoryId ?? ''];
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

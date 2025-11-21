import 'package:equatable/equatable.dart';

class CartItem extends Equatable {
  final String id;
  final String name;
  final String price;
  final String imageUrl;
  final int quantity;
  final String? size;
  final String? color;
  final String? productId;

  const CartItem({
    required this.id,
    required this.name,
    required this.price,
    required this.imageUrl,
    required this.quantity,
    this.size,
    this.color,
    this.productId,
  });

  CartItem copyWith({
    String? id,
    String? name,
    String? price,
    String? imageUrl,
    int? quantity,
    String? size,
    String? color,
    String? productId,
  }) {
    return CartItem(
      id: id ?? this.id,
      name: name ?? this.name,
      price: price ?? this.price,
      imageUrl: imageUrl ?? this.imageUrl,
      quantity: quantity ?? this.quantity,
      size: size ?? this.size,
      color: color ?? this.color,
      productId: productId ?? this.productId,
    );
  }

  @override
  List<Object?> get props =>
      [id, name, price, imageUrl, quantity, size, color, productId];
}

abstract class CartState extends Equatable {
  const CartState();
  @override
  List<Object> get props => [];
}

class CartLoading extends CartState {}

class CartLoaded extends CartState {
  final List<CartItem> items;
  const CartLoaded({this.items = const []});
  @override
  List<Object> get props => [items];
}

class CartError extends CartState {
  final String message;
  const CartError(this.message);
  @override
  List<Object> get props => [message];
}

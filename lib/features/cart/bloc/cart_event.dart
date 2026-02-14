import 'package:equatable/equatable.dart';
import 'package:hwasi_app/features/cart/bloc/cart_state.dart';

abstract class CartEvent extends Equatable {
  const CartEvent();
  @override
  List<Object> get props => [];
}

class CartStarted extends CartEvent {}

class AddToCart extends CartEvent {
  final CartItem item;
  const AddToCart(this.item);
  @override
  List<Object> get props => [item];
}

class RemoveFromCart extends CartEvent {
  final String itemId;
  const RemoveFromCart(this.itemId);
  @override
  List<Object> get props => [itemId];
}

class UpdateQuantity extends CartEvent {
  final String itemId;
  final int quantity;
  const UpdateQuantity(this.itemId, this.quantity);
  @override
  List<Object> get props => [itemId, quantity];
}

class ClearCart extends CartEvent {}

class SaveForLater extends CartEvent {
  final String itemId;
  final String productId; // Needed for wishlist

  const SaveForLater(this.itemId, this.productId);
  @override
  List<Object> get props => [itemId, productId];
}

class MoveFromSaved extends CartEvent {
  final List<String> itemIds;
  const MoveFromSaved(this.itemIds);
  @override
  List<Object> get props => [itemIds];
}

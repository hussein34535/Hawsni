import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hwasi_app/core/services/api_service.dart';
import 'package:hwasi_app/features/cart/bloc/cart_event.dart';
import 'package:hwasi_app/features/cart/bloc/cart_state.dart';
import 'package:hwasi_app/features/cart/data/services/cart_service.dart';

class CartBloc extends Bloc<CartEvent, CartState> {
  final CartService _cartService;

  CartBloc(this._cartService) : super(CartLoading()) {
    on<CartStarted>(_onCartStarted);
    on<AddToCart>(_onAddToCart);
    on<RemoveFromCart>(_onRemoveFromCart);
    on<UpdateQuantity>(_onUpdateQuantity);
    on<ClearCart>(_onClearCart);
    // on<SaveForLater>(_onSaveForLater); // TODO: Implement SaveForLater with backend if needed
    // on<MoveFromSaved>(_onMoveFromSaved); // TODO: Implement MoveFromSaved with backend if needed
  }

  Future<void> _onCartStarted(
      CartStarted event, Emitter<CartState> emit) async {
    emit(CartLoading());
    try {
      final items = await _cartService.getCart();
      emit(CartLoaded(items: items));
    } on ApiException catch (e) {
      if (e.statusCode == 401 || e.statusCode == 403) {
        emit(CartAuthError(e.message));
      } else {
        emit(CartError('Failed to load cart: ${e.message}'));
      }
    } catch (e) {
      emit(CartError('Failed to load cart: $e'));
    }
  }

  Future<void> _onAddToCart(AddToCart event, Emitter<CartState> emit) async {
    try {
      // Optimistic update could be done here, but for now let's wait for server
      // Or we can show loading.
      // For better UX, let's just call service and update state with result.

      // Note: AddToCart event item might not have productId if it comes from UI that constructs CartItem manually.
      // But CartService needs productId.
      // We should ensure CartItem passed in event has productId, OR pass productId separately.
      // The current CartItem definition has productId.

      if (event.item.productId == null && event.item.id.isNotEmpty) {
        // If productId is missing but id is present (and assuming id is productId for new items)
        // This is a bit risky. Let's assume the UI passes correct data.
      }

      final items = await _cartService.addToCart(
        event.item.productId ??
            event.item
                .id, // Fallback to id if productId is null (assuming id is product id for new items)
        event.item.quantity,
        size: event.item.size,
        color: event.item.color,
      );
      emit(CartLoaded(items: items));
    } on ApiException catch (e) {
      if (e.statusCode == 401 || e.statusCode == 403) {
        emit(CartAuthError(e.message));
      } else {
        emit(CartError('Failed to add to cart: ${e.message}'));
        add(CartStarted());
      }
    } catch (e) {
      emit(CartError('Failed to add to cart: $e'));
      // Reload cart to ensure consistency
      add(CartStarted());
    }
  }

  Future<void> _onRemoveFromCart(
      RemoveFromCart event, Emitter<CartState> emit) async {
    try {
      final items = await _cartService.removeFromCart(event.itemId);
      emit(CartLoaded(items: items));
    } on ApiException catch (e) {
      if (e.statusCode == 401 || e.statusCode == 403) {
        emit(CartAuthError(e.message));
      } else {
        emit(CartError('Failed to remove from cart: ${e.message}'));
        add(CartStarted());
      }
    } catch (e) {
      emit(CartError('Failed to remove from cart: $e'));
      add(CartStarted());
    }
  }

  Future<void> _onUpdateQuantity(
      UpdateQuantity event, Emitter<CartState> emit) async {
    try {
      final items =
          await _cartService.updateCartItem(event.itemId, event.quantity);
      emit(CartLoaded(items: items));
    } on ApiException catch (e) {
      if (e.statusCode == 401 || e.statusCode == 403) {
        emit(CartAuthError(e.message));
      } else {
        emit(CartError('Failed to update quantity: ${e.message}'));
        add(CartStarted());
      }
    } catch (e) {
      emit(CartError('Failed to update quantity: $e'));
      add(CartStarted());
    }
  }

  Future<void> _onClearCart(ClearCart event, Emitter<CartState> emit) async {
    try {
      await _cartService.clearCart();
      emit(const CartLoaded(items: []));
    } on ApiException catch (e) {
      if (e.statusCode == 401 || e.statusCode == 403) {
        emit(CartAuthError(e.message));
      } else {
        emit(CartError('Failed to clear cart: ${e.message}'));
      }
    } catch (e) {
      emit(CartError('Failed to clear cart: $e'));
    }
  }
}

import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hwasi_app/features/address/bloc/address_event.dart';
import 'package:hwasi_app/features/address/bloc/address_state.dart';
import 'package:hwasi_app/features/address/data/services/address_service.dart';

class AddressBloc extends Bloc<AddressEvent, AddressState> {
  final AddressService _addressService;

  AddressBloc({required AddressService addressService})
      : _addressService = addressService,
        super(const AddressState()) {
    on<LoadAddresses>(_onLoadAddresses);
    on<AddAddress>(_onAddAddress);
    on<UpdateAddress>(_onUpdateAddress);
    on<DeleteAddress>(_onDeleteAddress);
    on<SelectAddress>(_onSelectAddress);
  }

  Future<void> _onLoadAddresses(
      LoadAddresses event, Emitter<AddressState> emit) async {
    emit(state.copyWith(status: AddressStatus.loading));
    try {
      final addresses = await _addressService.getAddresses();

      // If we have a selected address ID but it's not in the new list, clear it
      // Or if we don't have one, maybe select default?
      String? selectedId = state.selectedAddressId;

      if (selectedId == null && addresses.isNotEmpty) {
        // Select the default one if exists, otherwise the first one
        try {
          final defaultAddress = addresses.firstWhere((a) => a.isDefault);
          selectedId = defaultAddress.id;
        } catch (_) {
          // No default, select first? User preference.
          // Let's rely on explicit selection or UI logic.
          // But for now, if list was empty and now has items, verify selected.
        }
      }

      emit(state.copyWith(
        status: AddressStatus.success,
        addresses: addresses,
        selectedAddressId: selectedId,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: AddressStatus.failure,
        errorMessage: e.toString(),
      ));
    }
  }

  Future<void> _onAddAddress(
      AddAddress event, Emitter<AddressState> emit) async {
    emit(state.copyWith(status: AddressStatus.loading));
    try {
      final newAddress = await _addressService.addAddress(event.address);
      final updatedList = List.of(state.addresses)..add(newAddress);

      // Sort: Default first? Handled by backend order?
      // For now just add.

      emit(state.copyWith(
        status: AddressStatus.success,
        addresses: updatedList,
        selectedAddressId: newAddress.id, // Auto-select new address
      ));

      // Reload to ensure consistency (e.g. if default flag changed others)
      add(LoadAddresses());
    } catch (e) {
      emit(state.copyWith(
        status: AddressStatus.failure,
        errorMessage: e.toString(),
      ));
    }
  }

  Future<void> _onUpdateAddress(
      UpdateAddress event, Emitter<AddressState> emit) async {
    emit(state.copyWith(status: AddressStatus.loading));
    try {
      await _addressService.updateAddress(event.address);
      add(LoadAddresses()); // Reload to get fresh list
    } catch (e) {
      emit(state.copyWith(
        status: AddressStatus.failure,
        errorMessage: e.toString(),
      ));
    }
  }

  Future<void> _onDeleteAddress(
      DeleteAddress event, Emitter<AddressState> emit) async {
    emit(state.copyWith(status: AddressStatus.loading));
    try {
      await _addressService.deleteAddress(event.addressId);
      final updatedList = state.addresses
          .where((element) => element.id != event.addressId)
          .toList();

      String? selectedId = state.selectedAddressId;
      if (selectedId == event.addressId) {
        selectedId = null; // Cleared selection
      }

      emit(state.copyWith(
        status: AddressStatus.success,
        addresses: updatedList,
        selectedAddressId: selectedId,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: AddressStatus.failure,
        errorMessage: e.toString(),
      ));
    }
  }

  void _onSelectAddress(SelectAddress event, Emitter<AddressState> emit) {
    emit(state.copyWith(selectedAddressId: event.addressId));
  }
}

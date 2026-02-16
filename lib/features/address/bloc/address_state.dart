import 'package:equatable/equatable.dart';
import 'package:hwasi_app/features/address/data/models/address_model.dart';

enum AddressStatus { initial, loading, success, failure }

class AddressState extends Equatable {
  final AddressStatus status;
  final List<AddressModel> addresses;
  final String? selectedAddressId;
  final String? errorMessage;

  const AddressState({
    this.status = AddressStatus.initial,
    this.addresses = const [],
    this.selectedAddressId,
    this.errorMessage,
  });

  AddressState copyWith({
    AddressStatus? status,
    List<AddressModel>? addresses,
    String? selectedAddressId,
    String? errorMessage,
  }) {
    return AddressState(
      status: status ?? this.status,
      addresses: addresses ?? this.addresses,
      selectedAddressId: selectedAddressId ?? this.selectedAddressId,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }

  AddressModel? get selectedAddress {
    if (selectedAddressId == null) return null;
    try {
      return addresses.firstWhere((element) => element.id == selectedAddressId);
    } catch (_) {
      return null;
    }
  }

  @override
  List<Object?> get props =>
      [status, addresses, selectedAddressId, errorMessage];
}

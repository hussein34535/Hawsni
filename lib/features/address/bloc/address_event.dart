import 'package:equatable/equatable.dart';
import 'package:hwasi_app/features/address/data/models/address_model.dart';

abstract class AddressEvent extends Equatable {
  const AddressEvent();

  @override
  List<Object> get props => [];
}

class LoadAddresses extends AddressEvent {}

class AddAddress extends AddressEvent {
  final AddressModel address;

  const AddAddress(this.address);

  @override
  List<Object> get props => [address];
}

class UpdateAddress extends AddressEvent {
  final AddressModel address;

  const UpdateAddress(this.address);

  @override
  List<Object> get props => [address];
}

class DeleteAddress extends AddressEvent {
  final String addressId;

  const DeleteAddress(this.addressId);

  @override
  List<Object> get props => [addressId];
}

class SelectAddress extends AddressEvent {
  final String addressId;

  const SelectAddress(this.addressId);

  @override
  List<Object> get props => [addressId];
}

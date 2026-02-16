import 'package:equatable/equatable.dart';

class AddressModel extends Equatable {
  final String? id;
  final String? userId;
  final String title;
  final String name;
  final String phone;
  final String addressLine1;
  final String city;
  final String state;
  final String zipCode;
  final String country;
  final bool isDefault;

  const AddressModel({
    this.id,
    this.userId,
    required this.title,
    required this.name,
    required this.phone,
    required this.addressLine1,
    required this.city,
    required this.state,
    required this.zipCode,
    this.country = 'Egypt',
    this.isDefault = false,
  });

  AddressModel copyWith({
    String? id,
    String? userId,
    String? title,
    String? name,
    String? phone,
    String? addressLine1,
    String? city,
    String? state,
    String? zipCode,
    String? country,
    bool? isDefault,
  }) {
    return AddressModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      title: title ?? this.title,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      addressLine1: addressLine1 ?? this.addressLine1,
      city: city ?? this.city,
      state: state ?? this.state,
      zipCode: zipCode ?? this.zipCode,
      country: country ?? this.country,
      isDefault: isDefault ?? this.isDefault,
    );
  }

  factory AddressModel.fromJson(Map<String, dynamic> json) {
    return AddressModel(
      id: json['id'],
      userId: json['user_id'],
      title: json['title'] ?? '',
      name: json['name'] ?? '',
      phone: json['phone'] ?? '',
      addressLine1: json['address_line1'] ?? '',
      city: json['city'] ?? '',
      state: json['state'] ?? '',
      zipCode: json['zip_code'] ?? '',
      country: json['country'] ?? 'Egypt',
      isDefault: json['is_default'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = {
      'title': title,
      'name': name,
      'phone': phone,
      'address_line1': addressLine1,
      'city': city,
      'state': state,
      'zip_code': zipCode,
      'country': country,
      'is_default': isDefault,
    };

    // Only include user_id if present (usually handled by RLS/Auth automatically on insert, but good to have)
    if (userId != null) {
      data['user_id'] = userId;
    }

    return data;
  }

  @override
  List<Object?> get props => [
        id,
        userId,
        title,
        name,
        phone,
        addressLine1,
        city,
        state,
        zipCode,
        country,
        isDefault,
      ];
}

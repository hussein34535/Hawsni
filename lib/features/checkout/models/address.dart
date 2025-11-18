class Address {
  final String id;
  final String title;
  final String fullName;
  final String address;
  final String city;
  final String country;
  final String phone;
  final bool isDefault;

  Address({
    required this.id,
    required this.title,
    required this.fullName,
    required this.address,
    required this.city,
    required this.country,
    required this.phone,
    required this.isDefault,
  });

  Address copyWith({
    String? id,
    String? title,
    String? fullName,
    String? address,
    String? city,
    String? country,
    String? phone,
    bool? isDefault,
  }) {
    return Address(
      id: id ?? this.id,
      title: title ?? this.title,
      fullName: fullName ?? this.fullName,
      address: address ?? this.address,
      city: city ?? this.city,
      country: country ?? this.country,
      phone: phone ?? this.phone,
      isDefault: isDefault ?? this.isDefault,
    );
  }
}

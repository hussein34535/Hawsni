class CategoryModel {
  final String id;
  final String name;
  final String? description;
  final String? imageUrl;
  final bool isActive;

  CategoryModel({
    required this.id,
    required this.name,
    this.description,
    this.imageUrl,
    this.isActive = true,
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    return CategoryModel(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      imageUrl: json['image'],
      isActive: json['is_active'] ?? true,
    );
  }
}

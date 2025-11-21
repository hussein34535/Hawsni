class ProductModel {
  final String id;
  final String name;
  final String description;
  final double price;
  final String imageUrl;
  final String category;
  final double rating;
  final int reviewCount;
  final int stock;
  final bool isFeatured;
  final List<String>? sizes;
  final List<String>? colors;

  ProductModel({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.imageUrl,
    required this.category,
    required this.rating,
    required this.reviewCount,
    required this.stock,
    required this.isFeatured,
    this.sizes,
    this.colors,
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    return ProductModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      price: (json['price'] ?? 0).toDouble(),
      imageUrl: (json['images'] != null && (json['images'] as List).isNotEmpty)
          ? json['images'][0]
          : (json['image'] ?? 'https://via.placeholder.com/300'),
      category: json['category'] is Map
          ? json['category']['name']
          : (json['category'] ?? ''),
      rating: (json['rating'] ?? 0).toDouble(),
      reviewCount: json['num_reviews'] ?? json['numReviews'] ?? 0,
      stock: json['stock'] ?? json['countInStock'] ?? 0,
      isFeatured: json['is_featured'] ?? json['isFeatured'] ?? false,
      sizes: json['sizes'] != null ? List<String>.from(json['sizes']) : null,
      colors: json['colors'] != null ? List<String>.from(json['colors']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'price': price,
      'image': imageUrl,
      'category': category,
      'rating': rating,
      'numReviews': reviewCount,
      'countInStock': stock,
      'isFeatured': isFeatured,
      if (sizes != null) 'sizes': sizes,
      if (colors != null) 'colors': colors,
    };
  }
}

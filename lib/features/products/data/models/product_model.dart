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
  final List\u003cString\u003e? sizes;
  final List\u003cString\u003e? colors;
  final List\u003cString\u003e? images;

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
    this.images,
  });

  factory ProductModel.fromJson(Map\u003cString, dynamic\u003e json) {
    return ProductModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      price: (json['price'] ?? 0).toDouble(),
      imageUrl: (json['images'] != null \u0026\u0026 (json['images'] as List).isNotEmpty)
          ? json['images'][0]
          : (json['image'] ?? 'https://via.placeholder.com/300'),
      category: json['category'] is Map
          ? json['category']['name']
          : (json['category'] ?? ''),
      rating: (json['rating'] ?? 0).toDouble(),
      reviewCount: json['num_reviews'] ?? json['numReviews'] ?? 0,
      stock: json['stock'] ?? json['countInStock'] ?? 0,
      isFeatured: json['is_featured'] ?? json['isFeatured'] ?? false,
      sizes: json['sizes'] != null ? List\u003cString\u003e.from(json['sizes']) : null,
      colors: json['colors'] != null ? List\u003cString\u003e.from(json['colors']) : null,
      images: json['images'] != null ? List\u003cString\u003e.from(json['images']) : null,
    );
  }

  Map\u003cString, dynamic\u003e toJson() {
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
      if (images != null) 'images': images,
    };
  }
}

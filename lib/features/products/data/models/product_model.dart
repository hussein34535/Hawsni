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
  final List<dynamic>? colors;
  final List<String>? images;
  final String? sizeGuide;
  final String? blurHash;
  final bool isVtoEnabled;

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
    this.sizeGuide,
    this.blurHash,
    this.isVtoEnabled = true,
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    return ProductModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      price: (json['price'] ?? 0).toDouble(),
      imageUrl: (json['images'] != null && (json['images'] as List).isNotEmpty)
          ? json['images'][0]
          : (json['image'] ?? ''),
      category: json['category'] is Map
          ? json['category']['name']
          : (json['category'] ?? ''),
      rating: (json['rating'] ?? 0).toDouble(),
      reviewCount: json['num_reviews'] ?? json['numReviews'] ?? 0,
      stock: json['stock'] ?? json['countInStock'] ?? 0,
      isFeatured: json['is_featured'] ?? json['isFeatured'] ?? false,
      isVtoEnabled: json['is_vto_enabled'] ?? json['isVtoEnabled'] ?? true,
      sizes: json['sizes'] != null
          ? (json['sizes'] is String
              ? (json['sizes'] as String)
                  .split(',')
                  .map((e) => e.trim())
                  .toList()
              : List<String>.from(json['sizes']))
          : null,
      colors: json['colors'] != null
          ? (json['colors'] is String
              ? (json['colors'] as String)
                  .split(',')
                  .map((e) => e.trim())
                  .toList()
              : List<dynamic>.from(json['colors']))
          : null,
      images: json['images'] != null ? List<String>.from(json['images']) : null,
      sizeGuide: json['size_guide'] as String?,
      blurHash: json['blur_hash'] as String?,
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
      if (images != null) 'images': images,
      if (sizeGuide != null) 'size_guide': sizeGuide,
      if (blurHash != null) 'blur_hash': blurHash,
      'is_vto_enabled': isVtoEnabled,
    };
  }
}

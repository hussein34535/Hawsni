import 'package:flutter/material.dart';
import 'package:hawsni_app/core/services/api_service.dart';
import 'package:hawsni_app/core/services/search_history_service.dart';
import 'package:hawsni_app/features/home/presentation/widgets/product_card.dart';
import 'package:hawsni_app/core/widgets/skeleton_loader.dart';

class EnhancedSearchScreen extends StatefulWidget {
  const EnhancedSearchScreen({super.key});

  @override
  State<EnhancedSearchScreen> createState() => _EnhancedSearchScreenState();
}

class _EnhancedSearchScreenState extends State<EnhancedSearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<dynamic> _searchResults = [];
  List<dynamic> _categories = [];
  List<String> _searchHistory = [];
  bool _isLoading = false;
  bool _hasSearched = false;
  bool _showingHistory = true;
  String? _selectedCategory;
  double _minPrice = 0;
  double _maxPrice = 1000;
  String _sortBy = 'createdAt.desc';
  bool _isFeatured = false;
  bool _showFilters = false;

  @override
  void initState() {
    super.initState();
    _loadCategories();
    _loadSearchHistory();
  }

  Future<void> _loadCategories() async {
    try {
      final categories = await ApiService.getCategories();
      setState(() {
        _categories = categories;
      });
    } catch (e) {
      print('Error loading categories: $e');
    }
  }

  Future<void> _loadSearchHistory() async {
    final history = await SearchHistoryService().getSearchHistory();
    setState(() {
      _searchHistory = history;
    });
  }

  Future<void> _performSearch([String? query]) async {
    final searchQuery = query ?? _searchController.text.trim();
    if (searchQuery.isEmpty && _selectedCategory == null) return;

    // Add to search history
    if (searchQuery.isNotEmpty) {
      await SearchHistoryService().addSearchTerm(searchQuery);
      await _loadSearchHistory();
    }

    setState(() {
      _isLoading = true;
      _hasSearched = true;
      _showingHistory = false;
    });

    try {
      final results = await ApiService.searchProductsWithFilters(
        query: searchQuery.isNotEmpty ? searchQuery : null,
        category: _selectedCategory,
        minPrice: _minPrice,
        maxPrice: _maxPrice,
        sortBy: _sortBy,
        isFeatured: _isFeatured ? true : null,
      );

      setState(() {
        _searchResults = results;
        _isLoading = false;
      });
    } catch (e) {
      print('Error searching products: $e');
      setState(() {
        _isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Error searching products')),
      );
    }
  }

  void _clearFilters() {
    setState(() {
      _selectedCategory = null;
      _minPrice = 0;
      _maxPrice = 1000;
      _sortBy = 'createdAt.desc';
      _isFeatured = false;
    });
    _performSearch();
  }

  void _clearSearchHistory() async {
    await SearchHistoryService().clearSearchHistory();
    await _loadSearchHistory();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Search history cleared')),
    );
  }

  void _removeSearchTerm(String term) async {
    await SearchHistoryService().removeSearchTerm(term);
    await _loadSearchHistory();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _searchController,
          decoration: const InputDecoration(
            hintText: 'Search products...',
            border: InputBorder.none,
            hintStyle: TextStyle(color: Colors.grey),
          ),
          onSubmitted: _performSearch,
          onTap: () {
            setState(() {
              _showingHistory = true;
            });
          },
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () => _performSearch(),
          ),
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () {
              setState(() {
                _showFilters = !_showFilters;
              });
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Filters section
          if (_showFilters)
            Container(
              padding: const EdgeInsets.all(16.0),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                border: Border(
                  bottom: BorderSide(color: Colors.grey[300]!),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Filters',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      TextButton(
                        onPressed: _clearFilters,
                        child: const Text('Clear All'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Category filter
                  if (_categories.isNotEmpty)
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Category',
                          style: TextStyle(
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            ChoiceChip(
                              label: const Text('All'),
                              selected: _selectedCategory == null,
                              onSelected: (selected) {
                                setState(() {
                                  _selectedCategory = null;
                                });
                              },
                            ),
                            ..._categories.map((category) {
                              return ChoiceChip(
                                label: Text(category['name']),
                                selected: _selectedCategory == category['id'],
                                onSelected: (selected) {
                                  setState(() {
                                    _selectedCategory =
                                        selected ? category['id'] : null;
                                  });
                                },
                              );
                            }).toList(),
                          ],
                        ),
                      ],
                    ),
                  const SizedBox(height: 12),
                  // Price range filter
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Price Range',
                        style: TextStyle(
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 8),
                      RangeSlider(
                        values: RangeValues(_minPrice, _maxPrice),
                        min: 0,
                        max: 1000,
                        divisions: 100,
                        labels: RangeLabels(
                          '\$${_minPrice.round()}',
                          '\$${_maxPrice.round()}',
                        ),
                        onChanged: (RangeValues values) {
                          setState(() {
                            _minPrice = values.start;
                            _maxPrice = values.end;
                          });
                        },
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('\$${_minPrice.round()}'),
                          Text('\$${_maxPrice.round()}'),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Featured filter
                  Row(
                    children: [
                      Checkbox(
                        value: _isFeatured,
                        onChanged: (value) {
                          setState(() {
                            _isFeatured = value ?? false;
                          });
                        },
                      ),
                      const Text('Featured products only'),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Sort by filter
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Sort By',
                        style: TextStyle(
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 8),
                      DropdownButton<String>(
                        value: _sortBy,
                        isExpanded: true,
                        items: const [
                          DropdownMenuItem(
                            value: 'createdAt.desc',
                            child: Text('Newest First'),
                          ),
                          DropdownMenuItem(
                            value: 'createdAt.asc',
                            child: Text('Oldest First'),
                          ),
                          DropdownMenuItem(
                            value: 'price.asc',
                            child: Text('Price: Low to High'),
                          ),
                          DropdownMenuItem(
                            value: 'price.desc',
                            child: Text('Price: High to Low'),
                          ),
                          DropdownMenuItem(
                            value: 'rating.desc',
                            child: Text('Top Rated'),
                          ),
                        ],
                        onChanged: (value) {
                          if (value != null) {
                            setState(() {
                              _sortBy = value;
                            });
                          }
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Apply filters button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        _performSearch();
                        setState(() {
                          _showFilters = false;
                        });
                      },
                      child: const Text('Apply Filters'),
                    ),
                  ),
                ],
              ),
            ),

          // Search history or results
          Expanded(
            child: _isLoading
                ? _buildLoadingState()
                : _showingHistory && !_hasSearched
                    ? _buildSearchHistory()
                    : _hasSearched
                        ? _searchResults.isEmpty
                            ? _buildEmptyState()
                            : _buildResultsGrid()
                        : _buildInitialState(),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchHistory() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_searchHistory.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Recent Searches',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextButton(
                  onPressed: _clearSearchHistory,
                  child: const Text('Clear All'),
                ),
              ],
            ),
          ),
          ListView.builder(
            shrinkWrap: true,
            itemCount: _searchHistory.length,
            itemBuilder: (context, index) {
              final term = _searchHistory[index];
              return Dismissible(
                key: Key('history_$term'),
                direction: DismissDirection.endToStart,
                onDismissed: (direction) {
                  _removeSearchTerm(term);
                },
                background: Container(
                  color: Colors.red,
                  alignment: Alignment.centerRight,
                  padding: const EdgeInsets.only(right: 20),
                  child: const Icon(
                    Icons.delete,
                    color: Colors.white,
                  ),
                ),
                child: ListTile(
                  leading: const Icon(Icons.history, color: Colors.grey),
                  title: Text(term),
                  onTap: () {
                    _searchController.text = term;
                    _performSearch(term);
                  },
                  trailing: IconButton(
                    icon: const Icon(Icons.close, size: 18),
                    onPressed: () => _removeSearchTerm(term),
                  ),
                ),
              );
            },
          ),
        ] else ...[
          const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.history,
                  size: 64,
                  color: Colors.grey,
                ),
                SizedBox(height: 16),
                Text(
                  'No search history',
                  style: TextStyle(
                    fontSize: 18,
                    color: Colors.grey,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  'Your search history will appear here',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey,
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildInitialState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.search,
            size: 64,
            color: Colors.grey[300],
          ),
          const SizedBox(height: 16),
          const Text(
            'Search for products',
            style: TextStyle(
              fontSize: 18,
              color: Colors.grey,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Enter a product name to search',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: GridView.builder(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.75,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
        ),
        itemCount: 6,
        itemBuilder: (context, index) {
          return Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.1),
                  spreadRadius: 1,
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SkeletonLoader(
                  height: 120,
                  borderRadius: BorderRadius.circular(12),
                ),
                const SizedBox(height: 12),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SkeletonLoader(
                        height: 16,
                        width: 80,
                      ),
                      const SizedBox(height: 8),
                      SkeletonLoader(
                        height: 14,
                        width: 60,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.search_off,
            size: 64,
            color: Colors.grey[300],
          ),
          const SizedBox(height: 16),
          const Text(
            'No products found',
            style: TextStyle(
              fontSize: 18,
              color: Colors.grey,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Try different search terms or filters',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildResultsGrid() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: GridView.builder(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.75,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
        ),
        itemCount: _searchResults.length,
        itemBuilder: (context, index) {
          final product = _searchResults[index];
          final images = product['images'] as List?;
          final imageUrl = images != null && images.isNotEmpty
              ? 'http://192.168.100.8:5000${images[0]}'
              : 'https://via.placeholder.com/300';

          // Generate a unique ID for the product (in a real app, this would come from the backend)
          final productId =
              product['id']?.toString() ?? 'search_product_$index';

          return ProductCard(
            id: productId,
            imageUrl: imageUrl,
            name: product['name'] ?? 'منتج بدون اسم',
            price: '\$${product['price'] ?? 0}',
            description: product['description'] ?? 'No description available',
            rating: (product['rating'] ?? 4.5).toDouble(),
            reviewCount: product['numReviews'] ?? 0,
            sizes: List<String>.from(product['sizes'] ?? []),
            colors: List<String>.from(product['colors'] ?? []),
          );
        },
      ),
    );
  }
}

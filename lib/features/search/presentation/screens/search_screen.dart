import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:hawsni_app/core/services/api_service.dart';
import 'package:hawsni_app/core/services/search_history_service.dart';
import 'package:hawsni_app/core/themes/app_theme.dart';
import 'package:hawsni_app/features/home/presentation/widgets/product_card.dart';
import 'package:hawsni_app/core/widgets/spinning_loader.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
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
      if (mounted) {
        setState(() {
          _categories = categories;
        });
      }
    } catch (e) {
      print('Error loading categories: $e');
    }
  }

  Future<void> _loadSearchHistory() async {
    final history = await SearchHistoryService().getSearchHistory();
    if (mounted) {
      setState(() {
        _searchHistory = history;
      });
    }
  }

  Future<void> _performSearch([String? query]) async {
    final searchQuery = query ?? _searchController.text.trim();
    if (searchQuery.isEmpty && _selectedCategory == null) return;

    if (searchQuery.isNotEmpty) {
      await SearchHistoryService().addSearchTerm(searchQuery);
      await _loadSearchHistory();
    }

    if (mounted) {
      setState(() {
        _isLoading = true;
        _hasSearched = true;
        _showingHistory = false;
      });
    }

    try {
      final results = await ApiService.searchProductsWithFilters(
        query: searchQuery.isNotEmpty ? searchQuery : null,
        category: _selectedCategory,
        minPrice: _minPrice,
        maxPrice: _maxPrice,
        sortBy: _sortBy,
        isFeatured: _isFeatured ? true : null,
      );

      if (mounted) {
        setState(() {
          _searchResults = results;
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Error searching products: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Error searching products',
                style: TextStyle(color: Colors.white)),
            backgroundColor: AppTheme.errorColor),
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
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        title: ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Container(
              height: 45,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withOpacity(0.2)),
              ),
              child: TextField(
                controller: _searchController,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  hintText: 'Search products...',
                  hintStyle: TextStyle(color: Colors.grey),
                  border: InputBorder.none,
                  prefixIcon: Icon(Icons.search, color: Colors.grey),
                  contentPadding: EdgeInsets.symmetric(vertical: 10),
                ),
                onSubmitted: _performSearch,
                onTap: () => setState(() => _showingHistory = true),
              ),
            ),
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.filter_list,
                color: _showFilters ? AppTheme.primaryColor : Colors.white),
            onPressed: () => setState(() => _showFilters = !_showFilters),
          ),
        ],
      ),
      body: Column(
        children: [
          if (_showFilters) _buildFilters(),
          Expanded(
            child: _isLoading
                ? const Center(child: SpinningLoader())
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

  Widget _buildFilters() {
    return Container(
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: const Color(0xFF121212),
        border:
            Border(bottom: BorderSide(color: Colors.white.withOpacity(0.1))),
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
                    color: Colors.white,
                    fontFamily: 'Playfair Display'),
              ),
              TextButton(
                onPressed: _clearFilters,
                child: const Text('Clear All',
                    style: TextStyle(color: AppTheme.primaryColor)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (_categories.isNotEmpty) ...[
            const Text('Category',
                style: TextStyle(
                    color: Colors.white, fontWeight: FontWeight.w500)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildFilterChip('All', _selectedCategory == null,
                    () => setState(() => _selectedCategory = null)),
                ..._categories.map((category) => _buildFilterChip(
                      category['name'],
                      _selectedCategory == category['id'],
                      () => setState(() => _selectedCategory =
                          _selectedCategory == category['id']
                              ? null
                              : category['id']),
                    )),
              ],
            ),
            const SizedBox(height: 12),
          ],
          const Text('Price Range',
              style:
                  TextStyle(color: Colors.white, fontWeight: FontWeight.w500)),
          RangeSlider(
            values: RangeValues(_minPrice, _maxPrice),
            min: 0,
            max: 1000,
            activeColor: AppTheme.primaryColor,
            inactiveColor: Colors.grey[800],
            onChanged: (values) => setState(() {
              _minPrice = values.start;
              _maxPrice = values.end;
            }),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('\$${_minPrice.round()}',
                  style: const TextStyle(color: Colors.grey)),
              Text('\$${_maxPrice.round()}',
                  style: const TextStyle(color: Colors.grey)),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                _performSearch();
                setState(() => _showFilters = false);
              },
              style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor),
              child: const Text('Apply Filters',
                  style: TextStyle(
                      color: Colors.black, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, bool isSelected, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected
              ? AppTheme.primaryColor
              : Colors.white.withOpacity(0.1),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
              color: isSelected
                  ? AppTheme.primaryColor
                  : Colors.white.withOpacity(0.2)),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.black : Colors.white,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Widget _buildSearchHistory() {
    if (_searchHistory.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.history, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text('No search history',
                style: TextStyle(fontSize: 18, color: Colors.grey)),
          ],
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _searchHistory.length,
      itemBuilder: (context, index) {
        final term = _searchHistory[index];
        return ListTile(
          leading: const Icon(Icons.history, color: Colors.grey),
          title: Text(term, style: const TextStyle(color: Colors.white)),
          trailing: IconButton(
            icon: const Icon(Icons.close, size: 18, color: Colors.grey),
            onPressed: () => _removeSearchTerm(term),
          ),
          onTap: () {
            _searchController.text = term;
            _performSearch(term);
          },
        );
      },
    );
  }

  Widget _buildInitialState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search, size: 64, color: Colors.grey),
          SizedBox(height: 16),
          Text('Search for products',
              style: TextStyle(fontSize: 18, color: Colors.grey)),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_off, size: 64, color: Colors.grey),
          SizedBox(height: 16),
          Text('No products found',
              style: TextStyle(fontSize: 18, color: Colors.grey)),
        ],
      ),
    );
  }

  Widget _buildResultsGrid() {
    return GridView.builder(
      padding: EdgeInsets.fromLTRB(
          16, 16, 16, MediaQuery.of(context).padding.bottom + 60),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.65,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
      ),
      itemCount: _searchResults.length,
      itemBuilder: (context, index) {
        final product = _searchResults[index];
        final images = product['images'] as List?;
        final imageUrl = images != null && images.isNotEmpty
            ? '${ApiService.baseUrl}${images[0]}'
            : 'https://picsum.photos/300?random=$index';

        return ProductCard(
          id: product['id']?.toString() ?? 'search_product_$index',
          imageUrl: imageUrl,
          name: product['name'] ?? 'No Name',
          price: product['price']?.toString() ?? '0.00',
          description: product['description'] ?? '',
          rating: (product['rating'] as num?)?.toDouble() ?? 0.0,
          reviewCount: (product['reviewCount'] as num?)?.toInt() ?? 0,
          screenId: 'search',
        );
      },
    );
  }
}

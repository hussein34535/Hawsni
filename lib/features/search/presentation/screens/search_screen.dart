import 'package:flutter/material.dart';
import 'package:hawsni_app/core/themes/app_theme.dart';
import 'package:hawsni_app/features/home/presentation/widgets/product_card.dart';
import 'package:hawsni_app/core/services/api_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<String> _searchHistory = [];
  List<dynamic> _searchResults = [];
  bool _isLoading = false;
  bool _showFilters = false;
  RangeValues _priceRange = const RangeValues(0, 1000);
  String? _selectedCategory;
  List<dynamic> _categories = [];
  double _minPrice = 0;
  double _maxPrice = 1000;

  @override
  void initState() {
    super.initState();
    _loadSearchHistory();
    _loadCategories();
  }

  Future<void> _loadSearchHistory() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _searchHistory = prefs.getStringList('search_history') ?? [];
    });
  }

  Future<void> _saveSearchHistory(String term) async {
    if (term.isEmpty) return;
    final prefs = await SharedPreferences.getInstance();
    if (!_searchHistory.contains(term)) {
      _searchHistory.insert(0, term);
      if (_searchHistory.length > 10) _searchHistory.removeLast();
      await prefs.setStringList('search_history', _searchHistory);
      setState(() {});
    }
  }

  Future<void> _removeSearchTerm(String term) async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _searchHistory.remove(term);
    });
    await prefs.setStringList('search_history', _searchHistory);
  }

  Future<void> _loadCategories() async {
    try {
      final response =
          await http.get(Uri.parse('${ApiService.baseUrl}/categories'));
      if (response.statusCode == 200) {
        setState(() {
          _categories = json.decode(response.body);
        });
      }
    } catch (e) {
      debugPrint('Error loading categories: $e');
    }
  }

  Future<void> _performSearch([String? term]) async {
    final searchTerm = term ?? _searchController.text;
    if (searchTerm.isEmpty &&
        _selectedCategory == null &&
        _minPrice == 0 &&
        _maxPrice == 1000) return;

    setState(() {
      _isLoading = true;
      if (term != null) _searchController.text = term;
    });

    try {
      // Build query parameters
      final queryParams = <String, String>{};
      if (searchTerm.isNotEmpty) queryParams['q'] = searchTerm;
      if (_selectedCategory != null)
        queryParams['category'] = _selectedCategory!;
      queryParams['minPrice'] = _minPrice.toString();
      queryParams['maxPrice'] = _maxPrice.toString();

      final uri = Uri.parse('${ApiService.baseUrl}/products/search')
          .replace(queryParameters: queryParams);

      final response = await http.get(uri);

      if (response.statusCode == 200) {
        setState(() {
          _searchResults = json.decode(response.body);
        });
        if (searchTerm.isNotEmpty) {
          _saveSearchHistory(searchTerm);
        }
      } else {
        // Handle error
        setState(() {
          _searchResults = [];
        });
      }
    } catch (e) {
      debugPrint('Error searching products: $e');
      setState(() {
        _searchResults = [];
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _clearFilters() {
    setState(() {
      _selectedCategory = null;
      _minPrice = 0;
      _maxPrice = 1000;
      _searchController.clear();
      _searchResults = [];
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: TextField(
          controller: _searchController,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: 'Search products...',
            hintStyle: TextStyle(color: Colors.grey[600]),
            border: InputBorder.none,
            suffixIcon: _searchController.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear, color: Colors.grey),
                    onPressed: () {
                      _searchController.clear();
                      setState(() {
                        _searchResults = [];
                      });
                    },
                  )
                : null,
          ),
          onSubmitted: (value) => _performSearch(value),
        ),
        actions: [
          IconButton(
            icon: Icon(
              Icons.filter_list,
              color: _showFilters ? AppTheme.primaryColor : Colors.white,
            ),
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
          if (_showFilters) _buildFilters(),
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(
                      valueColor:
                          AlwaysStoppedAnimation<Color>(AppTheme.primaryColor),
                    ),
                  )
                : _searchResults.isNotEmpty
                    ? _buildResultsGrid()
                    : _searchController.text.isEmpty && !_showFilters
                        ? _buildSearchHistory()
                        : _buildEmptyState(),
          ),
        ],
      ),
    );
  }

  Widget _buildFilters() {
    return Container(
      padding: const EdgeInsets.all(16),
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
          rating: (product['rating'] as num?)?.toDouble() ?? 0.0,
          reviewCount: (product['reviewCount'] as num?)?.toInt() ?? 0,
          screenId: 'search',
        );
      },
    );
  }
}

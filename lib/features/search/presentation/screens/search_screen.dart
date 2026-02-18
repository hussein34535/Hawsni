import 'package:flutter/material.dart';
import 'package:hwasi_app/core/themes/app_theme.dart';
import 'package:hwasi_app/features/home/presentation/widgets/product_card.dart';
import 'package:hwasi_app/core/services/api_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:hwasi_app/l10n/generated/app_localizations.dart';

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
  // RangeValues _priceRange = const RangeValues(0, 1000);
  String? _selectedCategory;
  List<dynamic> _categories = [];
  double _minPrice = 0;
  double _maxPrice = 5000;
  String _sortBy = 'newest'; // newest, price_asc, price_desc, rating

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
      final response = await http.get(
        Uri.parse('${ApiService.baseUrl}/categories'),
      );
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
      queryParams['sortBy'] = _sortBy;

      final uri = Uri.parse(
        '${ApiService.baseUrl}/products/search',
      ).replace(queryParameters: queryParams);

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
      _maxPrice = 5000;
      _sortBy = 'newest';
      _searchController.clear();
      _searchResults = [];
    });
  }

  List<String> _suggestions = [];

  void _updateSuggestions(String query) {
    setState(() {
      _suggestions = [
        ..._searchHistory.where(
          (term) => term.toLowerCase().contains(query.toLowerCase()),
        ),
        ..._categories
            .where(
              (cat) => cat['name'].toString().toLowerCase().contains(
                    query.toLowerCase(),
                  ),
            )
            .map((cat) => cat['name'].toString()),
      ].take(10).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: AppTheme.scaffoldBackgroundColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppTheme.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: Container(
          height: 40,
          decoration: BoxDecoration(
            color: Colors.grey[100],
            borderRadius: BorderRadius.circular(20),
          ),
          child: TextField(
            controller: _searchController,
            style: const TextStyle(color: AppTheme.textPrimary),
            textInputAction: TextInputAction.search,
            decoration: InputDecoration(
              hintText: AppLocalizations.of(context)!.searchPlaceholder,
              hintStyle: TextStyle(color: Colors.grey[500]),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 8,
              ),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, color: Colors.grey),
                      onPressed: () {
                        _searchController.clear();
                        setState(() {
                          _searchResults = [];
                          _suggestions = [];
                        });
                      },
                    )
                  : null,
            ),
            onChanged: (value) {
              if (value.isEmpty) {
                setState(() {
                  _suggestions = [];
                  _searchResults = [];
                });
              } else {
                _updateSuggestions(value);
              }
            },
            onSubmitted: (value) => _performSearch(value),
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(
              Icons.filter_list,
              color:
                  _showFilters ? AppTheme.primaryColor : AppTheme.textPrimary,
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
                      valueColor: AlwaysStoppedAnimation<Color>(
                        AppTheme.primaryColor,
                      ),
                    ),
                  )
                : _suggestions.isNotEmpty && _searchResults.isEmpty
                    ? _buildSuggestionsList()
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

  Widget _buildSuggestionsList() {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: _suggestions.length,
      itemBuilder: (context, index) {
        final suggestion = _suggestions[index];
        return ListTile(
          leading: const Icon(Icons.search, color: Colors.grey),
          title: Text(
            suggestion,
            style: const TextStyle(color: AppTheme.textPrimary),
          ),
          onTap: () {
            _searchController.text = suggestion;
            _performSearch(suggestion);
            setState(() => _suggestions = []);
          },
        );
      },
    );
  }

  Widget _buildFilters() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                AppLocalizations.of(context)!.filters,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                  fontFamily: 'Playfair Display',
                ),
              ),
              TextButton(
                onPressed: _clearFilters,
                child: Text(
                  AppLocalizations.of(context)!.clearAll,
                  style: TextStyle(color: AppTheme.primaryColor),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (_categories.isNotEmpty) ...[
            Text(
              AppLocalizations.of(context)!.category,
              style: TextStyle(
                color: AppTheme.textPrimary,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildFilterChip(
                  AppLocalizations.of(context)!.all,
                  _selectedCategory == null,
                  () => setState(() => _selectedCategory = null),
                ),
                ..._categories.map(
                  (category) => _buildFilterChip(
                    category['name'],
                    _selectedCategory == category['id'],
                    () => setState(
                      () => _selectedCategory =
                          _selectedCategory == category['id']
                              ? null
                              : category['id'],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
          ],
          Text(
            AppLocalizations.of(context)!.priceRange,
            style: TextStyle(
              color: AppTheme.textPrimary,
              fontWeight: FontWeight.w500,
            ),
          ),
          RangeSlider(
            values: RangeValues(_minPrice, _maxPrice),
            min: 0,
            max: 5000,
            divisions: 50,
            activeColor: AppTheme.primaryColor,
            inactiveColor: Colors.grey[300],
            onChanged: (values) => setState(() {
              _minPrice = values.start;
              _maxPrice = values.end;
            }),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${_minPrice.round()} EGP',
                style: const TextStyle(color: AppTheme.textSecondary),
              ),
              Text(
                '${_maxPrice.round()} EGP',
                style: const TextStyle(color: AppTheme.textSecondary),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Sort By
          Text(
            'ترتيب حسب',
            style: TextStyle(
              color: AppTheme.textPrimary,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _buildFilterChip('الأحدث', _sortBy == 'newest',
                  () => setState(() => _sortBy = 'newest')),
              _buildFilterChip('الأرخص', _sortBy == 'price_asc',
                  () => setState(() => _sortBy = 'price_asc')),
              _buildFilterChip('الأغلى', _sortBy == 'price_desc',
                  () => setState(() => _sortBy = 'price_desc')),
              _buildFilterChip('التقييم', _sortBy == 'rating',
                  () => setState(() => _sortBy = 'rating')),
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
                backgroundColor: AppTheme.primaryColor,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(25),
                ),
              ),
              child: Text(
                AppLocalizations.of(context)!.applyFilters,
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
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
          color: isSelected ? AppTheme.primaryColor : Colors.grey[100],
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppTheme.primaryColor : Colors.transparent,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : AppTheme.textPrimary,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Widget _buildSearchHistory() {
    if (_searchHistory.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.history, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            Text(
              AppLocalizations.of(context)!.noSearchHistory,
              style: const TextStyle(fontSize: 18, color: Colors.grey),
            ),
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
          title: Text(
            term,
            style: const TextStyle(color: AppTheme.textPrimary),
          ),
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
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.search_off, size: 64, color: Colors.grey),
          const SizedBox(height: 16),
          Text(
            AppLocalizations.of(context)!.noProductsFound,
            style: const TextStyle(fontSize: 18, color: Colors.grey),
          ),
        ],
      ),
    );
  }

  Widget _buildResultsGrid() {
    return GridView.builder(
      padding: EdgeInsets.fromLTRB(
        16,
        16,
        16,
        MediaQuery.of(context).padding.bottom + 60,
      ),
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
          screenId: 'search', // Updated
          colors: product['colors'] is List ? product['colors'] : null,
          sizes: product['sizes'] != null
              ? List<String>.from(product['sizes'])
              : null,
        );
      },
    );
  }
}

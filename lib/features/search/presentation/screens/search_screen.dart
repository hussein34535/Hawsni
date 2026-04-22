import 'package:flutter/material.dart';
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
  String? _selectedCategory;
  List<dynamic> _categories = [];
  double _minPrice = 0;
  double _maxPrice = 5000;
  String _sortBy = 'newest';

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
        _maxPrice == 1000) {
      return;
    }

    setState(() {
      _isLoading = true;
      if (term != null) _searchController.text = term;
    });

    try {
      final queryParams = <String, String>{};
      if (searchTerm.isNotEmpty) queryParams['q'] = searchTerm;
      if (_selectedCategory != null) {
        queryParams['category'] = _selectedCategory!;
      }
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

  @override
  Widget build(BuildContext context) {
    final isRTL = Directionality.of(context) == TextDirection.rtl;

    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        automaticallyImplyLeading: false,
        leadingWidth: 60,
        leading: Center(
          child: GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Icon(
                isRTL ? Icons.arrow_forward_ios : Icons.arrow_back_ios_new,
                size: 18,
                color: const Color(0xFF1A1A1A),
              ),
            ),
          ),
        ),
        title: Container(
          height: 44,
          decoration: BoxDecoration(
            color: const Color(0xFFF5F5F5),
            borderRadius: BorderRadius.circular(22),
          ),
          child: TextField(
            controller: _searchController,
            style: const TextStyle(
              fontFamily: 'Cairo',
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1A1A1A),
            ),
            textInputAction: TextInputAction.search,
            decoration: InputDecoration(
              hintText: AppLocalizations.of(context)!.searchPlaceholder,
              hintStyle: TextStyle(
                fontFamily: 'Cairo',
                color: Colors.grey[500],
                fontSize: 13,
                fontWeight: FontWeight.bold,
              ),
              border: InputBorder.none,
              prefixIcon: Icon(Icons.search, size: 20, color: Colors.grey[400]),
              contentPadding: const EdgeInsets.symmetric(vertical: 10),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.close_rounded,
                          size: 18, color: Colors.grey),
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
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12.0, left: 12.0),
            child: GestureDetector(
              onTap: () => setState(() => _showFilters = !_showFilters),
              child: Container(
                width: 44,
                height: 44,
                decoration: const BoxDecoration(
                  color: Colors.transparent,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.tune_rounded,
                  color: _showFilters
                      ? const Color(0xFF0E4435)
                      : const Color(0xFF1A1A1A),
                  size: 24,
                ),
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          if (_showFilters) _buildFilters(),
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: Color(0xFF0E4435)),
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
    final l10n = AppLocalizations.of(context)!;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
            bottom: BorderSide(color: Colors.grey.withValues(alpha: 0.1))),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                l10n.filters,
                style: const TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF1A1A1A),
                ),
              ),
              TextButton(
                onPressed: _clearFilters,
                child: Text(
                  l10n.clearAll,
                  style: const TextStyle(
                    fontFamily: 'Cairo',
                    color: Color(0xFF0E4435),
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_categories.isNotEmpty) ...[
            const Text(
              'التصنيف',
              style: TextStyle(
                fontFamily: 'Cairo',
                fontWeight: FontWeight.w900,
                fontSize: 14,
                color: Color(0xFF1A1A1A),
              ),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildFilterChip(
                  l10n.all,
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
            const SizedBox(height: 20),
          ],
          const Text(
            'نطاق السعر',
            style: TextStyle(
              fontFamily: 'Cairo',
              fontWeight: FontWeight.w900,
              fontSize: 14,
              color: Color(0xFF1A1A1A),
            ),
          ),
          RangeSlider(
            values: RangeValues(_minPrice, _maxPrice),
            min: 0,
            max: 5000,
            divisions: 50,
            activeColor: const Color(0xFF0E4435),
            inactiveColor: Colors.grey[200],
            onChanged: (values) => setState(() {
              _minPrice = values.start;
              _maxPrice = values.end;
            }),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('${_minPrice.round()} ج.م',
                  style: const TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey)),
              Text('${_maxPrice.round()} ج.م',
                  style: const TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey)),
            ],
          ),
          const SizedBox(height: 20),
          const Text(
            'ترتيب حسب',
            style: TextStyle(
              fontFamily: 'Cairo',
              fontWeight: FontWeight.w900,
              fontSize: 14,
              color: Color(0xFF1A1A1A),
            ),
          ),
          const SizedBox(height: 10),
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
            ],
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                _performSearch();
                setState(() => _showFilters = false);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0E4435),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 0,
              ),
              child: Text(
                l10n.applyFilters,
                style: const TextStyle(
                    fontFamily: 'Cairo',
                    fontWeight: FontWeight.w900,
                    fontSize: 16),
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
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF0E4435) : const Color(0xFFF5F5F5),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
              color: isSelected ? const Color(0xFF0E4435) : Colors.transparent),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontFamily: 'Cairo',
            color: isSelected ? Colors.white : const Color(0xFF1A1A1A),
            fontWeight: FontWeight.w900,
            fontSize: 12,
          ),
        ),
      ),
    );
  }

  Widget _buildSearchHistory() {
    final l10n = AppLocalizations.of(context)!;
    if (_searchHistory.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.search_rounded, size: 64, color: Colors.grey[200]),
            const SizedBox(height: 16),
            Text(
              l10n.searchPlaceholder,
              style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 16,
                  color: Colors.grey[400],
                  fontWeight: FontWeight.bold),
            ),
          ],
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      itemCount: _searchHistory.length,
      itemBuilder: (context, index) {
        final term = _searchHistory[index];
        return Container(
          decoration: BoxDecoration(
            border: Border(
                bottom: BorderSide(color: Colors.grey.withValues(alpha: 0.05))),
          ),
          child: ListTile(
            contentPadding: EdgeInsets.zero,
            leading: Icon(Icons.history_rounded,
                size: 20, color: Colors.grey[400]),
            title: Text(
              term,
              style: const TextStyle(
                fontFamily: 'Cairo',
                fontWeight: FontWeight.bold,
                fontSize: 14,
                color: Color(0xFF1A1A1A),
              ),
            ),
            trailing: IconButton(
              icon: Icon(Icons.close_rounded, size: 16, color: Colors.grey[300]),
              onPressed: () => _removeSearchTerm(term),
            ),
            onTap: () {
              _searchController.text = term;
              _performSearch(term);
            },
          ),
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_off_rounded, size: 80, color: Colors.grey[200]),
          const SizedBox(height: 16),
          Text(
            AppLocalizations.of(context)!.noProductsFound,
            style: const TextStyle(
              fontFamily: 'Cairo',
              fontSize: 18,
              fontWeight: FontWeight.w900,
              color: Color(0xFF1A1A1A),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildResultsGrid() {
    return GridView.builder(
      padding: const EdgeInsets.all(20),
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
            : '';

        return ProductCard(
          id: product['id']?.toString() ?? '',
          imageUrl: imageUrl,
          name: product['name'] ?? '',
          price: product['price']?.toString() ?? '0',
          rating: (product['rating'] as num?)?.toDouble() ?? 0.0,
          reviewCount: (product['reviewCount'] as num?)?.toInt() ?? 0,
          screenId: 'search',
          colors: product['colors'] is List ? product['colors'] : null,
          sizes: product['sizes'] != null
              ? List<String>.from(product['sizes'])
              : null,
          discount: (product['discount'] as num?)?.toInt() ?? 0,
          originalPrice: product['originalPrice']?.toString(),
        );
      },
    );
  }
}

import 'package:flutter/material.dart';
// import 'package:hwasi_app/core/themes/app_theme.dart';
// import 'package:hwasi_app/l10n/generated/app_localizations.dart';
// import 'package:shared_preferences/shared_preferences.dart';

class SearchSuggestionsScreen extends StatefulWidget {
  final Function(String) onSuggestionSelected;

  const SearchSuggestionsScreen(
      {super.key, required this.onSuggestionSelected});

  @override
  State<SearchSuggestionsScreen> createState() =>
      _SearchSuggestionsScreenState();
}

class _SearchSuggestionsScreenState extends State<SearchSuggestionsScreen> {
  final List<String> _popularSearches = [
    'Summer Dress',
    'Casual T-Shirt',
    'Kids Backpack',
    'Leather Wallet',
    'Designer Handbag',
    'Running Shoes',
    'Sunglasses',
    'Smart Watch',
  ];

  final List<String> _recentSearches = [
    'Blue Jeans',
    'White Sneakers',
    'Black Dress',
  ];

  final List<String> _trendingProducts = [
    'Wireless Earbuds',
    'Fitness Tracker',
    'Laptop Backpack',
    'Coffee Maker',
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Search'),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Popular searches
              const Text(
                'Popular Searches',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _popularSearches.map((search) {
                  return _buildSuggestionChip(search);
                }).toList(),
              ),
              const SizedBox(height: 24),

              // Recent searches
              const Text(
                'Recent Searches',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _recentSearches.map((search) {
                  return _buildSuggestionChip(search);
                }).toList(),
              ),
              const SizedBox(height: 24),

              // Trending products
              const Text(
                'Trending Products',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _trendingProducts.map((search) {
                  return _buildSuggestionChip(search);
                }).toList(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSuggestionChip(String text) {
    return ActionChip(
      label: Text(text),
      onPressed: () => widget.onSuggestionSelected(text),
      backgroundColor: Colors.grey[100],
      labelStyle: const TextStyle(color: Colors.black87),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: Colors.grey[300]!),
      ),
    );
  }
}

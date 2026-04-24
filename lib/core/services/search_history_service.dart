import 'package:shared_preferences/shared_preferences.dart';

class SearchHistoryService {
  static final SearchHistoryService _instance =
      SearchHistoryService._internal();
  static const String _searchHistoryKey = 'search_history';
  static const int _maxHistoryItems = 10;

  factory SearchHistoryService() => _instance;

  SearchHistoryService._internal();

  Future<List<String>> getSearchHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final List<String>? history = prefs.getStringList(_searchHistoryKey);
    return history ?? [];
  }

  Future<void> addSearchTerm(String term) async {
    if (term.trim().isEmpty) return;

    final prefs = await SharedPreferences.getInstance();
    final List<String> history = await getSearchHistory();

    // Remove the term if it already exists
    history.removeWhere((item) => item.toLowerCase() == term.toLowerCase());

    // Add the new term at the beginning
    history.insert(0, term);

    // Limit the history to max items
    if (history.length > _maxHistoryItems) {
      history.removeRange(_maxHistoryItems, history.length);
    }

    await prefs.setStringList(_searchHistoryKey, history);
  }

  Future<void> clearSearchHistory() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_searchHistoryKey);
  }

  Future<void> removeSearchTerm(String term) async {
    final prefs = await SharedPreferences.getInstance();
    final List<String> history = await getSearchHistory();

    history.removeWhere((item) => item.toLowerCase() == term.toLowerCase());

    await prefs.setStringList(_searchHistoryKey, history);
  }
}

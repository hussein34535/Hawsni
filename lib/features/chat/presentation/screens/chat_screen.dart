import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:hwasi_app/core/themes/app_theme.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  
  List<Map<String, dynamic>> _messages = [];
  bool _isLoading = false;
  String? _sessionId;
  RealtimeChannel? _subscription;

  static const String _sessionApiUrl = 'https://hwasibackend.vercel.app/api/chat/session';
  static const String _chatApiUrl = 'https://hwasibackend.vercel.app/api/chat';

  @override
  void initState() {
    super.initState();
    _initSession();
  }

  Future<void> _initSession() async {
    final prefs = await SharedPreferences.getInstance();
    String? sid = prefs.getString('hwasi_chat_session');
    
    if (sid == null) {
      sid = const Uuid().v4();
      await prefs.setString('hwasi_chat_session', sid);
    }

    setState(() {
      _sessionId = sid;
    });

    await _fetchSessionHistory(sid!);
    _subscribeToMessages(sid);
  }

  Future<void> _fetchSessionHistory(String sid) async {
    try {
      final response = await http.get(Uri.parse('$_sessionApiUrl/$sid'));
      final data = jsonDecode(response.body);

      if (data['success'] == true && data['messages'] != null) {
        setState(() {
          _messages = List<Map<String, dynamic>>.from(data['messages']);
        });
        _scrollToBottom();
      }
    } catch (e) {
      debugPrint('Failed to fetch session: $e');
    }
  }

  void _subscribeToMessages(String sid) {
    _subscription = Supabase.instance.client
        .channel('public:chat_messages:$sid')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'chat_messages',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq, 
            column: 'session_id', 
            value: sid,
          ),
          callback: (payload) {
            final newMessage = payload.newRecord;
            if (newMessage != null) {
              setState(() {
                // Check for optimism duplicate
                if (!_messages.any((m) => m['id'] == newMessage['id'])) {
                  _messages.add(newMessage);
                }
              });
              _scrollToBottom();
            }
          },
        )
        .subscribe();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _isLoading || _sessionId == null) return;

    // Optimistic UI
    setState(() {
      _messages.add({
        'sender_type': 'user',
        'content': text,
        'isOptimistic': true,
      });
      _isLoading = true;
    });
    
    _controller.clear();
    _scrollToBottom();

    try {
      final response = await http.post(
        Uri.parse(_chatApiUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'message': text, 'sessionId': _sessionId}),
      );

      final data = jsonDecode(response.body);

      if (data['success'] != true) {
        setState(() {
          _messages.add({'sender_type': 'bot', 'content': 'عذراً، حدث خطأ. يرجى المحاولة لاحقاً.'});
        });
      }
    } catch (e) {
      setState(() {
        _messages.add({'sender_type': 'bot', 'content': 'لا يمكن الاتصال بالخادم الآن. يرجى المحاولة لاحقاً.'});
      });
    } finally {
      setState(() => _isLoading = false);
      _scrollToBottom();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    _subscription?.unsubscribe();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_sessionId == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(
        title: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('✨', style: TextStyle(fontSize: 20)),
            SizedBox(width: 8),
            Text(
              'مساعد hwasi',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
          ],
        ),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: Column(
        children: [
          // Messages
          Expanded(
            child: Container(
              color: const Color(0xFFF8FAFC),
              child: _messages.isEmpty && !_isLoading
                  ? const Center(
                      child: Text('جاري التحميل...', style: TextStyle(color: Colors.grey)),
                    )
                  : ListView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.all(16),
                      itemCount: _messages.length + (_isLoading ? 1 : 0),
                      itemBuilder: (context, index) {
                        if (index == _messages.length && _isLoading) {
                          return const Align(
                            alignment: Alignment.centerRight,
                            child: Padding(
                              padding: EdgeInsets.symmetric(vertical: 8),
                              child: Text(
                                'المساعد يكتب...',
                                style: TextStyle(
                                  color: Color(0xFF64748B),
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          );
                        }

                        final msg = _messages[index];
                        final isUser = msg['sender_type'] == 'user';
                        final isAdmin = msg['sender_type'] == 'admin';
                        final isOptimistic = msg['isOptimistic'] == true;

                        return Align(
                          alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                          child: Container(
                            constraints: BoxConstraints(
                              maxWidth: MediaQuery.of(context).size.width * 0.8,
                            ),
                            margin: const EdgeInsets.only(bottom: 10),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            decoration: BoxDecoration(
                              color: isUser 
                                  ? AppTheme.primaryColor.withValues(alpha: isOptimistic ? 0.7 : 1.0) 
                                  : isAdmin ? const Color(0xFF0EA5E9) : Colors.white,
                              borderRadius: BorderRadius.only(
                                topLeft: const Radius.circular(14),
                                topRight: const Radius.circular(14),
                                bottomLeft: Radius.circular(isUser ? 14 : 4),
                                bottomRight: Radius.circular(isUser ? 4 : 14),
                              ),
                              border: isUser || isAdmin ? null : Border.all(color: const Color(0xFFE2E8F0)),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.04),
                                  blurRadius: 4,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Text(
                              msg['content'] ?? '',
                              style: TextStyle(
                                color: isUser || isAdmin ? Colors.white : const Color(0xFF1E293B),
                                fontSize: 14,
                                height: 1.6,
                              ),
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ),

          // Input Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
            ),
            child: SafeArea(
              top: false,
              child: Row(
                children: [
                  // Send Button
                  Material(
                    color: AppTheme.primaryColor,
                    borderRadius: BorderRadius.circular(10),
                    child: InkWell(
                      onTap: _isLoading ? null : _sendMessage,
                      borderRadius: BorderRadius.circular(10),
                      child: Container(
                        width: 44,
                        height: 44,
                        alignment: Alignment.center,
                        child: _isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2,
                                ),
                              )
                            : const Icon(Icons.send, color: Colors.white, size: 20),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  // Text Field
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      textDirection: TextDirection.rtl,
                      textAlign: TextAlign.right,
                      enabled: !_isLoading,
                      onSubmitted: (_) => _sendMessage(),
                      decoration: InputDecoration(
                        hintText: 'اكتب رسالتك هنا...',
                        hintTextDirection: TextDirection.rtl,
                        filled: true,
                        fillColor: const Color(0xFFF1F5F9),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                      style: const TextStyle(fontSize: 14),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

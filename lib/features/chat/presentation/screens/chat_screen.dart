import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:hwasi_app/core/themes/app_theme.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<_ChatMessage> _messages = [
    _ChatMessage(
      sender: _Sender.bot,
      text: 'مرحباً بك في Hawsni للفخامة والأزياء ✨\nكيف يمكنني مساعدتك؟ يمكنني البحث عن منتجات أو تتبع طلبك.',
    ),
  ];
  List<Map<String, dynamic>> _history = [];
  bool _isLoading = false;

  static const String _apiUrl = 'https://hwasibackend.vercel.app/api/chat';

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
    if (text.isEmpty || _isLoading) return;

    setState(() {
      _messages.add(_ChatMessage(sender: _Sender.user, text: text));
      _isLoading = true;
    });
    _controller.clear();
    _scrollToBottom();

    try {
      final response = await http.post(
        Uri.parse(_apiUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'message': text, 'history': _history}),
      );

      final data = jsonDecode(response.body);

      if (data['success'] == true) {
        setState(() {
          _messages.add(_ChatMessage(sender: _Sender.bot, text: data['reply'] ?? ''));
          _history = List<Map<String, dynamic>>.from(data['history'] ?? []);
        });
      } else {
        setState(() {
          _messages.add(_ChatMessage(sender: _Sender.bot, text: 'عذراً، حدث خطأ. يرجى المحاولة لاحقاً.'));
        });
      }
    } catch (e) {
      setState(() {
        _messages.add(_ChatMessage(sender: _Sender.bot, text: 'لا يمكن الاتصال بالخادم الآن. يرجى المحاولة لاحقاً.'));
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
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('✨', style: TextStyle(fontSize: 20)),
            SizedBox(width: 8),
            Text(
              'مساعد Hawsni',
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
              child: ListView.builder(
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
                  final isUser = msg.sender == _Sender.user;

                  return Align(
                    alignment: isUser ? Alignment.centerLeft : Alignment.centerRight,
                    child: Container(
                      constraints: BoxConstraints(
                        maxWidth: MediaQuery.of(context).size.width * 0.8,
                      ),
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: isUser ? AppTheme.primaryColor : Colors.white,
                        borderRadius: BorderRadius.only(
                          topLeft: const Radius.circular(14),
                          topRight: const Radius.circular(14),
                          bottomLeft: Radius.circular(isUser ? 4 : 14),
                          bottomRight: Radius.circular(isUser ? 14 : 4),
                        ),
                        border: isUser ? null : Border.all(color: const Color(0xFFE2E8F0)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.04),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Text(
                        msg.text,
                        style: TextStyle(
                          color: isUser ? Colors.white : const Color(0xFF1E293B),
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

enum _Sender { user, bot }

class _ChatMessage {
  final _Sender sender;
  final String text;

  _ChatMessage({required this.sender, required this.text});
}

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hawsni_app/features/cart/bloc/cart_bloc.dart';
import 'package:hawsni_app/features/cart/bloc/cart_event.dart';
import 'package:hawsni_app/features/cart/bloc/cart_state.dart';
import 'package:hawsni_app/features/cart/presentation/widgets/cart_item_card.dart';
import 'package:hawsni_app/features/checkout/presentation/screens/checkout_screen.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final Set<String> _selectedItems = {};

  void _toggleItemSelection(String itemId) {
    setState(() {
      if (_selectedItems.contains(itemId)) {
        _selectedItems.remove(itemId);
      } else {
        _selectedItems.add(itemId);
      }
    });
  }

  void _selectAllItems(List<CartItem> items) {
    setState(() {
      if (_selectedItems.length == items.length) {
        _selectedItems.clear();
      } else {
        _selectedItems.clear();
        for (var item in items) {
          _selectedItems.add(item.id);
        }
      }
    });
  }

  void _saveSelectedItemsForLater() {
    if (_selectedItems.isNotEmpty) {
      context.read<CartBloc>().add(SaveForLater(_selectedItems.toList()));
      setState(() {
        _selectedItems.clear();
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Items saved for later'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  void _clearCart() {
    context.read<CartBloc>().add(ClearCart());
    setState(() {
      _selectedItems.clear();
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Cart cleared'),
        backgroundColor: Colors.green,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'My Cart',
          style: TextStyle(
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 2,
        actions: [
          BlocBuilder<CartBloc, CartState>(
            builder: (context, state) {
              if (state is CartLoaded && state.items.isNotEmpty) {
                return PopupMenuButton<String>(
                  onSelected: (String result) {
                    switch (result) {
                      case 'clear':
                        _clearCart();
                        break;
                    }
                  },
                  itemBuilder: (BuildContext context) =>
                      <PopupMenuEntry<String>>[
                    const PopupMenuItem<String>(
                      value: 'clear',
                      child: Text('Clear Cart'),
                    ),
                  ],
                );
              }
              return Container();
            },
          ),
        ],
      ),
      body: BlocBuilder<CartBloc, CartState>(
        builder: (context, state) {
          if (state is CartLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (state is CartLoaded) {
            if (state.items.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.shopping_cart_outlined,
                      size: 80,
                      color: Colors.grey[300],
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'Your cart is empty',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Add some products to your cart',
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.grey,
                      ),
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: () {
                        Navigator.of(context).pop();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 32,
                          vertical: 16,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                      ),
                      child: const Text(
                        'Continue Shopping',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }

            // Calculate total
            double total = 0;
            for (var item in state.items) {
              // Fix: Parse price correctly by removing currency symbols
              final priceString = item.price.replaceAll(RegExp(r'[^\d.]'), '');
              final price = double.tryParse(priceString) ?? 0.0;
              total += price * item.quantity;
            }

            final tax = total * 0.1;
            final finalTotal = total + 5 + tax;

            return Column(
              children: [
                // Selection toolbar
                if (_selectedItems.isNotEmpty) ...[
                  Container(
                    padding: const EdgeInsets.all(8.0),
                    decoration: BoxDecoration(
                      color: Colors.blue[50],
                      border: Border(
                        bottom: BorderSide(color: Colors.grey[300]!),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('${_selectedItems.length} selected'),
                        Row(
                          children: [
                            TextButton(
                              onPressed: _saveSelectedItemsForLater,
                              child: const Text('Save for later'),
                            ),
                            TextButton(
                              onPressed: () {
                                setState(() {
                                  _selectedItems.clear();
                                });
                              },
                              child: const Text('Cancel'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],

                // Cart items
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16.0),
                    itemCount: state.items.length + 1,
                    itemBuilder: (context, index) {
                      if (index == state.items.length) {
                        // Add some spacing at the bottom
                        return const SizedBox(height: 20);
                      }

                      final item = state.items[index];
                      return GestureDetector(
                        onTap: () {
                          if (_selectedItems.isNotEmpty) {
                            _toggleItemSelection(item.id);
                          }
                        },
                        onLongPress: () {
                          _toggleItemSelection(item.id);
                        },
                        child: Stack(
                          children: [
                            CartItemCard(item: item),
                            if (_selectedItems.contains(item.id)) ...[
                              Container(
                                decoration: BoxDecoration(
                                  color: Colors.blue.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              Positioned(
                                top: 8,
                                right: 8,
                                child: Container(
                                  width: 24,
                                  height: 24,
                                  decoration: const BoxDecoration(
                                    color: Colors.blue,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.check,
                                    size: 16,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      );
                    },
                  ),
                ),

                // Checkout section
                Container(
                  padding: const EdgeInsets.all(16.0),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.grey.withOpacity(0.3),
                        spreadRadius: 1,
                        blurRadius: 5,
                        offset: const Offset(0, -2),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Select all checkbox
                      if (state.items.isNotEmpty) ...[
                        Row(
                          children: [
                            Checkbox(
                              value:
                                  _selectedItems.length == state.items.length &&
                                      state.items.isNotEmpty,
                              onChanged: (bool? value) {
                                if (value == true) {
                                  _selectAllItems(state.items);
                                } else {
                                  setState(() {
                                    _selectedItems.clear();
                                  });
                                }
                              },
                            ),
                            const Text('Select all items'),
                            const Spacer(),
                            if (_selectedItems.isNotEmpty)
                              TextButton(
                                onPressed: _saveSelectedItemsForLater,
                                child: const Text('Save selected'),
                              ),
                          ],
                        ),
                        const Divider(),
                      ],

                      // Order summary
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Subtotal',
                            style: TextStyle(fontSize: 16),
                          ),
                          Text(
                            '\$${total.toStringAsFixed(2)}',
                            style: const TextStyle(fontSize: 16),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      const Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Shipping',
                            style: TextStyle(fontSize: 16),
                          ),
                          Text(
                            '\$5.00',
                            style: TextStyle(fontSize: 16),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Tax',
                            style: TextStyle(fontSize: 16),
                          ),
                          Text(
                            '\$${tax.toStringAsFixed(2)}',
                            style: const TextStyle(fontSize: 16),
                          ),
                        ],
                      ),
                      const Divider(height: 24),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Total',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            '\$${finalTotal.toStringAsFixed(2)}',
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Colors.blue,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (context) => CheckoutScreen(
                                cartItems: state.items
                                    .map((item) => item.name)
                                    .toList(),
                                totalAmount: total,
                              ),
                            ),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          minimumSize: const Size(double.infinity, 50),
                          backgroundColor: Colors.blue,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text(
                          'Proceed to Checkout',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      OutlinedButton(
                        onPressed: () {
                          Navigator.of(context).pop();
                        },
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size(double.infinity, 50),
                          side: const BorderSide(color: Colors.blue),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text(
                          'Continue Shopping',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.blue,
                          ),
                        ),
                      ),
                    ],
                  ),
                )
              ],
            );
          }
          return const Center(child: Text('Something went wrong.'));
        },
      ),
    );
  }
}

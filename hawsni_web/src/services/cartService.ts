import apiClient from '@/lib/axios';
import { CartItem } from '@/store/cartStore';

export const cartService = {
    syncCart: async (items: CartItem[]): Promise<{ success: boolean; cart?: { items: CartItem[] } }> => {
        try {
            const payload = items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                size: item.size || null,
                color: item.color || null,
                accessories: item.accessories || []
            }));

            const response = await apiClient.post('/cart/sync', { items: payload });
            
            if (response.data.success && response.data.cart && response.data.cart.items) {
                // Map backend structure to frontend CartItem structure
                const formattedItems: CartItem[] = response.data.cart.items.map((backendItem: any) => {
                    const product = backendItem.product;
                    
                    // Generate composite ID matching the frontend's logic
                    let compositeId = product.id;
                    if (backendItem.size) compositeId += `-${backendItem.size}`;
                    if (backendItem.color) compositeId += `-${backendItem.color}`;
                    if (backendItem.accessories && backendItem.accessories.length > 0) {
                        compositeId += `-${backendItem.accessories.map((a: any) => a.name).join('-')}`;
                    }

                    return {
                        id: compositeId,
                        productId: product.id,
                        name: product.name,
                        price: product.price,
                        imageUrl: product.images && product.images.length > 0 ? product.images[0] : '',
                        quantity: backendItem.quantity,
                        size: backendItem.size,
                        color: backendItem.color,
                        accessories: backendItem.accessories
                    };
                });
                
                // Return the formatted items explicitly
                return { success: true, cart: { items: formattedItems } };
            }
            
            return response.data;
        } catch (error: any) {
            console.error('Failed to sync cart:', error);
            throw error.response?.data?.message || 'Failed to sync cart';
        }
    }
};

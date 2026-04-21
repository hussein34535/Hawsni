'use client';

import { ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useLanguage } from '@/context/LanguageContext';

export default function OrderReceipt({
  subtotal,
  shippingFee,
  discount,
  total,
}: {
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  couponApplied: boolean;
  selectedGov: string;
  deliveryEstimate: { min: number; max: number };
}) {
  const { items } = useCartStore();
  const { isRTL } = useLanguage();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
        <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-wider">
          {isRTL ? 'ملخص الطلب' : 'Order Summary'}
        </h3>
        <span className="text-[10px] font-bold text-gray-400">
          {items.length} {isRTL ? 'منتج' : 'items'}
        </span>
      </div>

      {/* Items */}
      <div className="px-5 py-3 space-y-2.5 max-h-[200px] overflow-y-auto">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 relative">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.png';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag size={12} className="text-gray-300" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-gray-900 truncate">{item.name}</p>
              <p className="text-[9px] text-gray-400 font-medium">
                {item.size && <span>{item.size}</span>}
                {item.size && item.color && <span> · </span>}
                {item.color && <span>{item.color}</span>}
                <span> × {item.quantity}</span>
              </p>
            </div>
            <span className="text-[11px] font-bold text-gray-900 whitespace-nowrap">
              {Math.round(item.price * item.quantity).toLocaleString()} EGP
            </span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="px-5 py-3.5 border-t border-gray-50 space-y-1.5">
        <div className="flex justify-between text-[11px]">
          <span className="text-gray-400">{isRTL ? 'المجموع الفرعي' : 'Subtotal'}</span>
          <span className="text-gray-700 font-bold">{Math.round(subtotal).toLocaleString()} EGP</span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="text-gray-400">{isRTL ? 'الشحن' : 'Shipping'}</span>
          <span className="font-bold">
            {shippingFee === 0 ? (
              <span className="text-emerald-600">{isRTL ? 'مجاناً' : 'Free'}</span>
            ) : (
              <span className="text-gray-700">{Math.round(shippingFee).toLocaleString()} EGP</span>
            )}
          </span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-[11px]">
            <span className="text-emerald-600">{isRTL ? 'الخصم' : 'Discount'}</span>
            <span className="text-emerald-600 font-bold">-{Math.round(discount).toLocaleString()} EGP</span>
          </div>
        )}
        <div className="flex justify-between pt-2.5 border-t border-gray-100">
          <span className="text-sm font-black text-gray-900">{isRTL ? 'الإجمالي' : 'Total'}</span>
          <span className="text-lg font-black text-[#0E4435]">
            {Math.round(total).toLocaleString()} <span className="text-xs">EGP</span>
          </span>
        </div>
      </div>
    </div>
  );
}

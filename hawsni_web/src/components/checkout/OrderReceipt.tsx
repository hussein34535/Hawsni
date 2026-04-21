'use client';

import { ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { useLanguage } from '@/context/LanguageContext';

export default function OrderReceipt({
  subtotal,
  shippingFee,
  discount,
  total,
  couponApplied,
  selectedGov,
  deliveryEstimate,
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
      <div className="px-6 py-4 border-b border-gray-50">
        <h3 className="font-bold text-gray-900 text-sm">
          {isRTL ? 'ملخص الطلب' : 'Order Summary'}
        </h3>
      </div>

      {/* Items */}
      <div className="px-6 py-4 space-y-3 max-h-[240px] overflow-y-auto">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 relative">
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
                  <ShoppingBag size={16} className="text-gray-300" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">{item.name}</p>
              <p className="text-[10px] text-gray-400 font-medium">
                {item.size && <span>{item.size}</span>}
                {item.size && item.color && <span> · </span>}
                {item.color && <span>{item.color}</span>}
                {!(item.size || item.color) && <span>× {item.quantity}</span>}
                {(item.size || item.color) && <span> × {item.quantity}</span>}
              </p>
            </div>
            <span className="text-xs font-bold text-gray-900 whitespace-nowrap">
              {Math.round(item.price * item.quantity).toLocaleString()} EGP
            </span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="px-6 py-4 border-t border-gray-50 space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">{isRTL ? 'المجموع الفرعي' : 'Subtotal'}</span>
          <span className="text-gray-900 font-bold">{Math.round(subtotal).toLocaleString()} EGP</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">{isRTL ? 'الشحن' : 'Shipping'}</span>
          <span className="text-gray-900 font-bold">
            {shippingFee === 0 ? (
              <span className="text-emerald-600">{isRTL ? 'مجاناً' : 'Free'}</span>
            ) : (
              `${Math.round(shippingFee).toLocaleString()} EGP`
            )}
          </span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-emerald-600">{isRTL ? 'الخصم' : 'Discount'}</span>
            <span className="text-emerald-600 font-bold">-{Math.round(discount).toLocaleString()} EGP</span>
          </div>
        )}
        <div className="flex justify-between pt-3 border-t border-gray-100">
          <span className="text-sm font-bold text-gray-900">{isRTL ? 'الإجمالي' : 'Total'}</span>
          <span className="text-lg font-black text-[#0E4435]">{Math.round(total).toLocaleString()} EGP</span>
        </div>
      </div>

      {/* Delivery Estimate */}
      {selectedGov && (
        <div className="px-6 py-3 bg-gray-50 text-[11px] text-gray-500 font-medium">
          {isRTL
            ? `التوصيل خلال ${deliveryEstimate.min}-${deliveryEstimate.max} أيام عمل`
            : `Delivery in ${deliveryEstimate.min}-${deliveryEstimate.max} business days`}
        </div>
      )}
    </div>
  );
}


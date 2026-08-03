'use client';

import { ShoppingBag, Truck, Tag, ShieldCheck } from 'lucide-react';
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
    <div className="bg-white rounded-[32px] border border-gray-100 shadow-lg overflow-hidden relative">
      {/* Premium Header */}
      <div className="px-6 py-6 border-b border-white/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0E4435] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-950/20">
            <ShoppingBag size={20} />
          </div>
          <h3 className="text-[15px] font-black text-gray-900 uppercase tracking-tight">
            {isRTL ? 'ملخص طلبك' : 'Your Order'}
          </h3>
        </div>
        <span className="px-3 py-1.5 bg-white/50 border border-white/60 rounded-full text-[10px] font-black text-[#0E4435] uppercase tracking-tighter">
          {items.length} {isRTL ? (items.length > 10 ? 'منتج' : 'منتجات') : 'items'}
        </span>
      </div>

      {/* Items Section */}
      <div className="px-6 py-4 space-y-4 max-h-[340px] overflow-y-auto scrollbar-hide">
        {items.map((item, idx) => (
          <div 
            key={item.id} 
            className="group flex items-center gap-4 py-2 first:pt-0"
          >
            <div className="w-16 h-16 bg-white/80 rounded-2xl overflow-hidden flex-shrink-0 relative border border-white/60 transition-all group-hover:scale-105 shadow-sm">
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
                  <ShoppingBag size={20} className="text-gray-300" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-gray-900 leading-tight mb-1 truncate">
                {item.name}
              </p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {item.size && (
                  <span className="px-1.5 py-0.5 bg-white/50 border border-white/20 rounded text-[10px] font-bold text-gray-500">
                    {item.size}
                  </span>
                )}
                {item.color && (
                  <span className="px-1.5 py-0.5 bg-white/50 border border-white/20 rounded text-[10px] font-bold text-gray-500">
                    {item.color}
                  </span>
                )}
                <span className="text-[11px] font-black text-gray-400">
                  × {item.quantity}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-gray-800">
                {Math.round(item.price * item.quantity).toLocaleString()}
              </span>
              <p className="text-[9px] font-black text-gray-400 mt-0.5 uppercase tracking-tighter">EGP</p>
            </div>
          </div>
        ))}
      </div>

      {/* Financial Details */}
      <div className="px-6 py-6 bg-white/20 border-t border-white/40 space-y-4">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-2 text-gray-500 font-bold">
            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
            {isRTL ? 'المجموع الفرعي' : 'Subtotal'}
          </div>
          <span className="text-gray-900 font-black tracking-tight">{Math.round(subtotal).toLocaleString()} <span className="text-[10px] text-gray-400">EGP</span></span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-2 text-gray-500 font-bold">
            <Truck size={14} strokeWidth={2.5} className="text-gray-400" />
            {isRTL ? 'تكلفة التوصيل' : 'Shipping'}
          </div>
          <span className="font-black">
            {shippingFee === 0 ? (
              <span className="text-emerald-600 bg-emerald-100/50 px-2.5 py-1 rounded-xl border border-emerald-200/50 text-[11px] uppercase tracking-wider">
                {isRTL ? 'مجاناً' : 'FREE'}
              </span>
            ) : (
              <span className="text-gray-900 tracking-tight">{Math.round(shippingFee).toLocaleString()} <span className="text-[10px] text-gray-400">EGP</span></span>
            )}
          </span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2 text-emerald-600 font-black uppercase tracking-tight">
              <Tag size={13} strokeWidth={3} />
              {isRTL ? 'خصم مفعّل' : 'Coupon'}
            </div>
            <span className="text-emerald-600 font-black">
              -{Math.round(discount).toLocaleString()} <span className="text-[10px]">EGP</span>
            </span>
          </div>
        )}

        {/* Total Grand */}
        <div className="pt-6 mt-4 border-t border-white/60">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                {isRTL ? 'إجمالي المطلوب' : 'Total Amount'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-4xl font-black text-[#0E4435] leading-none tracking-tighter">
                {Math.round(total).toLocaleString()}
              </span>
              <span className="text-[12px] font-black text-gray-400 ml-1.5 uppercase tracking-widest">EGP</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

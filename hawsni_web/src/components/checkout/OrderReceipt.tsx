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
    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden sticky top-20">
      {/* Premium Header */}
      <div className="px-6 py-5 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#0E4435] rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-900/20">
            <ShoppingBag size={16} />
          </div>
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">
            {isRTL ? 'ملخص طلبك' : 'Your Summary'}
          </h3>
        </div>
        <span className="px-2.5 py-1 bg-gray-200/50 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-tighter">
          {items.length} {isRTL ? (items.length > 10 ? 'منتج' : 'منتجات') : 'items'}
        </span>
      </div>

      {/* Items Section */}
      <div className="px-6 py-4 space-y-4 max-h-[300px] overflow-y-auto scrollbar-hide">
        {items.map((item) => (
          <div key={item.id} className="group flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0 relative border border-gray-50 transition-transform group-hover:scale-105">
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
                  <span className="px-1.5 py-0.5 bg-gray-50 border border-gray-100 rounded text-[10px] font-bold text-gray-500">
                    {item.size}
                  </span>
                )}
                {item.color && (
                  <span className="px-1.5 py-0.5 bg-gray-50 border border-gray-100 rounded text-[10px] font-bold text-gray-500">
                    {item.color}
                  </span>
                )}
                <span className="text-[11px] font-bold text-gray-400">
                  × {item.quantity}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-[#0E4435]">
                {Math.round(item.price * item.quantity).toLocaleString()}
              </span>
              <p className="text-[9px] font-bold text-gray-400 mt-0.5">EGP</p>
            </div>
          </div>
        ))}
      </div>

      {/* Financial Details */}
      <div className="px-6 py-5 bg-white border-t border-gray-50 space-y-3">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-2 text-gray-400 font-bold">
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            {isRTL ? 'المجموع الفرعي' : 'Subtotal'}
          </div>
          <span className="text-gray-900 font-black">{Math.round(subtotal).toLocaleString()} <span className="text-[10px] text-gray-400">EGP</span></span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-2 text-gray-400 font-bold">
            <Truck size={14} strokeWidth={2.5} className="text-gray-300" />
            {isRTL ? 'تكلفة التوصيل' : 'Delivery Fee'}
          </div>
          <span className="font-black">
            {shippingFee === 0 ? (
              <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                {isRTL ? 'مجاناً' : 'FREE'}
              </span>
            ) : (
              <span className="text-gray-900">{Math.round(shippingFee).toLocaleString()} <span className="text-[10px] text-gray-400">EGP</span></span>
            )}
          </span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2 text-emerald-600 font-bold">
              <Tag size={13} strokeWidth={3} />
              {isRTL ? 'خصم مفعّل' : 'Coupon Applied'}
            </div>
            <span className="text-emerald-600 font-black">
              -{Math.round(discount).toLocaleString()} <span className="text-[10px]">EGP</span>
            </span>
          </div>
        )}

        {/* Total Grand */}
        <div className="pt-4 mt-2 border-t border-gray-100">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1">
                {isRTL ? 'المبلغ الإجمالي' : 'Grand Total'}
              </p>
              <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                <ShieldCheck size={12} strokeWidth={3} />
                {isRTL ? 'أفضل سعر مضمون' : 'Best Price Guaranteed'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-[#0E4435] leading-none">
                {Math.round(total).toLocaleString()}
              </span>
              <span className="text-[11px] font-black text-gray-400 ml-1">EGP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Message */}
      <div className="px-6 py-4 bg-[#0E4435]/[0.02] border-t border-gray-50">
        <p className="text-[10px] font-bold text-gray-400 text-center leading-relaxed">
          {isRTL 
            ? 'بإتمامك للطلب، أنت توافق على شروط الخدمة. الشحن يتم بواسطة أسرع مناديب في مصر 🇪🇬'
            : 'By placing the order, you agree to the Terms of Service. Fast shipping across all Egypt 🇪🇬'}
        </p>
      </div>
    </div>
  );
}

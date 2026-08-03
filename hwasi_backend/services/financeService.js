const { supabaseAdmin: supabase } = require('../config/supabase');

const EXCLUDED_STATUSES = ['Cancelled', 'Out of Stock'];

class FinanceService {
    // إجمالي المبيعات (الطلبات غير الملغاة)
    async getRevenue() {
        const { data, error } = await supabase
            .from('orders')
            .select('total')
            .not('status', 'in', `(${EXCLUDED_STATUSES.map(s => `"${s}"`).join(',')})`);
        if (error) throw error;
        return (data || []).reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
    }

    // التحصيلات الفعلية (فلوس وصلت فعلاً)
    async getCollected() {
        const { data, error } = await supabase
            .from('orders')
            .select('total')
            .eq('is_collected', true);
        if (error) throw error;
        return (data || []).reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
    }

    // المستحق (فلوس ليك: طلبات متوصلة/شحنة بس لسه محصلهاش)
    async getPendingCollection() {
        const { data, error } = await supabase
            .from('orders')
            .select('total')
            .eq('is_collected', false)
            .in('status', ['Delivered', 'In Transit', 'Shipped', 'Confirmed']);
        if (error) throw error;
        return (data || []).reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
    }

    // تكلفة البضاعة المباعة (COGS) = مجموع cost_price × quantity
    async getCOGS({ fromDate, toDate } = {}) {
        let query = supabase
            .from('order_items')
            .select('cost_price, quantity, orders!inner(status, created_at)');

        if (fromDate || toDate) {
            let ordersQuery = query;
            // Filter via joined orders
        }

        const { data, error } = await query;
        if (error) throw error;

        const excluded = new Set(EXCLUDED_STATUSES);
        return (data || []).reduce((sum, item) => {
            const status = item.orders?.status;
            if (excluded.has(status)) return sum;
            return sum + (parseFloat(item.cost_price) || 0) * (parseInt(item.quantity) || 0);
        }, 0);
    }

    // إجمالي المصروفات
    async getTotalExpenses({ fromDate, toDate } = {}) {
        let query = supabase.from('expenses').select('amount');
        if (fromDate) query = query.gte('expense_date', fromDate);
        if (toDate) query = query.lte('expense_date', toDate);
        const { data, error } = await query;
        if (error) throw error;
        return (data || []).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    }

    // المصروفات مجمعة حسب التصنيف
    async getExpensesByCategory() {
        const { data, error } = await supabase.from('expenses').select('amount, category');
        if (error) throw error;
        const totals = {};
        (data || []).forEach(e => {
            const cat = e.category || 'other';
            totals[cat] = (totals[cat] || 0) + (parseFloat(e.amount) || 0);
        });
        return totals;
    }

    // رأس المال: capital + deposits - withdrawals
    async getCapitalBalance() {
        const { data, error } = await supabase.from('capital_entries').select('type, amount');
        if (error) throw error;
        return (data || []).reduce((sum, e) => {
            if (e.type === 'withdrawal') return sum - (parseFloat(e.amount) || 0);
            return sum + (parseFloat(e.amount) || 0);
        }, 0);
    }

    // صافي الربح = المبيعات - التكلفة - المصروفات
    async getNetProfit() {
        const [revenue, cogs, expenses] = await Promise.all([
            this.getRevenue(),
            this.getCOGS(),
            this.getTotalExpenses()
        ]);
        return revenue - cogs - expenses;
    }

    // ملخص شهري لآخر 6 شهور (مبيعات، تكلفة، مصروفات، صافي) — للرسم البياني
    async getMonthlySummary(months = 6) {
        const { data: orders, error: oErr } = await supabase
            .from('orders')
            .select('total, status, created_at')
            .not('status', 'in', `(${EXCLUDED_STATUSES.map(s => `"${s}"`).join(',')})`);
        if (oErr) throw oErr;

        const { data: items, error: iErr } = await supabase
            .from('order_items')
            .select('cost_price, quantity, orders!inner(status, created_at)');
        if (iErr) throw iErr;

        const { data: expenses, error: eErr } = await supabase.from('expenses').select('amount, expense_date');
        if (eErr) throw eErr;

        const now = new Date();
        const monthsArr = [];
        for (let i = months - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            monthsArr.push({
                key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
                label: d.toLocaleDateString('ar-EG', { month: 'long' }),
                revenue: 0, cogs: 0, expenses: 0, profit: 0
            });
        }
        const byKey = Object.fromEntries(monthsArr.map(m => [m.key, m]));

        const excluded = new Set(EXCLUDED_STATUSES);
        (orders || []).forEach(o => {
            const d = new Date(o.created_at);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (byKey[key]) byKey[key].revenue += parseFloat(o.total) || 0;
        });
        (items || []).forEach(it => {
            const status = it.orders?.status;
            if (excluded.has(status)) return;
            const d = new Date(it.orders?.created_at);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (byKey[key]) byKey[key].cogs += (parseFloat(it.cost_price) || 0) * (parseInt(it.quantity) || 0);
        });
        (expenses || []).forEach(e => {
            const d = new Date(e.expense_date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (byKey[key]) byKey[key].expenses += parseFloat(e.amount) || 0;
        });

        monthsArr.forEach(m => { m.profit = m.revenue - m.cogs - m.expenses; });
        return monthsArr;
    }

    // قائمة المصروفات
    async getExpenses({ limit = 200 } = {}) {
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .order('expense_date', { ascending: false })
            .limit(limit);
        if (error) throw error;
        return data || [];
    }

    // إضافة مصروف
    async addExpense({ title, amount, category, expense_date, notes }) {
        if (!title || !amount) throw new Error('العنوان والمبلغ مطلوبان');
        const { data, error } = await supabase
            .from('expenses')
            .insert([{
                title: String(title).trim(),
                amount: parseFloat(amount),
                category: category || 'other',
                expense_date: expense_date || new Date().toISOString().split('T')[0],
                notes: notes || null
            }])
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    // حذف مصروف
    async deleteExpense(id) {
        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if (error) throw error;
    }

    // معاملات رأس المال
    async getCapitalEntries({ limit = 200 } = {}) {
        const { data, error } = await supabase
            .from('capital_entries')
            .select('*')
            .order('entry_date', { ascending: false })
            .limit(limit);
        if (error) throw error;
        return data || [];
    }

    async addCapitalEntry({ type, amount, entry_date, notes }) {
        if (!['capital', 'deposit', 'withdrawal'].includes(type)) throw new Error('نوع غير صالح');
        if (!amount || parseFloat(amount) <= 0) throw new Error('المبلغ مطلوب');
        const { data, error } = await supabase
            .from('capital_entries')
            .insert([{
                type,
                amount: parseFloat(amount),
                entry_date: entry_date || new Date().toISOString().split('T')[0],
                notes: notes || null
            }])
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    async deleteCapitalEntry(id) {
        const { error } = await supabase.from('capital_entries').delete().eq('id', id);
        if (error) throw error;
    }

    // تحديث حالة التحصيل لطلب
    async setOrderCollected(orderId, collected) {
        const patch = collected
            ? { is_collected: true, collected_at: new Date().toISOString() }
            : { is_collected: false, collected_at: null };
        const { data, error } = await supabase
            .from('orders')
            .update(patch)
            .eq('id', orderId)
            .select('id, order_number, total, is_collected')
            .single();
        if (error) throw error;
        return data;
    }

    // طلبات محصلة / غير محصلة (أحدث 50)
    async getOrdersCollection({ limit = 50 } = {}) {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                id, order_number, total, is_collected, collected_at, status, created_at,
                users(name, phone),
                order_items(cost_price, quantity)
            `)
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) throw error;

        const excluded = new Set(EXCLUDED_STATUSES);
        return (data || []).map(o => {
            const cost = (o.order_items || []).reduce(
                (s, it) => s + (parseFloat(it.cost_price) || 0) * (parseInt(it.quantity) || 0), 0);
            return {
                id: o.id,
                order_number: o.order_number,
                total: parseFloat(o.total) || 0,
                is_collected: !!o.is_collected,
                collected_at: o.collected_at,
                status: o.status,
                created_at: o.created_at,
                customer: o.users?.name || o.users?.phone || '—',
                cogs: cost,
                profit: (parseFloat(o.total) || 0) - cost
            };
        });
    }
}

module.exports = new FinanceService();

const financeService = require('../../services/financeService');

const CATEGORY_LABELS = {
    marketing: 'تسويق وإعلانات',
    shipping: 'شحن وبوستة',
    purchases: 'شراء بضاعة',
    rent: 'إيجار',
    salaries: 'مرتبات',
    packaging: 'تغليف',
    returns: 'مرتجعات وتعويضات',
    other: 'أخرى'
};

class FinanceController {
    async index(req, res) {
        try {
            const [revenue, collected, pending, cogs, expenses, expensesByCat, capital, netProfit, monthly, expenseList, capitalList, orders] = await Promise.all([
                financeService.getRevenue(),
                financeService.getCollected(),
                financeService.getPendingCollection(),
                financeService.getCOGS(),
                financeService.getTotalExpenses(),
                financeService.getExpensesByCategory(),
                financeService.getCapitalBalance(),
                financeService.getNetProfit(),
                financeService.getMonthlySummary(6),
                financeService.getExpenses(),
                financeService.getCapitalEntries(),
                financeService.getOrdersCollection()
            ]);

            const expenseCategories = Object.entries(expensesByCat)
                .map(([cat, amount]) => ({ cat, label: CATEGORY_LABELS[cat] || cat, amount }))
                .sort((a, b) => b.amount - a.amount);

            res.render('finance', {
                page: 'finance',
                pageTitle: 'المحاسبة',
                revenue, collected, pending, cogs, expenses, expensesByCat,
                capital, netProfit, monthly,
                expenseList, capitalList, orders,
                expenseCategories,
                catLabels: CATEGORY_LABELS
            });
        } catch (err) {
            console.error('Finance page error:', err);
            res.status(500).send('خطأ في تحميل صفحة المحاسبة: ' + err.message);
        }
    }

    async addExpense(req, res) {
        try {
            const { title, amount, category, expense_date, notes } = req.body;
            await financeService.addExpense({ title, amount, category, expense_date, notes });
            res.json({ success: true, message: 'تم إضافة المصروف بنجاح' });
        } catch (err) {
            console.error('Add expense error:', err);
            res.status(400).json({ success: false, message: err.message });
        }
    }

    async deleteExpense(req, res) {
        try {
            const { id } = req.params;
            await financeService.deleteExpense(id);
            res.json({ success: true, message: 'تم حذف المصروف' });
        } catch (err) {
            console.error('Delete expense error:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async addCapitalEntry(req, res) {
        try {
            const { type, amount, entry_date, notes } = req.body;
            await financeService.addCapitalEntry({ type, amount, entry_date, notes });
            res.json({ success: true, message: 'تمت الإضافة بنجاح' });
        } catch (err) {
            console.error('Add capital entry error:', err);
            res.status(400).json({ success: false, message: err.message });
        }
    }

    async deleteCapitalEntry(req, res) {
        try {
            const { id } = req.params;
            await financeService.deleteCapitalEntry(id);
            res.json({ success: true, message: 'تم الحذف' });
        } catch (err) {
            console.error('Delete capital entry error:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async toggleCollected(req, res) {
        try {
            const { id } = req.params;
            const { collected } = req.body;
            const order = await financeService.setOrderCollected(id, collected === true || collected === 'true');
            res.json({ success: true, order });
        } catch (err) {
            console.error('Toggle collected error:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    }
}

module.exports = new FinanceController();

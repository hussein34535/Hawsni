const supabase = require('../../config/supabase');

class DashboardController {
    async getDashboard(req, res) {
        try {
            // 1. Get Counts
            const { count: productsCount } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true });

            const { count: categoriesCount } = await supabase
                .from('categories')
                .select('*', { count: 'exact', head: true });

            const { count: ordersCount } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true });

            const { count: usersCount } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });

            // 2. Calculate Revenue
            const { data: revenueData } = await supabase
                .from('orders')
                .select('total');

            const totalRevenue = revenueData
                ? revenueData.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0)
                : 0;

            // 3. Get Recent Products
            const { data: recentProducts } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            // 4. Get Recent Orders
            const { data: recentOrders } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            // 5. Get Order Stats
            const { data: orderStats } = await supabase
                .from('orders')
                .select('status');

            const statusCounts = {
                'Processing': 0,
                'Shipped': 0,
                'Delivered': 0,
                'Cancelled': 0
            };

            if (orderStats) {
                orderStats.forEach(order => {
                    const status = order.status || 'Processing';
                    if (statusCounts[status] !== undefined) {
                        statusCounts[status]++;
                    } else if (status === 'In Transit') {
                        statusCounts['Shipped']++;
                    }
                });
            }

            res.render('dashboard', {
                productsCount: productsCount || 0,
                categoriesCount: categoriesCount || 0,
                ordersCount: ordersCount || 0,
                usersCount: usersCount || 0,
                revenue: totalRevenue.toFixed(2),
                products: recentProducts || [],
                orders: recentOrders || [],
                chartData: statusCounts
            });

        } catch (err) {
            console.error('Dashboard Error:', err);
            res.status(500).send("خطأ في تحميل لوحة التحكم");
        }
    }
}

module.exports = new DashboardController();

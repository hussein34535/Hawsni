const supabase = require('../../config/supabase');

class AdminController {
    // GET /api/admin/dashboard
    async getDashboardStats(req, res) {
        try {
            // 1. Get Counts
            const { count: productsCount } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true });

            const { count: ordersCount } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true });

            const { count: usersCount } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });

            // 2. Calculate Revenue (Total from all orders)
            const { data: revenueData } = await supabase
                .from('orders')
                .select('total');

            const totalRevenue = revenueData
                ? revenueData.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0)
                : 0;

            // 3. Get Recent Orders (Last 5)
            const { data: recentOrders } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            // 4. Get Low Stock Products (Optional/Nice to have)
            // Assuming we might have a stock field, otherwise just recent products
            const { data: recentProducts } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            // 5. Order Status Distribution
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
                    // Normalize status if needed
                    const status = order.status || 'Processing';
                    if (statusCounts[status] !== undefined) {
                        statusCounts[status]++;
                    } else if (status === 'In Transit') {
                        // Map specific statuses if they vary
                        statusCounts['Shipped']++;
                    }
                });
            }

            res.status(200).json({
                success: true,
                data: {
                    stats: {
                        revenue: totalRevenue,
                        ordersCount: ordersCount || 0,
                        productsCount: productsCount || 0,
                        usersCount: usersCount || 0,
                    },
                    chartData: statusCounts,
                    recentOrders: recentOrders || [],
                    recentProducts: recentProducts || []
                }
            });

        } catch (error) {
            console.error('Admin Dashboard Error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching dashboard stats',
                error: error.message
            });
        }
    }
}

module.exports = new AdminController();

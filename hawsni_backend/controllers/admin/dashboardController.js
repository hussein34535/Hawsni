const { supabaseAdmin: supabase } = require('../../config/supabase');
const fetch = require('node-fetch');

let clarityCache = {
    data: null,
    lastFetched: null,
    nextFetch: null
};

async function fetchClarityData() {
    const token = process.env.CLARITY_API_TOKEN;
    const projectId = process.env.CLARITY_PROJECT_ID;
    if (!token || !projectId) return null;

    const now = Date.now();
    const cacheDuration = 2.5 * 60 * 60 * 1000; // 2.5 hours (ensures max 9-10 calls per day)
    
    if (clarityCache.data && clarityCache.lastFetched && (now - clarityCache.lastFetched < cacheDuration)) {
        return clarityCache;
    }

    try {
        const url = `https://www.clarity.ms/export-data/api/v1/project-live-insights?projectId=${projectId}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const metrics = Array.isArray(data) ? data[0] : data;
            clarityCache = {
                data: metrics,
                lastFetched: now,
                nextFetch: now + cacheDuration
            };
        } else {
            console.error('Clarity API Error:', await response.text());
        }
    } catch (error) {
        console.error('Clarity API fetch error:', error.message);
    }

    return clarityCache;
}

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

            const { count: bannersCount } = await supabase
                .from('banners')
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

            // 6. Get Clarity Insights
            const clarityInsights = await fetchClarityData();

            res.render('dashboard', {
                productsCount: productsCount || 0,
                categoriesCount: categoriesCount || 0,
                ordersCount: ordersCount || 0,
                usersCount: usersCount || 0,
                bannersCount: bannersCount || 0,
                revenue: totalRevenue.toFixed(2),
                products: recentProducts || [],
                orders: recentOrders || [],
                chartData: statusCounts,
                clarityInsights: clarityInsights
            });

        } catch (err) {
            console.error('Dashboard Error:', err);
            res.status(500).send("خطأ في تحميل لوحة التحكم");
        }
    }
}

module.exports = new DashboardController();

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
            // 1. Fetch Aggregated Stats via Supabase RPC (O(1) Network Request)
            const { data: stats, error } = await supabase.rpc('get_dashboard_stats');
            
            if (error) {
                console.error('❌ RPC Error falling back to manual fetch:', error);
                // Fallback logic could go here if needed, but we aim for RPC stability
                throw error;
            }

            // 2. Get Clarity Insights (Cached)
            const clarityInsights = await fetchClarityData();

            res.render('dashboard', {
                productsCount: stats.productsCount || 0,
                categoriesCount: stats.categoriesCount || 0,
                ordersCount: stats.ordersCount || 0,
                usersCount: stats.usersCount || 0,
                bannersCount: stats.bannersCount || 0,
                revenue: (stats.revenue || 0).toFixed(2),
                products: stats.recentProducts || [],
                orders: stats.recentOrders || [],
                chartData: stats.statusCounts || {},
                clarityInsights: clarityInsights
            });

        } catch (err) {
            console.error('Dashboard Error:', err);
            res.status(500).send("خطأ في تحميل لوحة التحكم - تأكد من تنفيذ الـ RPC في قاعدة البيانات");
        }
    }
}

module.exports = new DashboardController();

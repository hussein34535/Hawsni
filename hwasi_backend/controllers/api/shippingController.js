const bostaService = require('../../services/bostaService');

class ShippingController {
    /**
     * GET /api/shipping/cities
     * Returns a list of Bosta Governorates
     */
    async getCities(req, res) {
        try {
            const cities = await bostaService.getFormattedCities();
            res.json({ 
                success: true, 
                count: cities.length,
                cities 
            });
        } catch (error) {
            console.error('[ShippingController] Error fetching cities:', error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * GET /api/shipping/districts/:cityId
     * Returns a list of districts for a specific Bosta City ID
     */
    async getDistricts(req, res) {
        try {
            const { cityId } = req.params;
            if (!cityId) {
                return res.status(400).json({ success: false, message: 'City ID is required' });
            }

            const districts = await bostaService.getDistrictsByCity(cityId);
            res.json({ 
                success: true, 
                count: districts.length,
                districts 
            });
        } catch (error) {
            console.error('[ShippingController] Error fetching districts:', error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * GET /api/shipping/track/:trackingNumber
     * Get real-time status for a delivery
     */
    async trackShipment(req, res) {
        try {
            const { trackingNumber } = req.params;
            const details = await bostaService.getDeliveryDetails(trackingNumber);
            
            if (!details) {
                return res.status(404).json({ success: false, message: 'Tracking info not found' });
            }
            
            res.json({ success: true, details });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new ShippingController();

const bannerService = require('../services/bannerService');

class BannerController {
    async getBanners(req, res) {
        try {
            const banners = await bannerService.getBanners();
            res.json(banners);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async createBanner(req, res) {
        try {
            const banner = await bannerService.createBanner(req.body);
            res.status(201).json(banner);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
}

module.exports = new BannerController();

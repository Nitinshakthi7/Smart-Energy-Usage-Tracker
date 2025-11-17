const EnergyReading = require('../models/EnergyReading');
const Home = require('../models/Home');
const Alert = require('../models/Alert');

exports.getDashboardData = async (req, res) => {
    try {
        let { homeId } = req.params;
        const period = req.query.period || 'today';

        let home;
        if (homeId) {
            home = await Home.findOne({ _id: homeId, user: req.user.id });
        } else {
            home = await Home.findOne({ user: req.user.id });
        }

        if (!home) {
            return res.status(404).json({
                success: false,
                message: 'Home not found'
            });
        }

        if (!homeId) {
            homeId = home._id;
        }
        
        let startDate;
        if (period === 'today') {
            startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
        } else if (period === 'week') {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
        } else {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
        }
        
        const readings = await EnergyReading.find({
            home: homeId,
            timestamp: { $gte: startDate }
        }).sort({ timestamp: 1 });
        
        const todayUsage = readings.reduce((sum, r) => sum + r.energyConsumed, 0);
        
        const todayCost = Math.round(todayUsage * home.electricityRate);
        
        const carbonFootprint = (todayUsage * 0.82).toFixed(1);
        
        const treesNeeded = Math.ceil(carbonFootprint / 0.06);
        
        const latestReading = readings[readings.length - 1];
        const currentPower = latestReading ? latestReading.watts : 0;
        
        const deviceConsumption = {};
        readings.forEach(r => {
            if (!deviceConsumption[r.deviceName]) {
                deviceConsumption[r.deviceName] = 0;
            }
            deviceConsumption[r.deviceName] += r.energyConsumed;
        });
        
        const topConsumers = Object.entries(deviceConsumption)
            .map(([name, consumption]) => ({ name, consumption: consumption.toFixed(2) }))
            .sort((a, b) => b.consumption - a.consumption)
            .slice(0, 5);
        
        const timeline = [];
        for (let i = 0; i < 24; i++) {
            const hourStart = new Date(startDate);
            hourStart.setHours(i);
            const hourEnd = new Date(hourStart);
            hourEnd.setHours(i + 1);
            
            const hourReadings = readings.filter(r => 
                r.timestamp >= hourStart && r.timestamp < hourEnd
            );
            
            const avgWatts = hourReadings.length > 0
                ? hourReadings.reduce((sum, r) => sum + r.watts, 0) / hourReadings.length
                : 0;
            
            timeline.push({
                hour: `${i}:00`,
                watts: Math.round(avgWatts)
            });
        }
        
        const roomConsumption = {};
        readings.forEach(r => {
            if (!roomConsumption[r.roomName]) {
                roomConsumption[r.roomName] = { consumption: 0, devices: new Set() };
            }
            roomConsumption[r.roomName].consumption += r.energyConsumed;
            roomConsumption[r.roomName].devices.add(r.deviceName);
        });
        
        const rooms = Object.entries(roomConsumption).map(([name, data]) => ({
            name,
            icon: home.rooms.find(r => r.name === name)?.icon || '🏠',
            consumption: data.consumption.toFixed(2),
            devices: data.devices.size
        }));
        
        const alerts = await Alert.find({ home: homeId })
            .sort({ createdAt: -1 })
            .limit(5);
        
        const formattedAlerts = alerts.map(alert => ({
            type: alert.type,
            title: alert.title,
            message: alert.message,
            time: getTimeAgo(alert.createdAt)
        }));
        
        // For now, do not generate fake heatmap data; frontend will handle empty array
        const heatmap = [];
        
        res.status(200).json({
            success: true,
            data: {
                currentPower,
                stats: {
                    todayUsage: todayUsage.toFixed(2),
                    todayCost,
                    carbonFootprint,
                    treesNeeded,
                    streakDays: 14
                },
                topConsumers,
                timeline,
                rooms,
                alerts: formattedAlerts,
                heatmap
            }
        });
        
    } catch (error) {
        console.error('Dashboard analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.getHeatMapData = async (req, res) => {
    try {
        let { homeId } = req.params;
        const month = req.query.month;

        let home;
        if (homeId) {
            home = await Home.findOne({ _id: homeId, user: req.user.id });
        } else {
            home = await Home.findOne({ user: req.user.id });
        }

        if (!home) {
            return res.status(404).json({
                success: false,
                message: 'Home not found'
            });
        }

        if (!homeId) {
            homeId = home._id;
        }
        
        // No fake heatmap data; return empty array until real aggregation is implemented
        const heatmap = [];
        
        res.status(200).json({
            success: true,
            data: heatmap
        });
        
    } catch (error) {
        console.error('Heat map error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.getHistoryData = async (req, res) => {
    try {
        let { homeId } = req.params;
        const { timeRange = 'month', device = 'all', sortBy = 'date_desc' } = req.query;

        let home;
        if (homeId) {
            home = await Home.findOne({ _id: homeId, user: req.user.id });
        } else {
            home = await Home.findOne({ user: req.user.id });
        }

        if (!home) {
            return res.status(404).json({ success: false, message: 'Home not found' });
        }

        if (!homeId) {
            homeId = home._id;
        }

        let startDate = new Date();
        switch (timeRange) {
            case 'day':
                startDate.setDate(startDate.getDate() - 1);
                break;
            case 'week':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'year':
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            case 'month':
            default:
                startDate.setMonth(startDate.getMonth() - 1);
                break;
        }

        const query = {
            home: homeId,
            timestamp: { $gte: startDate },
        };

        if (device !== 'all') {
            query.deviceName = device;
        }

        const sortOptions = {};
        switch (sortBy) {
            case 'date_asc':
                sortOptions.timestamp = 1;
                break;
            case 'usage_desc':
                sortOptions.energyConsumed = -1;
                break;
            case 'usage_asc':
                sortOptions.energyConsumed = 1;
                break;
            case 'date_desc':
            default:
                sortOptions.timestamp = -1;
                break;
        }

        const readings = await EnergyReading.find(query).sort(sortOptions);

        const historyData = readings.map(reading => ({
            date: reading.timestamp.toISOString().split('T')[0],
            device: reading.deviceName,
            usage: reading.energyConsumed.toFixed(2),
            cost: (reading.energyConsumed * home.electricityRate).toFixed(2),
        }));

        res.status(200).json({
            success: true,
            data: historyData,
        });

    } catch (error) {
        console.error('History data error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching history data',
        });
    }
};

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
}
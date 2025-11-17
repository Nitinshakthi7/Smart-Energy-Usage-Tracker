let energyMeterChart = null;
let topConsumersChart = null;
let timelineChart = null;
let currentWatts = 0;
let homeId = null;
let currentHeatmapData = [];

let devices = [
    { name: 'Air Conditioner', room: 'Living Room', type: 'Cooling' },
    { name: 'Refrigerator', room: 'Kitchen', type: 'Appliance' },
    { name: 'Washing Machine', room: 'Laundry', type: 'Appliance' },
    { name: 'TV', room: 'Living Room', type: 'Entertainment' },
    { name: 'Ceiling Fan', room: 'Bedroom', type: 'Fan' },
    { name: 'Water Heater', room: 'Bathroom', type: 'Water Heater' },
    { name: 'Laptop Charger', room: 'Study Room', type: 'Electronics' }
];

document.addEventListener('DOMContentLoaded', async function() {
    
    checkAuthentication();
    
    await loadUserInfo();
    
    await loadDashboardData();
    
    setupLogout();
    
    setupTabs();
    
    setupDeviceModal();
    setupDayDetailsModal();

    loadDevices();
    
    setInterval(updateLiveData, 5000);
});

function setupDeviceModal() {
    const addDeviceBtn = document.getElementById('add-device-btn');
    const modal = document.getElementById('add-device-modal');
    const closeModalBtn = document.getElementById('add-device-modal-close-btn');
    const addDeviceForm = document.getElementById('add-device-form');

    addDeviceBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
    });

    closeModalBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    addDeviceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const deviceName = document.getElementById('device-name').value;
        const deviceRoom = document.getElementById('device-room').value;
        const deviceType = document.getElementById('device-type').value;

        const newDevice = { name: deviceName, room: deviceRoom, type: deviceType };
        console.log('New Device:', newDevice);

        // In a real application, you would send this data to the server.
        // For now, we'll just add it to our local array.
        devices.push(newDevice);
        
        addDeviceForm.reset();
        modal.classList.add('hidden');
        
        // Re-render the devices list with the new device.
        renderDevices(devices);
    });
}

function loadDevices() {
    renderDevices(devices);
}

function renderDevices(devices) {
    const tbody = document.getElementById('devices-tbody');
    if (!tbody) {
        return;
    }

    tbody.innerHTML = '';

    devices.forEach((device, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${device.name}</td>
            <td>${device.room}</td>
            <td>${device.type}</td>
            <td>
                <button class="btn-icon edit-device" data-index="${index}">✏️</button>
                <button class="btn-icon delete-device" data-index="${index}">🗑️</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    const editButtons = tbody.querySelectorAll('.edit-device');
    editButtons.forEach(button => {
        button.addEventListener('click', () => {
            const index = parseInt(button.getAttribute('data-index'), 10);
            const device = devices[index];
            const newName = prompt('Device name', device.name) || device.name;
            const newRoom = prompt('Room', device.room) || device.room;
            const newType = prompt('Type', device.type) || device.type;

            devices[index] = {
                name: newName,
                room: newRoom,
                type: newType
            };

            renderDevices(devices);
        });
    });

    const deleteButtons = tbody.querySelectorAll('.delete-device');
    deleteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const index = parseInt(button.getAttribute('data-index'), 10);
            const device = devices[index];

            const confirmed = confirm(`Delete ${device.name}?`);
            if (confirmed) {
                devices.splice(index, 1);
                renderDevices(devices);
            }
        });
    });
}

function setupTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();

            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const contentId = tab.getAttribute('data-tab');
            document.querySelector(`[data-content="${contentId}"]`).classList.add('active');

            if (contentId === 'history') {
                loadHistoryData();
            }
        });
    });
}

async function loadHistoryData() {
    const tbody = document.getElementById('history-tbody');
    const deviceFilter = document.getElementById('device-filter');
    const timeRangeSelect = document.getElementById('time-range-filter');
    const sortBySelect = document.getElementById('sort-by');

    if (!tbody) {
        return;
    }

    const timeRange = timeRangeSelect ? timeRangeSelect.value : 'month';
    const device = deviceFilter ? deviceFilter.value : 'all';
    const sortBy = sortBySelect ? sortBySelect.value : 'date_desc';

    try {
        const response = await api.getHistoryData(timeRange, device, sortBy);
        let rows = (response && response.data) || [];

        if (!rows.length) {
            rows = generateMockHistory();
        }

        fillHistoryTable(rows, tbody, deviceFilter);
    } catch (error) {
        console.error('Failed to load history data:', error);
        const rows = generateMockHistory();
        fillHistoryTable(rows, tbody, deviceFilter);
    }
}

function fillHistoryTable(rows, tbody, deviceFilter) {
    tbody.innerHTML = '';

    rows.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.date}</td>
            <td>${item.device}</td>
            <td>${item.usage}</td>
            <td>${item.cost}</td>
        `;
        tbody.appendChild(tr);
    });

    if (deviceFilter && deviceFilter.options.length === 1) {
        const deviceNames = Array.from(new Set(rows.map(row => row.device)));
        deviceNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            deviceFilter.appendChild(option);
        });
    }
}

function checkAuthentication() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
}

async function loadUserInfo() {
    try {
        const userData = await api.getCurrentUser();
        
        document.getElementById('user-name').textContent = userData.user.name;
        document.getElementById('welcome-name').textContent = userData.user.name.split(' ')[0];
        
    } catch (error) {
        console.error('Failed to load user info:', error);
        api.logout();
    }
}

async function loadDashboardData() {
    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.classList.remove('hidden');
    
    try {
        const data = await api.getDashboardData(homeId, 'today');
        
        updateLiveMeter(data.currentPower || 450);
        updateStatCards(data.stats || generateMockStats());
        updateTopConsumersChart(data.topConsumers || generateMockConsumers());
        updateTimelineChart(data.timeline || generateMockTimeline());
        updateAlerts(data.alerts || generateMockAlerts());
        updateRoomBreakdown(data.rooms || generateMockRooms());
        updateHeatMap(data.heatmap || generateMockHeatMap());
        
        updateLastUpdated();
        
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        loadMockData();
    } finally {
        loadingOverlay.classList.add('hidden');
    }
}

function updateLiveMeter(watts) {
    const canvas = document.getElementById('energy-meter');
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 120;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 20;
    ctx.stroke();
    
    const maxWatts = 2000;
    const progress = Math.min(watts / maxWatts, 1);
    const angle = progress * 2 * Math.PI - Math.PI / 2;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, angle);
    ctx.strokeStyle = getColorForWatts(watts);
    ctx.lineWidth = 20;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    animateValue('current-watts', currentWatts, watts, 1000);
    currentWatts = watts;
    
    const statusEl = document.getElementById('meter-status');
    if (watts < 500) {
        statusEl.textContent = 'Normal Usage';
        statusEl.className = 'meter-status';
    } else if (watts < 1000) {
        statusEl.textContent = 'Moderate Usage';
        statusEl.className = 'meter-status warning';
    } else {
        statusEl.textContent = 'High Usage';
        statusEl.className = 'meter-status danger';
    }
}

function getColorForWatts(watts) {
    if (watts < 500) return '#4caf50'; 
    if (watts < 1000) return '#ff9800'; 
    return '#f44336'; 
}

function updateStatCards(stats) {
    animateValue('today-usage', 0, stats.todayUsage, 1500);
    document.getElementById('today-cost').textContent = `₹${stats.todayCost}`;
    animateValue('carbon-footprint', 0, stats.carbonFootprint, 1500);
    document.getElementById('trees-needed').textContent = stats.treesNeeded;
    animateValue('streak-days', 0, stats.streakDays, 1000);
}

function updateTopConsumersChart(consumers) {
    const ctx = document.getElementById('top-consumers-chart').getContext('2d');
    
    if (topConsumersChart) {
        topConsumersChart.destroy();
    }
    
    topConsumersChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: consumers.map(c => c.name),
            datasets: [{
                label: 'Energy (kWh)',
                data: consumers.map(c => c.consumption),
                backgroundColor: '#0066ff',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        display: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function updateTimelineChart(timeline) {
    const ctx = document.getElementById('timeline-chart').getContext('2d');
    
    if (timelineChart) {
        timelineChart.destroy();
    }
    
    timelineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeline.map(t => t.hour),
            datasets: [{
                label: 'Power (W)',
                data: timeline.map(t => t.watts),
                borderColor: '#0066ff',
                backgroundColor: 'rgba(0, 102, 255, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#f0f0f0'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function updateAlerts(alerts) {
    const container = document.getElementById('alerts-container');
    container.innerHTML = '';
    
    alerts.forEach(alert => {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert-item alert-${alert.type}`;
        alertDiv.innerHTML = `
            <div class="alert-icon">${getAlertIcon(alert.type)}</div>
            <div class="alert-content">
                <div class="alert-title">${alert.title}</div>
                <div class="alert-message">${alert.message}</div>
                <div class="alert-time">${alert.time}</div>
            </div>
        `;
        container.appendChild(alertDiv);
    });
}

function getAlertIcon(type) {
    const icons = {
        warning: '⚠️',
        info: 'ℹ️',
        success: '✅'
    };
    return icons[type] || '⚠️';
}

function updateRoomBreakdown(rooms) {
    const container = document.getElementById('rooms-container');
    container.innerHTML = '';
    
    rooms.forEach(room => {
        const roomDiv = document.createElement('div');
        roomDiv.className = 'room-card';
        roomDiv.innerHTML = `
            <div class="room-header">
                <div class="room-name">${room.name}</div>
                <div class="room-icon">${room.icon}</div>
            </div>
            <div class="room-consumption">${room.consumption} kWh</div>
            <div class="room-devices">${room.devices} devices</div>
        `;
        container.appendChild(roomDiv);
    });
}

function updateHeatMap(heatmapData) {
    const container = document.getElementById('heatmap-calendar');
    container.innerHTML = '';

    currentHeatmapData = heatmapData || [];

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    document.getElementById('heatmap-month-year').textContent = 
        now.toLocaleString('default', { month: 'long', year: 'numeric' });

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(name => {
        const dayNameEl = document.createElement('div');
        dayNameEl.className = 'heatmap-day-name';
        dayNameEl.textContent = name;
        container.appendChild(dayNameEl);
    });

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayOfMonth; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'heatmap-day empty';
        container.appendChild(emptyCell);
    }

    for (let i = 0; i < daysInMonth; i++) {
        const day = document.createElement('div');
        const level = heatmapData[i] || 0;
        day.className = `heatmap-day level-${level}`;
        day.textContent = i + 1;
        day.setAttribute('data-day', i + 1);
        day.setAttribute('title', `Day ${i + 1}: Level ${level}`);

        day.addEventListener('click', () => {
            handleHeatmapDayClick(i + 1, level, year, month);
        });

        container.appendChild(day);
    }
}

function handleHeatmapDayClick(dayNumber, level, year, month) {
    const modal = document.getElementById('day-details-modal');
    if (!modal) {
        return;
    }

    const date = new Date(year, month, dayNumber);
    const dateString = date.toISOString().split('T')[0];

    const baseUsage = 5 + level * 2;
    const totalUsage = baseUsage.toFixed(2);
    const costPerKwh = 15;
    const totalCost = (baseUsage * costPerKwh).toFixed(2);

    const rooms = generateMockRooms();
    let maxRoom = rooms[0];
    rooms.forEach(room => {
        if (room.consumption > maxRoom.consumption) {
            maxRoom = room;
        }
    });

    const devicesList = generateMockConsumers();
    let maxDevice = devicesList[0];
    devicesList.forEach(device => {
        if (device.consumption > maxDevice.consumption) {
            maxDevice = device;
        }
    });

    const dateEl = document.getElementById('modal-date');
    const totalUsageEl = document.getElementById('modal-total-usage');
    const totalCostEl = document.getElementById('modal-total-cost');
    const topApplianceEl = document.getElementById('modal-top-appliance');
    const roomBreakdownEl = document.getElementById('modal-room-breakdown');

    if (dateEl) {
        dateEl.textContent = dateString;
    }
    if (totalUsageEl) {
        totalUsageEl.textContent = `${totalUsage} kWh`;
    }
    if (totalCostEl) {
        totalCostEl.textContent = `₹${totalCost}`;
    }
    if (topApplianceEl) {
        topApplianceEl.textContent = `${maxDevice.name} - ${maxDevice.consumption} kWh`;
    }
    if (roomBreakdownEl) {
        roomBreakdownEl.innerHTML = '';
        rooms.forEach(room => {
            const div = document.createElement('div');
            const value = (room.consumption + level).toFixed(2);
            div.textContent = `${room.name}: ${value} kWh`;
            if (room.name === maxRoom.name) {
                div.style.fontWeight = 'bold';
            }
            roomBreakdownEl.appendChild(div);
        });
    }

    modal.classList.remove('hidden');
}

function updateLastUpdated() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    document.getElementById('last-update').textContent = timeString;
}

async function updateLiveData() {
    try {
        const randomWatts = 300 + Math.random() * 400;
        updateLiveMeter(randomWatts);
        updateLastUpdated();
    } catch (error) {
        console.error('Failed to update live data:', error);
    }
}

function animateValue(elementId, start, end, duration) {
    const element = document.getElementById(elementId);
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            element.textContent = Math.round(end);
            clearInterval(timer);
        } else {
            element.textContent = Math.round(current);
        }
    }, 16);
}

function setupLogout() {
    document.getElementById('logout-btn').addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            api.logout();
        }
    });
}

function setupDayDetailsModal() {
    const modal = document.getElementById('day-details-modal');
    const closeBtn = document.getElementById('modal-close-btn');

    if (!modal || !closeBtn) {
        return;
    }

    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.classList.add('hidden');
        }
    });
}

function loadMockData() {
    updateLiveMeter(450);
    updateStatCards(generateMockStats());
    updateTopConsumersChart(generateMockConsumers());
    updateTimelineChart(generateMockTimeline());
    updateAlerts(generateMockAlerts());
    updateRoomBreakdown(generateMockRooms());
    updateHeatMap(generateMockHeatMap());
}

function generateMockStats() {
    return {
        todayUsage: 12.5,
        todayCost: 187,
        carbonFootprint: 8.5,
        treesNeeded: 5,
        streakDays: 14
    };
}

function generateMockConsumers() {
    return [
        { name: 'Air Conditioner', consumption: 4.2 },
        { name: 'Water Heater', consumption: 2.8 },
        { name: 'Refrigerator', consumption: 2.1 },
        { name: 'Washing Machine', consumption: 1.5 },
        { name: 'TV', consumption: 0.9 }
    ];
}

function generateMockTimeline() {
    const hours = [];
    for (let i = 0; i < 24; i++) {
        hours.push({
            hour: `${i}:00`,
            watts: 200 + Math.random() * 600
        });
    }
    return hours;
}

function generateMockAlerts() {
    return [
        {
            type: 'warning',
            title: 'High Usage Detected',
            message: 'Air conditioner has been running for 8 hours continuously',
            time: '2 minutes ago'
        },
        {
            type: 'info',
            title: 'Peak Hours Soon',
            message: 'Peak electricity rates start in 30 minutes',
            time: '15 minutes ago'
        },
        {
            type: 'success',
            title: 'Goal Achieved',
            message: 'You used 20% less energy than yesterday!',
            time: '1 hour ago'
        }
    ];
}

function generateMockRooms() {
    return [
        { name: 'Living Room', icon: '🛋️', consumption: 3.2, devices: 5 },
        { name: 'Bedroom', icon: '🛏️', consumption: 2.8, devices: 4 },
        { name: 'Kitchen', icon: '🍳', consumption: 4.1, devices: 6 },
        { name: 'Bathroom', icon: '🚿', consumption: 2.4, devices: 3 }
    ];
}

function generateMockHeatMap() {
    return Array.from({ length: 35 }, () => Math.floor(Math.random() * 5));
}

function generateMockHistory() {
    const history = [];
    const today = new Date();
    const deviceNames = ['Air Conditioner', 'Refrigerator', 'Washing Machine', 'TV', 'Water Heater', 'Fan'];

    for (let i = 0; i < 15; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);

        const device = deviceNames[i % deviceNames.length];
        const usage = (1 + Math.random() * 4).toFixed(2);
        const cost = (usage * 15).toFixed(2);

        history.push({
            date: date.toISOString().split('T')[0],
            device: device,
            usage: usage,
            cost: cost
        });
    }

    return history;
}

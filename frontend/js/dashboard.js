let energyMeterChart = null;
let topConsumersChart = null;
let timelineChart = null;
let currentWatts = 0;
let homeId = null;
let currentHeatmapData = [];

let currentHome = null;
let currentRooms = [];
let devices = [];
let selectedRoomId = '';

document.addEventListener('DOMContentLoaded', async function() {
    checkAuthentication();
    await loadUserInfo();

    await initializeHomeContext();
    await loadDashboardData();

    setupLogout();
    setupTabs();
    setupDeviceModal();
    setupDayDetailsModal();
    setupSettings();

    await loadDevices();

    setInterval(updateLiveData, 5000);
});

function setupDeviceModal() {
    const addDeviceBtn = document.getElementById('add-device-btn');
    const modal = document.getElementById('add-device-modal');
    const closeModalBtn = document.getElementById('add-device-modal-close-btn');
    const addDeviceForm = document.getElementById('add-device-form');
    const selectedRoomNameEl = document.getElementById('selected-room-name');

    addDeviceBtn.addEventListener('click', () => {
        if (!currentHome) {
            alert('Please create a home first before adding devices.');
            return;
        }
        if (!currentRooms || currentRooms.length === 0) {
            alert('Please add at least one room to your home before adding devices.');
            return;
        }
        if (!selectedRoomId) {
            alert('Please select a room from the dropdown first, then add a device.');
            return;
        }

        const room = currentRooms.find(r => r._id === selectedRoomId);
        if (!room) {
            alert('Selected room not found. Please re-select the room.');
            return;
        }

        if (selectedRoomNameEl) {
            selectedRoomNameEl.textContent = room.name;
        }

        modal.classList.remove('hidden');
    });

    closeModalBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    addDeviceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const deviceName = document.getElementById('device-name').value.trim();
        const deviceType = document.getElementById('device-type').value.trim();
        const powerRatingValue = document.getElementById('device-power-rating').value;
        const powerRating = parseInt(powerRatingValue, 10) || 0;

        if (!homeId || !selectedRoomId) {
            alert('Home or room not selected. Please select a room and try again.');
            return;
        }

        try {
            await api.addDeviceToRoom(homeId, selectedRoomId, {
                name: deviceName,
                type: deviceType || 'Other',
                powerRating: powerRating > 0 ? powerRating : 100
            });

            addDeviceForm.reset();
            modal.classList.add('hidden');

            // Reload home context and devices from backend so Postman & UI match
            await initializeHomeContext();
            await loadDevices();
        } catch (error) {
            console.error('Failed to add device:', error);
            alert(error.message || 'Failed to add device');
        }
    });
}

async function loadDevices() {
    devices = [];

    if (!currentHome || !currentRooms) {
        renderDevices(devices);
        return;
    }

    // Only show devices for the selected room; if none selected, keep list empty
    if (!selectedRoomId) {
        renderDevices(devices);
        return;
    }

    const room = currentRooms.find(r => r._id === selectedRoomId);
    if (!room) {
        renderDevices(devices);
        return;
    }

    (room.devices || []).forEach(device => {
        devices.push({
            id: device._id,
            name: device.name,
            room: room.name,
            type: device.type
        });
    });

    renderDevices(devices);
}

function renderDevices(devices) {
    const tbody = document.getElementById('devices-tbody');
    if (!tbody) {
        return;
    }

    tbody.innerHTML = '';

    if (!selectedRoomId) {
        // No room selected, show nothing
        return;
    }

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
            if (contentId === 'settings') {
                refreshSettingsHomeInfo();
            }
            if (contentId === 'devices') {
                populateRoomFilter();
            }
        });
    });
}

function setupSettings() {
    const createHomeForm = document.getElementById('create-home-form');
    const addRoomForm = document.getElementById('add-room-form');

    if (!createHomeForm && !addRoomForm) {
        return;
    }

    const homeNameInput = document.getElementById('home-name');
    const homeRateInput = document.getElementById('home-rate');
    const roomNameInput = document.getElementById('room-name-settings');
    const roomIconInput = document.getElementById('room-icon-settings');
    const settingsStatus = document.getElementById('settings-status');

    if (createHomeForm) {
        createHomeForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = homeNameInput.value.trim();
            const rateValue = homeRateInput.value;
            const rate = rateValue ? parseFloat(rateValue) : undefined;

            try {
                setSettingsStatus('Creating home...', settingsStatus);
                await api.createHome(name, rate);

                homeNameInput.value = '';
                homeRateInput.value = '';

                await initializeHomeContext();
                await loadDashboardData();
                await loadDevices();

                setSettingsStatus('Home created successfully.', settingsStatus);
                refreshSettingsHomeInfo();
            } catch (error) {
                console.error('Failed to create home:', error);
                setSettingsStatus(error.message || 'Failed to create home.', settingsStatus, true);
            }
        });
    }

    if (addRoomForm) {
        addRoomForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!currentHome || !homeId) {
                setSettingsStatus('Please create a home first before adding rooms.', settingsStatus, true);
                return;
            }

            const roomName = roomNameInput.value.trim();
            const roomIcon = roomIconInput.value.trim() || '🏠';

            if (!roomName) {
                setSettingsStatus('Room name is required.', settingsStatus, true);
                return;
            }

            try {
                setSettingsStatus('Adding room...', settingsStatus);
                await api.addRoom(homeId, roomName, roomIcon);

                roomNameInput.value = '';
                roomIconInput.value = '';

                await initializeHomeContext();
                await loadDashboardData();
                await loadDevices();

                setSettingsStatus('Room added successfully.', settingsStatus);
                refreshSettingsHomeInfo();
            } catch (error) {
                console.error('Failed to add room:', error);
                setSettingsStatus(error.message || 'Failed to add room.', settingsStatus, true);
            }
        });
    }
}

function refreshSettingsHomeInfo() {
    const currentHomeNameEl = document.getElementById('current-home-name');
    const currentRoomsCountEl = document.getElementById('current-rooms-count');

    if (!currentHomeNameEl || !currentRoomsCountEl) {
        return;
    }

    if (!currentHome) {
        currentHomeNameEl.textContent = 'No home found. Create one below.';
        currentRoomsCountEl.textContent = '-';
        return;
    }

    currentHomeNameEl.textContent = currentHome.name;
    currentRoomsCountEl.textContent = (currentHome.rooms || []).length;
}

function setSettingsStatus(message, element, isError = false) {
    if (!element) return;
    element.textContent = message;
    element.style.color = isError ? '#e53935' : '#4caf50';
}

function populateRoomFilter() {
    const roomFilter = document.getElementById('room-filter');
    if (!roomFilter) return;

    // Reset selection and options
    const previousSelection = selectedRoomId;
    roomFilter.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a room';
    roomFilter.appendChild(defaultOption);

    (currentRooms || []).forEach(room => {
        const option = document.createElement('option');
        option.value = room._id;
        option.textContent = room.name;
        roomFilter.appendChild(option);
    });

    // Try to keep previous selection if still valid
    if (previousSelection && (currentRooms || []).some(r => r._id === previousSelection)) {
        roomFilter.value = previousSelection;
        selectedRoomId = previousSelection;
    } else {
        selectedRoomId = '';
    }

    roomFilter.addEventListener('change', async () => {
        selectedRoomId = roomFilter.value;
        await loadDevices();
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
        const rows = (response && response.data) || [];

        fillHistoryTable(rows, tbody, deviceFilter);
    } catch (error) {
        console.error('Failed to load history data:', error);
        fillHistoryTable([], tbody, deviceFilter);
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

async function initializeHomeContext() {
    try {
        const response = await api.getHomes();
        const homes = (response && response.data) || [];

        if (!homes.length) {
            console.warn('No homes found for user. Create one via Settings or Postman.');
            homeId = null;
            currentHome = null;
            currentRooms = [];
            selectedRoomId = '';
            return;
        }

        currentHome = homes[0]; // pick the first home for now
        homeId = currentHome._id;
        currentRooms = currentHome.rooms || [];
        selectedRoomId = '';
    } catch (error) {
        console.error('Failed to initialize home context:', error);
        currentHome = null;
        currentRooms = [];
        selectedRoomId = '';
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
        const response = await api.getDashboardData(homeId, 'today');
        const data = (response && response.data) || {};

        updateLiveMeter(data.currentPower || 0);
        if (data.stats) {
            updateStatCards(data.stats);
        }
        updateTopConsumersChart(data.topConsumers || []);
        updateTimelineChart(data.timeline || []);
        updateAlerts(data.alerts || []);
        updateRoomBreakdown(data.rooms || []);
        updateHeatMap(data.heatmap || []);
        
        updateLastUpdated();
        
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
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
    const todayUsage = Number(stats.todayUsage) || 0;
    const todayCost = Number(stats.todayCost) || 0;
    const carbonFootprint = Number(stats.carbonFootprint) || 0;
    const treesNeeded = stats.treesNeeded || 0;
    const streakDays = stats.streakDays || 0;

    animateValue('today-usage', 0, todayUsage, 1500);
    document.getElementById('today-cost').textContent = `₹${todayCost}`;
    animateValue('carbon-footprint', 0, carbonFootprint, 1500);
    document.getElementById('trees-needed').textContent = treesNeeded;
    animateValue('streak-days', 0, streakDays, 1000);
}

function updateTopConsumersChart(consumers) {
    const ctx = document.getElementById('top-consumers-chart').getContext('2d');
    
    if (topConsumersChart) {
        topConsumersChart.destroy();
    }

    const labels = (consumers || []).map(c => c.name);
    const values = (consumers || []).map(c => Number(c.consumption) || 0);
    
    topConsumersChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Energy (kWh)',
                data: values,
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

    const labels = (timeline || []).map(t => t.hour);
    const values = (timeline || []).map(t => Number(t.watts) || 0);
    
    timelineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Power (W)',
                data: values,
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
    
    (rooms || []).forEach(room => {
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

    // For now, show only basic info derived from the heatmap level
    const baseUsage = 5 + level * 2;
    const totalUsage = baseUsage.toFixed(2);
    const costPerKwh = 15;
    const totalCost = (baseUsage * costPerKwh).toFixed(2);

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
        topApplianceEl.textContent = 'Details per device not available yet.';
    }
    if (roomBreakdownEl) {
        roomBreakdownEl.innerHTML = '';
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
        // Re-fetch latest dashboard data periodically instead of generating fake watts
        await loadDashboardData();
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


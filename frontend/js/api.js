const API_BASE_URL = 'http://localhost:5000/api';

function getToken() {
    return localStorage.getItem('token');
}

function setToken(token) {
    localStorage.setItem('token', token);
}

function removeToken() {
    localStorage.removeItem('token');
}

const api = {
    
    register: async function(name, email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }
            
            if (data.token) {
                setToken(data.token);
            }
            
            return data;
        } catch (error) {
            throw error;
        }
    },
    
    login: async function(email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }
            
            if (data.token) {
                setToken(data.token);
            }
            
            return data;
        } catch (error) {
            throw error;
        }
    },
    
    getCurrentUser: async function() {
        try {
            const token = getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }
            
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to get user info');
            }
            
            return data;
        } catch (error) {
            throw error;
        }
    },
    
    getDashboardData: async function(homeId, period = 'today') {
        try {
            const token = getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }
            
            const url = homeId 
                ? `${API_BASE_URL}/analytics/dashboard/${homeId}?period=${period}`
                : `${API_BASE_URL}/analytics/dashboard?period=${period}`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to get dashboard data');
            }
            
            return data;
        } catch (error) {
            throw error;
        }
    },
    
    getHomes: async function() {
        try {
            const token = getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }
            
            const response = await fetch(`${API_BASE_URL}/homes`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to get homes');
            }
            
            return data;
        } catch (error) {
            throw error;
        }
    },
    
    getHeatMapData: async function(homeId, month) {
        try {
            const token = getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }
            
            const response = await fetch(
                `${API_BASE_URL}/analytics/heatmap/${homeId}?month=${month}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to get heat map data');
            }
            
            return data;
        } catch (error) {
            throw error;
        }
    },
    
    submitReading: async function(readingData) {
        try {
            const token = getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }
            
            const response = await fetch(`${API_BASE_URL}/readings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(readingData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to submit reading');
            }
            
            return data;
        } catch (error) {
            throw error;
        }
    },
    
    logout: function() {
        removeToken();
        window.location.href = 'index.html';
    }
};
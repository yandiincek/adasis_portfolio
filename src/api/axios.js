import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    // 'Bypass-Tunnel-Reminder': 'true' // Not needed
  }
});

export default api;

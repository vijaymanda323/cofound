import axios from 'axios';

const API = axios.create({
  baseURL: 'http://192.168.1.7:8080/api', // ✅ Correct IP
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default API;

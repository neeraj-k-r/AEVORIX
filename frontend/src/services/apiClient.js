const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE;
    this.interceptors = {
      request: [],
      response: [],
    };
  }

  getAuthHeader() {
    const token = localStorage.getItem('aevorix_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  addRequestInterceptor(fn) {
    this.interceptors.request.push(fn);
  }

  addResponseInterceptor(fn) {
    this.interceptors.response.push(fn);
  }

  async applyRequestInterceptors(config) {
    let modifiedConfig = { ...config };
    for (const interceptor of this.interceptors.request) {
      modifiedConfig = await interceptor(modifiedConfig);
    }
    return modifiedConfig;
  }

  async applyResponseInterceptors(response, data) {
    let modifiedResponse = { response, data };
    for (const interceptor of this.interceptors.response) {
      modifiedResponse = await interceptor(modifiedResponse);
    }
    return modifiedResponse;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    let config = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    config = await this.applyRequestInterceptors(config);

    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    const { response: modifiedResponse, data: modifiedData } = await this.applyResponseInterceptors(response, data);

    if (!modifiedResponse.ok) {
      const error = new Error(modifiedData.error || 'Request failed');
      error.status = modifiedResponse.status;
      error.data = modifiedData;
      throw error;
    }

    return modifiedData;
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  }

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();

apiClient.addResponseInterceptor(async ({ response, data }) => {
  if (response.status === 401) {
    localStorage.removeItem('aevorix_token');
    localStorage.removeItem('aevorix_user');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
  if (response.status === 403) {
    if (window.location.pathname !== '/unauthorized') {
      window.location.href = '/unauthorized';
    }
  }
  return { response, data };
});
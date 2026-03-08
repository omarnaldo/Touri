const API_BASE = '/api';

// Helper to make authenticated API calls
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

// Helper for file uploads (multipart/form-data)
async function apiUpload(endpoint: string, formData: FormData, options: RequestInit = {}) {
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  // Let the browser set the Content-Type with proper boundary for FormData
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    method: options.method || 'POST',
    headers,
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Upload failed');
  }

  return data;
}

// Auth service
export const authService = {
  async signin(email: string, password: string) {
    const data = await apiFetch('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    return data.data;
  },

  async signup(payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    age: number;
    phoneNumber?: string;
    role: 'traveler' | 'guide';
    profileImageUrl?: string;
    guideProfile?: {
      bio: string;
      languages: string[];
      yearsOfExperience: number;
      city?: string;
      country?: string;
      specialties?: string[];
      dailyRate?: number;
    };
  }) {
    const data = await apiFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    return data.data;
  },

  async getMe() {
    const data = await apiFetch('/auth/me');
    return data.data.user;
  },

  async verifyEmail(token: string) {
    const data = await apiFetch(`/auth/verify-email?token=${encodeURIComponent(token)}`);
    return data;
  },

  async changePassword(currentPassword: string, newPassword: string) {
    return apiFetch('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  async uploadProfileImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);

    const data = await apiUpload('/upload/profile-image', formData);
    return data.data as { url: string };
  },
};

// Users / Guides service
export const userService = {
  async getGuides(filters: {
    city?: string;
    minRating?: number;
    maxPrice?: number;
    languages?: string[];
    specialties?: string[];
    page?: number;
    limit?: number;
  } = {}) {
    const params = new URLSearchParams();
    if (filters.city) params.set('city', filters.city);
    if (filters.minRating) params.set('minRating', String(filters.minRating));
    if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice));
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.languages) {
      filters.languages.forEach(l => params.append('languages', l));
    }
    if (filters.specialties) {
      filters.specialties.forEach(s => params.append('specialties', s));
    }

    const queryString = params.toString();
    const data = await apiFetch(`/users/guides${queryString ? `?${queryString}` : ''}`);
    return data.data;
  },

  async getGuideById(id: string) {
    const data = await apiFetch(`/users/guides/${id}`);
    return data.data;
  },

  async getProfile() {
    const data = await apiFetch('/users/profile');
    return data.data;
  },

  async updateProfile(profileData: {
    firstName?: string;
    lastName?: string;
    age?: number;
    phoneNumber?: string;
    profileImageUrl?: string;
  }) {
    const data = await apiFetch('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    return data.data;
  },

  async updateGuideProfile(userId: string, guideData: {
    bio?: string;
    languages?: string[];
    yearsOfExperience?: number;
    dailyRate?: number;
    specialties?: string[];
    city?: string;
    country?: string;
  }) {
    const data = await apiFetch(`/users/guides/${userId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(guideData),
    });
    return data.data;
  },
};

// Chat service
export const chatService = {
  async getRooms() {
    const data = await apiFetch('/chat/rooms');
    return data.data;
  },

  async getOrCreateRoom(otherUserId: string) {
    const data = await apiFetch('/chat/rooms', {
      method: 'POST',
      body: JSON.stringify({ otherUserId }),
    });
    return data.data;
  },

  async getMessages(roomId: string, options: { limit?: number; before?: string } = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', String(options.limit));
    if (options.before) params.set('before', options.before);

    const queryString = params.toString();
    const data = await apiFetch(`/chat/rooms/${roomId}/messages${queryString ? `?${queryString}` : ''}`);
    return data;
  },

  async sendMessage(roomId: string, message: string) {
    const data = await apiFetch(`/chat/rooms/${roomId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    return data.data;
  },

  async markAsRead(roomId: string) {
    return apiFetch(`/chat/rooms/${roomId}/read`, { method: 'PUT' });
  },

  async getUnreadCount() {
    const data = await apiFetch('/chat/unread-count');
    return data.data.unreadCount;
  },
};

// API Client for OnlineDaftar
export const API_BASE = import.meta.env.VITE_API_URL || 'https://onlinedaftar-backend.onrender.com/api';

// Token Management
export const getToken = () => localStorage.getItem('onlinedaftar_token');
export const setToken = (token) => {
  if (token) localStorage.setItem('onlinedaftar_token', token);
  else localStorage.removeItem('onlinedaftar_token');
};
export const removeToken = () => localStorage.removeItem('onlinedaftar_token');

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('onlinedaftar_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};
export const setStoredUser = (user) => {
  if (user) localStorage.setItem('onlinedaftar_user', JSON.stringify(user));
  else localStorage.removeItem('onlinedaftar_user');
};

const getHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

// Generic fetch wrapper with timeout and error handling
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {})
    }
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
      error.status = res.status;
      error.data = data;
      throw error;
    }
    return data;
  } catch (err) {
    // Pass along network/backend errors
    throw err;
  }
}

// ----------------- Fallback Demo Data for Offline / Interview Demo -----------------
export const DEMO_TASKS = [
  {
    id: 'demo-task-1',
    title: 'Audit and categorize 250 local business listings in Pune',
    description: 'Verify phone number, address accuracy, and categorize into retail / food / services from an Excel sheet.',
    category: 'Data Entry',
    pay_paise: 185000,
    poster_name: 'Vikram Mehta',
    status: 'open',
    proof_type: 'file',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'demo-task-2',
    title: 'Store shelf video footage: FMCG shampoo aisle in Bandra West',
    description: 'Walk down the aisle holding phone steady in 4K 60fps showing shelf facings and discount tags.',
    category: 'Field & Retail',
    pay_paise: 240000,
    poster_name: 'RetailLens Analytics',
    status: 'open',
    proof_type: 'video',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'demo-task-3',
    title: 'Translate 12 product description cards to Hindi & Marathi',
    description: 'E-commerce fashion copy translation maintaining brand tone and regional colloquial clarity.',
    category: 'Translation',
    pay_paise: 125000,
    poster_name: 'Kavita Sharma',
    status: 'open',
    proof_type: 'link',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: 'demo-task-4',
    title: 'Test UPI intent flow & checkout edge-cases on Android 14',
    description: 'Screen record 5 test transactions with low network simulation and document error logs.',
    category: 'QA Testing',
    pay_paise: 310000,
    poster_name: 'DaftarPay Tech',
    status: 'open',
    proof_type: 'link',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

export const DEMO_TRANSACTIONS = [
  {
    id: 'tx-1',
    task_title: 'Audit and categorize 250 local business listings in Pune',
    type: 'escrow_release',
    amount_paise: 185000,
    status: 'paid',
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'tx-2',
    task_title: null,
    type: 'withdrawal',
    amount_paise: 150000,
    status: 'sent',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'tx-3',
    task_title: 'Translate 12 product description cards to Hindi',
    type: 'escrow_release',
    amount_paise: 125000,
    status: 'paid',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString()
  }
];

export const DEMO_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Escrow Released',
    body: '₹1,850 credited to your wallet for task "Audit and categorize 250 listings".',
    read: false,
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'notif-2',
    title: 'New Task Match',
    body: 'A new QA Testing gig matching your profile was posted in your category.',
    read: false,
    created_at: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'notif-3',
    title: 'Bank Account Verified',
    body: 'Your payout UPI ID priya.s@okhdfc is verified and ready for instant withdrawals.',
    read: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

export const DEMO_LISTINGS = [
  {
    id: 'list-1',
    title: 'Mumbai Marine Drive Monsoon Timelapse (4K ProRes)',
    type: 'footage',
    category: 'Stock Footage',
    price_paise: 149900,
    license_type: 'single_use',
    seller_name: 'Aarav CineLab',
    preview_url: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&auto=format&fit=crop',
    created_at: new Date().toISOString()
  },
  {
    id: 'list-2',
    title: 'Indian Wedding Drone B-Roll & Haldi Cinematic Montage',
    type: 'footage',
    category: 'Cinematics',
    price_paise: 299900,
    license_type: 'single_use',
    seller_name: 'Studio Noor',
    preview_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop',
    created_at: new Date().toISOString()
  }
];

// ----------------- API Methods -----------------
export const authApi = {
  login: async ({ username, email, identifier, password }) => {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, email, identifier, password })
    });
  },
  register: async ({ username, name, email, password, role }) => {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, name, email, password, role })
    });
  },
  getMe: async () => {
    return request('/auth/me');
  },
  updateProfile: async ({ bio, name }) => {
    return request('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify({ bio, name })
    });
  }
};

export const tasksApi = {
  getTasks: async (category) => {
    const q = category && category !== 'All' ? `?category=${encodeURIComponent(category)}` : '';
    return request(`/tasks${q}`);
  },
  createTask: async ({ title, description, category, payPaise, proofType, deadline }) => {
    return request('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title, description, category, payPaise, proofType, deadline })
    });
  },
  acceptTask: async (taskId) => {
    return request(`/tasks/${taskId}/accept`, {
      method: 'POST'
    });
  },
  submitProof: async (taskId, { proofUrl, note }) => {
    return request(`/tasks/${taskId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ proofUrl, note })
    });
  },
  approveTask: async (taskId) => {
    return request(`/tasks/${taskId}/approve`, {
      method: 'POST'
    });
  }
};

export const walletApi = {
  getWallet: async () => {
    return request('/wallet');
  },
  withdraw: async () => {
    return request('/payments/withdraw', {
      method: 'POST'
    });
  }
};

export const bankApi = {
  getDetails: async () => {
    return request('/bank-account');
  },
  linkBank: async ({ accountNumber, ifsc, accountHolderName }) => {
    return request('/bank-account/link-bank', {
      method: 'POST',
      body: JSON.stringify({ accountNumber, ifsc, accountHolderName })
    });
  },
  linkUpi: async ({ upiId }) => {
    return request('/bank-account/link-upi', {
      method: 'POST',
      body: JSON.stringify({ upiId })
    });
  }
};

export const notificationsApi = {
  getNotifications: async () => {
    return request('/notifications');
  },
  markAllRead: async () => {
    return request('/notifications/mark-all-read', {
      method: 'POST'
    });
  }
};

export const listingsApi = {
  getListings: async (category) => {
    const q = category && category !== 'All' ? `?category=${encodeURIComponent(category)}` : '';
    return request(`/listings${q}`);
  },
  createListing: async (listingData) => {
    return request('/listings', {
      method: 'POST',
      body: JSON.stringify(listingData)
    });
  },
  createPurchaseOrder: async (listingId) => {
    return request(`/listings/${listingId}/purchase-order`, {
      method: 'POST'
    });
  },
  verifyPurchase: async (payload) => {
    return request('/listings/verify', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  getLibrary: async () => {
    return request('/listings/mine/library');
  },
  getSelling: async () => {
    return request('/listings/mine/selling');
  }
};

export const paymentsApi = {
  createEscrowOrder: async (taskId) => {
    return request('/payments/create-escrow-order', {
      method: 'POST',
      body: JSON.stringify({ taskId })
    });
  },
  verifyEscrow: async (payload) => {
    return request('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};

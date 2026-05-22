import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { clearAuth, refreshToken as fallbackRefresh } from './api/core/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // This is crucial for sending/receiving cookies
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000, // 20 seconds to accommodate slower endpoints
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // No need to manually set token in headers
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 401 errors (Unauthorized)
    if (error.response?.status === 401 && !originalRequest?._retry) {
      if (isRefreshing) {
        // If refresh is in progress, queue the request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token
        await api.post('/api/users/refresh-token');

        // Process queued requests
        processQueue(null, null);

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        try {
          await fallbackRefresh();
        } catch (_) {
          clearAuth();
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle validation errors
    if (error.response?.status === 422) {
      const backendErrors = (error.response.data as any)?.errors;
      if (Array.isArray(backendErrors) && backendErrors.length) {
        backendErrors.forEach((e: any) => {
          toast.error(e.message || 'خطأ في إدخال البيانات');
        });
      } else if ((error.response.data as any)?.message) {
        toast.error((error.response.data as any).message);
      }
    }

    // Handle other error statuses
    if (error.response) {
      const status = error.response.status;
      const errorMessage = String((error.response.data as any)?.message || '').toLowerCase();
      const skipLogging404 =
        status === 404 && (
          errorMessage.includes('cart not found') ||
          errorMessage.includes('no cart found') ||
          errorMessage.includes('announcement') ||
          (error.config?.url ?? '').includes('/announcements')
        );

      if (!skipLogging404) {
        switch (status) {
          case 403:
            console.error('Forbidden: You do not have permission to access this resource');
            break;
          case 404:
            console.error('Resource not found');
            break;
          case 500:
            console.error('Server error: Please try again later');
            break;
          case 502:
          case 503:
            console.error('Service unavailable: Please try again later');
            break;
          default:
            console.error('An error occurred');
            console.error(error);
        }
      }
    } else if (error.request) {
      console.error(error);
      console.error(error.request);
      console.error('Network error: Please check your connection');
    }

    return Promise.reject(error);
  }
);

// Authentication Services
export const authService = {
  register: (userData: {
    name: string;
    email: string;
    password: string;
    role?: 'user' | 'seller';
  }) => api.post('/api/users/register', userData),

  login: (loginData: { email: string; password: string }) =>
    api.post('/api/users/login', loginData),

  logout: () => api.post('/api/users/logout'),

  refreshToken: () => api.post('/api/users/refresh-token'),

  getMe: () => api.get('/api/users/me'),

  verifyResetCode: (code: string) =>
    api.post('/api/users/verify-reset-code', { code }),

  resetPassword: (email: string, newPassword: string) =>
    api.post('/api/users/reset-password', { email, newPassword }),

  verifyEmail: (verifyData: any) =>
    api.post('/api/users/verify-email', verifyData),

  resendVerification: (email: string) =>
    api.post('/api/users/resend-email', { email }),

  getCurrentUser: () => api.get('/api/users/profile'),

  forgotPassword: (email: string) =>
    api.post('/api/users/forgot-password', { email }),

  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string
  }) => api.patch('/api/users/change-password', data),

};

// Notification Service 
export const notificationService = {
  getNotifications: () => api.get('/api/notifications'),
  markAsRead: (id: number) => api.patch(`/api/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/api/notifications/read-all'),
  getNotificationCount: () => api.get('/api/notifications/unread-count'),
  sendNotification: (notificationData: any) => api.post('/api/notifications', notificationData),
};


// User Services
export const userService = {
  getProfile: () => api.get('/api/users/profile'),

  updateProfile: (userData: {
    name?: string;
    email?: string;
    avatar?: string;
    phone?: string;
  }) => api.patch('/api/users/profile', userData),


  getUsers: (params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }) => api.get('/api/users', { params }),

  getUserById: (id: string) => api.get(`/api/users/${id}`),

  updateUser: (id: string, userData: any) => api.put(`/api/users/${id}`, userData),
  getSellerBalance: () => api.get("/api/users/seller/balance"),
  getSellerOrders: () => api.get("/api/users/seller/orders"),
  getSellerForAdmin: (params?: any) => api.get("/api/users/admin/sellers", { params }),
  getUserForAdmin: (params?: any) => api.get("/api/users/admin/users", { params }),
  restoreUser: (id: string) => api.patch(`/api/users/restore`, { userId: id }),
  // Toggle trusted status for a seller (admin only)
  setSellerTrusted: (id: string, trusted: boolean = true) =>
    api.patch(`/api/users/admin/seller/${id}/trust`, { trusted }),
  searchUsers: (query: string, role?: string) =>
    api.get('/api/users', { params: { search: query, role } }),
  updateVendorBalance: (sellerId: string, balanceData: { balance?: number; pendingBalance?: number }) =>
    api.patch('/api/users/admin/vendor/balance', { sellerId, ...balanceData }),
  updateVendorStatus: (sellerId: string, statusData: { trustedSeller?: boolean; approvalStatus?: 'pending' | 'approved' | 'rejected' }) =>
    api.patch('/api/users/admin/vendor/status', { sellerId, ...statusData }),

  toggleUserActive: (userId: string, isActive: boolean) =>
    api.patch('/api/users/admin/toggle-active', { userId, isActive }),

  deleteUser: (id: string) => api.delete(`/api/users/admin/permanently-delete`, { data: { userId: id } }),
};

// Product Service (Merged & Optimized)
export const productService = {
  // Get products with filters / pagination
  getProducts: (params?: {
    page?: number;
    limit?: number;
    exclude?: string;
    category?: string;
    search?: string;
    sort?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
  }) => api.get("/api/products", { params }),

  // Create new product (supports FormData)
  createProduct: (productData: FormData | any) =>
    api.post("/api/products", productData, {
      headers: productData instanceof FormData
        ? { "Content-Type": "multipart/form-data" }
        : undefined,
    }),

  // Get product by ID
  getProductById: (id: string) => api.get(`/api/products/${id}`),

  // Update product (expects ID in payload body)
  updateProduct: (id: string, updates: Record<string, any>) =>
    api.patch(`/api/products/${id}`, updates),

  // Delete product
  deleteProduct: (id: string) => api.delete(`/api/products/${id}`),

  // Featured products
  getFeaturedProducts: () => api.get("/api/products/featured/product"),

  // New products
  getNewArrivals: () => api.get("/api/products/new/product"),

  // Admin All Products (with optional filters)
  getProductsForAdmin: (params?: any) =>
    api.get("/api/products/admin-products", { params }),

  // Seller products
  getSellerProducts: (params?: any) =>
    api.get("/api/products/seller/products", { params }),

  // Category products
  getProductsByCategory: (category: string) =>
    api.get(`/api/products/category/${category}`),

  // Approve product (Admin)
  approveProduct: (id: string | number) =>
    api.patch(`/api/products/approve`, { id }),

  // Reject product (Admin)
  rejectProduct: (id: string, reason: string) =>
    api.patch(`/api/products/reject`, { id, reason }),

  // Search products (independent search API)
  searchProducts: (query: string, params?: any) =>
    api.get("/api/search", {
      params: { q: query, ...params },
    }),

};

// Brand Services
export const brandService = {
  getBrands: (params?: { status?: 'active' | 'inactive'; }) =>
    api.get('/api/brands', { params }),

  getProductsByBrand: (brandId: string, params?: { limit?: number; page?: number; sort?: string; }) =>
    api.get(`/api/brands/${brandId}/products`, { params }),

  createBrand: (data: FormData | any) =>
    api.post('/api/brands', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    }),

  getBrandById: (id: string) => api.get(`/api/brands/${id}`),

  updateBrand: (id: string, data: FormData | any) =>
    api.put(`/api/brands/${id}`, data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    }),

  deleteBrand: (id: string) => api.delete(`/api/brands/${id}`),
};

// Category Services
export const categoryService = {
  getCategories: (params?: {
    status?: 'active' | 'inactive';
    includeProducts?: boolean;
  }) => api.get('/api/categories', { params }),

  getProductsByCategory: (categoryId: string, params?: {
    limit?: number;
    page?: number;
    sort?: string;
    minPrice?: number;
    maxPrice?: number;
  }) => api.get(`/api/categories/${categoryId}/products`, { params }),

  createCategory: (categoryData: FormData | any) =>
    api.post('/api/categories', categoryData, {
      headers: categoryData instanceof FormData ? {
        'Content-Type': 'multipart/form-data'
      } : undefined
    }),

  getCategoryById: (id: string) => api.get(`/api/categories/${id}`),

  updateCategory: (id: string, categoryData: FormData | any) =>
    api.put(`/api/categories/${id}`, categoryData, {
      headers: categoryData instanceof FormData ? {
        'Content-Type': 'multipart/form-data'
      } : undefined
    }),

  deleteCategory: (id: string) => api.delete(`/api/categories/${id}`),
};


// coupon services 
export const couponService = {
  // Get all coupons (admin only)
  getCoupons: () => api.get('/api/coupons'),

  // Get single coupon (admin only)
  getCoupon: (id: string) => api.get(`/api/coupons/${id}`),

  // Create coupon (admin only)
  createCoupon: (data: any) => api.post('/api/coupons', data),

  // Update coupon (admin only)
  updateCoupon: (id: string, data: any) => api.put(`/api/coupons/${id}`, data),

  // Delete coupon (admin only)
  deleteCoupon: (id: string) => api.delete(`/api/coupons/${id}`),

  // Validate coupon (public)
  validateCoupon: (code: string, cartTotal: number) =>
    api.post('/api/coupons/validate', { code, cartTotal }),

  // Remove coupon from order
  removeCouponFromCart: () =>
    api.delete(`/api/coupons/remove`),

  // Apply coupon to order
  applyCoupon: (orderId: string, code: string) =>
    api.post(`/api/orders/${orderId}/apply-coupon`, { code }),


  // Get coupon usage stats (admin only)
  getCouponStats: (couponId: string) =>
    api.get(`/api/coupons/${couponId}/stats`)
};

// Order Service 
export const orderService = {
  getOrders: (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => api.get("/api/orders", { params }),
  getUserOrders: () => api.get("/api/orders"),
  getSellerOrders: () => api.get("/api/orders/seller"),
  getAdminOrders: (params?: any) => api.get("/api/orders/admin/all", { params }),
  getOrderById: (id: string) => api.get(`/api/orders/${id}`),
  createOrder: (orderData: any) => api.post("/api/orders", orderData),
  updateOrder: (
    id: string,
    orderData: {
      status?: string;
      trackingNumber?: string;
    }
  ) => api.put(`/api/orders/${id}`, orderData),

  updateDeliveryStatus: (id: string, deliveryStatus: string) =>
    api.patch(`/api/orders/updateDelivery`, { id, deliveryStatus }),
  
  updatePaymentStatus: (orderId: string, status: string) =>
    api.patch(`/api/orders/update-payment`, {
      orderId,
      paymentStatus: status,
    }),
  confirmPreparation: (orderId: string) =>
    api.patch(`/api/orders/prepared/${orderId}`),
  confirmItemPreparation: (orderId: string, itemId: string) =>
    api.patch(`/api/orders/prepared/${orderId}/item/${itemId}`),
  printInvoice: (orderId: string) =>
    api.get(`/api/orders/${orderId}/invoice`),
  cancelOrder: (id: string) => api.patch(`/api/orders/${id}/cancel`),
  generateVerificationCode: (orderId: string | number) =>
    api.post(`/api/orders/${orderId}/verification-code`),

  verifyDelivery: (orderId: string | number, code: string) =>
    api.post(`/api/orders/${orderId}/verify`, { code }),

  toggleOrderStatus: (orderId: string, action: string) =>
    api.post(`/api/orders/toggleActivation`, { orderId, action }),


  orderComplete: (orderId: string, code: string) =>
    api.post(`/api/orders/complete`, { id: orderId, code }),

};

// Addresses Service 
export const addressService = {
  getAddresses: () => api.get('/api/addresses'),

  getAddress: (id: string) => api.get(`/api/addresses/${id}`),

  addAddress: (data: any) => api.post('/api/addresses', data),

  updateAddress: (id: string, data: any) => api.patch('/api/addresses', { id, ...data }),

  deleteAddress: (id: string) => api.delete('/api/addresses', { data: { id } }),

  setDefaultAddress: (id: string) => api.patch('/api/addresses/set-default', { id }),
};



// Cart Services
export const cartService = {
  getCart: () => api.get('/api/carts'),

  addToCart: (data: {
    productId: string;
    quantity: number;
    sizes?: string[];
    colors?: string[];
  }) => api.post('/api/carts', data),

  updateCartItem: (itemId: string, quantity: number) =>
    api.patch(`/api/carts/${itemId}`, { quantity }),

  getCartCount: () => api.get('/api/carts/count'),

  removeFromCart: (itemId: string) => api.delete(`/api/carts/${itemId}`),

  clearCart: () => api.delete('/api/carts'),
};

// Wishlist Services
export const wishlistService = {
  getWishlist: () => api.get('/api/wishlist'),
  getWishlistCount: () => api.get('/api/wishlist/count'),
  toggleWishlist: (productId: string) => api.post('/api/wishlist/toggle', { productId }),
  clearWishlist: () => api.delete('/api/wishlist'),
};

// Rating Services
export const ratingService = {
  createRating: (productId: string, payload: {
    rating: number;
    comment?: string;
  }) => api.post(`/api/products/${productId}/ratings`, payload),

  getProductRatings: (productId: string, params?: {
    page?: number;
    limit?: number;
  }) => api.get(`/api/products/${productId}/ratings`, { params }),

  updateRating: (productId: string, ratingId: string, payload: {
    rating?: number;
    comment?: string;
  }) => api.patch(`/api/products/${productId}/ratings/${ratingId}`, payload),

  deleteRating: (productId: string, ratingId: string) =>
    api.delete(`/api/products/${productId}/ratings/${ratingId}`),

  getUserRating: (productId: string) =>
    api.get(`/api/products/${productId}/ratings/user`),
};

// Announcement Services
export const announcementService = {
  getMainAnnouncements: () => api.get('/api/announcements/main'),

  getAnnouncements: () => api.get('/api/announcements'),

  getAnnouncementById: (id: string) => api.get(`/api/announcements/${id}`),

  getAllAnnouncementsForAdmin: () => api.get('/api/announcements/all'),

  createAnnouncement: (announcementData: {
    title: string;
    titleEn: string;
    content: string;
    contentEn: string;
    image?: string;
    isMain?: boolean;
    startDate: string | Date;
    endDate: string | Date;
    status?: 'active' | 'inactive';
    link?: string;
  }) => api.post('/api/announcements', announcementData),

  updateAnnouncement: (id: string, announcementData: {
    title?: string;
    content?: string;
    image?: string;
    isMain?: boolean;
    startDate?: string | Date;
    endDate?: string | Date;
    status?: 'active' | 'inactive';
    link?: string;
  }) => api.patch(`/api/announcements/${id}`, announcementData),

  deleteAnnouncement: (id: string) => api.delete(`/api/announcements/${id}`),
  toggleAnnouncementStatus: (id: string) => api.patch(`/api/announcements/${id}/toggle-status`)

};

// pickup point service
export const pickupPointService = {
  getPickupPoints: () => api.get("/api/pickup"),
  createPickupPoint: (pickupPoint: any) => api.post("/api/pickup", pickupPoint),
  updatePickupPoint: (id: string, pickupPoint: any) => api.put(`/api/pickup/${id}`, pickupPoint),
  deletePickupPoint: (id: string) => api.delete(`/api/pickup/${id}`),
};
// return services
export const returnService = {
  createReturnRequest: (returnData: { orderId: string; itemId: string; reason: string }) =>
    api.post('/api/returns', returnData),
  getReturnRequests: (params?: any) => api.get('/api/returns', { params }),
  getReturnRequestById: (id: string) => api.get(`/api/returns/${id}`),
  getReturnRequestsForAdmin: (params?: any) => api.get('/api/returns/admin', { params }),

  updateReturnRequest: (returnData: { returnId: string; status: string }) =>
    api.patch(`/api/returns`, returnData),

  deleteReturnRequest: (returnId: string) => api.delete('/api/returns', {
    data: { id: returnId }
  }),
};

// Add to your existing services in api.ts
export const platformEarningsService = {
  getSummary: () => api.get('/api/platform-earnings/admin/summary'),
  getMonthlyEarnings: (year?: number) => {
    const params = year ? { year } : {};
    return api.get('/api/platform-earnings/admin/monthly', { params });
  },
  getEarningsBySeller: (sellerId?: string) => {
    const params = sellerId ? { sellerId } : {};
    return api.get('/api/platform-earnings/admin/sellers', { params });
  }
};
// Seller Dashboard Services
export const paymentService = {
  // Fetch available payment methods (CARD, VODAFONE_CASH, WALLET, INSTAPAY, etc.)
  getPaymentMethods: () => api.get('/api/payments/methods'),
  // Create a Paymob payment session for the given order and method
  createPaymentSession: (payload: { orderId: string; amount?: number; paymentMethod?: string; walletPhone?: string }) =>
    api.post('/api/payments/create-session', payload),
};

export const sellerDashboardService = {
  getCounters: () => api.get('/api/dashboard/seller/counters'),
  getAnalytics: () => api.get('/api/analytics/seller'),
  getTransactions: (params?: any) => api.get('/api/transactions/seller', { params }),
  getOrderActivity: (orderId: string | number, params?: any) => api.get(`/api/orders/${orderId}/activity`, { params }),
};

export const adminDashboardService = {
  getCounters: () => api.get('/api/dashboard/admin/counters'),
  getAnalytics: () => api.get('/api/analytics/admin'),
  getTransactions: (params?: any) => api.get('/api/transactions/admin', { params }),
};
// Complaint Services
export const complaintService = {
  createComplaint: (data: any) => {
    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      return api.post('/api/complaints', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post('/api/complaints', data); // JSON
  },
  // Get all complaints for the current user
  getMyComplaints: (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => api.get('/api/complaints/user', { params }),
  // Get all complaints for admin
  getAllComplaintsAdmin: (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => api.get('/api/complaints/admin', { params }),
  // Get all complaints (legacy endpoint)
  getAllComplaints: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    userId?: string;
    orderId?: string;
    search?: string;
    sort?: string;
  }) => api.get('/api/complaints', { params }),
  // Get a single complaint by ID
  getComplaintById: (id: string) => api.get(`/api/complaints/${id}`),
  // Update complaint status (admin only)
  updateComplaintStatus: (id: string, status: 'open' | 'in_progress' | 'resolved') =>
    api.patch(`/api/complaints/status`, { status, id }),
  // Add admin reply to complaint
  addAdminReply: (id: string, adminReply: string) =>
    api.post(`/api/complaints/reply`, { adminReply, id }),
  // Delete a complaint (user can delete if not resolved)
  deleteComplaint: (id: string) => api.delete('/api/complaints', { data: { id } }),
  // Get complaint statistics (admin only)
  getComplaintStats: () => api.get('/api/complaints/stats'),
  // Get unresolved complaints count (admin only)
  getUnresolvedCount: () => api.get('/api/complaints/unresolved-count'),
};
// Export all services
export const apiServices = {
  api,
  authService,
  userService,
  productService,
  categoryService,
  orderService,
  cartService,
  wishlistService,
  ratingService,
  announcementService,
  pickupPointService,
  returnService,
  platformEarningsService,
  sellerDashboardService,
  adminDashboardService,
  complaintService
};

export default apiServices;
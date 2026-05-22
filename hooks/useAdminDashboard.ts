import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/language-provider";
import { toast } from "sonner";
import { AxiosResponse } from "axios";
import { useAuth } from "@/contexts/AuthProvider";
import {
    categoryService,
    productService,
    pickupPointService,
    announcementService,
    brandService,
    couponService,
    returnService,
    userService,
    orderService,
    platformEarningsService,
    adminDashboardService,
    complaintService,
} from "@/lib/api";

type TransactionFilters = {
    type: "all" | "credit" | "debit";
    sellerId: string;
};

type DashboardCounters = {
    totalUsers: number;
    totalSellers: number;
    totalOrders: number;
    pendingOrders: number;
    totalProducts: number;
    pendingProducts: number;
    totalRevenue: number;
    totalDiscounts: number;
    totalCommissions: number;
    totalProfits: number;
};

type AdminAnalyticsData = {
    ordersPerDay: Array<{ _id: string; count: number }>;
    topSellingProducts: Array<{ _id: string; title: string; sold: number; ratingsAverage?: number; seller?: { firstName?: string; lastName?: string } }>;
    highestRatedProducts: Array<{ _id: string; title: string; ratingsAverage: number; sold?: number; seller?: { firstName?: string; lastName?: string } }>;
    avgPreparationTime: number;
    satisfactionScore: number;
};

type CouponFormData = {
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minPurchaseAmount: number;
    maxDiscountAmount?: number;
    maxUses: number;
    validFrom: string;
    validUntil: string;
    isActive: boolean;
};

export function useAdminDashboard() {
    const router = useRouter();
    const { language, t } = useLanguage();
    const isArabic = language === "ar";
    const { user } = useAuth();

    // State management
    const [activeTab, setActiveTab] = useState("overview");
    const [products, setProducts] = useState<any[]>([]);
    const [productsPage, setProductsPage] = useState(1);
    const [productsPages, setProductsPages] = useState(1);
    const PRODUCTS_LIMIT = 25;
    const [coupons, setCoupons] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadingCoupon, setLoadingCoupon] = useState(true);
    const [errorProducts, setErrorProducts] = useState<string | null>(null);
    const [errorCoupons, setErrorCoupons] = useState<string | null>(null);
    const [categories, setCategories] = useState([]);
    // Brands state
    const [brands, setBrands] = useState<any[]>([]);
    const [loadingBrands, setLoadingBrands] = useState(false);
    const [errorBrands, setErrorBrands] = useState<string | null>(null);
    // Brand form states
    const [newBrand, setNewBrand] = useState({ name: "", description: "", image: "", status: "active" });
    const [isCreatingBrand, setIsCreatingBrand] = useState(false);
    const [editingBrand, setEditingBrand] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [announcementImage, setAnnouncementImage] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [orders, setOrders] = useState<any[]>([]);
    const [ordersPage, setOrdersPage] = useState(1);
    const [ordersPages, setOrdersPages] = useState(1);
    const ORDERS_LIMIT = 25;
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [errorOrders, setErrorOrders] = useState<string | null>(null);
    const [pickupPoints, setPickupPoints] = useState<any[]>([]);
    const [sellers, setSellers] = useState<any[]>([]);
    const [sellersPage, setSellersPage] = useState(1);
    const [sellersPages, setSellersPages] = useState(1);
    const SELLERS_LIMIT = 20;
    const [users, setUsers] = useState<any[]>([]);
    const [usersPage, setUsersPage] = useState(1);
    const [usersPages, setUsersPages] = useState(1);
    const USERS_LIMIT = 20;
    // User management loading flags
    const [updatingUser, setUpdatingUser] = useState<string | null>(null);
    const [loadingPickupPoints, setLoadingPickupPoints] = useState(true);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
    const [errorAnnouncements, setErrorAnnouncements] = useState<string | null>(null);
    const [returnRequests, setReturnRequests] = useState<any[]>([]);
    // Complaints state
    const [complaints, setComplaints] = useState<any[]>([]);
    const [loadingComplaints, setLoadingComplaints] = useState(false);
    const [complaintsPage, setComplaintsPage] = useState(1);
    const [complaintsPages, setComplaintsPages] = useState(1);
    const COMPLAINTS_LIMIT = 10;
    const [errorComplaints, setErrorComplaints] = useState<string | null>(null);
    const [returnsPage, setReturnsPage] = useState(1);
    const [returnsPages, setReturnsPages] = useState(1);
    const RETURNS_LIMIT = 10;
    const [loadingReturns, setLoadingReturns] = useState(false);
    const [errorReturns, setErrorReturns] = useState<string | null>(null);

    // Form states
    const [newCategory, setNewCategory] = useState({
        name: "",
        description: "",
        image: "",
        status: "active",
    });
    const [platformEarnings, setPlatformEarnings] = useState<any>(null);
    const [loadingEarnings, setLoadingEarnings] = useState(false);
    const [errorEarnings, setErrorEarnings] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [showSpinner, setShowSpinner] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [showAddPickupPoint, setShowAddPickupPoint] = useState(false);
    const [selectedPickupPoint, setSelectedPickupPoint] = useState<any>(null);
    const [showAddAnnouncement, setShowAddAnnouncement] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);

    // Coupon form state
    const [showAddCoupon, setShowAddCoupon] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<any>(null);
    const [newCoupon, setNewCoupon] = useState<CouponFormData>({
        code: "",
        discountType: "percentage",
        discountValue: 10,
        minPurchaseAmount: 0,
        maxDiscountAmount: undefined,
        maxUses: 100,
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isActive: true,
    });

    const [newAnnouncement, setNewAnnouncement] = useState({
        title: '',
        titleEn: '',
        content: '',
        contentEn: '',
        image: '',
        link: '',
        isMain: '',
        status: 'active',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });

    const [dashboardCounters, setDashboardCounters] = useState<DashboardCounters | null>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [transactionsLoading, setTransactionsLoading] = useState(false);
    const [transactionFilters, setTransactionFilters] = useState<TransactionFilters>({
        type: "all",
        sellerId: "all"
    });
    const [transactionsPage, setTransactionsPage] = useState(1);
    const [transactionsPages, setTransactionsPages] = useState(1);

    // Admin transactions fetching
    const fetchAdminTransactions = async () => {
        try {
            setTransactionsLoading(true);
            const TRANSACTIONS_LIMIT = 20;
            const params: any = { page: transactionsPage, limit: TRANSACTIONS_LIMIT };
            if (transactionFilters.type !== 'all') params.type = transactionFilters.type;
            if (transactionFilters.sellerId !== 'all') params.sellerId = transactionFilters.sellerId;
            const res = await adminDashboardService.getTransactions(params);
            if (res.data) {
                if (res.data.transactions) {
                    setTransactions(res.data.transactions);
                } else if (res.data.data) {
                    setTransactions(res.data.data);
                } else {
                    setTransactions(res.data);
                }
                if (res.data.pagination) {
                    setTransactionsPage(res.data.pagination.currentPage);
                    setTransactionsPages(res.data.pagination.totalPages);
                } else if (res.data.pages) {
                    setTransactionsPages(res.data.pages);
                }
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || (isArabic ? 'فشل جلب المعاملات' : 'Failed to fetch transactions'));
        } finally {
            setTransactionsLoading(false);
        }
    };

    // Platform earnings fetching
    const fetchPlatformEarnings = async () => {
        try {
            setLoadingEarnings(true);
            const res = await platformEarningsService.getSummary();
            setPlatformEarnings(res.data);
        } catch (err: any) {
            setErrorEarnings(err?.response?.data?.message || 'Failed to fetch platform earnings');
        } finally {
            setLoadingEarnings(false);
        }
    };

    // Dashboard counters fetching
    const fetchDashboardCounters = async () => {
        try {
            const res = await adminDashboardService.getCounters();
            setDashboardCounters(res.data?.data || res.data);
        } catch (err) {
            console.error('Failed to fetch dashboard counters', err);
        }
    };
    const [analytics, setAnalytics] = useState<AdminAnalyticsData | null>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [analyticsError, setAnalyticsError] = useState<string | null>(null);

    // Admin analytics fetching
    const fetchAdminAnalytics = async () => {
        try {
            setAnalyticsLoading(true);
            const res = await adminDashboardService.getAnalytics();
            setAnalytics(res.data);
        } catch (err: any) {
            setAnalyticsError(err?.response?.data?.message || 'Failed to fetch analytics');
            toast.error(err?.response?.data?.message || (isArabic ? 'فشل جلب التحليلات' : 'Failed to fetch analytics'));
        } finally {
            setAnalyticsLoading(false);
        }
    };

    // Authentication check based on global AuthProvider user
    useEffect(() => {
        if (user === null) {
            return;
        }

        if (user) {
            //console.log(user, 'IM USER');
            setIsAuthenticated(true);

            const userIsAdmin = ["admin", "super_admin"].includes((user as any).role);
            setIsAdmin(userIsAdmin);

            // Use the variable directly instead of the state
            //console.log(user?.role, 'THE ROLE');
            //console.log(userIsAdmin, 'IS ADMIN - DIRECT VALUE');

            // If you need to perform actions based on admin status, use userIsAdmin
            if (!userIsAdmin) {
                toast.error(isArabic ? "غير مسموح بالدخول" : "Access denied");
                // router.push("/");
            }
        }
    }, [user, isArabic, router]);
    // Brand CRUD
    const handleDeleteBrand = async (id: string) => {
        if (!confirm(isArabic ? 'حذف هذه الماركة؟' : 'Delete this brand?')) return;
        try {
            await brandService.deleteBrand(id);
            setBrands(prev => prev.filter(b => b._id !== id));
            toast.success(isArabic ? 'تم الحذف' : 'Deleted');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Error');
        }
    };

    // Brand fetching
    const fetchBrands = async () => {
        try {
            setLoadingBrands(true);
            const res = await brandService.getBrands();
            setBrands(res.data);
        } catch (err: any) {
            setErrorBrands(err?.response?.data?.message || 'Failed to fetch brands');
        } finally {
            setLoadingBrands(false);
        }
    };

    // Category fetching based on active tab
    useEffect(() => {
        if (isAuthenticated && isAdmin) {
            fetchInitialData();
        }
    }, [isAuthenticated, isAdmin]);

    useEffect(() => { fetchCategories(); fetchBrands(); }, []);

    // Refetch sellers when page changes
    useEffect(() => {
        fetchSellers();
    }, [sellersPage]);

    // Data fetching based on active tab
    useEffect(() => {
        if (isAuthenticated && isAdmin) {
            switch (activeTab) {
                case 'overview':
                    fetchPlatformEarnings();
                    fetchDashboardCounters();
                    break;
                case 'complaints':
                    fetchComplaints();
                    break;
                case 'returns':
                    fetchReturnRequests();
                    break;
                case 'products':
                    fetchProducts();
                    break;
                case 'orders':
                    fetchOrders();
                    break;
                case 'announcements':
                    fetchAnnouncements();
                    break;
                case 'pickup':
                    fetchPickupPoints();
                    break;
                case 'coupons':
                    fetchCoupons();
                    break;
                case 'analytics':
                    if (!analytics) {
                        fetchAdminAnalytics();
                    }
                    break;
                default:
                    break;
            }
        }
    }, [activeTab, isAuthenticated, isAdmin]);

    // refetch returns when page changes
    useEffect(() => {
        fetchReturnRequests();
    }, [returnsPage]);

    // refetch users on page change
    useEffect(() => {
        fetchUsers();
    }, [usersPage]);

    // refetch transactions when page changes
    useEffect(() => {
        fetchAdminTransactions();
    }, [transactionsPage]);

    const fetchInitialData = async () => {
        await Promise.all([
            fetchOrders(),
            fetchCategories(),
            fetchBrands(),
            fetchProducts(),
            fetchPickupPoints(),
            fetchAnnouncements(),
            fetchSellers(),
            fetchUsers(),
            fetchCoupons(),
            fetchPlatformEarnings(),
            fetchDashboardCounters()
        ]);
    };

    // Complaints operations
    const fetchComplaints = async () => {
        try {
            setLoadingComplaints(true);
            setErrorComplaints(null);
            const res = await complaintService.getAllComplaintsAdmin({ page: complaintsPage, limit: 20 });
            setComplaints(res.data?.data || []);
        } catch (error: any) {
            const msg = error.response?.data?.message || (isArabic ? "فشل جلب الشكاوى" : "Failed to fetch complaints");
            setErrorComplaints(msg);
            toast.error(msg);
        } finally {
            setLoadingComplaints(false);
        }
    };

    // User management handlers
    const handleDeleteUser = async (id: string) => {
        if (!confirm(isArabic ? 'حذف المستخدم نهائياً؟' : 'Permanently delete user?')) return;
        try {
            setUpdatingUser(id);
            await userService.deleteUser(id);
            setUsers((prev) => prev.filter((u) => u._id !== id));
            setSellers((prev) => prev.filter((u) => u._id !== id));
            toast.success(isArabic ? 'تم الحذف' : 'Deleted');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Error');
        } finally {
            setUpdatingUser(null);
        }
    };
 


    const handleRestoreUser = async (id: string) => {
        try {
            setUpdatingUser(id);
            await userService.restoreUser(id);
            setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, isActive: true, isDeleted: false } : u)));
            setSellers((prev) => prev.map((u) => (u._id === id ? { ...u, isActive: true, isDeleted: false } : u)));
            toast.success(isArabic ? 'تم الاستعادة' : 'Restored');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Error');
        } finally {
            setUpdatingUser(null);
        }
    };

    // Return requests operations
    const fetchReturnRequests = async () => {
        try {
            setLoadingReturns(true);
            setErrorReturns(null);
            const response = await returnService.getReturnRequestsForAdmin({ page: returnsPage, limit: RETURNS_LIMIT });
            if (response.data?.data) {
                setReturnRequests(response.data.data);
            } else {
                setReturnRequests(response.data);
            }
            if (response.data?.pagination) {
                setReturnsPage(response.data.pagination.currentPage);
                setReturnsPages(response.data.pagination.totalPages);
            }
        } catch (error: any) {
            setErrorReturns(error.response?.data?.message || (isArabic ? "فشل جلب طلبات الإرجاع" : "Failed to fetch return requests"));
            toast.error(isArabic ? "فشل جلب طلبات الإرجاع" : "Failed to fetch return requests");
        } finally {
            setLoadingReturns(false);
        }
    };

    const handleApproveReturn = async (returnId: string) => {
        if (!confirm(isArabic ? "هل تريد الموافقة على طلب الإرجاع؟" : "Are you sure you want to approve this return request?")) {
            return;
        }

        try {
            const response = await returnService.updateReturnRequest({
                returnId,
                status: 'approved'
            });

            if (response.status === 200) {
                setReturnRequests(prev =>
                    prev.map(request =>
                        request._id === returnId
                            ? { ...request, status: 'approved' }
                            : request
                    )
                );
                toast.success(isArabic ? "تمت الموافقة على طلب الإرجاع" : "Return request approved successfully");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || (isArabic ? "حدث خطأ أثناء الموافقة على طلب الإرجاع" : "Error approving return request"));
        }
    };

    const handleRejectReturn = async (returnId: string) => {
        if (!confirm(isArabic ? "هل تريد رفض طلب الإرجاع؟" : "Are you sure you want to reject this return request?")) {
            return;
        }

        try {
            const response = await returnService.updateReturnRequest({
                returnId,
                status: 'rejected'
            });

            if (response.status === 200) {
                setReturnRequests(prev =>
                    prev.map(request =>
                        request._id === returnId
                            ? { ...request, status: 'rejected' }
                            : request
                    )
                );
                toast.success(isArabic ? "تم رفض طلب الإرجاع" : "Return request rejected successfully");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || (isArabic ? "حدث خطأ أثناء رفض طلب الإرجاع" : "Error rejecting return request"));
        }
    };

    const handleProcessReturn = async (returnId: string) => {
        if (!confirm(isArabic ? "هل تريد معالجة طلب الإرجاع؟" : "Are you sure you want to process this return request?")) {
            return;
        }

        try {
            const response = await returnService.updateReturnRequest({
                returnId,
                status: 'processing'
            });

            if (response.status === 200) {
                setReturnRequests(prev =>
                    prev.map(request =>
                        request._id === returnId
                            ? { ...request, status: 'finished' }
                            : request
                    )
                );
                toast.success(isArabic ? "تمت معالجة طلب الإرجاع" : "Return request finished successfully");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || (isArabic ? "حدث خطأ أثناء معالجة طلب الإرجاع" : "Error processing return request"));
        }
    };
    const handleFinishedReturn = async (returnId: string) => {
        if (!confirm(isArabic ? "هل تريد  انهاء طلب الإرجاع؟" : "Are you sure you want to process this return request?")) {
            return;
        }

        try {
            const response = await returnService.updateReturnRequest({
                returnId,
                status: 'processed'
            });

            if (response.status === 200) {
                setReturnRequests(prev =>
                    prev.map(request =>
                        request._id === returnId
                            ? { ...request, status: 'finished' }
                            : request
                    )
                );
                toast.success(isArabic ? "تمت معالجة طلب الإرجاع" : "Return request finished successfully");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || (isArabic ? "حدث خطأ أثناء معالجة طلب الإرجاع" : "Error processing return request"));
        }
    };

    const handleDeleteReturn = async (returnId: string) => {
        if (!confirm(isArabic ? "هل تريد حذف طلب الإرجاع؟" : "Are you sure you want to delete this return request?")) {
            return;
        }

        try {
            const response = await returnService.deleteReturnRequest(returnId);

            if (response.status === 200) {
                setReturnRequests(prev => prev.filter(request => request._id !== returnId));
                toast.success(isArabic ? "تم حذف طلب الإرجاع" : "Return request deleted successfully");
            }
        } catch (error: any) {
            //console.log(error, 'the error')
            toast.error(error.response?.data?.message || (isArabic ? "حدث خطأ أثناء حذف طلب الإرجاع" : "Error deleting return request"));
        }
    };

    // Fetch products list with pagination
    const fetchProducts = async () => {
        try {
            setLoadingProducts(true);
            const response = await productService.getProductsForAdmin({ page: productsPage, limit: PRODUCTS_LIMIT });
            const data = response.data;
            if (data?.products) {
                setProducts(data.products);
            } else {
                setProducts([]);
            }
            if (data?.pagination) {
                setProductsPage(data.pagination.currentPage);
                setProductsPages(data.pagination.totalPages);
            }
        } catch (error: any) {
            setErrorProducts(error.message || (isArabic ? "فشل جلب المنتجات" : "Failed to fetch products"));
        } finally {
            setLoadingProducts(false);
        }
    };

    // Refetch products when page changes
    useEffect(() => {
        fetchProducts();
    }, [productsPage]);

    // fetch coupons
    const fetchCoupons = async () => {
        try {
            setLoadingCoupon(true);
            const response = await couponService.getCoupons();
            //console.log(response.data, 'coupons')
            setCoupons(response.data || []);
        } catch (error: any) {
            setErrorCoupons(error.message || (isArabic ? "فشل جلب كوبونات الخصم" : "Failed to fetch coupons"));
        } finally {
            setLoadingCoupon(false);
        }
    };

    // Create new coupon
    const handleCreateCoupon = async () => {
        try {
            // Validate required fields
            if (!newCoupon.code.trim()) {
                toast.error(isArabic ? "كود الكوبون مطلوب" : "Coupon code is required");
                return;
            }

            if (newCoupon.discountValue <= 0) {
                toast.error(isArabic ? "قيمة الخصم يجب أن تكون أكبر من صفر" : "Discount value must be greater than zero");
                return;
            }

            if (newCoupon.maxUses <= 0) {
                toast.error(isArabic ? "الحد الأقصى للاستخدامات يجب أن يكون أكبر من صفر" : "Maximum uses must be greater than zero");
                return;
            }

            if (new Date(newCoupon.validUntil) <= new Date(newCoupon.validFrom)) {
                toast.error(isArabic ? "تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء" : "End date must be after start date");
                return;
            }

            const response = await couponService.createCoupon(newCoupon);
            //console.log('Coupon created:', response.data);

            // Add the new coupon to the list
            setCoupons(prev => [response.data, ...prev]);

            // Reset form and close modal
            setNewCoupon({
                code: "",
                discountType: "percentage",
                discountValue: 10,
                minPurchaseAmount: 0,
                maxDiscountAmount: undefined,
                maxUses: 100,
                validFrom: new Date().toISOString().split('T')[0],
                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                isActive: true,
            });
            setShowAddCoupon(false);

            toast.success(isArabic ? "تم إنشاء الكوبون بنجاح" : "Coupon created successfully");
        } catch (error: any) {
            console.error('Error creating coupon:', error);
            toast.error(
                error.response?.data?.message ||
                (isArabic ? "حدث خطأ أثناء إنشاء الكوبون" : "Error creating coupon")
            );
        }
    };

    // Update existing coupon
    const handleUpdateCoupon = async () => {
        if (!editingCoupon) return;

        try {
            // Validate required fields
            if (!editingCoupon.code.trim()) {
                toast.error(isArabic ? "كود الكوبون مطلوب" : "Coupon code is required");
                return;
            }

            if (editingCoupon.discountValue <= 0) {
                toast.error(isArabic ? "قيمة الخصم يجب أن تكون أكبر من صفر" : "Discount value must be greater than zero");
                return;
            }

            if (editingCoupon.maxUses <= 0) {
                toast.error(isArabic ? "الحد الأقصى للاستخدامات يجب أن يكون أكبر من صفر" : "Maximum uses must be greater than zero");
                return;
            }

            if (new Date(editingCoupon.validUntil) <= new Date(editingCoupon.validFrom)) {
                toast.error(isArabic ? "تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء" : "End date must be after start date");
                return;
            }

            const response = await couponService.updateCoupon(editingCoupon._id, editingCoupon);
            //console.log('Coupon updated:', response.data);

            // Update the coupon in the list
            setCoupons(prev =>
                prev.map(coupon =>
                    coupon._id === editingCoupon._id ? response.data : coupon
                )
            );

            // Reset editing state
            setEditingCoupon(null);
            setShowAddCoupon(false);

            toast.success(isArabic ? "تم تحديث الكوبون بنجاح" : "Coupon updated successfully");
        } catch (error: any) {
            console.error('Error updating coupon:', error);
            toast.error(
                error.response?.data?.message ||
                (isArabic ? "حدث خطأ أثناء تحديث الكوبون" : "Error updating coupon")
            );
        }
    };

    // Get single coupon details
    const handleGetCoupon = async (couponId: string) => {
        try {
            const response = await couponService.getCoupon(couponId);
            return response.data;
        } catch (error: any) {
            console.error('Error fetching coupon:', error);
            toast.error(
                error.response?.data?.message ||
                (isArabic ? "حدث خطأ أثناء جلب تفاصيل الكوبون" : "Error fetching coupon details")
            );
            return null;
        }
    };

    // Get coupon statistics
    const handleGetCouponStats = async (couponId: string) => {
        try {
            const response = await couponService.getCouponStats(couponId);
            return response.data;
        } catch (error: any) {
            console.error('Error fetching coupon stats:', error);
            toast.error(
                error.response?.data?.message ||
                (isArabic ? "حدث خطأ أثناء جلب إحصائيات الكوبون" : "Error fetching coupon statistics")
            );
            return null;
        }
    };

    // Toggle coupon active status
    const handleToggleCouponStatus = async (id: string, isActive: boolean) => {
        try {
            const response = await couponService.updateCoupon(id, { isActive });
            setCoupons(prev => prev.map(c => (c._id === id ? response.data : c)));
            toast.success(isArabic ? (isActive ? "تم تفعيل الكوبون" : "تم إلغاء تفعيل الكوبون") : (isActive ? "Coupon activated" : "Coupon deactivated"));
        } catch (error: any) {
            console.error('Error toggling coupon status', error);
            toast.error(error?.response?.data?.message || (isArabic ? "حدث خطأ أثناء تحديث حالة الكوبون" : "Error toggling coupon status"));
        }
    }; 

    // delete coupon 
    const handleDeleteCoupon = async (id: string) => {
        if (!confirm(isArabic ? "هل أنت متأكد من حذف هذا الكوبون" : "Are you sure you want to delete this coupon?")) {
            return;
        }
        try {
            //console.log('Deleting coupon with ID:', id);
            //console.log('Current coupons before deletion:', coupons);

            await couponService.deleteCoupon(id);

            // Update the state by filtering out the deleted coupon
            const updatedCoupons = coupons.filter(coupon => coupon._id !== id);
            //console.log('Updated coupons after deletion:', updatedCoupons);

            setCoupons(updatedCoupons);
            toast.success(isArabic ? "تم حذف الكوبون بنجاح" : "Coupon deleted successfully");
        } catch (error) {
            console.error('Error deleting coupon:', error);
            toast.error(isArabic ? "حدث خطأ أثناء حذف الكوبون" : "Error deleting coupon");
        }
    };

    // Handle coupon form input change
    const handleCouponInputChange = (field: keyof CouponFormData, value: any) => {
        if (editingCoupon) {
            setEditingCoupon(prev => ({ ...prev, [field]: value }));
        } else {
            setNewCoupon(prev => ({ ...prev, [field]: value }));
        }
    };

    // Open coupon form for editing
    const handleEditCoupon = (coupon: any) => {
        setEditingCoupon(coupon);
        setShowAddCoupon(true);
    };

    // Open coupon form for creation
    const handleAddCoupon = () => {
        setEditingCoupon(null);
        setShowAddCoupon(true);
    };

    // Close coupon form
    const handleCloseCouponForm = () => {
        setShowAddCoupon(false);
        setEditingCoupon(null);
        setNewCoupon({
            code: "",
            discountType: "percentage",
            discountValue: 10,
            minPurchaseAmount: 0,
            maxDiscountAmount: undefined,
            maxUses: 100,
            validFrom: new Date().toISOString().split('T')[0],
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            isActive: true,
        });
    };

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await categoryService.getCategories();
            setCategories(response.data);
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to fetch categories');
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        try {
            setLoadingOrders(true);
            const response = await orderService.getAdminOrders({ page: ordersPage, limit: ORDERS_LIMIT });
            //console.log(response,'admin order')
            if (response.data?.orders) {
                setOrders(response.data.orders);
            } else {
                setOrders(response.data);
            }
            if (response.data?.pagination) {
                setOrdersPage(response.data.pagination.currentPage);
                setOrdersPages(response.data.pagination.totalPages);
            }
        } catch (error: any) {
            setErrorOrders(error.response?.data?.message || 'Failed to fetch orders');
        } finally {
            setLoadingOrders(false);
        }
    };

    // Refetch orders when page changes
    useEffect(() => {
        fetchOrders();
    }, [ordersPage]);

    const updateDeliveryStatus = async (orderId: string, deliveryStatus: string) => {
        try {
            await orderService.updateDeliveryStatus(orderId, deliveryStatus);
            setOrders(prev =>
                prev.map(order =>
                    order._id === orderId ? { ...order, deliveryStatus } : order
                )
            );
            toast.success(isArabic ? 'تم تحديث حالة التوصيل بنجاح' : 'Delivery status updated successfully');
        } catch (error: any) {
            toast.error(error.response?.data?.message || (isArabic ? 'حدث خطأ أثناء تحديث حالة التوصيل' : 'Failed to update delivery status'));
        }
    };

    const orderComplete = async (orderId: string, code: string) => {
        try {
            await orderService.orderComplete(orderId, code);
            setOrders(prev =>
                prev.map(order =>
                    order._id === orderId
                        ? { ...order, deliveryStatus: 'delivered', paymentStatus: 'paid' }
                        : order
                )
            );
            toast.success(isArabic ? 'تم إكمال الطلب بنجاح' : 'Order completed successfully');
        } catch (error: any) {
            toast.error(error.response?.data?.message || (isArabic ? 'حدث خطأ أثناء إكمال الطلب' : 'Failed to complete order'));
        }
    };

    const updatePaymentStatus = async (orderId: string, status: string) => {
        try {
            await orderService.updatePaymentStatus(orderId, status);

            setOrders(prev =>
                prev.map(order =>
                    order._id === orderId
                        ? { ...order, paymentStatus: status }
                        : order
                )
            );

            toast.success(
                isArabic
                    ? 'تم تحديث حالة الدفع بنجاح'
                    : 'Payment status updated successfully'
            );
        } catch (error: any) {
            toast.error(
                error.response?.data?.message ||
                (isArabic
                    ? 'حدث خطأ أثناء تحديث حالة الدفع'
                    : 'Failed to update payment status')
            );
        }
    };
    const fetchPickupPoints = async () => {
        try {
            setLoadingPickupPoints(true);
            const response = await pickupPointService.getPickupPoints();
            setPickupPoints(response.data);
        } catch (error: any) {
            console.error('Error fetching pickup points:', error);
        } finally {
            setLoadingPickupPoints(false);
        }
    };

    const fetchAnnouncements = async () => {
        try {
            setLoadingAnnouncements(true);
            const response = await announcementService.getAllAnnouncementsForAdmin();
            setAnnouncements(response.data);
        } catch (error: any) {
            setErrorAnnouncements(error.response?.data?.message || 'Failed to fetch announcements');
        } finally {
            setLoadingAnnouncements(false);
        }
    };

    const fetchSellers = async () => {
        try {
            const response = await userService.getSellerForAdmin({ page: sellersPage, limit: SELLERS_LIMIT });
            if (response.data?.sellers) {
                setSellers(response.data.sellers);
            } else {
                setSellers(response.data);
            }
            if (response.data?.pagination) {
                setSellersPage(response.data.pagination.currentPage);
                setSellersPages(response.data.pagination.totalPages);
            }
        } catch (error: any) {
            console.error('Error fetching sellers:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await userService.getUserForAdmin({ page: usersPage, limit: USERS_LIMIT });
            if (response.data?.users) {
                setUsers(response.data.users);
            } else {
                setUsers(response.data);
            }
            if (response.data?.pagination) {
                setUsersPage(response.data.pagination.currentPage);
                setUsersPages(response.data.pagination.totalPages);
            }
        } catch (error: any) {
            console.error('Error fetching users:', error);
        }
    };

    // Category operations (existing)
    const handleCreateCategory = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!newCategory.name.trim()) {
            toast.error(isArabic ? "الاسم  مطلوب" : "Name in Arabic and English is required");
            return;
        }

        try {
            setShowSpinner(true);
            setIsCreating(true);
            const response = await categoryService.createCategory(newCategory);
            setCategories(prev => [...prev, response.data]);
            setNewCategory({
                name: "",
                description: "",
                image: "",
                status: "active",
            });
            toast.success(isArabic ? "تم إنشاء التصنيف بنجاح" : "Category created successfully");
        } catch (err: any) {
            toast.error(err.response?.data?.message || isArabic ? "حدث خطأ أثناء إنشاء التصنيف" : "Error creating category");
        } finally {
            setIsCreating(false);
            setShowSpinner(false);
        }
    };

    const handleEditCategory = async (category: any) => {
        try {
            const response = await categoryService.updateCategory(category._id, category);
            setCategories(categories.map((c: any) => (c._id === category._id ? response.data : c)));
            setEditingCategory(null);
            toast.success(isArabic ? "تم تحديث التصنيف بنجاح" : "Category updated successfully");
        } catch (err) {
            toast.error(isArabic ? "حدث خطأ أثناء تحديث التصنيف" : "Error updating category");
        }
    };

    const handleDeleteCategory = async (categoryId: string) => {
        if (!confirm(isArabic ? "هل أنت متأكد من حذف هذا التصنيف؟" : "Are you sure you want to delete this category?")) {
            return;
        }
        try {
            await categoryService.deleteCategory(categoryId);
            setCategories(categories.filter((c: any) => c._id !== categoryId));
            toast.success(isArabic ? "تم حذف التصنيف بنجاح" : "Category deleted successfully");
        } catch (err) {
            toast.error(isArabic ? "حدث خطأ أثناء حذف التصنيف" : "Error deleting category");
        }
    };

    // Product operations (existing)
    const handleApproveProduct = async (productId: string) => {
        try {
            const response = await productService.approveProduct(productId);
            if (response.status === 200) {
                setProducts(products.map((p: any) => (p._id === productId ? { ...p, isApproved: true } : p)));
                toast.success(isArabic ? "تم الموافقة على المنتج" : "Product approved successfully");
            }
        } catch (err: any) {
            toast.error(err.message || (isArabic ? "حدث خطأ أثناء الموافقة على المنتج" : "Error approving product"));
        }
    };

    // Reject product
    const handleRejectProduct = async (productId: string, sellerId: string, title: string, reason: string) => {
        if (!reason) return;
        try {
            const response = await productService.rejectProduct(productId, reason);
            if (response.status === 200) {
                setProducts(prev => prev.filter((p: any) => p._id !== productId));
                toast.success(isArabic ? "تم رفض المنتج" : "Product rejected successfully");
            }
        } catch (err: any) {
            toast.error(err.message || (isArabic ? "حدث خطأ أثناء رفض المنتج" : "Error rejecting product"));
        }
    };

    // Announcement operations (existing)
    const handleSaveAnnouncement = async () => {
        try {
            const announcementData = selectedAnnouncement?._id
                ? selectedAnnouncement
                : newAnnouncement;

            const body = {
                title: announcementData.title,
                titleEn: announcementData.titleEn,
                content: announcementData.content,
                contentEn: announcementData.contentEn,
                startDate: announcementData.startDate,
                endDate: announcementData.endDate,
                status: announcementData.status,
                isMain: announcementData.isMain,
                image: imageUrl || announcementData.image,
                link: announcementData.link,
            };

            let response: AxiosResponse<any, any>;
            if (selectedAnnouncement?._id) {
                response = await announcementService.updateAnnouncement(selectedAnnouncement._id, body);
                setAnnouncements(announcements.map((a) => a._id === selectedAnnouncement._id ? response.data : a));
                toast.success(isArabic ? "تم تحديث الإعلان بنجاح" : "Announcement updated successfully");
            } else {
                response = await announcementService.createAnnouncement(body);
                //console.log(response, 'ann')
                setAnnouncements([...announcements, response.data]);
                toast.success(isArabic ? "تم إنشاء الإعلان بنجاح" : "Announcement created successfully");
            }

            setShowAddAnnouncement(false);
            setSelectedAnnouncement(null);
            setAnnouncementImage(null);
            setNewAnnouncement({
                title: "",
                titleEn: "",
                content: "",
                contentEn: "",
                startDate: "",
                endDate: "",
                isMain: "",
                status: "active",
                image: "",
                link: "",
            });
        } catch (error) {
            toast.error(isArabic ? "حدث خطأ أثناء حفظ الإعلان" : "Error saving announcement");
        }
    };

    const handleDeleteAnnouncement = async (id: string) => {
        if (!confirm(isArabic ? "هل أنت متأكد من حذف هذا الإعلان؟" : "Are you sure you want to delete this announcement?")) {
            return;
        }
        try {
            await announcementService.deleteAnnouncement(id);
            setAnnouncements(announcements.filter(a => a._id !== id));
            toast.success(isArabic ? "تم حذف الإعلان بنجاح" : "Announcement deleted successfully");
        } catch (error) {
            toast.error(isArabic ? "حدث خطأ أثناء حذف الإعلان" : "Error deleting announcement");
        }
    };

    // Pickup point operations (existing)
    const handleSubmitPickupPoint = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPickupPoint) return;

        try {
            if (selectedPickupPoint._id) {
                await pickupPointService.updatePickupPoint(selectedPickupPoint._id, selectedPickupPoint);
                toast.success(isArabic ? 'تم تحديث نقطة الاستلام بنجاح' : 'Pickup point updated successfully');
            } else {
                await pickupPointService.createPickupPoint(selectedPickupPoint);
                toast.success(isArabic ? 'تم إنشاء نقطة الاستلام بنجاح' : 'Pickup point created successfully');
            }
            setShowAddPickupPoint(false);
            setSelectedPickupPoint(null);
            fetchPickupPoints();
        } catch (error) {
            toast.error(isArabic ? 'حدث خطأ أثناء حفظ نقطة الاستلام' : 'Error saving pickup point');
        }
    };

    const handleDeletePickupPoint = async (pickupPointId: string) => {
        if (!confirm(isArabic ? "هل أنت متأكد من حذف نقطة الاستلام؟" : "Are you sure you want to delete this pickup point?")) {
            return;
        }
        try {
            await pickupPointService.deletePickupPoint(pickupPointId);
            setPickupPoints(pickupPoints.filter((p: any) => p._id !== pickupPointId));
            toast.success(isArabic ? "تم حذف نقطة الاستلام بنجاح" : "Pickup point deleted successfully");
        } catch (err) {
            toast.error(isArabic ? "حدث خطأ أثناء حذف نقطة الاستلام" : "Error deleting pickup point");
        }
    };

    // Image handling (existing)
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        if (file) {
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                toast.error(isArabic ? "نوع الملف غير مدعوم. الرجاء اختيار صورة." : "File type not supported. Please select an image.");
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                toast.error(isArabic ? "حجم الصورة كبير جداً. الحد الأقصى 5MB" : "Image size too large. Maximum 5MB");
                return;
            }

            setAnnouncementImage(file);
        }
    };

    const handleRemoveImage = () => {
        setAnnouncementImage(null);
        if (selectedAnnouncement) {
            setSelectedAnnouncement({ ...selectedAnnouncement, image: '' });
        } else {
            setNewAnnouncement({ ...newAnnouncement, image: '' });
        }
    };
    // أضف هذه الدوال داخل الكود الرئيسي للـ hook:

    const handleUpdateVendorBalance = async (sellerId: string, balance: number, pendingBalance?: number) => {
        try {
            setUpdatingUser(sellerId); // تشغيل مؤشر التحميل الخاص بالمستخدم الحالي
            await userService.updateVendorBalance(sellerId, { balance, pendingBalance });

            setSellers((prev) =>
                prev.map((s) =>
                    s._id === sellerId
                        ? { ...s, wallet: { ...s.wallet, balance, pendingBalance: pendingBalance ?? s.wallet.pendingBalance } }
                        : s
                )
            );
            toast.success(isArabic ? 'تم تحديث رصيد البائع بنجاح' : 'Vendor balance updated successfully');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Error updating balance');
        } finally {
            setUpdatingUser(null);
        }
    };

    const handleUpdateVendorStatus = async (sellerId: string, trustedSeller?: boolean, approvalStatus?: 'pending' | 'approved' | 'rejected') => {
        try {
            setUpdatingUser(sellerId);
            await userService.updateVendorStatus(sellerId, { trustedSeller, approvalStatus });

            setSellers((prev) =>
                prev.map((s) =>
                    s._id === sellerId
                        ? {
                            ...s,
                            vendorProfile: {
                                ...s.vendorProfile,
                                ...(trustedSeller !== undefined && { trustedSeller }),
                                ...(approvalStatus !== undefined && { approvalStatus })
                            }
                        }
                        : s
                )
            );
            toast.success(isArabic ? 'تم تحديث حالة توثيق البائع' : 'Vendor profile status updated');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Error updating status');
        } finally {
            setUpdatingUser(null);
        }
    };

    const handleToggleUserActive = async (userId: string, currentActiveStatus: boolean) => {
        try {
            setUpdatingUser(userId);
            const newActiveStatus = !currentActiveStatus;
            await userService.toggleUserActive(userId, newActiveStatus);

            setSellers((prev) =>
                prev.map((s) => (s._id === userId ? { ...s, isActive: newActiveStatus } : s))
            );
            toast.success(
                isArabic
                    ? (newActiveStatus ? 'تم تفعيل الحساب ' : 'تم تعطيل الحساب ')
                    : (newActiveStatus ? 'Vendor activated' : 'Vendor deactivated')
            );
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Error updating activation status');
        } finally {
            setUpdatingUser(null);
        }
    };

   
    return {
        // State
        activeTab,
        setActiveTab,
        products,
        coupons,
        loadingProducts,
        errorProducts,
        categories,
        loading,
        error,
        announcementImage,
        imageUrl,
        setImageUrl,
        isAuthenticated,
        isAdmin,
        orders,
        loadingOrders,
        errorOrders,
        pickupPoints,
        sellers,
        users,
        loadingPickupPoints,
        announcements,
        loadingAnnouncements,
        errorAnnouncements,

        // Return requests pagination
        returnsPage,
        returnsPages,
        setReturnsPage,

        // Earnings state
        platformEarnings,
        loadingEarnings,
        errorEarnings,

        // Return requests state
        returnRequests,
        loadingReturns,
        errorReturns,

        // Coupon form state
        showAddCoupon,
        setShowAddCoupon,
        editingCoupon,
        setEditingCoupon,
        newCoupon,
        setNewCoupon,

        // Form states
        newCategory,
        setNewCategory,
        isCreating,
        setIsCreating,
        showSpinner,
        editingCategory,
        setEditingCategory,
        showAddPickupPoint,
        setShowAddPickupPoint,
        selectedPickupPoint,
        setSelectedPickupPoint,
        showAddAnnouncement,
        setShowAddAnnouncement,
        selectedAnnouncement,
        setSelectedAnnouncement,
        newAnnouncement,
        setNewAnnouncement,


    // Functions
        handleCreateCategory,
        handleEditCategory,
        handleDeleteCategory,
        handleApproveProduct,
        handleRejectProduct,
        handleSaveAnnouncement,
        handleDeleteAnnouncement,
        handleSubmitPickupPoint,
        handleDeletePickupPoint,
        handleImageUpload,
        handleRemoveImage,
        fetchProducts,
        fetchCategories,
        fetchBrands,
        fetchCoupons,
        fetchOrders,
        updateDeliveryStatus,
        updatePaymentStatus,
        orderComplete,
        handleToggleCouponStatus,
        handleDeleteCoupon,
        fetchPickupPoints,
        fetchAnnouncements,

        // Coupon functions
        handleCreateCoupon,
        handleUpdateCoupon,
        handleGetCoupon,
        handleGetCouponStats,
        handleCouponInputChange,
        handleEditCoupon,
        handleAddCoupon,
        handleCloseCouponForm,

        // Return requests functions
        fetchReturnRequests,
        handleApproveReturn,
        handleRejectReturn,
        handleProcessReturn,
        handleFinishedReturn,
        // Complaints
        complaints,
        loadingComplaints,
        errorComplaints,
        fetchComplaints,
        complaintsPage,
        setComplaintsPage,
        handleDeleteReturn,
        platformEarnings,
        loadingEarnings,
        // Brands
        brands,
        loadingBrands,
        errorBrands,
        fetchBrands,
        handleDeleteBrand,
        fetchPlatformEarnings,
        dashboardCounters,
        fetchDashboardCounters,
        // User management
        handleDeleteUser,
        handleRestoreUser,
        updatingUser,
        transactions,
        transactionsLoading,
        transactionFilters,
        setTransactionFilters,
        transactionsPage,
        setTransactionsPage,
        transactionsPages,
        fetchAdminTransactions,
        analytics,
        analyticsLoading,
        analyticsError,

        // Orders pagination
        ordersPage,
        ordersPages,
        setOrdersPage,

        // Sellers pagination
        sellersPage,
        sellersPages,
        setSellersPage,

        // Users pagination
        usersPage,
        usersPages,
        setUsersPage,
        sellersPage,
        sellersPages,
        setSellersPage,
        handleUpdateVendorBalance,
        handleUpdateVendorStatus,
        handleToggleUserActive,
        // Products pagination
        productsPage,
        productsPages,
        setProductsPage,
        fetchAdminAnalytics,

        // Language
        language,
        t,
        isArabic,
    };
}
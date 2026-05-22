"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from "sonner"
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { orderService, paymentService } from '@/lib/api';
import { MirvoryPageLoader } from '@/components/MirvoryLoader';
import {
    Package,
    ShoppingBag,
    Clock,
    CheckCircle,
    Truck,
    XCircle,
    ExternalLink,
    ShoppingCart,
    Filter,
    Calendar,
    MapPin,
    CreditCard,
    User,
    Phone,
    MoreVertical,
    Download,
    Repeat,
    Headset,
    Star,
    ChevronRight,
    Home,
    Sparkles,
    BadgeCheck,
    Shield,
    Loader2
} from 'lucide-react';

// Components
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface OrderItem {
    _id: string;
    product: {
        _id: string;
        title?: string;
        name?: string;
        price: number;
        images: string[];
    };
    quantity: number;
    price: number;
    colors?: string[];
    sizes?: string[];
}

interface Order {
    _id: string;
    orderNumber?: string;
    items: OrderItem[];
    total: number;
    subtotal?: number;
    shippingFee?: number;
    discount?: number;
    deliveryStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
    createdAt: string;
    updatedAt?: string;
    paidAt?: string;
    deliveredAt?: string;
    deliveryAddress?: string;
    deliveryMethod?: string;
    recipientInfo?: {
        fullName: string;
        phoneNumber: string;
    };
    trackingNumber?: string;
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [processingPayment, setProcessingPayment] = useState<string | null>(null);
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await orderService.getUserOrders();
            if (response?.data) {
                setOrders(response.data);
            } else {
                toast.error('حدث خطأ أثناء جلب الطلبات')
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    type PayMethod = 'card' | 'wallet';

    const handleCompletePayment = async (orderId: string, method: PayMethod) => {
        try {
            setProcessingPayment(orderId);
            const res = await paymentService.createPaymentSession({ orderId, paymentMethod: method });
            const { redirectUrl, iframeUrl } = res.data || {};
            if (redirectUrl) {
                window.location.href = redirectUrl;
            } else if (iframeUrl) {
                window.location.href = iframeUrl;
            } else {
                toast.error('فشل إنشاء جلسة الدفع');
            }
        } catch (error) {
            console.error('Payment session error:', error);
            toast.error(error instanceof Error ? error.message : 'حدث خطأ أثناء إنشاء جلسة الدفع');
        } finally {
            setProcessingPayment(null);
        }
    };

    const refreshOrders = async () => {
        setRefreshing(true);
        await fetchOrders();
        setRefreshing(false);
        toast.success('تم تحديث الطلبات');
    };

    const getStatusConfig = (deliveryStatus: Order['deliveryStatus']) => {
        const configs = {
            pending: {
                icon: Clock,
                color: 'bg-sky-500',
                text: 'قيد الانتظار',
                description: 'في انتظار تأكيد الدفع',
                bgColor: 'bg-sky-50',
                textColor: 'text-sky-700',
                borderColor: 'border-sky-200'
            },
            processing: {
                icon: Package,
                color: 'bg-indigo-500',
                text: 'قيد المعالجة',
                description: 'جاري تجهيز الطلب',
                bgColor: 'bg-indigo-50',
                textColor: 'text-indigo-700',
                borderColor: 'border-indigo-200'
            },
            shipped: {
                icon: Truck,
                color: 'bg-purple-500',
                text: 'تم الشحن',
                description: 'في طريق التوصيل',
                bgColor: 'bg-purple-50',
                textColor: 'text-purple-700',
                borderColor: 'border-purple-200'
            },
            delivered: {
                icon: CheckCircle,
                color: 'bg-emerald-500',
                text: 'تم التوصيل',
                description: 'تم التسليم بنجاح',
                bgColor: 'bg-emerald-50',
                textColor: 'text-emerald-700',
                borderColor: 'border-emerald-200'
            },
            cancelled: {
                icon: XCircle,
                color: 'bg-rose-500',
                text: 'ملغي',
                description: 'تم إلغاء الطلب',
                bgColor: 'bg-rose-50',
                textColor: 'text-rose-700',
                borderColor: 'border-rose-200'
            },
            returned: {
                icon: Repeat,
                color: 'bg-slate-500',
                text: 'مرتجع',
                description: 'تم إرجاع الطلب',
                bgColor: 'bg-slate-50',
                textColor: 'text-slate-700',
                borderColor: 'border-slate-200'
            }
        };
        return configs[deliveryStatus] || configs.pending;
    };

    const getPaymentStatusConfig = (paymentStatus: Order['paymentStatus']) => {
        const configs = {
            pending: {
                color: 'bg-sky-100 text-sky-800',
                text: 'بانتظار الدفع'
            },
            paid: {
                color: 'bg-emerald-100 text-emerald-800',
                text: 'مدفوع'
            },
            failed: {
                color: 'bg-rose-100 text-rose-800',
                text: 'فشل الدفع'
            },
            refunded: {
                color: 'bg-slate-100 text-slate-800',
                text: 'تم الاسترجاع'
            }
        };
        return configs[paymentStatus] || configs.pending;
    };

    const getDeliveryProgress = (status: Order['deliveryStatus']) => {
        const progress = {
            pending: 25,
            processing: 50,
            shipped: 75,
            delivered: 100,
            cancelled: 0,
            returned: 0
        };
        return progress[status] || 0;
    };

    const isWithinReturnWindow = (order: Order) => {
        if (order.deliveryStatus !== 'delivered' || !order.deliveredAt) return false;
        const daysSinceDelivery = Math.floor((new Date().getTime() - new Date(order.deliveredAt).getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceDelivery <= 14;
    };

    const filteredOrders = orders.filter(order => {
        if (activeTab === 'all') return true;
        return order.deliveryStatus === activeTab;
    }).sort((a, b) => {
        if (sortBy === 'newest') {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else if (sortBy === 'oldest') {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        } else if (sortBy === 'highest') {
            return b.total - a.total;
        } else {
            return a.total - b.total;
        }
    });

    const getOrderStats = () => {
        return {
            total: orders.length,
            pending: orders.filter(o => o.deliveryStatus === 'pending').length,
            processing: orders.filter(o => o.deliveryStatus === 'processing').length,
            shipped: orders.filter(o => o.deliveryStatus === 'shipped').length,
            delivered: orders.filter(o => o.deliveryStatus === 'delivered').length,
            totalSpent: orders.reduce((sum, order) => sum + order.total, 0)
        };
    };

    const stats = getOrderStats();

    if (loading) {
        return <MirvoryPageLoader text="جاري تحميل طلباتك..." />;
    }

    if (orders.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 py-12 px-4">
                <div className="container mx-auto max-w-4xl">
                    <div className="text-center">
                        <div className="relative inline-block mb-8">
                            <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center">
                                <ShoppingBag className="w-16 h-16 text-primary/60" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-emerald-200">
                                <Sparkles className="w-8 h-8 text-white" />
                            </div>
                        </div>

                        <div className="max-w-md mx-auto mb-10">
                            <h1 className="text-2xl md:text-4xl font-bold text-slate-900 mb-4">
                                لا توجد طلبات حتى الآن
                            </h1>
                            <p className="text-base md:text-lg text-slate-500 leading-relaxed">
                                ابدأ رحلة التسوق واكتشف منتجاتنا المميزة
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-12">
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center mb-4 mx-auto sm:mx-0">
                                    <ShoppingCart className="w-6 h-6 text-sky-600" />
                                </div>
                                <h3 className="font-semibold text-slate-900 mb-2">تصفح المنتجات</h3>
                                <p className="text-sm text-slate-500">اكتشف آلاف المنتجات المميزة</p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 mx-auto sm:mx-0">
                                    <BadgeCheck className="w-6 h-6 text-emerald-600" />
                                </div>
                                <h3 className="font-semibold text-slate-900 mb-2">توصيل سريع</h3>
                                <p className="text-sm text-slate-500">توصيل في جميع أنحاء مصر</p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 mx-auto sm:mx-0">
                                    <Shield className="w-6 h-6 text-indigo-600" />
                                </div>
                                <h3 className="font-semibold text-slate-900 mb-2">دفع آمن</h3>
                                <p className="text-sm text-slate-500">مدفوعات مشفرة وآمنة</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button
                                size="lg"
                                onClick={() => router.push('/')}
                                className="w-full sm:w-auto px-8 py-6 text-base rounded-2xl shadow-lg hover:shadow-xl transition-all"
                            >
                                <ShoppingBag className="w-5 h-5 ml-2" />
                                ابدأ التسوق الآن
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={() => router.push('/products')}
                                className="w-full sm:w-auto px-8 py-6 text-base rounded-2xl"
                            >
                                تصفح الكتالوج
                                <ExternalLink className="w-5 h-5 mr-2" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const filters = [
        { id: 'all', label: 'الكل', icon: Filter },
        { id: 'pending', label: 'الانتظار', icon: Clock },
        { id: 'processing', label: 'التجهيز', icon: Package },
        { id: 'shipped', label: 'الشحن', icon: Truck },
        { id: 'delivered', label: 'التسليم', icon: CheckCircle },
        { id: 'cancelled', label: 'ملغية', icon: XCircle },
    ];

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Mobile/Desktop Glass Header */}
            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="container mx-auto px-4 py-4 md:py-6">
                    <div className="flex flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 md:p-3 bg-primary/10 rounded-xl md:rounded-2xl shrink-0">
                                <ShoppingBag className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-3xl font-bold text-slate-900">
                                    طلباتي
                                </h1>
                                <p className="text-slate-500 text-xs md:text-sm mt-0.5 md:mt-1 hidden sm:flex items-center gap-2">
                                    تتبع جميع طلباتك في مكان واحد
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={refreshOrders}
                                disabled={refreshing}
                                size="sm"
                                className="rounded-xl hidden sm:flex gap-2"
                            >
                                {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Repeat className="w-4 h-4" />}
                                تحديث
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => router.push('/')}
                                size="icon"
                                className="rounded-xl sm:hidden"
                            >
                                <Home className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid - Swipeable on mobile */}
            <div className="container mx-auto px-4 pt-6 pb-2">
                <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-4 hide-scrollbar">
                    <div className="snap-start min-w-[130px] flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm shrink-0">
                        <div className="text-xl md:text-2xl font-bold text-slate-900">{stats.total}</div>
                        <div className="text-xs md:text-sm text-slate-500 mt-1">إجمالي الطلبات</div>
                    </div>
                    <div className="snap-start min-w-[130px] flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm shrink-0">
                        <div className="text-xl md:text-2xl font-bold text-sky-600">{stats.pending}</div>
                        <div className="text-xs md:text-sm text-slate-500 mt-1">قيد الانتظار</div>
                    </div>
                    <div className="snap-start min-w-[130px] flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm shrink-0">
                        <div className="text-xl md:text-2xl font-bold text-indigo-600">{stats.processing}</div>
                        <div className="text-xs md:text-sm text-slate-500 mt-1">قيد التجهيز</div>
                    </div>
                    <div className="snap-start min-w-[130px] flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm shrink-0">
                        <div className="text-xl md:text-2xl font-bold text-emerald-600">{stats.delivered}</div>
                        <div className="text-xs md:text-sm text-slate-500 mt-1">تم التوصيل</div>
                    </div>
                    <div className="snap-start min-w-[140px] flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm shrink-0">
                        <div className="text-lg md:text-xl font-bold text-slate-900 truncate">
                            {stats.totalSpent.toFixed(0)} <span className="text-xs">ج.م</span>
                        </div>
                        <div className="text-xs md:text-sm text-slate-500 mt-1">المشتريات</div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-2">
                {/* Scrollable Mobile Tabs & Filters */}
                <div className="mb-6 flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2 -mx-4 px-4 md:mx-0 md:px-0">
                        {filters.map((filter) => {
                            const Icon = filter.icon;
                            const isActive = activeTab === filter.id;
                            return (
                                <Button
                                    key={filter.id}
                                    variant={isActive ? "default" : "outline"}
                                    onClick={() => setActiveTab(filter.id)}
                                    className={`rounded-full shrink-0 gap-1.5 transition-all ${isActive ? 'shadow-md shadow-primary/20' : 'bg-white text-slate-600'
                                        }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                                    {filter.label}
                                </Button>
                            )
                        })}
                    </div>

                    <div className="w-full md:w-auto">
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-full md:w-[180px] bg-white rounded-xl border-slate-200">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <SelectValue placeholder="ترتيب حسب" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="newest">الأحدث أولاً</SelectItem>
                                <SelectItem value="oldest">الأقدم أولاً</SelectItem>
                                <SelectItem value="highest">الأعلى سعراً</SelectItem>
                                <SelectItem value="lowest">الأقل سعراً</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Orders Grid */}
                <div className="space-y-4 md:space-y-6">
                    {filteredOrders.map((order) => {
                        const statusConfig = getStatusConfig(order.deliveryStatus);
                        const StatusIcon = statusConfig.icon;
                        const paymentConfig = getPaymentStatusConfig(order.paymentStatus);
                        const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
                        const isExpanded = expandedOrder === order._id;

                        return (
                            <Card key={order._id} className={`overflow-hidden border transition-all duration-300 hover:shadow-lg rounded-2xl ${statusConfig.borderColor} bg-white`}>
                                <CardHeader className="p-4 md:p-6 pb-2 md:pb-4 border-b border-slate-50 bg-slate-50/30">
                                    <div className="flex flex-row items-start justify-between gap-2 md:gap-4">
                                        <div className="flex items-start gap-3 md:gap-4">
                                            <div className={`p-2.5 md:p-3 rounded-2xl shrink-0 ${statusConfig.bgColor}`}>
                                                <StatusIcon className={`w-5 h-5 md:w-6 md:h-6 ${statusConfig.textColor}`} />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <CardTitle className="text-base md:text-lg text-slate-900 leading-none">
                                                    طلب #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                                                </CardTitle>
                                                <div className="flex flex-wrap items-center gap-2 mt-1 md:mt-2">
                                                    <span className="flex items-center gap-1 text-xs md:text-sm text-slate-500">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {format(new Date(order.createdAt), 'dd MMM yyyy', { locale: ar })}
                                                    </span>
                                                    <span className="hidden sm:inline text-slate-300">•</span>
                                                    <span className="flex items-center gap-1 text-xs md:text-sm text-slate-500">
                                                        <Package className="w-3.5 h-3.5" />
                                                        {itemCount} منتج
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            <div className="text-right">
                                                <div className="text-lg md:text-xl font-bold text-slate-900">
                                                    {order.total.toFixed(0)} <span className="text-xs md:text-sm text-slate-500 font-normal">ج.م</span>
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className={`${paymentConfig.color} border-0 rounded-lg text-[10px] md:text-xs px-2 py-0.5`}>
                                                {paymentConfig.text}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-4 md:p-6">
                                    {/* Progress Bar */}
                                    <div className="mb-6 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold text-sm md:text-base ${statusConfig.textColor}`}>
                                                    {statusConfig.text}
                                                </span>
                                            </div>
                                            <span className="text-xs md:text-sm text-slate-500">{statusConfig.description}</span>
                                        </div>
                                        <Progress value={getDeliveryProgress(order.deliveryStatus)} className="h-1.5 md:h-2 rounded-full" />
                                        <div className="flex justify-between text-[10px] md:text-xs text-slate-400 mt-2 font-medium px-1">
                                            <span>تم التوصيل</span>
                                            <span className="hidden sm:inline">تم الشحن</span>
                                            <span className="hidden sm:inline">قيد المعالجة</span>
                                            <span>تم الطلب</span>
                                        </div>
                                    </div>

                                    {/* Products Preview (Scrollable horizontally on mobile) */}
                                    <div className="mb-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-sm font-bold text-slate-900">المنتجات</h3>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                                                className="text-primary text-xs h-8 px-2"
                                            >
                                                {isExpanded ? 'إظهار أقل' : 'عرض الكل'}
                                                <ChevronRight className={`w-3.5 h-3.5 ml-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                            </Button>
                                        </div>

                                        <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 transition-all ${!isExpanded && order.items.length > 2 ? 'overflow-x-auto hide-scrollbar flex snap-x pb-2' : ''}`}>
                                            {order.items.slice(0, isExpanded ? order.items.length : 5).map((item) => (
                                                <div
                                                    key={item._id}
                                                    className={`group relative bg-white border border-slate-100 rounded-2xl p-2.5 hover:shadow-md transition-all ${!isExpanded && order.items.length > 2 ? 'min-w-[140px] snap-start shrink-0' : ''}`}
                                                >
                                                    <div className="cursor-pointer" onClick={() => router.push(`/products/${item.product._id}`)}>
                                                        <div className="aspect-square rounded-xl overflow-hidden bg-slate-50 mb-2.5 relative">
                                                            <img
                                                                src={item.product?.images?.[0] || '/placeholder-product.jpg'}
                                                                alt={item.product?.title}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                            />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                                                                {item.product?.title}
                                                            </p>
                                                            <div className="flex justify-between items-center mt-1.5">
                                                                <p className="text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                                                                    الكمية: {item.quantity}
                                                                </p>
                                                                <p className="text-xs font-bold text-primary">
                                                                    {(item.price * item.quantity).toFixed(0)} <span className="text-[9px]">ج.م</span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {order.deliveryStatus === 'delivered' && isWithinReturnWindow(order) && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="w-full mt-2.5 text-[10px] h-7 rounded-lg"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.push(`/returns/new?orderId=${order._id}&itemId=${item._id}`);
                                                            }}
                                                        >
                                                            <Repeat className="w-3 h-3 ml-1" />
                                                            إرجاع
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                            {!isExpanded && order.items.length > 5 && (
                                                <div className="min-w-[140px] snap-start shrink-0 relative bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setExpandedOrder(order._id)}>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-black text-slate-400 mb-1">
                                                            +{order.items.length - 5}
                                                        </div>
                                                        <div className="text-[11px] font-medium text-slate-500">عرض الباقي</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Order Details Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                                        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="p-1.5 bg-slate-50 rounded-lg"><MapPin className="w-4 h-4 text-slate-500" /></div>
                                                <h4 className="text-sm font-bold text-slate-900">عنوان التوصيل</h4>
                                            </div>
                                            <p className="text-xs text-slate-600 leading-relaxed pl-8">
                                                {order.deliveryAddress || 'لم يتم تحديد عنوان'}
                                            </p>
                                        </div>

                                        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="p-1.5 bg-slate-50 rounded-lg"><Truck className="w-4 h-4 text-slate-500" /></div>
                                                <h4 className="text-sm font-bold text-slate-900">حالة الشحن</h4>
                                            </div>
                                            <div className="space-y-1.5 text-xs pl-8">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">الطريقة:</span>
                                                    <span className="font-medium text-slate-800">{order.deliveryMethod || 'توصيل منزلي'}</span>
                                                </div>
                                                {order.trackingNumber && (
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500">التتبع:</span>
                                                        <span className="font-bold text-primary">{order.trackingNumber}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 sm:col-span-2 lg:col-span-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="p-1.5 bg-slate-50 rounded-lg"><CreditCard className="w-4 h-4 text-slate-500" /></div>
                                                <h4 className="text-sm font-bold text-slate-900">ملخص الدفع</h4>
                                            </div>
                                            <div className="space-y-1.5 text-xs pl-8">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">المجموع:</span>
                                                    <span className="font-medium">{order.subtotal?.toFixed(0) || order.total.toFixed(0)} ج.م</span>
                                                </div>
                                                {order.shippingFee ? (
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500">الشحن:</span>
                                                        <span className="font-medium">{order.shippingFee.toFixed(0)} ج.م</span>
                                                    </div>
                                                ) : null}
                                                <div className="flex justify-between font-bold text-sm pt-2 border-t border-slate-100 mt-1">
                                                    <span className="text-slate-900">الإجمالي:</span>
                                                    <span className="text-primary">{order.total.toFixed(0)} ج.م</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>

                                <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-4">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">

                                        {/* Actions for Mobile: Full width buttons. For Desktop: inline */}
                                        <div className="grid grid-cols-2 sm:flex flex-wrap gap-2 w-full sm:w-auto">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.push(`/orders/${order._id}`)}
                                                className="w-full sm:w-auto rounded-xl text-xs h-9 bg-white"
                                            >
                                                التفاصيل
                                            </Button>

                                            {order.deliveryStatus === 'delivered' && (
                                                <Button variant="outline" size="sm" className="w-full sm:w-auto rounded-xl text-xs h-9 bg-white">
                                                    <Star className="w-3.5 h-3.5 ml-1.5 text-amber-500" />
                                                    تقييم
                                                </Button>
                                            )}

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full sm:w-auto rounded-xl text-xs h-9 col-span-2 sm:col-span-1 text-slate-500 hover:text-slate-900"
                                                onClick={() => router.push('/contact')}
                                            >
                                                <Headset className="w-3.5 h-3.5 ml-1.5" />
                                                مساعدة
                                            </Button>
                                        </div>

                                        {order.paymentStatus === 'pending' && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        className="w-full sm:w-auto rounded-xl shadow-md shadow-primary/20"
                                                        disabled={processingPayment === order._id}
                                                    >
                                                        {processingPayment === order._id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin ml-2" />
                                                        ) : (
                                                            <CreditCard className="w-4 h-4 ml-2" />
                                                        )}
                                                        {processingPayment === order._id ? 'جاري...' : 'الدفع الآن'}
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[200px]">
                                                    <DropdownMenuLabel className="text-xs text-slate-500">اختر طريقة الدفع</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="rounded-xl cursor-pointer py-2.5" onClick={() => handleCompletePayment(order._id, 'card')}>
                                                        <CreditCard className="w-4 h-4 ml-2 text-primary" />
                                                        بطاقة بنكية (Card)
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="rounded-xl cursor-pointer py-2.5" onClick={() => handleCompletePayment(order._id, 'wallet')}>
                                                        <Shield className="w-4 h-4 ml-2 text-indigo-500" />
                                                        محفظة إلكترونية (Wallet)
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>

                {/* Empty State for Filters */}
                {filteredOrders.length === 0 && activeTab !== 'all' && (
                    <div className="text-center py-20 px-4">
                        <div className="w-20 h-20 mx-auto mb-5 bg-slate-100 rounded-full flex items-center justify-center">
                            <Filter className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">
                            لا توجد طلبات في هذه الفئة
                        </h3>
                        <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                            لا يوجد لديك طلبات بحالة "{getStatusConfig(activeTab as any).text}" حالياً.
                        </p>
                        <Button
                            onClick={() => setActiveTab('all')}
                            variant="outline"
                            className="rounded-xl"
                        >
                            عرض جميع الطلبات
                            <ChevronRight className="w-4 h-4 mr-2" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Custom Styles to hide scrollbar but keep functionality */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                `
            }} />
        </div>
    );
}
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MirvoryPageLoader } from "@/components/MirvoryLoader";
import PaginationControls from "@/components/pagination-controls";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import {
    ShoppingBag, User, Phone, MapPin, CreditCard,
    Truck, Package, Calendar, Hash, CheckCircle2,
    Clock, XCircle, ExternalLink
} from "lucide-react";

interface OrdersTabProps {
    orders: any[];
    loadingOrders: boolean;
    errorOrders: string | null;
    isArabic: boolean;
    pagination: { currentPage: number; totalPages: number };
    onPageChange: (page: number) => void;
    updateDeliveryStatus: (orderId: string, deliveryStatus: string) => void;
    updatePaymentStatus: (orderId: string, status: string) => void;
    orderComplete: (orderId: string, code: string) => void;
    markItemAsPrepared?: (orderId: string, itemId: string) => void;
}

// ── Shared label row inside a card ────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, valueClass = "" }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: React.ReactNode;
    valueClass?: string;
}) {
    return (
        <div className="flex items-start gap-2 py-1.5 border-b border-slate-100 last:border-0">
            <Icon className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
            <span className="text-xs text-slate-400 shrink-0 w-20">{label}</span>
            <span className={`text-xs font-medium text-slate-700 flex-1 text-right ${valueClass}`}>
                {value}
            </span>
        </div>
    );
}

// ── Status badge helper ───────────────────────────────────────────────────────
function StatusBadge({ value, map }: {
    value: string;
    map: Record<string, { label: string; className: string }>;
}) {
    const cfg = map[value] ?? { label: value, className: "bg-slate-100 text-slate-600 border-slate-200" };
    return (
        <Badge variant="outline" className={`text-xs rounded-full px-2.5 py-0.5 font-medium border ${cfg.className}`}>
            {cfg.label}
        </Badge>
    );
}

export function OrdersTab({
    orders, loadingOrders, errorOrders, isArabic,
    pagination, onPageChange,
    updateDeliveryStatus, updatePaymentStatus, orderComplete,
    markItemAsPrepared
}: OrdersTabProps) {
    const router = useRouter();
    const ar = isArabic;

    const handleOrderClick = useCallback((orderId: string, event: React.MouseEvent) => {
        const target = event.target as HTMLElement;
        const isInteractiveElement =
            target.closest('button') || target.closest('select') ||
            target.closest('input') || target.closest('[role="combobox"]') ||
            target.closest('[data-interactive="true"]');
        if (!isInteractiveElement) router.push(`/orders/${orderId}`);
    }, [router]);

    const getPaymentMethodLabel = (method: string) => {
        const labels: { [key: string]: { en: string; ar: string } } = {
            cash: { en: "Cash", ar: "كاش" },
            card: { en: "Card", ar: "بطاقة" },
            wallet: { en: "Wallet", ar: "محفظة" },
            vodafone_cash: { en: "Vodafone Cash", ar: "فودافون كاش" },
            paymob: { en: "Paymob", ar: "باي موب" }
        };
        return labels[method] || { en: method, ar: method };
    };

    const getDeliveryMethodLabel = (method: string) => {
        const labels: { [key: string]: { en: string; ar: string } } = {
            home: { en: "Home Delivery", ar: "توصيل منزل" },
            pickup: { en: "Store Pickup", ar: "استلام من المتجر" },
            express: { en: "Express", ar: "توصيل سريع" }
        };
        return labels[method] || { en: method, ar: method };
    };

    // status color maps
    const paymentStatusMap: Record<string, { label: string; className: string }> = {
        pending: { label: ar ? "قيد الانتظار" : "Pending", className: "bg-amber-50 text-amber-700 border-amber-200" },
        paid: { label: ar ? "مدفوع" : "Paid", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
        failed: { label: ar ? "فشل" : "Failed", className: "bg-red-50 text-red-700 border-red-200" },
        completed: { label: ar ? "مكتمل" : "Completed", className: "bg-blue-50 text-blue-700 border-blue-200" },
    };

    const deliveryStatusMap: Record<string, { label: string; className: string }> = {
        pending: { label: ar ? "قيد الانتظار" : "Pending", className: "bg-amber-50 text-amber-700 border-amber-200" },
        shipped: { label: ar ? "تم الشحن" : "Shipped", className: "bg-blue-50 text-blue-700 border-blue-200" },
        delivered: { label: ar ? "تم التوصيل" : "Delivered", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
        cancelled: { label: ar ? "ملغي" : "Cancelled", className: "bg-red-50 text-red-700 border-red-200" },
    };

    if (loadingOrders) return <MirvoryPageLoader text={ar ? "جاري التحميل..." : "Loading..."} />;
    if (errorOrders) return (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            <XCircle className="h-4 w-4 shrink-0" />
            {errorOrders}
        </div>
    );

    return (
        <div className="space-y-5" dir={ar ? "rtl" : "ltr"}>

            {/* ── Page heading ─────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                        <ShoppingBag className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-800">
                            {ar ? "إدارة الطلبات" : "Order Management"}
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {ar ? `${orders.length} طلب` : `${orders.length} orders`}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Orders grid ──────────────────────────────────────── */}
            {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 border border-dashed border-slate-200 rounded-2xl bg-white text-center">
                    <div className="p-4 bg-slate-100 rounded-2xl mb-3">
                        <ShoppingBag className="h-7 w-7 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">{ar ? "لا توجد طلبات" : "No orders found"}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {orders.map((order: any) => {
                        const paymentMethodLabel = getPaymentMethodLabel(order.paymentMethod || 'cash');
                        const deliveryMethodLabel = getDeliveryMethodLabel(order.deliveryMethod === "home"
                            ? order.deliveryInfo?.address
                            : order.deliveryInfo?.pickupPoint?.stationName);

                        return (
                            <div
                                key={order._id}
                                onClick={(e) => handleOrderClick(order._id, e)}
                                className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:border-slate-300 transition-all active:scale-[0.99] group"
                            >
                                {/* ── Card header ──────────────────────────────── */}
                                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Hash className="h-3.5 w-3.5 text-slate-400" />
                                        <span className="text-sm font-bold text-slate-800 font-mono">
                                            {order.orderNumber}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <StatusBadge value={order.deliveryStatus || "pending"} map={deliveryStatusMap} />
                                        <ExternalLink className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                                    </div>
                                </div>

                                <div className="px-4 py-3 space-y-3">

                                    {/* ── Customer ─────────────────────────────── */}
                                    <div className="flex items-start gap-2">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                            <User className="h-4 w-4 text-slate-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 truncate">
                                                {order.buyer?.fullName ||
                                                    `${order.buyer?.firstName || ''} ${order.buyer?.lastName || ''}`.trim() || "N/A"}
                                            </p>
                                            <p className="text-xs text-slate-400 truncate">{order.buyer?.email || ""}</p>
                                        </div>
                                        <div className="shrink-0 text-xs text-slate-400">
                                            {order.buyer?.phone || ""}
                                        </div>
                                    </div>

                                    {/* ── Items ────────────────────────────────── */}
                                    <div className="space-y-2">
                                        {order.items?.map((item: any, index: number) => (
                                            <div key={index} className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-xl border border-slate-100">
                                                <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
                                                    <img
                                                        src={item.product?.images?.[0] || "/placeholder-product.jpg"}
                                                        alt={item.product?.title || "Product"}
                                                        className="object-cover w-full h-full"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold text-slate-800 truncate">
                                                        {ar ? item.product?.title : item.product?.titleEn || item.product?.title}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-0.5">

                                                        {/* Selected Color */}
                                                        {item.color && (
                                                            <>
                                                                {ar ? "لون مختار: " : "Selected Color: "}
                                                                {item.color}
                                                            </>
                                                        )}

                                                        {/* Show all available colors */}
                                                        {item.product?.colors?.length > 0 && (
                                                            <div className="mt-1">
                                                                {ar ? "الألوان: " : "Colors: "}
                                                                {item.product.colors.map((c: any, i: number) => (
                                                                    <span key={i} className="mr-1">
                                                                        {c.name}{i !== item.product.colors.length - 1 ? "," : ""}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Separator */}
                                                        {item.color && item.size && <span> · </span>}

                                                        {/* Selected Size */}
                                                        {item.size && (
                                                            <>
                                                                {ar ? "مقاس مختار: " : "Selected Size: "}
                                                                {item.size}
                                                            </>
                                                        )}

                                                        {/* All sizes */}
                                                        {item.product?.sizes?.length > 0 && (
                                                            <div className="mt-1">
                                                                {ar ? "المقاسات: " : "Sizes: "}
                                                                {item.product.sizes.map((s: string, i: number) => (
                                                                    <span key={i} className="mr-1">
                                                                        {s}{i !== item.product.sizes.length - 1 ? "," : ""}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}

                                                    </p>
                                                </div>
                                                <div className="shrink-0 flex flex-col items-end gap-1">
                                                    <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-full px-2 py-0.5">
                                                        ×{item.quantity}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* ── Seller info ──────────────────────────── */}
                                    {order.items?.some((i: any) => i.seller) && (
                                        <div className="space-y-1.5">
                                            {order.items?.map((item: any, index: number) => item.seller && (
                                                <div key={index} className="flex items-center gap-2 p-2 bg-purple-50 border border-purple-100 rounded-xl">
                                                    <Package className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-semibold text-purple-800 truncate">
                                                            {item.seller?.firstName && item.seller?.lastName
                                                                ? `${item.seller.firstName} ${item.seller.lastName}`
                                                                : item.seller?.fullName || "N/A"}
                                                        </p>
                                                        {item.seller?.phone && (
                                                            <p className="text-xs text-purple-600">{item.seller.phone}</p>
                                                        )}
                                                    </div>
                                                    {item.seller?.wallet && (
                                                        <span className="text-xs font-bold text-purple-700 shrink-0">
                                                            {item.seller.wallet.balance || 0} EGP
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* ── Financials ───────────────────────────── */}
                                    <div className="grid grid-cols-3 gap-1.5">
                                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-center">
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">{ar ? "فرعي" : "Sub"}</p>
                                            <p className="text-xs font-bold text-slate-700 mt-0.5">
                                                {order.subtotal?.toFixed(2) || "0.00"}
                                            </p>
                                        </div>
                                        <div className="bg-red-50 border border-red-100 rounded-xl p-2 text-center">
                                            <p className="text-[10px] text-red-400 uppercase tracking-wide">{ar ? "خصم" : "Disc"}</p>
                                            <p className="text-xs font-bold text-red-600 mt-0.5">
                                                -{order?.discount?.toFixed(2) || "0.00"}
                                            </p>
                                        </div>
                                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-2 text-center">
                                            <p className="text-[10px] text-blue-400 uppercase tracking-wide">{ar ? "شحن" : "Ship"}</p>
                                            <p className="text-xs font-bold text-blue-600 mt-0.5">
                                                {order.shippingFee?.toFixed(2) || "0.00"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Total */}
                                    <div className="flex items-center justify-between px-3 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                                        <span className="text-xs font-semibold text-emerald-700">{ar ? "الإجمالي" : "Total"}</span>
                                        <span className="text-sm font-bold text-emerald-700">
                                            EGP {order.total?.toFixed(2) || "0.00"}
                                        </span>
                                    </div>

                                    {/* ── Meta info grid ───────────────────────── */}
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {/* Date */}
                                        <div className="flex items-center gap-1.5 p-2 bg-slate-50 border border-slate-100 rounded-xl">
                                            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-[10px] text-slate-400">{ar ? "التاريخ" : "Date"}</p>
                                                <p className="text-xs font-medium text-slate-700 truncate">
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Payment method */}
                                        <div className="flex items-center gap-1.5 p-2 bg-slate-50 border border-slate-100 rounded-xl">
                                            <CreditCard className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-[10px] text-slate-400">{ar ? "الدفع" : "Payment"}</p>
                                                <p className="text-xs font-medium text-slate-700 truncate">
                                                    {ar ? paymentMethodLabel.ar : paymentMethodLabel.en}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Delivery method */}
                                        <div className="flex items-center gap-1.5 p-2 bg-slate-50 border border-slate-100 rounded-xl">
                                            <Truck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-[10px] text-slate-400">{ar ? "التوصيل" : "Delivery"}</p>
                                                <p className="text-xs font-medium text-slate-700 truncate">
                                                    {order.deliveryMethod || "N/A"}                                                </p>
                                            </div>
                                        </div>

                                        {/* Address */}
                                        <div className="flex items-center gap-1.5 p-2 bg-slate-50 border border-slate-100 rounded-xl">
                                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-[10px] text-slate-400">{ar ? "العنوان" : "Address"}</p>
                                                <p className="text-xs font-medium text-slate-700 truncate">
                                                    {order.deliveryInfo?.address || order.deliveryInfo?.pickupPoint.stationName}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recipient */}
                                    <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                                        <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-slate-700 truncate">
                                                {order.deliveryInfo?.fullName || order.buyer?.fullName || "N/A"}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {order.deliveryInfo?.phoneNumber || order.buyer?.phone || "N/A"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* ── Status badges row ────────────────────── */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {/* Preparation */}
                                        <Badge variant="outline" className={`text-xs rounded-full px-2.5 py-0.5 border ${order.isPrepared ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                                            {order.isPrepared ? (ar ? "مجهز" : "Prepared") : (ar ? "قيد التجهيز" : "Preparing")}
                                        </Badge>

                                        {/* Payout */}
                                        <Badge variant="outline" className={`text-xs rounded-full px-2.5 py-0.5 border ${order.payoutProcessed ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                                            {order.payoutProcessed ? (ar ? "تم الدفع" : "Paid Out") : (ar ? "معلق" : "Payout Pending")}
                                        </Badge>

                                        {/* Activated */}
                                        <Badge variant="outline" className={`text-xs rounded-full px-2.5 py-0.5 border ${order.wasActivated ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
                                            {ar ? "تفعيل:" : "Act:"} {order.activateCount || 0}
                                        </Badge>

                                        {/* Cancelled */}
                                        <Badge variant="outline" className={`text-xs rounded-full px-2.5 py-0.5 border ${order.wasCanceled ? "bg-red-50 text-red-700 border-red-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
                                            {ar ? "إلغاء:" : "Can:"} {order.cancelCount || 0}
                                        </Badge>
                                    </div>

                                    {/* Secret code */}
                                    <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                                        <span className="text-xs text-slate-400">{ar ? "كود التوصيل" : "Delivery Code"}</span>
                                        <code className="text-xs font-mono font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-lg">
                                            {order.secretCode}
                                        </code>
                                    </div>

                                    {/* ── Interactive controls ──────────────────── */}
                                    <div
                                        className="grid grid-cols-1 gap-2 pt-1"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* Payment status select */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-400 w-24 shrink-0">
                                                {ar ? "حالة الدفع" : "Payment Status"}
                                            </span>
                                            <Select
                                                value={order.paymentStatus || "pending"}
                                                onValueChange={(value) => updatePaymentStatus(order._id, value)}
                                            >
                                                <SelectTrigger className="h-9 flex-1 rounded-xl border-slate-200 bg-white text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="pending">{ar ? "قيد الانتظار" : "Pending"}</SelectItem>
                                                    <SelectItem value="paid">{ar ? "مدفوع" : "Paid"}</SelectItem>
                                                    <SelectItem value="failed">{ar ? "فشل" : "Failed"}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Delivery status select */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-400 w-24 shrink-0">
                                                {ar ? "حالة التوصيل" : "Delivery Status"}
                                            </span>
                                            <Select
                                                value={order.deliveryStatus || "pending"}
                                                onValueChange={(value) => updateDeliveryStatus(order._id, value)}
                                            >
                                                <SelectTrigger className="h-9 flex-1 rounded-xl border-slate-200 bg-white text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="pending">{ar ? "قيد الانتظار" : "Pending"}</SelectItem>
                                                    <SelectItem value="shipped">{ar ? "تم الشحن" : "Shipped"}</SelectItem>
                                                    <SelectItem value="delivered">{ar ? "تم التوصيل" : "Delivered"}</SelectItem>
                                                    <SelectItem value="cancelled">{ar ? "ملغي" : "Cancelled"}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Complete button */}
                                        <Button
                                            variant="default"
                                            size="sm"
                                            onClick={() => orderComplete(order._id, order.secretCode)}
                                            disabled={order.deliveryStatus === "delivered"}
                                            className={`w-full h-10 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] ${order.deliveryStatus === "delivered"
                                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                                                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                                }`}
                                        >
                                            {order.deliveryStatus === "delivered"
                                                ? <><CheckCircle2 className="h-4 w-4 mr-1.5" />{ar ? "مكتمل" : "Completed"}</>
                                                : <><Clock className="h-4 w-4 mr-1.5" />{ar ? "إكمال الطلب" : "Complete Order"}</>
                                            }
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Pagination ───────────────────────────────────────── */}
            {!loadingOrders && orders.length > 0 && (
                <PaginationControls
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={onPageChange}
                    className="justify-end pt-2"
                />
            )}
        </div>
    );
}
"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, RotateCcw, Truck, CheckCircle, XCircle, Clock, ArrowLeft, Package, Home, Store, Eye, EyeOff, Copy, QrCode } from "lucide-react"
import { format } from "date-fns"
import { useLanguage } from "@/components/language-provider"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { orderService } from "@/lib/api"
import { QRCodeSVG } from "qrcode.react"
import Image from "next/image"
import Link from "next/link"

type DeliveryStatus = 'pending' | 'shipped' | 'delivered' | 'cancelled'
type PaymentStatus = 'pending' | 'paid' | 'failed'
type PaymentMethod = 'cash' | 'card'
type DeliveryMethod = 'home' | 'pickup'

interface OrderItem {
    _id: string
    product: {
        _id: string
        title: string
        titleEn?: string
        price: number
        images: string[]
    }
    seller: {
        _id: string
        name: string
        email: string
        phone?: string
    }
    quantity: number
    price: number
    color?: string
    size?: string
    isPrepared: boolean
}

interface OrderDetails {
    _id: string
    buyer: {
        _id: string
        name: string
        email: string
        phone?: string
    }
    items: OrderItem[]
    deliveryInfo: {
        fullName: string
        phoneNumber: string
        address: string
        pickupPoint?: {
            _id: string
            stationName: string
            address: string
            phone: string
        }
    }
    paymentMethod: PaymentMethod
    paymentStatus: PaymentStatus
    deliveryMethod: DeliveryMethod
    deliveryStatus: DeliveryStatus
    subtotal: number
    discount: number
    coupon?: {
        discountAmount: number
    }
    shippingFee: number
    total: number
    payoutProcessed: boolean
    isPrepared: boolean
    secretCode: string
    createdAt: string
    updatedAt: string
}

export default function OrderDetailsPage() {
    const { id } = useParams()
    const router = useRouter()
    const { t } = useLanguage()
    const [order, setOrder] = useState<OrderDetails | null>(null)
    const [loading, setLoading] = useState(true)
    const [showSecretCode, setShowSecretCode] = useState(false)

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                setLoading(true)
                const idStr = Array.isArray(id) ? id[0] : id;
                if (!idStr) throw new Error('Invalid order id');
                const response = await orderService.getOrderById(idStr as string);

                if (response?.data) {
                    setOrder(response.data);
                } else {
                    console.error('No data found in response:', response);
                    toast.error('حدث خطأ أثناء جلب تفاصيل الطلب')
                }
            } catch (error) {
                console.error('Error fetching order details:', error)
                toast.error('حدث خطأ أثناء جلب تفاصيل الطلب')
            } finally {
                setLoading(false)
            }
        }

        fetchOrderDetails()
    }, [id, t])

    useEffect(() => {
        // Order state updated
    }, [order]);

    const getDeliveryStatusInfo = (status: DeliveryStatus) => {
        switch (status) {
            case 'pending':
                return {
                    text: 'قيد الانتظار',
                    color: 'bg-yellow-100 text-yellow-800',
                    icon: <Clock className="h-4 w-4" />
                }
            case 'shipped':
                return {
                    text: 'تم الشحن',
                    color: 'bg-blue-100 text-blue-800',
                    icon: <Truck className="h-4 w-4" />
                }
            case 'delivered':
                return {
                    text: 'تم التوصيل',
                    color: 'bg-green-100 text-green-800',
                    icon: <CheckCircle className="h-4 w-4" />
                }
            case 'cancelled':
                return {
                    text: 'ملغي',
                    color: 'bg-red-100 text-red-800',
                    icon: <XCircle className="h-4 w-4" />
                }
            default:
                return {
                    text: 'غير معروف',
                    color: 'bg-gray-100 text-gray-800',
                    icon: null
                }
        }
    }

    const getPaymentStatusInfo = (status: PaymentStatus) => {
        switch (status) {
            case 'paid':
                return {
                    text: 'مدفوع',
                    color: 'bg-green-100 text-green-800'
                }
            case 'pending':
                return {
                    text: 'قيد الانتظار',
                    color: 'bg-yellow-100 text-yellow-800'
                }
            case 'failed':
                return {
                    text: 'فشل الدفع',
                    color: 'bg-red-100 text-red-800'
                }
            default:
                return {
                    text: 'غير معروف',
                    color: 'bg-gray-100 text-gray-800'
                }
        }
    }

    const getPaymentMethodInfo = (method: PaymentMethod) => {
        switch (method) {
            case 'cash':
                return 'الدفع عند الاستلام'
            case 'card':
                return 'بطاقة ائتمان'
            default:
                return method
        }
    }

    const getDeliveryMethodInfo = (method: DeliveryMethod) => {
        switch (method) {
            case 'home':
                return {
                    text: 'توصيل للمنزل',
                    icon: <Home className="h-4 w-4" />
                }
            case 'pickup':
                return {
                    text: 'استلام من نقطة التوصيل',
                    icon: <Store className="h-4 w-4" />
                }
            default:
                return {
                    text: method,
                    icon: <Package className="h-4 w-4" />
                }
        }
    }

    const toggleSecretCode = () => {
        setShowSecretCode(!showSecretCode);
    }

    const formatSecretCode = (code: string) => {
        if (!showSecretCode) {
            return '••••••••';
        }
        return code;
    }

    if (loading) {
        return (
            <div className="container mx-auto py-12 flex justify-center items-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground text-sm sm:text-base">جاري تحميل تفاصيل الطلب...</p>
                </div>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="container mx-auto py-12 px-4 text-center">
                <h2 className="text-xl sm:text-2xl font-bold mb-4">الطلب غير موجود</h2>
                <p className="text-muted-foreground mb-6 text-sm sm:text-base">عذراً، لا يمكن العثور على تفاصيل الطلب المطلوبة</p>
                <Button className="w-full sm:w-auto" onClick={() => router.push('/profile/orders')}>
                    العودة إلى طلباتي
                </Button>
            </div>
        )
    }

    const deliveryStatusInfo = getDeliveryStatusInfo(order.deliveryStatus)
    const paymentStatusInfo = getPaymentStatusInfo(order.paymentStatus)
    const deliveryMethodInfo = getDeliveryMethodInfo(order.deliveryMethod)
    const qrPayload = JSON.stringify({ orderId: order._id, secretCode: order.secretCode })

    return (
        <div className="container mx-auto py-4 sm:py-8 px-3 sm:px-4">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-lg sm:text-2xl font-bold flex items-center flex-wrap gap-2 break-all">
                        <span>تفاصيل الطلب رقم</span>
                        <span className="text-primary font-mono">#{order._id.slice(0, 8)}</span>
                        <Button
                            size="icon"
                            variant="secondary"
                            onClick={() => {
                                navigator.clipboard.writeText(order._id);
                                toast.success("تم نسخ رقم الطلب كاملاً")
                            }}
                            className="h-7 w-7 rounded-md"
                            title="نسخ رقم الطلب كاملاً"
                        >
                            <Copy className="h-3.5 w-3.5" />
                        </Button>
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Order Summary & Delivery Info Column */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                    {/* Order Summary Card */}
                    <Card>
                        <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                <CardTitle className="text-base sm:text-lg">ملخص الطلب</CardTitle>
                                <div className="flex items-center gap-2 self-start sm:self-auto">
                                    <Badge className={`${deliveryStatusInfo.color} flex items-center gap-1.5 py-1 px-2.5 text-xs font-medium`}>
                                        {deliveryStatusInfo.icon}
                                        <span>{deliveryStatusInfo.text}</span>
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                            <div className="space-y-4">
                                <div className="divide-y divide-gray-100">
                                    {order.items.map((item) => (
                                        <div key={item._id} className="flex gap-3 sm:gap-4 py-4 first:pt-0 last:pb-0">
                                            {/* Product Image */}
                                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                                                <Image
                                                    src={item.product.images?.[0] || '/placeholder-product.jpg'}
                                                    alt={item.product.title}
                                                    fill
                                                    className="object-cover"
                                                    sizes="(max-width: 640px) 64px, 80px"
                                                />
                                            </div>
                                            {/* Product Details */}
                                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 mb-1">
                                                        <h3 className="font-medium text-sm sm:text-base text-gray-900 line-clamp-2 leading-tight">
                                                            {item.product.title}
                                                        </h3>
                                                        {/* SKU / Product ID */}
                                                        <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                                                            <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                                                                رقم المنتج:
                                                            </span>
                                                            <div
                                                                className="flex items-center gap-1 bg-gray-50 hover:bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-colors border border-gray-200/60"
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(item.product._id);
                                                                    toast.success("تم نسخ رقم المنتج")
                                                                }}
                                                                title="انقر للنسخ"
                                                            >
                                                                <span>#{item.product._id?.substring(0, 6)}...</span>
                                                                <Copy className="h-2.5 w-2.5 text-gray-400" />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Variant Badges */}
                                                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                        <span className="text-xs text-muted-foreground bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                                            الكمية: {item.quantity}
                                                        </span>
                                                        {item.color && (
                                                            <Badge variant="outline" className="text-[11px] px-1.5 py-0 font-normal">
                                                                اللون: {item.color}
                                                            </Badge>
                                                        )}
                                                        {item.size && (
                                                            <Badge variant="outline" className="text-[11px] px-1.5 py-0 font-normal">
                                                                المقاس: {item.size}
                                                            </Badge>
                                                        )}
                                                        {item.isPrepared && (
                                                            <Badge className="bg-green-50 text-green-700 border border-green-200 shadow-none text-[11px] px-1.5 py-0 font-medium">
                                                                تم التجهيز
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="font-semibold text-sm sm:text-base text-gray-900 mt-2">
                                                    {item.price * item.quantity} ج.م
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Financials Breakdown */}
                                <div className="pt-4 border-t space-y-2.5 text-sm sm:text-base">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>المجموع الفرعي</span>
                                        <span className="font-medium text-gray-900">{order.subtotal} ج.م</span>
                                    </div>
                                    <div className="flex justify-between text-green-600">
                                        <span>الخصم</span>
                                        <span className="font-medium">-{order.discount} ج.م</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>الشحن</span>
                                        <span className="font-medium text-gray-900">{order.shippingFee} ج.م</span>
                                    </div>
                                    <Separator className="my-2" />
                                    <div className="flex justify-between font-bold text-base sm:text-lg text-gray-950">
                                        <span>الإجمالي</span>
                                        <span>{order.total} ج.م</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Delivery Info Card */}
                    <Card>
                        <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                {deliveryMethodInfo.icon}
                                <span>معلومات التوصيل</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 text-sm sm:text-base">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="font-normal text-xs px-2.5 py-0.5">
                                        {deliveryMethodInfo.text}
                                    </Badge>
                                </div>

                                {order.deliveryMethod === 'home' ? (
                                    <div className="space-y-2 text-gray-700 bg-gray-50/50 p-3 sm:p-4 rounded-xl border border-gray-100">
                                        <p className="font-semibold text-gray-900">{order.deliveryInfo?.fullName}</p>
                                        <p className="text-gray-600 text-sm leading-relaxed">{order.deliveryInfo?.address}</p>
                                        <p className="pt-1 text-sm">
                                            <span className="text-muted-foreground">الهاتف:</span> <span className="font-mono text-gray-900">{order.deliveryInfo?.phoneNumber}</span>
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 text-gray-700 bg-gray-50/50 p-3 sm:p-4 rounded-xl border border-gray-100">
                                        <p className="font-semibold text-gray-900">{order.deliveryInfo?.pickupPoint?.stationName}</p>
                                        <p className="text-gray-600 text-sm leading-relaxed">{order.deliveryInfo.pickupPoint?.address}</p>
                                        <p className="text-sm">
                                            <span className="text-muted-foreground">الهاتف:</span> <span className="font-mono text-gray-900">{order.deliveryInfo?.pickupPoint?.phone}</span>
                                        </p>
                                        <p className="pt-1 text-sm border-t border-gray-200/60 mt-2">
                                            <span className="font-medium text-gray-600">المستلم:</span> {order.deliveryInfo?.fullName}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Payment & Actions Side Column */}
                <div className="space-y-4 sm:space-y-6">
                    {/* Payment Info Card */}
                    <Card>
                        <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
                            <CardTitle className="text-base sm:text-lg">معلومات الدفع</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 text-sm">
                            <div className="space-y-3.5">
                                <div className="flex justify-between items-center gap-2">
                                    <span className="text-muted-foreground">طريقة الدفع</span>
                                    <span className="font-medium text-gray-900">{getPaymentMethodInfo(order.paymentMethod)}</span>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                    <span className="text-muted-foreground">حالة الدفع</span>
                                    <Badge className={`${paymentStatusInfo.color} font-normal text-xs px-2 py-0`}>
                                        {paymentStatusInfo.text}
                                    </Badge>
                                </div>
                                {order.payoutProcessed && (
                                    <div className="flex justify-between items-center gap-2">
                                        <span className="text-muted-foreground">تم تحويل الأرباح</span>
                                        <Badge className="bg-green-100 text-green-800 font-normal text-xs px-2 py-0">
                                            مكتمل
                                        </Badge>
                                    </div>
                                )}
                                <div className="flex justify-between items-center gap-2">
                                    <span className="text-muted-foreground">تاريخ الطلب</span>
                                    <span className="font-mono text-gray-900">{format(new Date(order.createdAt), 'dd/MM/yyyy')}</span>
                                </div>

                                {/* Secret Code Section */}
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border p-3 rounded-xl bg-gray-50 mt-4">
                                    <span className="text-muted-foreground font-medium shrink-0">الكود السري</span>
                                    <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                                        <Badge
                                            variant="outline"
                                            className="font-mono text-sm sm:text-base py-1 px-3 rounded-lg bg-white shadow-sm border-gray-300 flex-1 sm:flex-initial text-center justify-center min-w-[90px]"
                                        >
                                            {showSecretCode ? formatSecretCode(order.secretCode) : "••••••"}
                                        </Badge>
                                        <div className="flex gap-1.5 shrink-0">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={toggleSecretCode}
                                                className="h-8 w-8 rounded-lg border-gray-300 hover:bg-gray-100 bg-white"
                                            >
                                                {showSecretCode ? (
                                                    <EyeOff className="h-4 w-4 text-gray-600" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-gray-600" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(order.secretCode);
                                                    toast.success("تم نسخ الكود السري");
                                                }}
                                                className="h-8 w-8 rounded-lg border-gray-300 hover:bg-gray-100 bg-white"
                                            >
                                                <Copy className="h-4 w-4 text-gray-600" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* QR Code Card */}
                    <Card>
                        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <QrCode className="h-5 w-5 text-gray-700" />
                                <span>QR Code للطلب</span>
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                استخدم هذا الكود لتحقيق الطلب عند الاستلام
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 pt-2 flex flex-col items-center space-y-3">
                            <div className="p-3 sm:p-4 bg-white rounded-xl border border-gray-200 shadow-sm max-w-full overflow-hidden flex justify-center items-center">
                                <QRCodeSVG
                                    value={qrPayload}
                                    size={180}
                                    level="H"
                                    includeMargin={true}
                                    style={{ maxWidth: '100%', height: 'auto' }}
                                />
                            </div>
                            <p className="text-xs text-center text-muted-foreground leading-normal max-w-[240px]">
                                يمكن للمسوق مسح هذا الكود عند تسليم الطلب
                            </p>
                        </CardContent>
                    </Card>

                    {/* Dynamic Action Buttons */}
                    <div className="space-y-2">
                        {order.deliveryStatus === 'delivered' && (
                            <Button className="w-full" variant="outline" onClick={() => router.push(`/profile/orders/${order._id}/review`)}>
                                تقييم الطلب
                            </Button>
                        )}
                        {order.deliveryStatus === 'pending' && (
                            <Button className="w-full" variant="destructive" onClick={() => {
                                // أضف منطق إلغاء الطلب هنا
                                toast.info("ميزة إلغاء الطلب غير متوفرة حالياً");
                            }}>
                                إلغاء الطلب
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
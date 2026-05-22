"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from "sonner";
import { format } from 'date-fns';
import { returnService } from '@/lib/api';
import { MirvoryPageLoader } from '@/components/MirvoryLoader';

interface ReturnRequest {
    _id: string;

    user: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
    };

    order: {
        _id: string;
        orderNumber: string;
        totalPrice: number;
    };

    product: {
        _id: string;
        name: string;
        image: string;
        price: number;
    };

    seller: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
    };

    item: string;

    reason: string;

    images: string[];

    status: 'pending' | 'approved' | 'rejected' | 'processing' | 'processed';

    refundAmount: number;
    refundStatus: string;

    deleteAt?: string;

    createdAt: string;
    updatedAt: string;

    rejectionReason?: string;
}
export default function ReturnDetailsPage() {
    const [returnRequest, setReturnRequest] = useState<ReturnRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
    const { id } = useParams();
    const router = useRouter();

    useEffect(() => {
        const fetchReturnDetails = async () => {
            try {
                if (!id) {
                    toast.error('معرف طلب الإرجاع غير موجود');
                    router.push('/returns');
                    return;
                }

                const response = await returnService.getReturnRequestById(id as string);
                console.log(response, 'kllll')
                if (response?.data) {
                    setReturnRequest(response.data);
                    generateStatusHistory(response.data);
                } else {
                    toast.error('لم يتم العثور على طلب الإرجاع');
                    // router.push('/returns');
                }
            } catch (error) {
                console.error('Error fetching return details:', error);
                toast.error('فشل في تحميل تفاصيل طلب الإرجاع');
                router.push('/returns');
            } finally {
                setLoading(false);
            }
        };

        fetchReturnDetails();
    }, [id, router]);

    const generateStatusHistory = (returnData: ReturnRequest) => {
        const history: StatusHistory[] = [
            {
                status: 'pending',
                date: returnData.createdAt,
                note: 'تم إنشاء طلب الإرجاع'
            }
        ];

        // Add statuses based on current status with more realistic dates
        if (returnData.status !== 'pending') {
            history.push({
                status: 'approved',
                date: new Date(new Date(returnData.createdAt).getTime() + 24 * 60 * 60 * 1000).toISOString(), // 1 day after creation
                note: 'تمت الموافقة على طلب الإرجاع'
            });
        }

        if (['processing', 'ready_for_pickup', 'received', 'finished'].includes(returnData.status)) {
            history.push({
                status: 'processing',
                date: new Date(new Date(returnData.createdAt).getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days after creation
                note: 'جاري معالجة الإرجاع'
            });
        }

        if (returnData.status === 'ready_for_pickup') {
            history.push({
                status: 'ready_for_pickup',
                date: new Date(new Date(returnData.createdAt).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days after creation
                note: 'المنتج جاهز للاستلام'
            });
        }

        if (returnData.status === 'received') {
            history.push({
                status: 'received',
                date: new Date(new Date(returnData.createdAt).getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days after creation
                note: 'تم استلام المنتج'
            });
        }

        if (returnData.status === 'finished') {
            history.push({
                status: 'finished',
                date: returnData.updatedAt,
                note: 'تم إكمال عملية الإرجاع'
            });
        }

        if (returnData.status === 'rejected') {
            history.push({
                status: 'rejected',
                date: returnData.updatedAt,
                note: 'تم رفض طلب الإرجاع'
            });
        }

        setStatusHistory(history);
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'approved':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'processing':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'ready_for_pickup':
                return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            case 'received':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'rejected':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'finished':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusText = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'قيد المراجعة';
            case 'approved':
                return 'تم الموافقة';
            case 'processing':
                return 'قيد المعالجة';
            case 'ready_for_pickup':
                return 'جاهز للاستلام';
            case 'received':
                return 'تم الاستلام';
            case 'rejected':
                return 'مرفوض';
            case 'finished':
                return 'مكتمل';
            default:
                return status;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return '⏳';
            case 'approved':
                return '✅';
            case 'processing':
                return '🔄';
            case 'ready_for_pickup':
                return '📦';
            case 'received':
                return '📥';
            case 'rejected':
                return '❌';
            case 'finished':
                return '🎉';
            default:
                return '📋';
        }
    };

    const handleContactSupport = () => {
        toast.info('سيتم فتح نموذج الاتصال بدعم العملاء');
        // You can implement actual contact support logic here
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDeleteReturn = async () => {
        if (!returnRequest) return;

        if (confirm('هل أنت متأكد من حذف طلب الإرجاع هذا؟')) {
            try {
                await returnService.deleteReturnRequest(returnRequest._id);
                toast.success('تم حذف طلب الإرجاع');
                router.push('/returns');
            } catch (error) {
                console.error('Error deleting return request:', error);
                toast.error('فشل في حذف طلب الإرجاع');
            }
        }
    };

    if (loading) {
        return <MirvoryPageLoader text={"جاري تحميل تفاصيل طلب الإرجاع..."} />;
    }

    if (!returnRequest) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">طلب الإرجاع غير موجود</h2>
                    <button
                        onClick={() => router.push('/returns')}
                        className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                    >
                        العودة إلى طلبات الإرجاع
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
                <div>
                    <button
                        onClick={() => router.push('/returns')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        العودة إلى طلبات الإرجاع
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">تفاصيل طلب الإرجاع</h1>
                    <p className="text-gray-600 mt-2">رقم الطلب: #{returnRequest._id.slice(-8).toUpperCase()}</p>
                </div>
                <div className="flex gap-3 mt-4 lg:mt-0">
                    {/* <button
                        onClick={handlePrint}
                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        طباعة
                    </button> */}
                    <button
                        onClick={handleContactSupport}
                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        الاتصال بالدعم
                    </button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content - 2/3 width */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Status Card */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">حالة طلب الإرجاع</h2>
                            <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(returnRequest.status)}`}>
                                {getStatusText(returnRequest.status)}
                            </span>
                        </div>

                        {/* Status Timeline */}
                        <div className="space-y-4">
                            {statusHistory.map((historyItem, index) => (
                                <div key={index} className="flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${getStatusColor(historyItem.status)}`}>
                                        {getStatusIcon(historyItem.status)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-medium text-gray-900">{getStatusText(historyItem.status)}</h3>
                                            <span className="text-sm text-gray-500">
                                                {format(new Date(historyItem.date), 'yyyy/MM/dd - hh:mm a')}
                                            </span>
                                        </div>
                                        {historyItem.note && (
                                            <p className="text-sm text-gray-600 mt-1">{historyItem.note}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Product Information */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">معلومات المنتج</h2>
                        <div className="flex flex-col sm:flex-row gap-6">
                            <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                <img
                                    src={returnRequest.product.image || '/placeholder-product.jpg'}
                                    alt={returnRequest.product.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                                    }}
                                />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-medium text-gray-900 mb-2">{returnRequest.product.name}</h3>
                                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium text-gray-700">سعر المنتج:</span>
                                        <p className="text-gray-600">{returnRequest.product.price} ج.م</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">الكمية:</span>
                                        <p className="text-gray-600">{returnRequest.quantity || 1}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">رقم المنتج:</span>
                                        <p className="text-gray-600">{(returnRequest.product._id ?? '').slice(-6).toUpperCase()}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">رقم العنصر:</span>
                                        <p className="text-gray-600">{returnRequest.item.slice(-6).toUpperCase()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Return Details */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">تفاصيل الإرجاع</h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-medium text-gray-900 mb-2">سبب الإرجاع</h3>
                                <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">{returnRequest.reason}</p>
                            </div>
                            {returnRequest.additionalNotes && (
                                <div>
                                    <h3 className="font-medium text-gray-900 mb-2">ملاحظات إضافية</h3>
                                    <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">{returnRequest.additionalNotes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar - 1/3 width */}
                <div className="space-y-6">
                    {/* Order Information */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">معلومات الطلب</h2>
                        <div className="space-y-3">
                            <div>
                                <span className="font-medium text-gray-700">رقم الطلب الأصلي:</span>
                                <p className="text-gray-600">#{returnRequest.order?.orderNumber}</p>
                                <p className="text-gray-600">
                                    {returnRequest.order?.totalPrice} ج.م
                                </p>
                            </div>

                            <div>
                                <span className="font-medium text-gray-700">تاريخ الطلب:</span>
                                <p className="text-gray-600">{format(new Date(returnRequest.createdAt), 'yyyy/MM/dd')}</p>
                            </div>
                        </div>
                    </div>

                    {/* User Information */}
                    {/* <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">معلومات المستخدم</h2>
                        <div className="space-y-3">
                            <div>
                                <span className="font-medium text-gray-700">الاسم:</span>
                                <p className="text-gray-600">{returnRequest.username}</p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">البريد الإلكتروني:</span>
                                <p className="text-gray-600">{returnRequest.email}</p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">الهاتف:</span>
                                <p className="text-gray-600">{returnRequest.phone}</p>
                            </div>
                        </div>
                  
                    </div> */}

                    {/* 
                    Seller Information
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">معلومات البائع</h2>
                        <div className="space-y-3">
                            <div>
                                <span className="font-medium text-gray-700">اسم البائع:</span>
                                <p className="text-gray-600">{returnRequest.seller.name}</p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">البريد الإلكتروني:</span>
                                <p className="text-gray-600">{returnRequest.seller.email}</p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">رقم البائع:</span>
                                <p className="text-gray-600">{returnRequest.seller.slice(-6).toUpperCase()}</p>
                            </div>
                        </div>
                    </div> */}

                    {/* Refund Information */}
                    {/* {(returnRequest.refundAmount || returnRequest.status === 'finished') && (
                        <div className="bg-white border border-green-200 rounded-lg p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">معلومات الاسترداد</h2>
                            <div className="space-y-3">
                                {returnRequest.refundAmount && (
                                    <div>
                                        <span className="font-medium text-gray-700">المبلغ المسترد:</span>
                                        <p className="text-green-600 font-semibold">{returnRequest.refundAmount} ج.م</p>
                                    </div>
                                )}
                                {returnRequest.refundMethod && (
                                    <div>
                                        <span className="font-medium text-gray-700">طريقة الاسترداد:</span>
                                        <p className="text-gray-600">{returnRequest.refundMethod}</p>
                                    </div>
                                )}
                                {returnRequest.deleteAt && (
                                    <div>
                                        <span className="font-medium text-gray-700">تاريخ الانتهاء:</span>
                                        <p className="text-gray-600">{format(new Date(returnRequest.deleteAt), 'yyyy/MM/dd')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )} */}

                    {/* Quick Actions */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">إجراءات سريعة</h2>
                        <div className="space-y-3">
                            <button
                                onClick={() => router.push('/contact')}
                                className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                            >
                                الاتصال بالدعم
                            </button>
                            {(returnRequest.status === 'pending' || returnRequest.status === 'approved') && (
                                <button
                                    onClick={handleDeleteReturn}
                                    className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                                >
                                    حذف طلب الإرجاع
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { orderService, addressService, cartService, pickupPointService } from '@/lib/api'
import { useAuth } from "@/contexts/AuthProvider"
import { useLanguage } from "@/components/language-provider"
import { toast } from 'sonner'
import { GREATER_CAIRO_AREA, getCitiesByGovernorate } from '@/lib/data/greater-cairo-area'
import {
    Loader2, MapPin, User, ShoppingBag, CreditCard,
    Truck, Home, Store, ArrowRight, ArrowLeft, Package,
    Banknote, CheckCircle2
} from 'lucide-react'
import Image from 'next/image'

interface Address {
    _id: string
    address: string
    city: string
    state: string
    phoneNumber?: string
    fullName?: string
    isDefault?: boolean
}

interface PickupPoint {
    _id: string
    stationName: string
    address: string
    workingHours: string
    phone?: string
}

export default function Checkout() {
    const router = useRouter()
    const { user } = useAuth()
    const { language } = useLanguage()
    const isAr = language === 'ar'

    const [loading, setLoading] = useState(false)
    const [loadingData, setLoadingData] = useState(true)
    const [fullName, setFullName] = useState('')
    const [phone, setPhone] = useState('')
    const [deliveryMethod, setDeliveryMethod] = useState<'home' | 'pickup'>('home')
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash')

    const [addresses, setAddresses] = useState<Address[]>([])
    const [selectedAddressId, setSelectedAddressId] = useState('')
    const [addressMode, setAddressMode] = useState<'saved' | 'new'>('saved')

    const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([])
    const [selectedPickupPointId, setSelectedPickupPointId] = useState('')

    const [newAddress, setNewAddress] = useState({
        governorate: '',
        city: '',
        addressLine: '',
        fullName: '',
        phoneNumber: '',
    })

    const [cartItems, setCartItems] = useState<any[]>([])
    const [subtotal, setSubtotal] = useState(0)

    const shippingFee = useMemo(() => (subtotal > 500 || deliveryMethod === 'pickup' ? 0 : 70), [subtotal, deliveryMethod])
    const total = useMemo(() => subtotal + shippingFee, [subtotal, shippingFee])

    const handleNewAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setNewAddress(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'governorate' ? { city: '' } : {})
        }))
    }

    const availableCities = useMemo(() => {
        if (!newAddress.governorate) return []
        return getCitiesByGovernorate(newAddress.governorate)
    }, [newAddress.governorate])

    useEffect(() => {
        const loadCheckoutData = async () => {
            try {
                setLoadingData(true)
                const cartRes = await cartService.getCart()
                const items = cartRes?.data?.items || []
                setCartItems(items)

                const sub = items.reduce((acc: number, item: any) =>
                    acc + ((item?.price ?? item?.product?.price ?? 0) * (item?.quantity ?? 1)), 0
                )
                setSubtotal(sub)

                const addrRes = await addressService.getAddresses()
                const addrs = addrRes?.data?.data || []
                setAddresses(addrs)

                if (addrs.length > 0) {
                    const defaultAddr = addrs.find((a: Address) => a.isDefault) || addrs[0]
                    setSelectedAddressId(defaultAddr._id)
                    setAddressMode('saved')
                } else {
                    setAddressMode('new')
                }

                try {
                    const pickupRes = await pickupPointService.getPickupPoints()
                    setPickupPoints(pickupRes?.data || [])
                    if (pickupRes?.data?.[0]) setSelectedPickupPointId(pickupRes.data[0]._id)
                } catch (pErr) {
                    console.error("Pickup points fetch error", pErr)
                }

                if (user) {
                    setFullName(`${user.firstName || ''} ${user.lastName || ''}`.trim())
                    setPhone(user.phone || '')
                }
            } catch (err) {
                console.error('Failed to load checkout data:', err)
                toast.error(isAr ? 'فشل تحميل البيانات' : 'Failed to load data')
            } finally {
                setLoadingData(false)
            }
        }
        loadCheckoutData()
    }, [user, isAr])

    const handleSubmit = useCallback(async () => {
        if (!fullName.trim()) {
            toast.error(isAr ? 'الرجاء إدخال الاسم بالكامل' : 'Please enter your full name')
            return
        }

        const phoneRegex = /^01[0125][0-9]{8}$/
        let finalPhone = phone.trim()

        if (!finalPhone || !phoneRegex.test(finalPhone)) {
            toast.error(isAr ? 'الرجاء إدخال رقم هاتف محمول صحيح' : 'Please enter a valid phone number')
            return
        }

        let finalAddressStr = undefined
        let finalFullName = fullName.trim()

        if (deliveryMethod === 'home') {
            if (addressMode === 'saved') {
                if (!selectedAddressId) {
                    toast.error(isAr ? 'الرجاء اختيار عنوان التوصيل' : 'Please select a delivery address')
                    return
                }
                const targetAddress = addresses.find(a => a._id === selectedAddressId)
                if (targetAddress) {
                    finalAddressStr = `${targetAddress.address}, ${targetAddress.city}, ${targetAddress.state}`
                    if (targetAddress.phoneNumber) finalPhone = targetAddress.phoneNumber
                    if (targetAddress.fullName) finalFullName = targetAddress.fullName
                }
            } else {
                if (!newAddress.governorate || !newAddress.city || !newAddress.addressLine) {
                    toast.error(isAr ? 'الرجاء إكمال بيانات العنوان الجديد بالكامل' : 'Please complete all new address fields')
                    return
                }
                finalAddressStr = `${newAddress.addressLine}, ${newAddress.city}, ${newAddress.governorate}`
                if (newAddress.phoneNumber && phoneRegex.test(newAddress.phoneNumber.trim())) {
                    finalPhone = newAddress.phoneNumber.trim()
                }
                if (newAddress.fullName.trim()) {
                    finalFullName = newAddress.fullName.trim()
                }
            }
        } else if (deliveryMethod === 'pickup' && !selectedPickupPointId) {
            toast.error(isAr ? 'الرجاء اختيار نقطة الاستلام المعتمدة' : 'Please select a pickup point')
            return
        }

        try {
            setLoading(true)
            const orderPayload = {
                deliveryMethod,
                paymentMethod,
                deliveryInfo: {
                    fullName: finalFullName,
                    phone: finalPhone,
                    address: finalAddressStr,
                    pickupPoint: deliveryMethod === 'pickup' ? selectedPickupPointId : undefined
                }
            }

            const response = await orderService.createOrder(orderPayload)
            if (response.data) {
                toast.success(isAr ? 'تم تسجيل طلبك بنجاح' : 'Order placed successfully')
                const orderId = response.data?.data?._id || response.data?._id || response.data?.order?._id
                router.push(`/orders/${orderId}`)
            }
        } catch (error: any) {
            console.error("Order creation failed error response:", error?.response?.data)
            toast.error(error?.response?.data?.message || (isAr ? 'فشل في إنشاء الطلب، حاول ثانية' : 'Failed to process order'))
        } finally {
            setLoading(false)
        }
    }, [fullName, phone, deliveryMethod, paymentMethod, selectedAddressId, selectedPickupPointId, addresses, newAddress, addressMode, isAr, router])

    if (loadingData) {
        return (
            <div className="min-h-screen bg-[#eee] flex items-center justify-center" dir={isAr ? "rtl" : "ltr"}>
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-sm text-gray-600 font-medium">{isAr ? "جاري التحميل..." : "Loading..."}</p>
                </div>
            </div>
        )
    }

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-[#eee] flex items-center justify-center px-4" dir={isAr ? "rtl" : "ltr"}>
                <div className="text-center space-y-4 max-w-sm bg-white p-8 rounded-2xl shadow-sm">
                    <ShoppingBag className="h-10 w-10 text-gray-400 mx-auto" />
                    <h2 className="text-xl font-bold">{isAr ? "سلة التسوق فارغة" : "Cart is empty"}</h2>
                    <Button onClick={() => router.push('/products')} className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl">
                        {isAr ? "العودة للتسوق" : "Back to shop"}
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <section className="min-h-screen bg-[#eee] py-8 lg:py-12 antialiased" dir={isAr ? "rtl" : "ltr"}>
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="bg-white rounded-[1.5rem] shadow-lg overflow-hidden flex flex-col lg:flex-row min-h-[80vh]">

                    {/* Left Column - Forms (Order Details) */}
                    <div className="w-full lg:w-10/12 p-6 lg:p-10 bg-white">

                        {/* Header */}
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-gray-800 hover:text-blue-600 transition-colors font-medium text-lg mb-6"
                        >
                            {isAr ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
                            {isAr ? "مواصلة التسوق" : "Continue shopping"}
                        </button>

                        <hr className="mb-6 border-gray-200" />

                        <div className="mb-6 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">{isAr ? "إتمام الطلب" : "Checkout"}</h2>
                                <p className="text-gray-500 text-sm mt-1">{isAr ? `لديك ${cartItems.length} عناصر في السلة` : `You have ${cartItems.length} items in your cart`}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* 1. Customer Information Card */}
                            <div className="border border-gray-200 rounded-2xl p-5">
                                <h3 className="font-bold flex items-center gap-2 mb-4 text-gray-800">
                                    <User className="w-5 h-5 text-blue-600" />
                                    {isAr ? "معلومات الاتصال" : "Contact Information"}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs text-gray-500 mb-1 block">{isAr ? "الاسم الكامل" : "Full Name"}</Label>
                                        <Input
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder={isAr ? "الاسم الأول واللقب" : "John Doe"}
                                            className="h-12 bg-gray-50 rounded-xl"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs text-gray-500 mb-1 block">{isAr ? "رقم الهاتف" : "Phone"}</Label>
                                        <Input
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="01XXXXXXXXX"
                                            className="h-12 bg-gray-50 rounded-xl text-left"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 2. Delivery Method Card */}
                            <div className="border border-gray-200 rounded-2xl p-5">
                                <h3 className="font-bold flex items-center gap-2 mb-4 text-gray-800">
                                    <Truck className="w-5 h-5 text-blue-600" />
                                    {isAr ? "طريقة التوصيل" : "Delivery Method"}
                                </h3>

                                <RadioGroup
                                    value={deliveryMethod}
                                    onValueChange={(v) => setDeliveryMethod(v as 'home' | 'pickup')}
                                    className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5"
                                >
                                    <Label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${deliveryMethod === 'home' ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600' : 'border-gray-200 hover:border-blue-300'}`}>
                                        <RadioGroupItem value="home" id="home" className="sr-only" />
                                        <Home className={`w-6 h-6 ${deliveryMethod === 'home' ? 'text-blue-600' : 'text-gray-400'}`} />
                                        <div>
                                            <p className="font-bold text-sm text-gray-800">{isAr ? "توصيل للمنزل" : "Home Delivery"}</p>
                                        </div>
                                    </Label>
                                    <Label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${deliveryMethod === 'pickup' ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600' : 'border-gray-200 hover:border-blue-300'}`}>
                                        <RadioGroupItem value="pickup" id="pickup" className="sr-only" />
                                        <Store className={`w-6 h-6 ${deliveryMethod === 'pickup' ? 'text-blue-600' : 'text-gray-400'}`} />
                                        <div>
                                            <p className="font-bold text-sm text-gray-800">{isAr ? "استلام من الفرع" : "Store Pickup"}</p>
                                        </div>
                                    </Label>
                                </RadioGroup>

                                {/* Address Details */}
                                {deliveryMethod === 'home' && (
                                    <div className="mt-4 animate-in fade-in">
                                        <div className="flex bg-gray-100 p-1 rounded-xl w-fit mb-4">
                                            {addresses.length > 0 && (
                                                <button onClick={() => setAddressMode('saved')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${addressMode === 'saved' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                                    {isAr ? "العناوين المحفوظة" : "Saved Addresses"}
                                                </button>
                                            )}
                                            <button onClick={() => setAddressMode('new')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${addressMode === 'new' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                                {isAr ? "عنوان جديد" : "New Address"}
                                            </button>
                                        </div>

                                        {addressMode === 'saved' && addresses.length > 0 && (
                                            <div className="grid grid-cols-1 gap-3">
                                                {addresses.map((addr) => (
                                                    <div key={addr._id} onClick={() => setSelectedAddressId(addr._id)} className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedAddressId === addr._id ? 'border-blue-600 bg-blue-50/30 ring-1 ring-blue-600' : 'border-gray-200 hover:border-blue-300'}`}>
                                                        <p className="font-bold text-gray-800 text-sm mb-1">{addr.address}</p>
                                                        <p className="text-xs text-gray-500">{addr.city}، {addr.state}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {addressMode === 'new' && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                                                <div>
                                                    <Label className="text-xs text-gray-500 mb-1 block">{isAr ? "المحافظة" : "Governorate"}</Label>
                                                    <div className="relative">
                                                        <select
                                                            name="governorate"
                                                            value={newAddress.governorate}
                                                            onChange={handleNewAddressChange}
                                                            className="w-full h-12 rounded-xl border-gray-200 bg-white px-4 text-sm outline-none border focus:border-blue-600 focus:ring-1 focus:ring-blue-600 appearance-none"
                                                        >
                                                            <option value="" disabled>{isAr ? "اختر المحافظة" : "Select..."}</option>
                                                            {GREATER_CAIRO_AREA.map((gov) => (
                                                                <option key={gov.id} value={gov.id}>
                                                                    {gov.nameAr}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <MapPin className={`absolute ${isAr ? 'left-4' : 'right-4'} top-3.5 h-5 w-5 text-gray-400 pointer-events-none`} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-gray-500 mb-1 block">{isAr ? "المنطقة" : "City"}</Label>
                                                    <div className="relative">
                                                        <select
                                                            name="city"
                                                            value={newAddress.city}
                                                            onChange={handleNewAddressChange}
                                                            disabled={!newAddress.governorate}
                                                            className="w-full h-12 rounded-xl border-gray-200 bg-white px-4 text-sm outline-none border focus:border-blue-600 focus:ring-1 focus:ring-blue-600 appearance-none disabled:bg-gray-100 disabled:opacity-50"
                                                        >
                                                            <option value="" disabled>{isAr ? "اختر المنطقة" : "Select..."}</option>
                                                            {availableCities.map((city) => (
                                                                <option key={city.id} value={city.id}>
                                                                    {city.nameAr}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <MapPin className={`absolute ${isAr ? 'left-4' : 'right-4'} top-3.5 h-5 w-5 text-gray-400 pointer-events-none`} />
                                                    </div>
                                                </div>
                                                <div className="sm:col-span-2">
                                                    <Label className="text-xs text-gray-500 mb-1 block">{isAr ? "العنوان بالتفصيل" : "Address details"}</Label>
                                                    <Input
                                                        name="addressLine"
                                                        value={newAddress.addressLine}
                                                        onChange={handleNewAddressChange}
                                                        placeholder={isAr ? "رقم المبنى، الشارع، علامة مميزة..." : "Building, Street..."}
                                                        className="h-12 bg-white rounded-xl border-gray-200"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Pickup Details */}
                                {deliveryMethod === 'pickup' && (
                                    <div className="mt-4 space-y-3 animate-in fade-in">
                                        {pickupPoints.map((point) => (
                                            <div key={point._id} onClick={() => setSelectedPickupPointId(point._id)} className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedPickupPointId === point._id ? 'border-blue-600 bg-blue-50/30 ring-1 ring-blue-600' : 'border-gray-200 hover:border-blue-300'}`}>
                                                <h4 className="font-bold text-gray-800 text-sm">{point.stationName}</h4>
                                                <p className="text-xs text-gray-500 mt-1">{point.address}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 3. Payment Method Card */}
                            <div className="border border-gray-200 rounded-2xl p-5">
                                <h3 className="font-bold flex items-center gap-2 mb-4 text-gray-800">
                                    <CreditCard className="w-5 h-5 text-blue-600" />
                                    {isAr ? "طريقة الدفع" : "Payment"}
                                </h3>
                                <RadioGroup
                                    value={paymentMethod}
                                    onValueChange={(v) => setPaymentMethod(v as 'cash' | 'card')}
                                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                                >
                                    <Label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'cash' ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600' : 'border-gray-200 hover:border-blue-300'}`}>
                                        <RadioGroupItem value="cash" id="cash" className="sr-only" />
                                        <Banknote className={`w-6 h-6 ${paymentMethod === 'cash' ? 'text-blue-600' : 'text-gray-400'}`} />
                                        <div>
                                            <p className="font-bold text-sm text-gray-800">{isAr ? "الدفع عند الاستلام" : "Cash on Delivery"}</p>
                                        </div>
                                    </Label>
                                    <Label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600' : 'border-gray-200 hover:border-blue-300'}`}>
                                        <RadioGroupItem value="card" id="card" className="sr-only" />
                                        <CreditCard className={`w-6 h-6 ${paymentMethod === 'card' ? 'text-blue-600' : 'text-gray-400'}`} />
                                        <div>
                                            <p className="font-bold text-sm text-gray-800">{isAr ? "بطاقة ائتمانية" : "Card Payment"}</p>
                                        </div>
                                    </Label>
                                </RadioGroup>
                            </div>
                        </div>

                    </div>

                    {/* Right Column - Order Summary (MDB Blue Card Style) */}
                    <div className="w-full lg:w-5/12 bg-[#0c264d] text-white p-6 lg:p-10 flex flex-col justify-between rounded-t-[2rem] lg:rounded-t-none lg:rounded-s-[2rem] rtl:lg:rounded-s-none rtl:lg:rounded-e-[2rem] shadow-2xl z-10 -mt-6 lg:mt-0 lg:-ms-6 rtl:lg:ms-0 rtl:lg:-me-6">

                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">{isAr ? "تفاصيل الطلب" : "Order Summary"}</h3>
                                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                                    <Package className="w-6 h-6 text-white" />
                                </div>
                            </div>

                            {/* Cart Items Summary */}
                            <div className="max-h-[35vh] overflow-y-auto custom-scrollbar pe-2 space-y-4 mb-6">
                                {cartItems.map((item: any, idx: number) => (
                                    <div key={idx} className="flex gap-4 items-center bg-white/10 p-3 rounded-xl border border-white/20">
                                        <div className="w-16 h-16 bg-white rounded-lg overflow-hidden shrink-0 relative">
                                            <Image
                                                src={item.product?.images?.[0] || "/placeholder.png"}
                                                alt={item.product?.title || "Item"}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h5 className="font-medium text-sm text-white truncate">{item.product?.title}</h5>
                                            <p className="text-blue-200 text-xs mt-1">{isAr ? "الكمية:" : "Qty:"} {item.quantity}</p>
                                        </div>
                                        <div className="text-white font-bold whitespace-nowrap">
                                            ج.م{(item.quantity * item.price).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <hr className="border-blue-400/50 mb-4" />

                            <div className="flex justify-between items-center mb-3">
                                <p className="text-blue-100 font-medium">{isAr ? "المجموع الفرعي" : "Subtotal"}</p>
                                <p className="font-bold">ج.م{subtotal.toFixed(2)}</p>
                            </div>

                            <div className="flex justify-between items-center mb-3">
                                <p className="text-blue-100 font-medium">{isAr ? "الشحن" : "Shipping"}</p>
                                <p className="font-bold">{shippingFee === 0 ? (isAr ? 'مجاني' : 'Free') : `ج.م${shippingFee.toFixed(2)}`}</p>
                            </div>

                            <div className="flex justify-between items-center mb-6">
                                <p className="text-white font-bold text-lg">{isAr ? "الإجمالي" : "Total"}</p>
                                <p className="text-white font-bold text-xl">ج.م{total.toFixed(2)}</p>
                            </div>

                            <Button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full h-14 bg-white hover:bg-gray-100 text-gray-900 border border-gray-200 rounded-xl text-lg font-bold flex justify-between items-center px-6 transition-transform active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 shadow-[0_4px_14px_0_rgba(0,0,0,0.08)]"                            >
                                <span>ج.م{total.toFixed(2)}</span>
                                <span className="flex items-center gap-2">
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isAr ? "إتمام الطلب" : "Checkout")}
                                </span>
                            </Button>
                        </div>

                    </div>
                </div>
            </div>
            {/* أضف هذا النمط (Style) لضبط شكل الـ scrollbar داخل الشريط الجانبي */}

        </section>
    )
}
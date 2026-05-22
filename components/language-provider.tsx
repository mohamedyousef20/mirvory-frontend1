"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

type Language = "ar" | "en"

type TranslationKey = keyof typeof translations.ar

type LanguageContextType = {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const translations = {
  ar: {
    home: "الرئيسية",
    products: "المنتجات",
    // offers: "العروض",
    cart: "سلة التسوق",
    account: "حسابي",
    search: "ابحث عن منتجات...",
    categories: "الفئات",
    brands: "الماركات",
    price: "السعر",
    ratings: "التقييمات",
    addToCart: "أضف إلى السلة",
    buyNow: "اشترِ الآن",
    sort: "ترتيب حسب",
    newest: "الأحدث",
    priceHighToLow: "السعر: من الأعلى إلى الأقل",
    priceLowToHigh: "السعر: من الأقل إلى الأعلى",
    topRated: "الأعلى تقييماً",
    darkMode: "الوضع المظلم",
    lightMode: "الوضع المضيء",
    login: "تسجيل الدخول",
    register: "إنشاء حساب",
    logout: "تسجيل الخروج",
    vendorDashboard: "لوحة تحكم البائع",
    adminDashboard: "لوحة تحكم المدير",
    orders: "الطلبات",
    balance: "الرصيد",
    settings: "الإعدادات",
    shoes: "كوتشيات",
    clothing: "ملابس",
    men: "رجالي",
    women: "نسائي",
    kids: "أطفال",
    discount: "خصم",
    off: "خصم",
    freeShipping: "شحن مجاني",
    newArrival: "وصل حديثاً",
    outOfStock: "نفذت الكمية",
    inStock: "متوفر",
    reviews: "التقييمات",
    description: "الوصف",
    specifications: "المواصفات",
    size: "المقاس",
    color: "اللون",
    quantity: "الكمية",
    relatedProducts: "منتجات مشابهة",
    contactUs: "اتصل بنا",
    faq: "الأسئلة الشائعة",
    termsAndConditions: "الشروط والأحكام",
    privacyPolicy: "سياسة الخصوصية",
    trackOrder: "تتبع الطلب",
    myProfile: "الملف الشخصي",
    myOrders: "طلباتي",
    myWishlist: "المفضلة",
    myReviews: "تقييماتي",
    myAddresses: "عناويني",
    paymentMethods: "طرق الدفع",
    cashOnDelivery: "الدفع عند الاستلام",
    creditCard: "بطاقة ائتمان",
    paypal: "باي بال",
    applyCoupon: "تطبيق كوبون",
    subtotal: "المجموع الفرعي",
    shipping: "الشحن",
    total: "الإجمالي",
    checkout: "إتمام الشراء",
    continueShopping: "مواصلة التسوق",
    emptyCart: "سلة التسوق فارغة",
    orderSummary: "ملخص الطلب",
    shippingAddress: "عنوان الشحن",
    paymentMethod: "طريقة الدفع",
    placeOrder: "تأكيد الطلب",
    orderPlaced: "تم تأكيد طلبك",
    orderNumber: "رقم الطلب",
    thankYou: "شكراً لطلبك",
    orderDetails: "تفاصيل الطلب",
    orderStatus: "حالة الطلب",
    orderDate: "تاريخ الطلب",
    orderTotal: "إجمالي الطلب",
    trackingNumber: "رقم التتبع",
    estimatedDelivery: "موعد التسليم المتوقع",
    delivered: "تم التسليم",
    processing: "قيد المعالجة",
    category_status_active: "نشط",
    category_status_inactive: "غير نشط",
    category_name_placeholder: "أدخل اسم الفئة",
    category_name_en_placeholder: "أدخل اسم الفئة بالإنجليزية",
    category_description_placeholder: "أدخل وصف الفئة",
    category_description_en_placeholder: "أدخل وصف الفئة بالإنجليزية",
    category_image_placeholder: "أدخل رابط الصورة",
    category_status_placeholder: "اختر الحالة",
    category_create_button: "إنشاء الفئة",
    product_status_approved: "تمت الموافقة",
    product_status_rejected: "مرفوض",
    product_status_pending: "قيد الانتظار",
    shipped: "تم الشحن",
    cancelled: "ملغي",
    returnPolicy: "سياسة الإرجاع",
    exchangePolicy: "سياسة الاستبدال",
    warrantyPolicy: "سياسة الضمان",
    coins: "نقاط",
    earnCoins: "اكسب نقاط",
    redeemCoins: "استبدل النقاط",
    coinsBalance: "رصيد النقاط",
    coinsHistory: "سجل النقاط",
    coinsExpiry: "تاريخ انتهاء النقاط",
    coinsValue: "قيمة النقاط",
    coinsRedemption: "استبدال النقاط",
    coinsRedemptionValue: "قيمة استبدال النقاط",
    coinsRedemptionMinimum: "الحد الأدنى للاستبدال",
    coinsRedemptionMaximum: "الحد الأقصى للاستبدال",
    coinsRedemptionRate: "معدل الاستبدال",
    coinsRedemptionRateValue: "قيمة معدل الاستبدال",
    coinsRedemptionRateUnit: "وحدة معدل الاستبدال",
    coinsRedemptionRateUnitValue: "قيمة وحدة معدل الاستبدال",
  },
  en: {
    home: "Home",
    products: "Products",
    offers: "Offers",
    cart: "Cart",
    account: "Account",
    search: "Search for products...",
    categories: "Categories",
    brands: "Brands",
    price: "Price",
    ratings: "Ratings",
    addToCart: "Add to Cart",
    buyNow: "Buy Now",
    sort: "Sort by",
    newest: "Newest",
    priceHighToLow: "Price: High to Low",
    priceLowToHigh: "Price: Low to High",
    topRated: "Top Rated",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    login: "Login",
    register: "Register",
    logout: "Logout",
    vendorDashboard: "Vendor Dashboard",
    adminDashboard: "Admin Dashboard",
    orders: "Orders",
    balance: "Balance",
    settings: "Settings",
    shoes: "Shoes",
    clothing: "Clothing",
    men: "Men",
    women: "Women",
    kids: "Kids",
    discount: "Discount",
    off: "Off",
    freeShipping: "Free Shipping",
    newArrival: "New Arrival",
    outOfStock: "Out of Stock",
    inStock: "In Stock",
    reviews: "Reviews",
    description: "Description",
    specifications: "Specifications",
    size: "Size",
    color: "Color",
    quantity: "Quantity",
    relatedProducts: "Related Products",
    contactUs: "Contact Us",
    faq: "FAQ",
    termsAndConditions: "Terms & Conditions",
    privacyPolicy: "Privacy Policy",
    trackOrder: "Track Order",
    myProfile: "My Profile",
    myOrders: "My Orders",
    myWishlist: "My Wishlist",
    myReviews: "My Reviews",
    myAddresses: "My Addresses",
    paymentMethods: "Payment Methods",
    cashOnDelivery: "Cash on Delivery",
    creditCard: "Credit Card",
    paypal: "PayPal",
    applyCoupon: "Apply Coupon",
    subtotal: "Subtotal",
    shipping: "Shipping",
    total: "Total",
    checkout: "Checkout",
    continueShopping: "Continue Shopping",
    emptyCart: "Your cart is empty",
    orderSummary: "Order Summary",
    shippingAddress: "Shipping Address",
    paymentMethod: "Payment Method",
    placeOrder: "Place Order",
    orderPlaced: "Your order has been placed",
    orderNumber: "Order Number",
    thankYou: "Thank you for your order",
    orderDetails: "Order Details",
    orderStatus: "Order Status",
    orderDate: "Order Date",
    orderTotal: "Order Total",
    trackingNumber: "Tracking Number",
    estimatedDelivery: "Estimated Delivery",
    delivered: "Delivered",
    processing: "Processing",
    shipped: "Shipped",
    cancelled: "Cancelled",
    category_name: "Name",
    category_name_en: "Name (English)",
    category_description: "Description",
    category_description_en: "Description (English)",
    category_image: "Image",
    category_status: "Status",
    category_status_active: "Active",
    category_status_inactive: "Inactive",
    category_name_placeholder: "Enter category name",
    category_name_en_placeholder: "Enter category name in English",
    category_description_placeholder: "Enter category description",
    category_description_en_placeholder: "Enter category description in English",
    category_image_placeholder: "Enter image URL",
    category_status_placeholder: "Select status",
    category_create_button: "Create Category",
    product_status_approved: "Approved",
    product_status_rejected: "Rejected",
    product_status_pending: "Pending",
    returnPolicy: "Return Policy",
    exchangePolicy: "Exchange Policy",
    warrantyPolicy: "Warranty Policy",
    coins: "Coins",
    earnCoins: "Earn Coins",
    redeemCoins: "Redeem Coins",
    coinsBalance: "Coins Balance",
    coinsHistory: "Coins History",
    coinsExpiry: "Coins Expiry",
    coinsValue: "Coins Value",
    coinsRedemption: "Coins Redemption",
    coinsRedemptionValue: "Coins Redemption Value",
    coinsRedemptionMinimum: "Minimum Redemption",
    coinsRedemptionMaximum: "Maximum Redemption",
    coinsRedemptionRate: "Redemption Rate",
    coinsRedemptionRateValue: "Redemption Rate Value",
    coinsRedemptionRateUnit: "Redemption Rate Unit",
    coinsRedemptionRateUnitValue: "Redemption Rate Unit Value",
  }
} as const

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language');
      if (savedLanguage && savedLanguage in translations) {
        return savedLanguage as Language;
      }
    }
    return 'ar';
  });

  // Save language to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem('language', language);
    }
  }, [language]);

  const t = (key: TranslationKey) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <div dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType & { isArabic: boolean } {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return { ...context, isArabic: context.language === 'ar' }
}

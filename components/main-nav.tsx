"use client"
//TODO CHANGE DROP DOWN MENU
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useLanguage } from "@/components/language-provider";
import { useTheme } from "next-themes"
import { useColorTheme } from "@/components/color-theme-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Search,
  ShoppingCart,
  Menu,
  Sun,
  Moon,
  Heart,
  Bell,
  LogIn,
  Store,
  LayoutDashboard,
  ShoppingBag,
  User,
  Settings,
  HelpCircle,
  LogOut,
  Gift,
  Headphones,
  Globe,
  Home,
  X,
  ArrowLeft,
  ArrowLeftRight,
  MessageCircle,
} from "lucide-react"
import MirvoryLogo from "@/components/mirvory-logo"
import Image from "next/image"
import { toast } from 'sonner';
import { ProductSearch } from "./ProductSearch"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthProvider"
import { authService, cartService, notificationService, wishlistService } from "@/lib/api"

// Update your interfaces at the top
interface ProductDetails {
  _id: string;
  seller?: string;
  title: string;
  titleEn?: string;
  images: string[];
  price: number;
  ratingStars?: {
    rounded: number | null;
    fullStars: number | null;
    hasHalfStar: boolean;
    emptyStars: number | null;
  };
  ratingPercentages?: {
    1: number | null;
    2: number | null;
    3: number | null;
    4: number | null;
    5: number | null;
  };
  trustScore?: number | null;
  id: string;
}

interface CartItem {
  _id: string;
  price: number;
  product: ProductDetails; // This is now an object, not string
  quantity: number;
  sizes: string[];
  colors: string[];
  itemTotal?: number;
  id?: string;
}

interface CartData {
  items: CartItem[];
  total?: number;
  user?: string;
  appliedCoupon?: any;
  itemCount?: number;
}

interface Counts {
  cart: number;
  wishlist: number;
  notifications: number;
}

export function MainNav() {
  const { language, setLanguage, t } = useLanguage()
  const { theme, setTheme } = useTheme()
  const { colorTheme, setColorTheme } = useColorTheme()
  const router = useRouter()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [enhancedCartItems, setEnhancedCartItems] = useState<CartItem[]>([])
  const [notificationItem, setNotificationItem] = useState<CartItem[]>([])
  const [counts, setCounts] = useState<Counts>({
    cart: 0,
    wishlist: 0,
    notifications: 0
  })
  console.log(user,'auth')
  const [loading, setLoading] = useState({
    cart: false,
    wishlist: false,
    notifications: false
  })
  const isLoggedIn = Boolean(user)
  const userRole = user?.role

  const isAdmin = ["admin", "super_admin"].includes(userRole)
  const isVendor = userRole === "seller"
  //logout
  const handleLogout = async () => {
  await authService.logout();
    toast.success('تم تسجيل الخروج بنجاح ');

    window.location.href = "/auth/login";
  };

  // Fetch counts from API
  const fetchCounts = useCallback(async () => {
    if (!isLoggedIn) {
      setCounts({ cart: 0, wishlist: 0, notifications: 0 })
      return
    }
    console.log(user, 'user***')
    try {

      setLoading(prev => ({ ...prev, cart: true, wishlist: true, notifications: true }))

      // Fetch cart count
      try {
        const cartResponse = await cartService.getCartCount();
        //console.log(enhancedCartItems, 'enhancedCartItems')
        const cartCount = cartResponse.data?.count || 0
        setCounts(prev => ({ ...prev, cart: cartCount }))
      } catch (error: any) {
        console.error('Error fetching cart count:', error)
        setCounts(prev => ({ ...prev, cart: 0 }))
      }

      // Fetch wishlist count
      try {
        const wishlistResponse = await wishlistService.getWishlistCount()
        const wishlistCount = wishlistResponse.data?.count || 0
        setCounts(prev => ({ ...prev, wishlist: wishlistCount }))
      } catch (error: any) {
        console.error('Error fetching wishlist count:', error)
        setCounts(prev => ({ ...prev, wishlist: 0 }))
      }

      // Fetch notification count
      try {
        const notificationResponseCount = await notificationService.getNotificationCount();
        const notificationResponse = await notificationService.getNotifications();

        //console.log('Notification Count Response:', notificationResponseCount);
        //console.log('Notification List Response:', notificationResponse);

        // Check if responses are successful
        if (notificationResponseCount.data?.success && notificationResponse.data?.success) {
          setNotificationItem(notificationResponse.data.data || notificationResponse.data.notifications || [])
          const notificationCount = notificationResponseCount.data.data || notificationResponseCount.data.count || 0
          //console.log('Processed notification count:', notificationCount)
          setCounts(prev => ({ ...prev, notifications: notificationCount }))
        } else {
          console.error('API returned error:', notificationResponseCount.data, notificationResponse.data)
          setCounts(prev => ({ ...prev, notifications: 0 }))
        }
      } catch (error: any) {
        console.error('Error fetching notification count:', error)
        console.error('Error response:', error.response?.data)
        setCounts(prev => ({ ...prev, notifications: 0 }))
      }


    } catch (error: any) {
      console.error('Error fetching counts:', error)
    } finally {
      setLoading(prev => ({ ...prev, cart: false, wishlist: false, notifications: false }))
    }
  }, [isLoggedIn, user])
  // Fetch cart items
  // Fetch cart items
  const fetchCartItems = useCallback(async () => {
    if (!isLoggedIn) {
      setEnhancedCartItems([])
      return
    }


    try {
      const response = await cartService.getCart()
      //console.log('Cart API Response:', response)

      if (response.data.items) {
        setEnhancedCartItems(response.data.items);

        const cartCount = response.data.items.reduce((sum, item) => sum + item.quantity, 0)
        setCounts(prev => ({ ...prev, cart: cartCount }))



      } else {
        console.warn('No items found in cart data')
        setEnhancedCartItems([])
      }
    } catch (error: any) {
      const status = error?.response?.status
      if (status === 404) {
        console.warn('Cart not found, initializing empty cart')
        setEnhancedCartItems([])
        setCounts(prev => ({ ...prev, cart: 0 }))
        return
      }
      console.error('Error fetching cart items:', error)
      setEnhancedCartItems([])
    }
  }, [isLoggedIn, user])
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Fetch data when component mounts or auth status changes
  useEffect(() => {
    //console.log(isAdmin,'n8n')
    if (isLoggedIn) {
      fetchCounts()
      fetchCartItems()
    } else {
      setCounts({ cart: 0, wishlist: 0, notifications: 0 })
      setEnhancedCartItems([])
    }
  }, [isLoggedIn, fetchCounts, fetchCartItems])

  // Handle remove from cart
  // Handle remove from cart
  const handleRemoveFromCart = async (cartItemId: string) => {
    try {
      setLoading(prev => ({ ...prev, cart: true }))
      await cartService.removeFromCart(cartItemId)

      // Optimistic update
      setEnhancedCartItems(prev => prev.filter(item => item._id !== cartItemId))

      // Update counts
      setCounts(prev => ({
        ...prev,
        cart: Math.max(0, prev.cart - 1)
      }))

      toast.success(language === "ar" ? "تمت إزالة المنتج من السلة" : "Product removed from cart")
    } catch (error: any) {
      console.error('Failed to remove item from cart:', error)
      toast.error(language === "ar" ? "حدث خطأ أثناء إزالة المنتج" : "Failed to remove product")
    } finally {
      setLoading(prev => ({ ...prev, cart: false }))
    }
  }

  const handleSearch = useCallback((query: string) => {
    if (query.trim()) {
      setIsSearchOpen(false)
      router.push(`/products?q=${encodeURIComponent(query)}`)
    }
  }, [router])

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
  }, []);

  const handleMobileSearch = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery)}`)
    }
  }, [searchQuery, router])

  // Main navigation items
  const navItems = [
    { href: "/", icon: <Home className="h-4 w-4" />, label: t("home") },
    { href: "/products", icon: <ShoppingBag className="h-4 w-4" />, label: t("products") },
    // { href: "/offers", icon: <Gift className="h-4 w-4" />, label: t("offers") },

    {
      href: "/returns",
      icon: <ArrowLeftRight className="h-4 w-4" />,
      label: language === "ar" ? "المرتجعات" : "Returns",
    },
    {
      href: "/wishlist",
      icon: <Heart className="h-4 w-4" />,
      label: language === "ar" ? "المفضلة" : "Wishlist",
      badge: counts.wishlist
    },
  ]

  // Mobile menu items
  const mobileMenuItems = [
    ...navItems,
    {
      href: "/notifications",
      icon: <Bell className="h-4 w-4" />,
      label: language === "ar" ? "الإشعارات" : "Notifications",
      badge: counts.notifications
    },
    { href: "/contact", icon: <Headphones className="h-4 w-4" />, label: t("contactUs") },
    { href: "/faq", icon: <HelpCircle className="h-4 w-4" />, label: t("faq") },
  ]

  // Dashboard links - only show if logged in
  const dashboardLinks = [
    isVendor && { href: "/vendor/dashboard", icon: <Store className="h-4 w-4" />, label: t("vendorDashboard") },
    isAdmin && { href: "/admin/dashboard", icon: <LayoutDashboard className="h-4 w-4" />, label: t("adminDashboard") },
  ].filter(Boolean) as { href: string; icon: React.ReactNode; label: string }[]

  // Helper function to get icon based on notification type
  const getNotificationIcon = (type: string) => {
    const iconProps = { className: "h-4 w-4" };

    switch (type) {
      case 'ORDER_PLACED':
      case 'order_paid': // Keep this for backward compatibility if needed
      case 'order_shipped': // Keep this for backward compatibility if needed
      case 'order_delivered': // Keep this for backward compatibility if needed
      case 'ORDER_COMPLETED':
        return <ShoppingBag {...iconProps} />;
      case 'RETURN_REQUESTED':
      case 'order_return_approved': // Keep this for backward compatibility if needed
      case 'RETURN_STATUS_UPDATED':
        return <ArrowLeft {...iconProps} />;
      case 'product_approved': // Keep this for backward compatibility if needed
      case 'product_rejected':
        return <Store {...iconProps} />;
      case 'low_stock':
        return <ShoppingBag {...iconProps} />;
      case 'admin_alert':
        return <Settings {...iconProps} />;
      default:
        return <Bell {...iconProps} />;
    }
  };

  // Helper function to format notification time
  const formatNotificationTime = (dateString: string, language: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (language === "ar") {
      if (diffInMinutes < 1) return "الآن";
      if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
      if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
      if (diffInDays === 1) return "منذ يوم";
      if (diffInDays < 7) return `منذ ${diffInDays} أيام`;
      return date.toLocaleDateString('ar-EG');
    } else {
      if (diffInMinutes < 1) return "Just now";
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInDays === 1) return "1 day ago";
      if (diffInDays < 7) return `${diffInDays} days ago`;
      return date.toLocaleDateString('en-US');
    }
  };


  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm" : "bg-background"}`}>
      {/* Search overlay - mobile */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t("search")}</h2>
            <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(false)}>
              <X className="h-5 w-5" />
              <span className="sr-only">Close search</span>
            </Button>
          </div>
          {/* Search Bar */}
          <ProductSearch
            onSearch={handleSearch}
            onClear={handleClearSearch}
            className="w-full"
            autoFocus
          />
        </div>
      )}

      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Mobile menu trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side={language === "ar" ? "right" : "left"} className="w-80">
              <SheetHeader>
                <SheetTitle className="sr-only">{language === "ar" ? "القائمة" : "Menu"}</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between py-4">
                  <Link href={isVendor ? "/vendor/dashboard" : "/"} className="flex items-center gap-2 text-lg font-semibold">
                    <MirvoryLogo className="text-3xl" />
                  </Link>
                </div>

                <form onSubmit={handleMobileSearch} className="relative my-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:left-auto rtl:right-3" />
                  <Input
                    type="search"
                    placeholder={t("search")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 rtl:pr-10 rtl:pl-3"
                  />
                </form>

                <nav className="grid gap-2 mt-4">
                  {mobileMenuItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors relative"
                    >
                      {item.icon}
                      <span className="font-medium">{item.label}</span>
                      {item.badge > 0 && (
                        <Badge className="absolute right-3 h-5 w-5 flex items-center justify-center rounded-full text-[10px] p-0">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  ))}
                </nav>

                <div className="mt-8 space-y-4">
                  <div className="px-2">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">{language === "ar" ? "لوحات التحكم" : "Dashboards"}</h3>
                    <div className="space-y-1">
                      {dashboardLinks.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                        >
                          {item.icon}
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-1/2 mr-2"
                      onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      {language === "ar" ? "English" : "عربي"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-1/2 ml-2"
                      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    >
                      {theme === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                      {theme === "dark" ? t("lightMode") : t("darkMode")}
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <div className="flex items-center">
            <Link href={isVendor ? "/vendor/dashboard" : "/"} className="flex items-center gap-2 navbar-brand mr-6">
              <MirvoryLogo className="text-3xl" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 text-sm font-medium rounded-md hover:bg-accent/50 transition-colors flex items-center gap-1.5 relative"
                >
                  {item.icon}
                  {item.label}
                  {item.badge > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full text-[10px] p-0">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search button */}
            <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)} className="hidden sm:flex">
              <Search className="h-5 w-5" />
              <span className="sr-only">{t("search")}</span>
            </Button>

            {/* Theme switcher */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon">
                  {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56" align="end">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">{language === "ar" ? "المظهر" : "Appearance"}</h4>
                    <p className="text-sm text-muted-foreground">
                      {language === "ar" ? "اختر المظهر واللون" : "Choose theme and color"}
                    </p>
                  </div>

                  <Tabs defaultValue={theme}>
                    <TabsList className="grid grid-cols-2">
                      <TabsTrigger value="light" onClick={() => setTheme("light")}>
                        <Sun className="h-4 w-4 mr-2" />
                        {language === "ar" ? "فاتح" : "Light"}
                      </TabsTrigger>
                      <TabsTrigger value="dark" onClick={() => setTheme("dark")}>
                        <Moon className="h-4 w-4 mr-2" />
                        {language === "ar" ? "داكن" : "Dark"}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">{language === "ar" ? "الألوان" : "Colors"}</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={colorTheme === "blue" ? "default" : "outline"}
                        size="sm"
                        className={`${colorTheme === "blue" ? "" : "bg-blue-500 text-white hover:text-white hover:bg-blue-600"}`}
                        onClick={() => setColorTheme("blue")}
                      >
                        {language === "ar" ? "أزرق" : "Blue"}
                      </Button>
                      <Button
                        variant={colorTheme === "green" ? "default" : "outline"}
                        size="sm"
                        className={`${colorTheme === "green" ? "" : "bg-green-500 text-white hover:text-white hover:bg-green-600"}`}
                        onClick={() => setColorTheme("green")}
                      >
                        {language === "ar" ? "أخضر" : "Green"}
                      </Button>
                      <Button
                        variant={colorTheme === "orange" ? "default" : "outline"}
                        size="sm"
                        className={`${colorTheme === "orange" ? "" : "bg-orange-500 text-white hover:text-white hover:bg-orange-600"}`}
                        onClick={() => setColorTheme("orange")}
                      >
                        {language === "ar" ? "برتقالي" : "Orange"}
                      </Button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Wishlist */}
            <Button variant="ghost" size="icon" asChild className="relative hidden sm:flex">
              <Link href="/wishlist">
                <Heart className="h-5 w-5" />
                {counts.wishlist > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full text-[10px] p-0">
                    {counts.wishlist}
                  </Badge>
                )}
              </Link>
            </Button>

            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {counts.notifications > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full text-[10px] p-0">
                      {counts.notifications}
                    </Badge>
                  )}
                  <span className="sr-only">Notifications</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 h-[400px] flex flex-col p-0" align="end">
                {/* Header */}
                <div className="p-4 border-b">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">
                      {language === "ar" ? "الإشعارات" : "Notifications"}
                      {counts.notifications > 0 && (
                        <span className="text-muted-foreground ml-1">({counts.notifications})</span>
                      )}
                    </h4>
                    {counts.notifications > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            await notificationService.markAllAsRead();
                            fetchCounts();
                            toast.success(language === "ar" ? "تم تحديد الكل كمقروء" : "All notifications marked as read");
                          } catch (error: any) {
                            console.error('Error marking notifications as read:', error);
                            toast.error(language === "ar" ? "حدث خطأ" : "An error occurred");
                          }
                        }}
                      >
                        {language === "ar" ? "تحديد الكل كمقروء" : "Mark all as read"}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Notifications List - Scrollable Area */}
                <div className="flex-1 overflow-auto p-2">
                  {notificationItem?.length > 0 ? (
                    <div className="space-y-2">
                      {notificationItem.map((notification) => (
                        <div
                          key={notification._id}
                          className={`flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer hover:bg-accent/50 ${!notification.isRead
                            ? 'bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800'
                            : ''
                            }`}
                          onClick={async () => {
                            if (!notification.isRead) {
                              try {
                                await notificationService.markAsRead(notification._id);
                                fetchCounts();
                              } catch (error: any) {
                                console.error('Error marking notification as read:', error);
                              }
                            }
                            if (notification.link) {
                              router.push(notification.link);
                            }
                          }}
                        >
                          <div className={`h-9 w-9 rounded-full flex items-center justify-center ${!notification.isRead
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                            : 'bg-accent text-muted-foreground'
                            }`}>
                            {getNotificationIcon(notification.type)}
                          </div>

                          <div className="space-y-1 flex-1 min-w-0">
                            <p className="text-sm font-medium leading-tight">
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground leading-tight">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatNotificationTime(notification.createdAt, language)}
                            </p>

                            {notification.data?.orderId && (
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                {language === "ar" ? `رقم الطلب: ${notification.data.orderId}` : `Order #${notification.data.orderId}`}
                              </p>
                            )}

                            {notification.data?.productId && (
                              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                {language === "ar" ? "منتج" : "Product"}
                              </p>
                            )}
                          </div>

                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                      <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-sm text-muted-foreground">
                        {language === "ar" ? "لا توجد إشعارات" : "No notifications"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {language === "ar" ? "سيظهر إشعاراتك هنا" : "Your notifications will appear here"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Fixed Footer with View All Button */}
                <div className="border-t p-3 bg-background sticky bottom-0">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href="/notifications">
                      {language === "ar" ? "عرض كل الإشعارات" : "View all notifications"}
                    </Link>
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            {/* Cart */}
            {/* Cart Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {counts.cart > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full text-[10px] p-0">
                      {counts.cart}
                    </Badge>
                  )}
                  <span className="sr-only">{t("cart")}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">
                      {language === "ar" ? "سلة التسوق" : "Shopping Cart"}
                      <span className="text-muted-foreground ml-1">({counts.cart})</span>
                    </h4>
                  </div>

                  <div className="space-y-3 max-h-[250px] overflow-auto">
                    {enhancedCartItems?.length ? (
                      enhancedCartItems.map((item) => (
                        <div key={item._id} className="flex items-center gap-3">
                          <div className="h-16 w-16 bg-accent rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
                            {item.product?.images?.[0] ? (
                              <Image
                                src={item.product.images[0]}
                                alt={item.product.title || "Product"}
                                width={64}
                                height={64}
                                className="object-cover"
                                unoptimized // For external images
                              />
                            ) : (
                              <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {item.product?.title || `Product ${item._id.substring(0, 6)}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {language === "ar"
                                ? `السعر: ${item.price} ج.م`
                                : `Price: ${item.price} EGP`
                              } |{' '}
                              {language === "ar"
                                ? `الكمية: ${item.quantity}`
                                : `Qty: ${item.quantity}`
                              }
                            </p>
                            {item.sizes?.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {language === "ar" ? "المقاسات: " : "Sizes: "}
                                {item.sizes.join(", ")}
                              </p>
                            )}
                            {item.colors?.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {language === "ar" ? "الألوان: " : "Colors: "}
                                {item.colors.join(", ")}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 flex-shrink-0"
                            onClick={() => handleRemoveFromCart(item._id)}
                            disabled={loading.cart}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <ShoppingCart className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                        <p className="text-sm text-muted-foreground">
                          {language === "ar" ? "سلة التسوق فارغة" : "Your cart is empty"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {language === "ar"
                            ? "أضف منتجات لتبدأ التسوق"
                            : "Add products to start shopping"
                          }
                        </p>
                      </div>
                    )}
                  </div>

                  {enhancedCartItems.length > 0 && (
                    <div className="pt-3 border-t">
                      <div className="flex justify-between mb-4">
                        <span className="font-medium">{language === "ar" ? "المجموع" : "Total"}</span>
                        <span className="font-bold">
                          {language === "ar"
                            ? `${enhancedCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)} ج.م`
                            : `${enhancedCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)} EGP`
                          }
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" asChild>
                          <Link href="/cart">
                            {language === "ar" ? "عرض السلة" : "View Cart"}
                          </Link>
                        </Button>
                        <Button asChild>
                          <Link href="/checkout">
                            {language === "ar" ? "الدفع" : "Checkout"}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  {isLoggedIn ? (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profileImage || ""} alt={user?.firstName || "User"} />
                      <AvatarFallback className="text-xs">
                        {user?.firstName?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <span className="sr-only">{t("account")}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {isLoggedIn ? (
                  <>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.profileImage || ""} alt={user?.firstName || "User"} />
                        <AvatarFallback>{user?.firstName?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-0.5">
                        <p className="text-sm font-medium">{user?.firstName || "User"}</p>
                        <p className="text-xs text-muted-foreground">{user?.email || "user@F.com"}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {language === "ar" ? "الملف الشخصي" : "Profile"}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/orders" className="cursor-pointer flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4" />
                        {language === "ar" ? "طلباتي" : "My Orders"}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/returns" className="cursor-pointer flex items-center gap-2">
                        <ArrowLeftRight className="h-4 w-4" />
                        <div className="flex-1 flex items-center justify-between">
                          <span>{language === "ar" ? "المرتجعات" : "Returns"}</span>

                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/complaints" className="cursor-pointer flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        <div className="flex-1 flex items-center justify-between">
                          <span>{language === "ar" ? "الشكاوى والدعم" : "Complaints & Support"}</span>

                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        {language === "ar" ? "الإعدادات" : "Settings"}
                      </Link>
                    </DropdownMenuItem>
                    {dashboardLinks.map((item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href} className="flex items-center gap-2 cursor-pointer">
                          {item.icon}
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleLogout()}
                    >
                      <LogOut className="h-4 w-4" />
                      {language === "ar" ? "تسجيل الخروج" : "Logout"}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <div className="p-2">
                      <h4 className="text-sm font-medium mb-1">{language === "ar" ? "مرحبًا بك!" : "Welcome!"}</h4>
                      <p className="text-xs text-muted-foreground">
                        {language === "ar" ? "سجل الدخول للوصول إلى حسابك" : "Sign in to access your account"}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/auth/login" className="flex items-center gap-2 cursor-pointer">
                        <LogIn className="h-4 w-4" />
                        {t("login")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/auth/register" className="cursor-pointer flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {t("register")}
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
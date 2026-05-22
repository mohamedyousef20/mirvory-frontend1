'use client'

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { addressService, authService, userService } from '@/lib/api';
import { useValidation } from '@/hooks/useValidation';
import { MirvoryPageLoader } from '@/components/MirvoryLoader';

// مكونات UI محسنة
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";

import {
    Badge
} from "@/components/ui/badge";

import {
    Input
} from "@/components/ui/input";
import {
    Label
} from "@/components/ui/label";
import {
    Button
} from "@/components/ui/button";
import {
    Separator
} from "@/components/ui/separator";
import {
    Switch
} from "@/components/ui/switch";
import {
    Alert,
    AlertDescription,
    AlertTitle
} from "@/components/ui/alert";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Textarea
} from "@/components/ui/textarea";
import {
    Progress
} from "@/components/ui/progress";

// أيقونات
import {
    User,
    Mail,
    Phone,
    MapPin,
    Shield,
    Settings,
    Lock,
    Bell,
    CreditCard,
    Package,
    Truck,
    CheckCircle,
    AlertCircle,
    Edit,
    Trash2,
    Star,
    Calendar,
    Globe,
    Wallet,
    Clock,
    Flag,
    Building,
    Home,
    Briefcase,
    ChevronRight,
    Upload,
    Camera,
    Eye,
    EyeOff,
    LogOut,
    RefreshCw,
    ShieldCheck,
    Activity,
    History,
    Plus
} from 'lucide-react';

// تعريف المدن والمحافظات
const EGYPT_GOVERNORATES = [
    { value: 'القاهرة', label: 'القاهرة', cities: ['مدينة نصر', 'مصر الجديدة', 'المهندسين', 'المعادي', 'الشيخ زايد'] },
    { value: 'الجيزة', label: 'الجيزة', cities: ['الدقي', 'المهندسين', 'العجوزة', 'الهرم', '6 أكتوبر'] },
    { value: 'الإسكندرية', label: 'الإسكندرية', cities: ['سموحة', 'سيدي جابر', 'المنتزه', 'العجمي', 'المندرة'] },
    { value: 'المنيا', label: 'المنيا', cities: ['المنيا الجديدة', 'ملوي', 'دير مواس', 'سمالوط'] },
    { value: 'أسيوط', label: 'أسيوط', cities: ['أسيوط الجديدة', 'ديروط', 'منفلوط', 'القوصية'] },
];

const INITIAL_ADDRESS_FORM = {
    state: '',
    city: '',
    district: '',
    street: '',
    buildingNumber: '',
    apartmentNumber: '',
    landmark: '',
    label: 'home',
    isDefault: true
};

const Profile = () => {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('personal');
    const [showPassword, setShowPassword] = useState({
        current: false,
        new: false,
        confirm: false
    });

    // States
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
       
    });

   
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [user, setUser] = useState<any>(null);
    const [addresses, setAddresses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [addressLoading, setAddressLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [error, setError] = useState('');
    const [addressError, setAddressError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [addressToDelete, setAddressToDelete] = useState<string | null>(null);

    // Initialize validation
    const { errors, validate } = useValidation('updateProfile');

    // تحميل البيانات الأولية
    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await authService.getCurrentUser();
            const userData = response.data.data?.user || response.data;

            setUser(userData);
            setFormData({
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                email: userData.email || '',
                phone: userData.phone || '',
            });
        } catch (err: any) {
            setError(err.message || 'فشل تحميل الملف الشخصي');
            toast.error('فشل تحميل الملف الشخصي');
        } finally {
            setLoading(false);
        }
    };

  
    
    // معالجة تغيير كلمة المرور
    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordLoading(true);
        setPasswordError('');

        try {
            // التحقق من صحة البيانات
            if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
                setPasswordError('جميع الحقول مطلوبة');
                setPasswordLoading(false);
                return;
            }

            if (passwordForm.newPassword.length < 8) {
                setPasswordError('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل');
                setPasswordLoading(false);
                return;
            }

            if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                setPasswordError('كلمة المرور الجديدة وتأكيدها غير متطابقين');
                setPasswordLoading(false);
                return;
            }

            if (passwordForm.currentPassword === passwordForm.newPassword) {
                setPasswordError('كلمة المرور الجديدة يجب أن تختلف عن كلمة المرور الحالية');
                setPasswordLoading(false);
                return;
            }

            const response = await authService.changePassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
                confirmPassword: passwordForm.confirmPassword,
            });

            // إعادة تعيين النموذج
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });

            toast.success('تم تغيير كلمة المرور بنجاح');
            setIsPasswordDialogOpen(false);

            setTimeout(() => {
                router.push('/auth/login');
            }, 2000);

        } catch (err: any) {
            console.error('Password change error:', err);
            const errorMessage = err.response?.data?.message ||
                err.message ||
                'فشل تغيير كلمة المرور، يرجى المحاولة مرة أخرى';
            setPasswordError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setPasswordLoading(false);
        }
    };

    // معالجة تحديث الملف الشخصي
    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const filteredData = Object.fromEntries(
                Object.entries(formData).filter(([key, value]) => value !== '' && value != null)
            );

            const isValid = await validate(filteredData);
            if (!isValid) {
                setLoading(false);
                return;
            }

            await userService.updateProfile(filteredData);
            toast.success('تم تحديث الملف الشخصي بنجاح');
            setIsEditing(false);
            await fetchProfile();
        } catch (err: any) {
            setError(err.message || 'فشل تحديث الملف الشخصي');
            toast.error('فشل تحديث الملف الشخصي');
        } finally {
            setLoading(false);
        }
    };

    // دالة مساعدة لتنسيق التاريخ
    const formatDate = (dateString: string) => {
        if (!dateString) return 'غير محدد';
        return new Date(dateString).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // توليد الأحرف الأولى للصورة الرمزية
    const getInitials = () => {
        if (!user) return 'US';
        return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'US';
    };

    // الحصول على لون الدور
    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-red-500';
            case 'seller': return 'bg-blue-500';
            case 'user': return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    };

    // الحصول على نص الدور
    const getRoleText = (role: string) => {
        switch (role) {
            case 'admin': return 'مدير النظام';
            case 'seller': return 'تاجر';
            case 'user': return 'مستخدم';
            default: return role;
        }
    };

    // الحصول على أيقونة نوع العنوان
    const getAddressIcon = (type: string) => {
        switch (type) {
            case 'home': return <Home className="h-5 w-5" />;
            case 'work': return <Briefcase className="h-5 w-5" />;
            default: return <MapPin className="h-5 w-5" />;
        }
    };

    // حساب قوة كلمة المرور
    const calculatePasswordStrength = (password: string) => {
        if (!password) return 0;
        let strength = 0;
        if (password.length >= 8) strength += 25;
        if (/[A-Z]/.test(password)) strength += 25;
        if (/[0-9]/.test(password)) strength += 25;
        if (/[^A-Za-z0-9]/.test(password)) strength += 25;
        return strength;
    };

    if (loading && !user) {
        return <MirvoryPageLoader text={'جاري تحميل الملف الشخصي...'} />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-primary to-slate-800 shadow-xl">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-6">

                        {/* Left Side - Profile Info */}
                        <div className="flex items-center gap-5">

                            {/* CIRCULAR AVATAR */}
                            <div className="relative">
                                <div className="h-24 w-24 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/30 flex items-center justify-center text-white text-2xl font-bold shadow-lg overflow-hidden">
                                    {user?.profileImage ? (
                                        <img
                                            src={user.profileImage}
                                            alt="profile"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`
                                    )}
                                </div>

                                {/* small status dot */}
                                <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-green-500"></span>
                            </div>

                            {/* USER INFO */}
                            <div>
                                <h1 className="text-3xl font-bold text-white">
                                    {user?.firstName} {user?.lastName}
                                </h1>

                                <p className="text-white/80 mt-1 flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    {user?.email}
                                </p>

                                <div className="flex items-center gap-2 mt-3 flex-wrap">

                                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getRoleColor(user?.role)}`}>
                                        {getRoleText(user?.role)}
                                    </span>

                                    {user?.isVerified ? (
                                        <span className="px-3 py-1 rounded-full bg-green-500 text-white text-xs font-medium flex items-center gap-1">
                                            <ShieldCheck className="h-3 w-3" />
                                            Verified
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 rounded-full bg-red-500 text-white text-xs font-medium flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            Not Verified
                                        </span>
                                    )}

                                </div>
                            </div>
                        </div>

                        {/* Right Side - Action */}
                        <div className="flex items-center gap-3">

                            {!user?.isVerified && (
                                <Link href="/verifyEmail">
                                    <button className="px-5 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium shadow-md transition">
                                        <CheckCircle className="h-4 w-4 inline mr-2" />
                                        Verify Account
                                    </button>
                                </Link>
                            )}

                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Sidebar Navigation */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-24">
                            <CardContent className="p-6">
                                <nav className="space-y-2">
                                    <Button
                                        variant={activeTab === 'personal' ? 'default' : 'ghost'}
                                        className="w-full justify-start"
                                        onClick={() => setActiveTab('personal')}
                                    >
                                        <User className="h-4 w-4 mr-3" />
                                        المعلومات الشخصية
                                    </Button>

                                    <Button
                                        variant={activeTab === 'account' ? 'default' : 'ghost'}
                                        className="w-full justify-start"
                                        onClick={() => setActiveTab('account')}
                                    >
                                        <Shield className="h-4 w-4 mr-3" />
                                        معلومات الحساب
                                    </Button>

                                    {user?.role === 'seller' && (
                                        <Button
                                            variant={activeTab === 'vendor' ? 'default' : 'ghost'}
                                            className="w-full justify-start"
                                            onClick={() => setActiveTab('vendor')}
                                        >
                                            <Building className="h-4 w-4 mr-3" />
                                            معلومات التاجر
                                        </Button>
                                    )}

                                  
                                

                                    <Button
                                        variant={activeTab === 'security' ? 'default' : 'ghost'}
                                        className="w-full justify-start"
                                        onClick={() => setActiveTab('security')}
                                    >
                                        <Lock className="h-4 w-4 mr-3" />
                                        الأمان
                                    </Button>

                                    <Button
                                        variant={activeTab === 'activity' ? 'default' : 'ghost'}
                                        className="w-full justify-start"
                                        onClick={() => setActiveTab('activity')}
                                    >
                                        <Activity className="h-4 w-4 mr-3" />
                                        النشاطات
                                    </Button>

                                    <Separator className="my-4" />

                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => router.push('/auth/logout')}
                                    >
                                        <LogOut className="h-4 w-4 mr-3" />
                                        تسجيل الخروج
                                    </Button>
                                </nav>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-3">
                        {/* Personal Information */}
                        {activeTab === 'personal' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        المعلومات الشخصية
                                    </CardTitle>
                                    <CardDescription>
                                        إدارة معلوماتك الشخصية وبيانات الاتصال
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {error && (
                                        <Alert variant="destructive" className="mb-6">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertTitle>خطأ</AlertTitle>
                                            <AlertDescription>{error}</AlertDescription>
                                        </Alert>
                                    )}

                                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="firstName">الاسم الأول *</Label>
                                                <Input
                                                    id="firstName"
                                                    name="firstName"
                                                    value={formData.firstName}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                                    placeholder="أدخل اسمك الأول"
                                                    disabled={!isEditing}
                                                />
                                                {errors.firstName && (
                                                    <p className="text-sm text-destructive">{errors.firstName}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="lastName">الاسم الأخير *</Label>
                                                <Input
                                                    id="lastName"
                                                    name="lastName"
                                                    value={formData.lastName}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                                    placeholder="أدخل اسمك الأخير"
                                                    disabled={!isEditing}
                                                />
                                                {errors.lastName && (
                                                    <p className="text-sm text-destructive">{errors.lastName}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="email">البريد الإلكتروني *</Label>
                                                <div className="relative">
                                                    <Input
                                                        id="email"
                                                        name="email"
                                                        type="email"
                                                        value={formData.email}
                                                        disabled
                                                        className="bg-gray-50"
                                                    />
                                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                                        {user?.isVerified ? (
                                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                                        ) : (
                                                            <AlertCircle className="h-5 w-5 text-destructive" />
                                                        )}
                                                    </div>
                                                </div>
                                                <p className={`text-sm ${user?.isVerified ? 'text-green-600' : 'text-destructive'}`}>
                                                    {user?.isVerified ? '✓ تم التحقق من البريد الإلكتروني' : '⚠ لم يتم التحقق من البريد الإلكتروني'}
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="phone">رقم الهاتف *</Label>
                                                <Input
                                                    id="phone"
                                                    name="phone"
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                                    placeholder="01XXXXXXXXX"
                                                    disabled={!isEditing}
                                                />
                                                {errors.phone && (
                                                    <p className="text-sm text-destructive">{errors.phone}</p>
                                                )}
                                            </div>
                                        </div>

                                        {!isEditing ? (
                                            <Button
                                                type="button"
                                                onClick={() => setIsEditing(true)}
                                                className="mt-6"
                                            >
                                                <Edit className="h-4 w-4 mr-2" />
                                                تعديل المعلومات
                                            </Button>
                                        ) : (
                                            <div className="flex gap-3 pt-6">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setIsEditing(false);
                                                        fetchProfile();
                                                    }}
                                                >
                                                    إلغاء
                                                </Button>
                                                <Button type="submit" disabled={loading}>
                                                    {loading ? (
                                                        <>
                                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                            جاري الحفظ...
                                                        </>
                                                    ) : (
                                                        'حفظ التغييرات'
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </form>
                                </CardContent>
                            </Card>
                        )}

                        {/* Account Information */}
                        {activeTab === 'account' && (
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Shield className="h-5 w-5" />
                                            معلومات الحساب
                                        </CardTitle>
                                        <CardDescription>
                                            تفاصيل حسابك وإعدادات الأمان
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                                    <span className="font-medium">معرف المستخدم</span>
                                                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                                        {user?.id?.slice(0, 8)}...
                                                    </code>
                                                </div>

                                                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                                    <span className="font-medium">حالة الحساب</span>
                                                    <Badge variant={user?.isActive ? 'default' : 'destructive'}>
                                                        {user?.isActive ? 'نشط' : 'غير نشط'}
                                                    </Badge>
                                                </div>

                                                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                                    <span className="font-medium">تاريخ الإنشاء</span>
                                                    <span className="text-sm text-gray-600">
                                                        {formatDate(user?.createdAt)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                                    <span className="font-medium">آخر تحديث</span>
                                                    <span className="text-sm text-gray-600">
                                                        {formatDate(user?.updatedAt)}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                                    <span className="font-medium">آخر تسجيل دخول</span>
                                                    <span className="text-sm text-gray-600">
                                                        {formatDate(user?.lastLogin)}
                                                    </span>
                                                </div>

                                                <div className="p-4 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-medium">أمان الحساب</span>
                                                        <Badge variant={user?.isVerified ? 'default' : 'destructive'}>
                                                            {user?.isVerified ? 'آمن' : 'يحتاج تفعيل'}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-gray-600">
                                                        {user?.isVerified
                                                            ? 'تم التحقق من بريدك الإلكتروني ويمكنك استخدام كافة الميزات'
                                                            : 'يرجى تفعيل بريدك الإلكتروني لاستخدام كافة الميزات'
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Wallet Information for Sellers */}
                                {user?.role === 'seller' && user?.wallet && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Wallet className="h-5 w-5" />
                                                المحفظة
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid md:grid-cols-3 gap-4">
                                                <div className="p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="p-2 bg-green-100 rounded-lg">
                                                            <Wallet className="h-6 w-6 text-green-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-green-700 font-medium">الرصيد المتاح</p>
                                                            <p className="text-2xl font-bold text-green-900">
                                                                {user.wallet.balance} {user.wallet.currency}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="p-2 bg-blue-100 rounded-lg">
                                                            <Clock className="h-6 w-6 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-blue-700 font-medium">الرصيد المعلق</p>
                                                            <p className="text-2xl font-bold text-blue-900">
                                                                {user.wallet.pendingBalance?.toFixed(2)} {user.wallet.currency}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="p-2 bg-purple-100 rounded-lg">
                                                            <CreditCard className="h-6 w-6 text-purple-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-purple-700 font-medium">إجمالي الرصيد</p>
                                                            <p className="text-2xl font-bold text-purple-900">
                                                                {(user.wallet.balance || 0) + (user.wallet.pendingBalance || 0)} {user.wallet.currency}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}

                        {/* Vendor Information */}
                        {activeTab === 'vendor' && user?.vendorProfile && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Building className="h-5 w-5" />
                                        معلومات التاجر
                                    </CardTitle>
                                    <CardDescription>
                                        تفاصيل نشاطك التجاري
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="p-4 bg-gray-50 rounded-lg">
                                                <Label className="text-sm text-gray-500 mb-1">اسم النشاط التجاري</Label>
                                                <p className="font-medium">{user.vendorProfile.storeName}</p>
                                            </div>

                                            <div className="p-4 bg-gray-50 rounded-lg">
                                                <Label className="text-sm text-gray-500 mb-1">نوع النشاط</Label>
                                                <p className="font-medium">
                                                    {user.vendorProfile.businessType === 'individual' ? 'تاجر فردي' :
                                                        user.vendorProfile.businessType === 'company' ? 'شركة' : 'مؤسسة'}
                                                </p>
                                            </div>

                                            <div className="p-4 bg-gray-50 rounded-lg">
                                                <Label className="text-sm text-gray-500 mb-1">السجل التجاري</Label>
                                                <p className="font-medium">{user.vendorProfile.taxID || 'غير محدد'}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                                                <div className="flex items-center justify-between mb-2">
                                                    <Label className="text-sm text-yellow-700">التقييم</Label>
                                                    <div className="flex items-center">
                                                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                                        <span className="font-bold text-lg mr-1">{user.vendorProfile.rating?.toFixed(1)}</span>
                                                    </div>
                                                </div>
                                                <Progress value={(user.vendorProfile.rating || 0) * 20} className="h-2" />
                                            </div>

                                            <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-sm text-green-700">إجمالي المبيعات</Label>
                                                    <p className="text-2xl font-bold text-green-900">
                                                        {user.vendorProfile.totalSales?.toFixed(0)} طلب
                                                    </p>
                                                </div>
                                            </div>

                                            {user.vendorProfile.description && (
                                                <div className="p-4 bg-gray-50 rounded-lg">
                                                    <Label className="text-sm text-gray-500 mb-2">وصف النشاط</Label>
                                                    <p className="text-gray-700">{user.vendorProfile.description}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        {/* Security & Password */}
                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Lock className="h-5 w-5" />
                                            تغيير كلمة المرور
                                        </CardTitle>
                                        <CardDescription>
                                            قم بتحديث كلمة المرور الخاصة بك لتأمين حسابك
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={handlePasswordChange} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
                                                <div className="relative">
                                                    <Input
                                                        id="currentPassword"
                                                        type={showPassword.current ? "text" : "password"}
                                                        value={passwordForm.currentPassword}
                                                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                                        placeholder="أدخل كلمة المرور الحالية"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="absolute left-2 top-1/2 transform -translate-y-1/2"
                                                        onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                                                    >
                                                        {showPassword.current ? (
                                                            <EyeOff className="h-4 w-4" />
                                                        ) : (
                                                            <Eye className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                                                <div className="relative">
                                                    <Input
                                                        id="newPassword"
                                                        type={showPassword.new ? "text" : "password"}
                                                        value={passwordForm.newPassword}
                                                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                                        placeholder="كلمة المرور الجديدة (8 أحرف على الأقل)"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="absolute left-2 top-1/2 transform -translate-y-1/2"
                                                        onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                                                    >
                                                        {showPassword.new ? (
                                                            <EyeOff className="h-4 w-4" />
                                                        ) : (
                                                            <Eye className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                                {passwordForm.newPassword && (
                                                    <div className="space-y-2">
                                                        <Progress
                                                            value={calculatePasswordStrength(passwordForm.newPassword)}
                                                            className="h-2"
                                                        />
                                                        <p className="text-xs text-gray-500">
                                                            قوة كلمة المرور: {calculatePasswordStrength(passwordForm.newPassword)}%
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</Label>
                                                <div className="relative">
                                                    <Input
                                                        id="confirmPassword"
                                                        type={showPassword.confirm ? "text" : "password"}
                                                        value={passwordForm.confirmPassword}
                                                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                                        placeholder="أعد إدخال كلمة المرور الجديدة"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="absolute left-2 top-1/2 transform -translate-y-1/2"
                                                        onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                                                    >
                                                        {showPassword.confirm ? (
                                                            <EyeOff className="h-4 w-4" />
                                                        ) : (
                                                            <Eye className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                                {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                                                    <p className="text-sm text-destructive">كلمة المرور غير متطابقة</p>
                                                )}
                                            </div>

                                            {passwordError && (
                                                <Alert variant="destructive">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <AlertDescription>{passwordError}</AlertDescription>
                                                </Alert>
                                            )}

                                            <Button type="submit" className="w-full" disabled={passwordLoading}>
                                                {passwordLoading ? (
                                                    <>
                                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                        جاري التحديث...
                                                    </>
                                                ) : 'تغيير كلمة المرور'}
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <ShieldCheck className="h-5 w-5" />
                                            نصائح الأمان
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-3 text-sm">
                                            <li className="flex items-start gap-2">
                                                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                <span>استخدم كلمة مرور قوية تحتوي على أحرف وأرقام ورموز خاصة</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                <span>لا تستخدم كلمة المرور نفسها في أكثر من موقع</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                <span>غير كلمة المرور بانتظام (كل 3-6 أشهر)</span>
                                            </li>
                                        
                                        </ul>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Activity */}
                        {activeTab === 'activity' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="h-5 w-5" />
                                        النشاطات الأخيرة
                                    </CardTitle>
                                    <CardDescription>
                                        سجل نشاطات حسابك
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <h3 className="font-semibold text-lg">ملخص النشاط</h3>
                                            <div className="grid md:grid-cols-3 gap-4">
                                                <div className="p-4 bg-gray-50 rounded-lg">
                                                    <p className="text-sm text-gray-600">تاريخ الإنشاء</p>
                                                    <p className="font-semibold">{formatDate(user?.createdAt)}</p>
                                                </div>
                                                <div className="p-4 bg-gray-50 rounded-lg">
                                                    <p className="text-sm text-gray-600">آخر تحديث</p>
                                                    <p className="font-semibold">{formatDate(user?.updatedAt)}</p>
                                                </div>
                                                <div className="p-4 bg-gray-50 rounded-lg">
                                                    <p className="text-sm text-gray-600">آخر تسجيل دخول</p>
                                                    <p className="font-semibold">{formatDate(user?.lastLogin)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <Separator />

                                        <div>
                                            <h3 className="font-semibold text-lg mb-4">سجل النشاطات</h3>
                                            <div className="space-y-4">
                                                {user?.loginHistory?.length > 0 ? (
                                                    user.loginHistory.slice(0, 10).map((login: any, index: number) => (
                                                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-primary/10 rounded-lg">
                                                                    <User className="h-4 w-4 text-primary" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium">تسجيل دخول</p>
                                                                    <p className="text-sm text-gray-600">
                                                                        {login.device} • {login.ipAddress}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <p className="text-sm text-gray-600">
                                                                {formatDate(login.timestamp)}
                                                            </p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-8">
                                                        <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                                        <p className="text-gray-600">لا توجد نشاطات مسجلة</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
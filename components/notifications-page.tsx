'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from "@/components/language-provider";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Package, Tag, Percent, AlertCircle } from 'lucide-react';

interface Notification {
  _id: string;
  type: string;
  title?: string;
  message?: string;
  link?: string;
  isRead: boolean;
  createdAt: string | number | Date;
}

import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { notificationService } from '@/lib/api';
import { MirvoryPageLoader } from './MirvoryLoader';

export function NotificationsPage() {
  const { language } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await notificationService.getNotifications();
        //console.log(response, 'xs')
        setNotifications(response.data.data || []);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        toast.error(language === 'ar' ? 'فشل في تحميل الإشعارات' : 'Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };
    // ✅ تحقق أولاً إن المستخدم مسجّل دخول
    fetchNotifications();

  }, []);

  const formatDate = (dateString: string | number | Date) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return language === 'ar' ? 'تاريخ غير معروف' : 'Unknown date';
    }
  };

  const getTypeIcon = (type: any) => {
    switch (type) {
      case 'ORDER_PLACED':
      case 'ORDER_SHIPPED':
      case 'ORDER_COMPLETED':
      case 'ORDER_DELIVERED':
        return <Package className="h-5 w-5" />;
      case 'PAYOUT_COMPLETED':
      case 'NEW_ANNOUNCEMENT':
      case 'promo':
        return <Percent className="h-5 w-5" />;
      case 'product':
        return <Tag className="h-5 w-5" />;
      case 'RETURN_REQUESTED':
      case 'system':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: any) => {
    switch (type) {
      case 'ORDER_PLACED':
      case 'ORDER_SHIPPED':
      case 'ORDER_COMPLETED':
      case 'ORDER_DELIVERED':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'PAYOUT_COMPLETED':
      case 'NEW_ANNOUNCEMENT':
      case 'promo':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'product':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'RETURN_REQUESTED':
      case 'system':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success(language === 'ar' ? 'تم تعليم الكل كمقروء' : 'All marked as read');
    } catch {
      toast.error(language === 'ar' ? 'فشل في تعليم الإشعارات كمقروءة' : 'Failed to mark as read');
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => (n._id === id ? { ...n, isRead: true } : n)));
    } catch {
      toast.error(language === 'ar' ? 'فشل في تحديث الإشعار' : 'Failed to update notification');
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.isRead;

    const typeMap = {
      order: ['ORDER_PLACED', 'ORDER_SHIPPED', 'ORDER_COMPLETED', 'ORDER_DELIVERED'],
      promo: ['PAYOUT_COMPLETED', 'NEW_ANNOUNCEMENT'],
      system: ['RETURN_REQUESTED']
    };

    return typeMap[activeTab]?.includes(notification.type) || notification.type === activeTab;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // ✅ حالة التحميل
  if (loading) {
    return <MirvoryPageLoader text={language === 'ar' ? 'جاري التحميل...' : 'Loading...'} />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            {language === 'ar' ? 'الإشعارات' : 'Notifications'}
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-primary px-2.5 py-0.5 text-sm font-medium text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar'
              ? 'اطلع على آخر التحديثات والإشعارات الخاصة بحسابك وطلباتك والعروض'
              : 'Check your latest updates and notifications about your account, orders, and offers'}
          </p>
        </div>
        <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
          {language === 'ar' ? 'تعليم الكل كمقروء' : 'Mark all as read'}
        </Button>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 md:w-[600px]">
          <TabsTrigger value="all">{language === 'ar' ? 'الكل' : 'All'}</TabsTrigger>
          <TabsTrigger value="unread">{language === 'ar' ? 'غير مقروءة' : 'Unread'}</TabsTrigger>
          <TabsTrigger value="order">{language === 'ar' ? 'الطلبات' : 'Orders'}</TabsTrigger>
          {/* <TabsTrigger value="promo">{language === 'ar' ? 'العروض' : 'Promos'}</TabsTrigger> */}
          <TabsTrigger value="system">{language === 'ar' ? 'النظام' : 'System'}</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-4">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-medium mb-2">
                {language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
              </h2>
              <p className="text-muted-foreground mb-6">
                {language === 'ar'
                  ? 'لا توجد إشعارات من هذا النوع حاليًا'
                  : 'There are no notifications of this type yet'}
              </p>
              <Button asChild variant="outline">
                <Link href="/products">
                  {language === 'ar' ? 'تصفح المنتجات' : 'Browse Products'}
                </Link>
              </Button>
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <Card
                key={notification._id}
                className={`p-4 transition-all duration-200 ${notification.isRead ? 'bg-background' : 'bg-primary/5'
                  }`}
              >
                <Link
                  href={notification.link || '#'}
                  onClick={() => !notification.isRead && markAsRead(notification._id)}
                >
                  <div className="flex gap-4">
                    <div className={`rounded-full p-2 ${getTypeColor(notification.type)}`}>
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between">
                        <h3 className="font-medium">{notification.title}</h3>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ms-4">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                    </div>
                    {!notification.isRead && <div className="w-2 h-2 rounded-full bg-primary mt-2" />}
                  </div>
                </Link>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

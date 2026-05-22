"use client";

import { Mail, Phone, Facebook, Instagram, Twitter, Linkedin, Youtube, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function ContactPage() {
  const router = useRouter();

  const contacts = [
    {
      label: "البريد الإلكتروني",
      href: "mailto:support.mirvory@gmail.com",
      Icon: Mail,
      description: "support.mirvory@gmail.com",
      bg: "bg-primary/10 text-primary",
    },
    {
      label: "واتساب",
      href: "https://wa.me/201060167568",
      Icon: MessageCircle,
      description: "+201060167568",
      bg: "bg-emerald-50 text-emerald-600",
    },
    // {
    //   label: "فيسبوك",
    //   href: "https://facebook.com/mirvory",
    //   Icon: Facebook,
    //   description: "facebook.com/mirvory",
    //   bg: "bg-blue-50 text-blue-600",
    // },
    // {
    //   label: "إنستجرام",
    //   href: "https://instagram.com/mirvory",
    //   Icon: Instagram,
    //   description: "@mirvory",
    //   bg: "bg-pink-50 text-pink-500",
    // },
    // {
    //   label: "تويتر",
    //   href: "https://twitter.com/mirvory",
    //   Icon: Twitter,
    //   description: "@mirvory",
    //   bg: "bg-sky-50 text-sky-500",
    // },
    // {
    //   label: "لينكدإن",
    //   href: "https://linkedin.com/company/mirvory",
    //   Icon: Linkedin,
    //   description: "linkedin.com/company/mirvory",
    //   bg: "bg-slate-50 text-slate-600",
    // },
    // {
    //   label: "يوتيوب",
    //   href: "https://youtube.com/@mirvory",
    //   Icon: Youtube,
    //   description: "youtube.com/@mirvory",
    //   bg: "bg-rose-50 text-rose-600",
    // },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">تواصل معنا</h1>
          <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
            يسعدنا تواصلك مع فريق ميرفوري لأي استفسارات، مقترحات أو دعم فني. اختر وسيلة التواصل المناسبة لك.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {contacts.map(({ label, href, Icon, description, bg }) => (
            <Card key={label} className="transition-shadow hover:shadow-lg">
              <CardHeader className="flex flex-row items-center gap-4 pb-4">
                <div className={`p-3 rounded-xl ${bg}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">{label}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => window.open(href, "_blank")}
                >
                  زيارة
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16">
          <Button variant="outline" onClick={() => router.back()} className="gap-2">
            العودة
          </Button>
        </div>
      </div>
    </div>
  );
}

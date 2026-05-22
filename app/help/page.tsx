"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { HelpCircle, Mail, MessageCircle } from "lucide-react";

export default function HelpPage() {
  const router = useRouter();

  const faqs = [
    {
      q: "كيف أتتبع طلباتي؟",
      a: "يمكنك تتبع طلباتك من خلال صفحة \"طلباتي\" حيث ستجد حالة كل طلب بالتفصيل.",
    },
    {
      q: "كيف أعدل أو ألغي طلب؟",
      a: "إذا كان الطلب قيد الانتظار يمكنك التواصل معنا لإلغائه أو تعديله قبل الشحن.",
    },
    {
      q: "ما هي خيارات الدفع المتاحة؟",
      a: "نقبل الدفع بالبطاقات البنكية، المحافظ الإلكترونية وخدمة الدفع عند الاستلام في بعض المناطق.",
    },
    {
      q: "كم يستغرق التوصيل؟",
      a: "عادةً ما يتم التوصيل خلال 2-5 أيام عمل داخل مصر حسب المدينة ومنطقة التوصيل.",
    },
    {
      q: "كيف أتواصل مع الدعم الفني؟",
      a: "توجه إلى صفحة التواصل واختر الوسيلة التي تناسبك مثل البريد الإلكتروني أو واتساب.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
            <HelpCircle className="w-8 h-8 text-primary" />
            المساعدة والأسئلة الشائعة
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
            ستجد هنا إجابات عن أكثر الأسئلة شيوعًا. إذا لم تجد ما تبحث عنه فلا تتردد في التواصل معنا.
          </p>
        </div>

        <Accordion type="single" collapsible className="mb-16 border rounded-xl bg-white shadow-sm">
          {faqs.map(({ q, a }, idx) => (
            <AccordionItem key={idx} value={`item-${idx}`}>
              <AccordionTrigger className="px-6">{q}</AccordionTrigger>
              <AccordionContent className="px-6 pb-6 text-gray-700 leading-relaxed">
                {a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="text-center space-y-6">
          <p className="text-gray-700 text-lg">
            لازلت بحاجة للمساعدة؟ تواصل مع فريق الدعم بكل سهولة.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              variant="default"
              className="gap-2"
              onClick={() => router.push("/contact")}
            >
              <Mail className="w-4 h-4" />
              صفحة التواصل
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.open("https://wa.me/201060167568", "_blank")}
            >
              <MessageCircle className="w-4 h-4" />
              واتساب مباشر
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

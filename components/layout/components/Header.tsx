"use client"

import React from 'react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingCart, User, Menu, X } from "lucide-react";

interface HeaderProps {
  cartCount?: number;
}

export const Header = ({ cartCount = 0 }: HeaderProps) => {

  return (
    <header className="border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Sheet>
              <SheetTrigger>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>القائمة</SheetTitle>
                </SheetHeader>
              </SheetContent>
            </Sheet>
            <div className="ml-4">
              <h1 className="text-2xl font-bold">Mirvory</h1>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <a href="/" className="text-sm font-medium hover:text-primary transition-colors">
              الرئيسية
            </a>
            <a href="/products" className="text-sm font-medium hover:text-primary transition-colors">
              المنتجات
            </a>
            <a href="/categories" className="text-sm font-medium hover:text-primary transition-colors">
              التصنيفات
            </a>
            {/* <a href="/offers" className="text-sm font-medium hover:text-primary transition-colors">
              العروض
            </a> */}
          </nav>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {cartCount}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="icon">
              <User className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Wifi, Menu, X } from "lucide-react"
import { useState } from "react"

export function Header() {
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { label: "หน้าแรก", href: "/" },
    { label: "โซลูชัน", href: "/solutions" },
    { label: "คุณสมบัติ", href: "/features" },
    { label: "ราคา", href: "/pricing" },
    { label: "บทความ", href: "/blog" },
    { label: "ติดต่อ", href: "/contact" },
    { label: "เกี่ยวกับเรา", href: "/about" },
  ]

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <Wifi className="w-5 h-5 text-background" />
          </div>
          <span className="text-xl font-bold text-foreground">IoTHub</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-foreground/70 hover:text-foreground transition text-sm"
            >
              {item.label}
            </Link>
          ))}
          <Button variant="default" className="bg-accent text-background hover:bg-accent/90">
            เริ่มต้นใช้งาน
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-foreground" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="absolute top-16 left-0 right-0 bg-background border-b border-border md:hidden">
            <div className="flex flex-col gap-2 p-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-foreground/70 hover:text-foreground transition py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Button variant="default" className="bg-accent text-background hover:bg-accent/90 mt-2 w-full">
                เริ่มต้นใช้งาน
              </Button>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock, ArrowRight, Loader } from "lucide-react"
import Link from "next/link"

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if already logged in, redirect to dashboard
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.replace("/admin/dashboard")
      }
    }
    checkAuth()
  }, [router, supabase])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-2xl p-12 bg-card border-border relative z-10">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-accent/20 rounded-lg mb-6">
            <Lock className="w-10 h-10 text-accent" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">ระบบจัดการ IoT</h1>
          <p className="text-foreground/60 text-lg mb-8">
            แพลตฟอร์มจัดการอุปกรณ์ IoT แบบครบวงจร<br />
            ควบคุม ติดตาม และวิเคราะห์ข้อมูลอุปกรณ์ของคุณ
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-background/50 rounded-lg border border-border">
            <div className="text-accent font-semibold mb-2">📊 Dashboard</div>
            <p className="text-sm text-foreground/60">ภาพรวมระบบและสถานะอุปกรณ์</p>
          </div>
          <div className="p-4 bg-background/50 rounded-lg border border-border">
            <div className="text-accent font-semibold mb-2">🔧 จัดการอุปกรณ์</div>
            <p className="text-sm text-foreground/60">เพิ่ม ลบ และตั้งค่าอุปกรณ์</p>
          </div>
          <div className="p-4 bg-background/50 rounded-lg border border-border">
            <div className="text-accent font-semibold mb-2">📈 วิเคราะห์ข้อมูล</div>
            <p className="text-sm text-foreground/60">กราฟและรายงานแบบเรียลไทม์</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/admin/login" className="flex-1 sm:flex-initial">
            <Button className="w-full bg-accent text-background hover:bg-accent/90 h-12 text-lg gap-2">
              เข้าสู่ระบบ
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/admin/sign-up" className="flex-1 sm:flex-initial">
            <Button variant="outline" className="w-full h-12 text-lg">
              สร้างบัญชีใหม่
            </Button>
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-sm text-foreground/60 mb-2">บัญชีทดสอบสำหรับ Demo:</p>
          <code className="text-xs bg-background px-3 py-1 rounded border border-border">
            admin@iot.com / password123
          </code>
        </div>
      </Card>
    </div>
  )
}

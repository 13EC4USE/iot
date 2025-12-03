import Link from "next/link"
import { Wifi } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-semibold text-foreground mb-4">สินค้า</h4>
            <ul className="space-y-2 text-sm text-foreground/70">
              <li>
                <Link href="/features" className="hover:text-foreground transition">
                  คุณสมบัติ
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-foreground transition">
                  ราคา
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground transition">
                  ความปลอดภัย
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">ทรัพยากร</h4>
            <ul className="space-y-2 text-sm text-foreground/70">
              <li>
                <Link href="#" className="hover:text-foreground transition">
                  เอกสาร
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground transition">
                  ข้อมูลอ้างอิง API
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-foreground transition">
                  บล็อก
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">บริษัท</h4>
            <ul className="space-y-2 text-sm text-foreground/70">
              <li>
                <Link href="/about" className="hover:text-foreground transition">
                  เกี่ยวกับ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground transition">
                  ติดต่อ
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground transition">
                  อาชีพ
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">กฎหมาย</h4>
            <ul className="space-y-2 text-sm text-foreground/70">
              <li>
                <Link href="#" className="hover:text-foreground transition">
                  ความเป็นส่วนตัว
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground transition">
                  เงื่อนไข
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground transition">
                  นโยบายคุกกี้
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <Wifi className="w-5 h-5 text-background" />
              </div>
              <span className="font-semibold text-foreground">IoTHub</span>
            </div>
            <p className="text-sm text-foreground/60">© 2025 IoTHub สงวนสิทธิ์ทั้งหมด</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

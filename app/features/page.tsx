import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Wifi, Zap, Shield, BarChart3, Cloud, Lock } from "lucide-react"

export default function FeaturesPage() {
  return (
    <main className="font-sans">
      <Header />

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-background border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">คุณสมบัติที่ทรงพลัง</h1>
          <p className="text-lg text-foreground/60 text-balance">
            เพลิดเพลินกับชุดคุณสมบัติที่ครอบคลุมสำหรับแอปพลิเคชัน IoT ที่ปลายสุด
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
            {[
              {
                icon: Wifi,
                title: "การเชื่อมต่อแบบเรียลไทม์",
                description: "สนับสนุนหลาย ๆ โปรโตคอล (MQTT, CoAP, HTTP) พร้อมการปลอดภัยระดับองค์กรและการเข้ารหัส",
                details: [
                  "การเชื่อมต่อหลายแสนอุปกรณ์พร้อมกัน",
                  "เวลาตอบสนอง < 100ms",
                  "การโหลดสมดุลอัตโนมัติ",
                  "การจัดการการเชื่อมต่อซ้ำ",
                ],
              },
              {
                icon: BarChart3,
                title: "การวิเคราะห์ขั้นสูง",
                description: "ประมวลผลและแสดงภาพข้อมูลการไหลแบบเรียลไทม์ สร้างแดชบอร์ดแบบกำหนดเอง",
                details: [
                  "การสืบค้นข้อมูลเพื่อหยิบยกในหลาย ๆ มิติ",
                  "การรวมข้อมูลแบบกำหนดเอง",
                  "การแจ้งเตือน/การทำให้เป็นอัตโนมัติ",
                  "ส่วนรองรับ SQL เต็มรูปแบบ",
                ],
              },
              {
                icon: Zap,
                title: "การประมวลผลแบบ Edge",
                description: "ประมวลผลข้อมูลในท้องถิ่นบนอุปกรณ์เพื่อลดเวลาแฝงและแบนด์วิดท์",
                details: [
                  "รันไทม์ JavaScript บน Edge Devices",
                  "การประมวลผลคำสั่งสูงสุด",
                  "ลดการใช้แบนด์วิดท์ 90%",
                  "การตัดสินใจในเวลาจริง",
                ],
              },
              {
                icon: Shield,
                title: "ความปลอดภัยระดับองค์กร",
                description: "การเข้ารหัสเกรดทหาร การควบคุมการเข้าถึงแบบอิงบทบาท และการตรวจสอบ",
                details: ["การเข้ารหัส TLS/SSL", "ลายนิ้วมือของอุปกรณ์", "การควบคุมการเข้าถึงแบบ RBAC", "บันทึกการตรวจสอบเต็มรูปแบบ"],
              },
              {
                icon: Cloud,
                title: "เนทีฟคลาวด์",
                description: "ปรับขนาดได้อย่างราบรื่นจากหลายพันเป็นหลายพันล้านเหตุการณ์ต่อวินาที",
                details: ["คลัสเตอร์ Kubernetes", "การ Scaling อัตโนมัติ", "การลงชื่อใหม่เสมอ", "ความพร้อม 99.99%"],
              },
              {
                icon: Lock,
                title: "การจัดการอุปกรณ์",
                description: "อัปเดตผ่านอากาศ การวินิจฉัยระยะไกล และการจัดการฟลีต",
                details: ["อัปเดตผ่านอากาศแบบปลอดภัย", "การจัดการกลุ่มอุปกรณ์", "การวินิจฉัยระยะไกล", "การติดตามและการรายงาน"],
              },
            ].map((feature, idx) => (
              <Card key={idx} className="p-8 bg-card border-border hover:border-accent/50 transition">
                <div className="mb-4 inline-block p-3 bg-accent/10 rounded-lg">
                  <feature.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-foreground/70 mb-6">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.details.map((detail, i) => (
                    <li key={i} className="flex items-start text-foreground/80">
                      <div className="w-2 h-2 bg-accent rounded-full mr-3 mt-2 flex-shrink-0"></div>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

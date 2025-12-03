import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ArrowRight, Wifi, Zap, Shield, BarChart3, Cloud, Lock } from "lucide-react"

export default function Home() {
  return (
    <main className="font-sans">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-background via-background to-background/95 px-4 sm:px-6 lg:px-8 py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="inline-block mb-4">
            <span className="text-accent text-sm font-semibold tracking-wide">อุปกรณ์ที่เชื่อมต่อแบบอัจฉริยะ</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance leading-tight">
            อนาคตของการเชื่อมต่อ <span className="text-accent">อัจฉริยะ</span>
          </h1>

          <p className="text-lg md:text-xl text-foreground/70 mb-8 max-w-2xl mx-auto text-balance">
            เชื่อมต่อ ตรวจสอบ และควบคุมอุปกรณ์ของคุณจากทุกที่ การวิเคราะห์ข้อมูลแบบเรียลไทม์ การบำรุงรักษาแบบคาดการณ์
            และการรวมเข้าด้วยกันได้อย่างราบรื่นสำหรับระบบนิเวศของคุณ
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-accent text-background hover:bg-accent/90 h-12">
              เริ่มการทดลองใช้ฟรี <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-accent/50 text-foreground hover:bg-accent/10 h-12 bg-transparent"
            >
              ดูสาธิต
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 text-balance">แพลตฟอร์ม IoT ที่ทรงพลัง</h2>
            <p className="text-lg text-foreground/60 max-w-2xl mx-auto text-balance">
              ทุกสิ่งที่คุณต้องการเพื่อสร้าง ปรับใช้ และเพิ่มขนาดแอปพลิเคชัน IoT
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Wifi,
                title: "การเชื่อมต่อแบบเรียลไทม์",
                description: "เชื่อมต่อหลายล้านอุปกรณ์ด้วยเวลาตอบสนองต่ำที่สุด โปรโตคอลการสื่อสารที่เชื่อถือได้และปลอดภัย",
              },
              {
                icon: BarChart3,
                title: "การวิเคราะห์ขั้นสูง",
                description: "ประมวลผลและแสดงภาพข้อมูลการไหล สร้างแดชบอร์ดแบบกำหนดเองและได้รับข้อมูลเชิงลึกที่มีความหมายในทันที",
              },
              {
                icon: Zap,
                title: "การประมวลผลแบบ Edge",
                description: "ประมวลผลข้อมูลในท้องถิ่นบนอุปกรณ์ของคุณ ลดเวลาแฝงและแบนด์วิดท์ขณะรักษาความปลอดภัย",
              },
              {
                icon: Shield,
                title: "ความปลอดภัยระดับองค์กร",
                description: "การเข้ารหัสเกรดทหาร การควบคุมการเข้าถึงแบบอิงบทบาท และการตรวจสอบภัยคุกคามอย่างต่อเนื่อง",
              },
              {
                icon: Cloud,
                title: "เนทีฟคลาวด์",
                description: "ปรับขนาดได้อย่างราบรื่นจากหลายพันเป็นหลายพันล้านเหตุการณ์ต่อวินาที จ่ายเฉพาะที่คุณใช้เท่านั้น",
              },
              {
                icon: Lock,
                title: "การจัดการอุปกรณ์",
                description: "อัปเดตผ่านอากาศ การวินิจฉัยระยะไกล และการจัดการฟลีตจากคอนโซลเดียว",
              },
            ].map((feature, idx) => (
              <Card key={idx} className="p-6 bg-card border-border hover:border-accent/50 transition group">
                <div className="mb-4 inline-block p-3 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition">
                  <feature.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-foreground/60">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solutions" className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-background/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 text-balance">โซลูชันตามอุตสาหกรรม</h2>
            <p className="text-lg text-foreground/60 max-w-2xl mx-auto text-balance">
              ได้รับความไว้วางใจจากผู้นำอุตสาหกรรมในหลายภาค
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: "การผลิตอัจฉริยะ",
                description: "ปรับปรุงเส้นการผลิต ทำนายความล้มเหลวของอุปกรณ์ และปรับปรุงประสิทธิภาพการใช้อุปกรณ์โดยรวม",
                items: ["การบำรุงรักษาแบบคาดการณ์", "การวิเคราะห์การผลิต", "ควบคุมคุณภาพ"],
              },
              {
                title: "เมืองอัจฉริยะ",
                description: "สร้างโครงสร้างพื้นฐานที่เชื่อมต่อสำหรับการจัดการ交通พลังงาน และทรัพยากรในมาตราส่วนขนาดใหญ่",
                items: ["การจัดการการจราจร", "การปรับปรุงพลังงาน", "การตรวจสอบโครงสร้างพื้นฐาน"],
              },
              {
                title: "สุขภาพ",
                description: "ตรวจสอบสุขภาพของผู้ป่วย จัดการอุปกรณ์ทางการแพทย์ และเปิดใช้งานการวินิจฉัยระยะไกลได้อย่างปลอดภัย",
                items: ["การตรวจสอบระยะไกล", "การจัดการอุปกรณ์", "ความปลอดภัยข้อมูล"],
              },
              {
                title: "เกษตรกรรม",
                description: "เพิ่มผลผลิตพืชโดยใช้การตรวจสอบดินและสภาพอากาศ การชลประทานอัตโนมัติ และการคาดการณ์ผลผลิต",
                items: ["การตรวจสอบดิน", "ปัญญาอากาศ", "ระบบอัตโนมัติ"],
              },
            ].map((solution, idx) => (
              <Card key={idx} className="p-8 bg-card border-border hover:border-accent/50 transition">
                <h3 className="text-2xl font-bold text-foreground mb-3">{solution.title}</h3>
                <p className="text-foreground/70 mb-6">{solution.description}</p>
                <ul className="space-y-2">
                  {solution.items.map((item, i) => (
                    <li key={i} className="flex items-center text-foreground/80">
                      <div className="w-2 h-2 bg-accent rounded-full mr-3"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 text-balance">ราคาที่เรียบง่ายและโปร่งใส</h2>
            <p className="text-lg text-foreground/60 max-w-2xl mx-auto text-balance">
              เริ่มฟรี ปรับขนาดได้เมื่อคุณเติบโต จ่ายเฉพาะที่คุณใช้เท่านั้น
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "ผู้เริ่มต้น",
                price: "ฟรี",
                description: "เหมาะสำหรับการสร้างต้นแบบ",
                features: ["1,000 อุปกรณ์", "1 ล้านข้อความ/เดือน", "การวิเคราะห์พื้นฐาน", "ส่วนรองรับชุมชน"],
              },
              {
                name: "มืออาชีพ",
                price: "฿9,999",
                period: "/เดือน",
                description: "สำหรับธุรกิจที่เติบโต",
                featured: true,
                features: [
                  "100,000 อุปกรณ์",
                  "1 พันล้านข้อความ/เดือน",
                  "การวิเคราะห์ขั้นสูง",
                  "ส่วนรองรับลำดับความสำคัญ",
                  "การรวมเข้าด้วยกันแบบกำหนดเอง",
                ],
              },
              {
                name: "ระดับองค์กร",
                price: "กำหนดเอง",
                description: "สำหรับการปรับใช้ขนาดใหญ่",
                features: ["อุปกรณ์ไม่จำกัด", "ข้อความไม่จำกัด", "จัดการบัญชีแบบเฉพาะ", "การรับประกัน SLA", "โซลูชันแบบกำหนดเอง"],
              },
            ].map((plan, idx) => (
              <Card
                key={idx}
                className={`p-8 border-border transition ${plan.featured ? "ring-2 ring-accent bg-card" : "bg-card hover:border-accent/50"}`}
              >
                <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                <p className="text-foreground/60 text-sm mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  {plan.period && <span className="text-foreground/60">{plan.period}</span>}
                </div>
                <Button
                  className={`w-full mb-6 h-10 ${plan.featured ? "bg-accent text-background hover:bg-accent/90" : "bg-background text-foreground border border-border hover:bg-muted"}`}
                >
                  เริ่มต้นใช้งาน
                </Button>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center text-foreground/80 text-sm">
                      <div className="w-4 h-4 rounded-full bg-accent/30 mr-3 flex items-center justify-center">
                        <div className="w-2 h-2 bg-accent rounded-full"></div>
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
            พร้อมที่จะปรับเปลี่ยนธุรกิจของคุณหรือยัง?
          </h2>
          <p className="text-lg text-foreground/60 mb-8 text-balance">เข้าร่วมกับธุรกิจหลายพันแห่งที่สร้างอนาคตด้วย IoTHub</p>
          <Button size="lg" className="bg-accent text-background hover:bg-accent/90 h-12">
            เริ่มการทดลองใช้ฟรีวันนี้
          </Button>
        </div>
      </section>

      <Footer />
    </main>
  )
}

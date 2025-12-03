import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function PricingPage() {
  return (
    <main className="font-sans">
      <Header />

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-background border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">ราคาที่เป็นธรรม</h1>
          <p className="text-lg text-foreground/60 text-balance">จ่ายเฉพาะที่คุณใช้เท่านั้น ปรับขนาดได้ตามธุรกิจของคุณ</p>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                name: "ผู้เริ่มต้น",
                price: "ฟรี",
                description: "เหมาะสำหรับการสร้างต้นแบบและการทดลอง",
                features: [
                  "1,000 อุปกรณ์",
                  "1 ล้านข้อความ/เดือน",
                  "1 ผู้ใช้",
                  "การวิเคราะห์พื้นฐาน",
                  "ส่วนรองรับชุมชน",
                  "ความพร้อม 99.5%",
                ],
              },
              {
                name: "มืออาชีพ",
                price: "฿9,999",
                period: "/เดือน",
                description: "สำหรับธุรกิจและทีมที่เติบโต",
                featured: true,
                features: [
                  "100,000 อุปกรณ์",
                  "10 พันล้านข้อความ/เดือน",
                  "100 ผู้ใช้",
                  "การวิเคราะห์ขั้นสูง",
                  "ส่วนรองรับลำดับความสำคัญ",
                  "ความพร้อม 99.95%",
                  "การรวมเข้าด้วยกัน",
                ],
              },
              {
                name: "ระดับองค์กร",
                price: "กำหนดเอง",
                description: "สำหรับการปรับใช้ขนาดใหญ่และความต้องการพิเศษ",
                features: [
                  "อุปกรณ์ไม่จำกัด",
                  "ข้อความไม่จำกัด",
                  "ผู้ใช้ไม่จำกัด",
                  "บัญชีมัลติ-เทนแนนต์",
                  "จัดการบัญชีแบบเฉพาะ",
                  "ความพร้อม 99.99%",
                  "SLA ที่กำหนดเอง",
                ],
              },
            ].map((plan, idx) => (
              <Card
                key={idx}
                className={`p-8 border-border transition ${
                  plan.featured ? "ring-2 ring-accent bg-card" : "bg-card hover:border-accent/50"
                }`}
              >
                <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                <p className="text-foreground/60 text-sm mb-6">{plan.description}</p>
                <div className="mb-8">
                  <span className="text-5xl font-bold text-foreground">{plan.price}</span>
                  {plan.period && <span className="text-foreground/60 text-lg">{plan.period}</span>}
                </div>
                <Button
                  className={`w-full mb-8 h-10 ${
                    plan.featured
                      ? "bg-accent text-background hover:bg-accent/90"
                      : "bg-background text-foreground border border-border hover:bg-muted"
                  }`}
                >
                  เริ่มต้นใช้งาน
                </Button>
                <ul className="space-y-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center text-foreground/80 text-sm">
                      <div className="w-5 h-5 rounded-full bg-accent/20 mr-3 flex items-center justify-center flex-shrink-0">
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

      <Footer />
    </main>
  )
}

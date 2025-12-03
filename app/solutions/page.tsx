import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function SolutionsPage() {
  return (
    <main className="font-sans">
      <Header />

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-background border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">โซลูชันตามอุตสาหกรรม</h1>
          <p className="text-lg text-foreground/60 text-balance">ได้รับความไว้วางใจจากผู้นำอุตสาหกรรมในทั่วโลก</p>
        </div>
      </section>

      {/* Solutions */}
      <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-12">
            {[
              {
                title: "การผลิตอัจฉริยะ",
                description: "ปรับปรุงประสิทธิภาพการผลิต ลดค่าใช้จ่าย และปรับปรุงการควบคุมคุณภาพ",
                benefits: ["ลดเวลาหยุดไปถึง 85%", "เพิ่มประสิทธิภาพของสายการผลิตถึง 30%", "ลดการสูญเสียผลิตภัณฑ์ 40%"],
                image: "smart-manufacturing",
              },
              {
                title: "เมืองอัจฉริยะ",
                description: "สร้างเมืองที่เชื่อมต่อด้วยการวิเคราะห์ข้อมูล การประหยัดพลังงาน และการจัดการ交通",
                benefits: ["ประหยัดพลังงาน 25-30%", "ลดความแออัดจราจร 15%", "ปรับปรุงความปลอดภัยสาธารณะ"],
                image: "smart-cities",
              },
              {
                title: "สุขภาพ",
                description: "ตรวจสอบสุขภาพของผู้ป่วยและการจัดการอุปกรณ์ทางการแพทย์แบบปลอดภัยและมีประสิทธิภาพ",
                benefits: ["ปรับปรุงผลลัพธ์ของผู้ป่วย 20%", "ลดต้นทุนการดูแลสุขภาพ 15-20%", "เพิ่มคุณภาพชีวิตของผู้ป่วย"],
                image: "healthcare",
              },
              {
                title: "เกษตรกรรม",
                description: "เพิ่มผลผลิตพืช ลดการใช้น้ำและปุ๋ย และปรับปรุงการจัดการพื้นดิน",
                benefits: ["เพิ่มผลผลิต 30-40%", "ประหยัดน้ำถึง 50%", "ลดต้นทุนปุ๋ยถึง 35%"],
                image: "agriculture",
              },
            ].map((solution, idx) => (
              <Card key={idx} className="p-8 md:p-12 bg-card border-border hover:border-accent/50 transition">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h2 className="text-3xl font-bold text-foreground mb-4">{solution.title}</h2>
                    <p className="text-lg text-foreground/70 mb-6">{solution.description}</p>
                    <div className="space-y-3 mb-8">
                      {solution.benefits.map((benefit, i) => (
                        <div key={i} className="flex items-center">
                          <div className="w-2 h-2 bg-accent rounded-full mr-3"></div>
                          <span className="text-foreground/80">{benefit}</span>
                        </div>
                      ))}
                    </div>
                    <Button className="bg-accent text-background hover:bg-accent/90">
                      เรียนรู้เพิ่มเติม <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                  <div className="bg-accent/10 rounded-lg h-64 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-accent/60 text-5xl mb-2">📊</div>
                      <p className="text-foreground/60">{solution.image}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

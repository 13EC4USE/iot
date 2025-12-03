import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function BlogPage() {
  return (
    <main className="font-sans">
      <Header />

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-background border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">บล็อก IoTHub</h1>
          <p className="text-lg text-foreground/60 text-balance">ข่าวสาร บทความ และข้อมูลเชิงลึกเกี่ยวกับ IoT</p>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="grid gap-8">
            {[
              {
                title: "อนาคตของ IoT ในปี 2025",
                excerpt: "เรียนรู้เกี่ยวกับแนวโน้มและการพยากรณ์สำหรับ IoT ในปีข้างหน้า",
                date: "15 พฤศจิกายน 2567",
                author: "สมชาย นวพัฒน์",
                category: "ข่าวสาร",
                image: "future-iot",
              },
              {
                title: "เทคนิคการรักษาความปลอดภัย IoT ที่สำคัญ",
                excerpt: "วิธีการป้องกันอุปกรณ์ IoT ของคุณจากภัยคุกคามความปลอดภัย",
                date: "12 พฤศจิกายน 2567",
                author: "ฉัตรชัย อรรถกร",
                category: "ความปลอดภัย",
                image: "iot-security",
              },
              {
                title: "กรณีศึกษา: IoT ในเมืองอัจฉริยะ",
                excerpt: "ดูว่าเมืองบางแห่งใช้เทคโนโลยี IoT เพื่อปรับปรุงชีวิตของประชาชน",
                date: "8 พฤศจิกายน 2567",
                author: "ปรชญา ชูศรี",
                category: "กรณีศึกษา",
                image: "smart-city-case",
              },
              {
                title: "ข้อมูลเบื้องต้นเกี่ยวกับ Edge Computing",
                excerpt: "เข้าใจความแตกต่างระหว่าง Cloud Computing และ Edge Computing",
                date: "5 พฤศจิกายน 2567",
                author: "สมร คำวัง",
                category: "เทคโนโลยี",
                image: "edge-computing",
              },
              {
                title: "การเพิ่มประสิทธิภาพการบริหารจัดการอุปกรณ์",
                excerpt: "เรียนรู้วิธีการจัดการและติดตามอุปกรณ์ IoT ของคุณอย่างมีประสิทธิภาพ",
                date: "1 พฤศจิกายน 2567",
                author: "พีรศักดิ์ ศิริสุข",
                category: "เรื่องแนะนำ",
                image: "device-management",
              },
              {
                title: "บริการ IoT ระดับองค์กร: คู่มืออบรม",
                excerpt: "สิ่งที่ธุรกิจต้องรู้เกี่ยวกับการนำเสนอแอปพลิเคชัน IoT ที่ปลอดภัยและปรับขนาดได้",
                date: "28 ตุลาคม 2567",
                author: "วิชิต พรหมสิงห์",
                category: "เรื่องแนะนำ",
                image: "enterprise-iot",
              },
            ].map((post, idx) => (
              <Card key={idx} className="p-6 md:p-8 bg-card border-border hover:border-accent/50 transition group">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="bg-accent/10 rounded-lg h-48 w-full md:w-48 flex-shrink-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-accent/60 text-4xl mb-2">📰</div>
                      <p className="text-foreground/60 text-sm">{post.image}</p>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-semibold text-accent bg-accent/10 px-3 py-1 rounded-full">
                        {post.category}
                      </span>
                      <span className="text-sm text-foreground/60">{post.date}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-accent transition">
                      {post.title}
                    </h3>
                    <p className="text-foreground/70 mb-4">{post.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-foreground/60">โดย {post.author}</p>
                      <Button variant="ghost" className="text-accent hover:bg-accent/10">
                        อ่านเพิ่มเติม <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
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

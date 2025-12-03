import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Phone, MapPin } from "lucide-react"

export default function ContactPage() {
  return (
    <main className="font-sans">
      <Header />

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-background border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">ติดต่อเรา</h1>
          <p className="text-lg text-foreground/60 text-balance">มีคำถามหรือต้องการทดลองใช้? เรายินดีที่จะช่วยเหลือ</p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">ส่งข้อความให้เรา</h2>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">ชื่อของคุณ</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-accent"
                    placeholder="สมชาย นวพัฒน์"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">อีเมล</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-accent"
                    placeholder="somchai@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">หัวข้อ</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-accent"
                    placeholder="ฉันต้องการเรียนรู้เพิ่มเติมเกี่ยวกับ IoTHub"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">ข้อความ</label>
                  <textarea
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-accent h-32 resize-none"
                    placeholder="คำนวณปัญหาของคุณหรือคำถามของคุณ"
                  ></textarea>
                </div>
                <Button className="w-full bg-accent text-background hover:bg-accent/90">ส่งข้อความ</Button>
              </form>
            </div>

            {/* Contact Info */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">ข้อมูลติดต่อ</h2>
              <div className="space-y-6">
                <Card className="p-6 bg-card border-border">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-accent/10 rounded-lg">
                      <Mail className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">อีเมล</h3>
                      <p className="text-foreground/70">support@iothub.com</p>
                      <p className="text-foreground/70">sales@iothub.com</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-card border-border">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-accent/10 rounded-lg">
                      <Phone className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">โทรศัพท์</h3>
                      <p className="text-foreground/70">+66 (0)2 XXX-XXXX</p>
                      <p className="text-foreground/70">สนับสนุน 24/7</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-card border-border">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-accent/10 rounded-lg">
                      <MapPin className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">ที่อยู่</h3>
                      <p className="text-foreground/70">
                        IoTHub Thailand
                        <br />
                        กรุงเทพมหานคร 10100
                        <br />
                        ประเทศไทย
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Social Media */}
              <div className="mt-8">
                <h3 className="font-semibold text-foreground mb-4">ติดตามเรา</h3>
                <div className="flex gap-4">
                  {["Facebook", "Twitter", "LinkedIn"].map((social) => (
                    <Button
                      key={social}
                      variant="outline"
                      className="border-border text-foreground hover:bg-accent/10 bg-transparent"
                    >
                      {social}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

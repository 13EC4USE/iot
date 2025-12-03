import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-teal-400 mb-4">404</h1>
        <h2 className="text-3xl font-bold text-white mb-4">ไม่พบหน้า</h2>
        <p className="text-slate-400 mb-8 max-w-md">ขออภัย ไม่พบหน้าที่คุณกำลังค้นหา</p>
        <Link
          href="/"
          className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg transition inline-block"
        >
          กลับหน้าแรก
        </Link>
      </div>
    </div>
  )
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // เพิ่มบรรทัดนี้สำคัญมาก! สำหรับ Docker
  output: "standalone", 
  
  // ของเดิมที่คุณมีอยู่แล้ว (เก็บไว้เหมือนเดิม)
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { ApexOptions } from "apexcharts"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface TrafficChartProps {
  className?: string
}

export function TrafficChart({ className }: TrafficChartProps) {
  const [chartData, setChartData] = useState<{ labels: string[]; data: number[] }>({
    labels: [],
    data: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch("/api/stats/traffic")
      const data = await res.json()
      setChartData({ labels: data.labels || [], data: data.data || [] })
    } catch (error) {
      console.error("Failed to fetch traffic data:", error)
    } finally {
      setLoading(false)
    }
  }

  const options: ApexOptions = {
    chart: {
      type: "area",
      height: 350,
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: "smooth",
      width: 2
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3,
        stops: [0, 90, 100]
      }
    },
    xaxis: {
      categories: chartData.labels,
      labels: {
        rotate: -45,
        rotateAlways: false
      }
    },
    yaxis: {
      title: {
        text: "จำนวนข้อความ"
      }
    },
    tooltip: {
      x: {
        format: "HH:mm"
      }
    },
    colors: ["#3b82f6"],
    grid: {
      borderColor: "#f1f1f1"
    }
  }

  const series = [
    {
      name: "ข้อความ",
      data: chartData.data
    }
  ]

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-[350px] ${className}`}>
        <div className="text-muted-foreground">กำลังโหลด...</div>
      </div>
    )
  }

  return (
    <div className={className}>
      <Chart options={options} series={series} type="area" height={350} />
    </div>
  )
}

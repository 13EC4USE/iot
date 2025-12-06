"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { ApexOptions } from "apexcharts"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface OnlineHistoryChartProps {
  className?: string
}

export function OnlineHistoryChart({ className }: OnlineHistoryChartProps) {
  const [chartData, setChartData] = useState<{ labels: string[]; data: number[] }>({
    labels: [],
    data: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch("/api/stats/online-history")
      const data = await res.json()
      setChartData({ labels: data.labels || [], data: data.data || [] })
    } catch (error) {
      console.error("Failed to fetch online history:", error)
    } finally {
      setLoading(false)
    }
  }

  const options: ApexOptions = {
    chart: {
      type: "bar",
      height: 300,
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: "60%"
      }
    },
    dataLabels: {
      enabled: false
    },
    xaxis: {
      categories: chartData.labels
    },
    yaxis: {
      title: {
        text: "อุปกรณ์ออนไลน์"
      }
    },
    colors: ["#10b981"],
    grid: {
      borderColor: "#f1f1f1"
    }
  }

  const series = [
    {
      name: "อุปกรณ์ออนไลน์",
      data: chartData.data
    }
  ]

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-[300px] ${className}`}>
        <div className="text-muted-foreground">กำลังโหลด...</div>
      </div>
    )
  }

  return (
    <div className={className}>
      <Chart options={options} series={series} type="bar" height={300} />
    </div>
  )
}

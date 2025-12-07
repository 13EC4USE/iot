"use client"

import useSWR from "swr"
import dynamic from "next/dynamic"
import { ApexOptions } from "apexcharts"
import { useEffect, useState } from "react"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface TrafficChartProps {
  className?: string
}

const fetcher = (url: string) =>
  fetch(url).then((res) => res.json())

export function TrafficChart({ className }: TrafficChartProps) {
  const [isDark, setIsDark] = useState(false)

  // Detect theme changes
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }
    
    checkTheme()
    
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    return () => observer.disconnect()
  }, [])

  // Use SWR for traffic data
  const { data: trafficData, isLoading: loading } = useSWR(
    "/api/stats/traffic",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000,
      refreshInterval: 60000,
    }
  )

  const chartData = {
    labels: trafficData?.labels || [],
    data: trafficData?.data || []
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
      },
      background: 'transparent',
      foreColor: isDark ? '#e5e5e5' : '#262422'
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
        rotateAlways: false,
        style: {
          colors: isDark ? '#a3a3a3' : '#737373'
        }
      },
      axisBorder: {
        color: isDark ? '#404040' : '#e0ddd9'
      },
      axisTicks: {
        color: isDark ? '#404040' : '#e0ddd9'
      }
    },
    yaxis: {
      title: {
        text: "จำนวนข้อความ",
        style: {
          color: isDark ? '#e5e5e5' : '#262422'
        }
      },
      labels: {
        style: {
          colors: isDark ? '#a3a3a3' : '#737373'
        }
      }
    },
    tooltip: {
      x: {
        format: "HH:mm"
      },
      theme: isDark ? 'dark' : 'light'
    },
    colors: ["#3b82f6"],
    grid: {
      borderColor: isDark ? '#404040' : '#e0ddd9'
    },
    theme: {
      mode: isDark ? 'dark' : 'light'
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

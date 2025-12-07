"use client"

import useSWR from "swr"
import dynamic from "next/dynamic"
import { ApexOptions } from "apexcharts"
import { useEffect, useState } from "react"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface OnlineHistoryChartProps {
  className?: string
}

const fetcher = (url: string) =>
  fetch(url).then((res) => res.json())

export function OnlineHistoryChart({ className }: OnlineHistoryChartProps) {
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

  // Use SWR for online history data
  const { data: trafficData, isLoading: loading } = useSWR(
    "/api/stats/online-history",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000,
      refreshInterval: 300000, // 5 minutes - historical data changes slowly
    }
  )

  const chartData = {
    labels: trafficData?.labels || [],
    data: trafficData?.data || []
  }

  const options: ApexOptions = {
    chart: {
      type: "bar",
      height: 300,
      toolbar: {
        show: false
      },
      background: 'transparent',
      foreColor: isDark ? '#e5e5e5' : '#262422'
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
      categories: chartData.labels,
      labels: {
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
        text: "อุปกรณ์ออนไลน์",
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
      theme: isDark ? 'dark' : 'light'
    },
    colors: ["#10b981"],
    grid: {
      borderColor: isDark ? '#404040' : '#e0ddd9'
    },
    theme: {
      mode: isDark ? 'dark' : 'light'
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

"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { ApexOptions } from "apexcharts"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface DonutChartProps {
  online: number
  offline: number
  className?: string
}

export function DonutChart({ online, offline, className }: DonutChartProps) {
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

  const options: ApexOptions = {
    chart: {
      type: "donut",
      height: 300,
      background: 'transparent',
      foreColor: isDark ? '#e5e5e5' : '#262422'
    },
    labels: ["ออนไลน์", "ออฟไลน์"],
    colors: ["#10b981", "#ef4444"],
    legend: {
      position: "bottom",
      labels: {
        colors: isDark ? '#e5e5e5' : '#262422'
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "รวม",
              fontSize: "16px",
              color: isDark ? '#e5e5e5' : '#262422'
            },
            value: {
              color: isDark ? '#e5e5e5' : '#262422'
            },
            name: {
              color: isDark ? '#a3a3a3' : '#737373'
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: true,
      style: {
        colors: ['#fff']
      }
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light'
    },
    theme: {
      mode: isDark ? 'dark' : 'light'
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 200
          },
          legend: {
            position: "bottom"
          }
        }
      }
    ]
  }

  const series = [online, offline]

  return (
    <div className={className}>
      <Chart options={options} series={series} type="donut" height={300} />
    </div>
  )
}

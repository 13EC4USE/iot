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
  const options: ApexOptions = {
    chart: {
      type: "donut",
      height: 300
    },
    labels: ["ออนไลน์", "ออฟไลน์"],
    colors: ["#10b981", "#ef4444"],
    legend: {
      position: "bottom"
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
              fontSize: "16px"
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: true
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

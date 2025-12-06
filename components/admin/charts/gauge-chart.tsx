"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { ApexOptions } from "apexcharts"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface GaugeChartProps {
  value: number
  max?: number
  label: string
  className?: string
}

export function GaugeChart({ value, max = 100, label, className }: GaugeChartProps) {
  const percentage = Math.min((value / max) * 100, 100)

  const options: ApexOptions = {
    chart: {
      type: "radialBar",
      height: 250
    },
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        hollow: {
          size: "65%"
        },
        track: {
          background: "#f1f1f1"
        },
        dataLabels: {
          name: {
            fontSize: "14px",
            offsetY: -10
          },
          value: {
            fontSize: "24px",
            fontWeight: "bold",
            offsetY: 5,
            formatter: () => value.toFixed(2)
          }
        }
      }
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: "dark",
        type: "horizontal",
        shadeIntensity: 0.5,
        gradientToColors: ["#3b82f6"],
        inverseColors: true,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100]
      }
    },
    labels: [label],
    colors: ["#06b6d4"]
  }

  const series = [percentage]

  return (
    <div className={className}>
      <Chart options={options} series={series} type="radialBar" height={250} />
    </div>
  )
}

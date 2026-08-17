import { useEffect, useRef } from 'react'
import { Chart } from 'chart.js/auto'
import { toIsoDate } from '../../lib/dateHelpers'

const INK = '#40476d'
const OFF_COLOR = '#eef0e6'
const FUTURE_COLOR = 'rgba(64,71,109,0.12)'

function shade(hours: number, max: number): string {
  if (hours === 0) return OFF_COLOR
  const t = max > 0 ? hours / max : 0
  const lo = [222, 224, 209]
  const hi = [64, 71, 109]
  const rgb = lo.map((c, i) => Math.round(c + (hi[i] - c) * t))
  return `rgb(${rgb.join(',')})`
}

export function DailyHoursChart({
  monthStart,
  monthEnd,
  dailyHoursMap,
  today,
  avgDailyHours,
}: {
  monthStart: Date
  monthEnd: Date
  dailyHoursMap: Map<string, number>
  today: Date
  avgDailyHours: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const todayIso = toIsoDate(today)
    const labels: string[] = []
    const hours: number[] = []
    const isFuture: boolean[] = []

    const cursor = new Date(monthStart)
    while (cursor <= monthEnd) {
      const iso = toIsoDate(cursor)
      labels.push(String(cursor.getDate()))
      if (iso <= todayIso) {
        hours.push(dailyHoursMap.get(iso) ?? 0)
        isFuture.push(false)
      } else {
        hours.push(avgDailyHours)
        isFuture.push(true)
      }
      cursor.setDate(cursor.getDate() + 1)
    }

    const actualValues = hours.filter((h, i) => !isFuture[i] && h > 0)
    const max = actualValues.length > 0 ? Math.max(...actualValues) : 1
    const avg = Math.round(avgDailyHours * 100) / 100

    const avgLinePlugin = {
      id: 'avgLine',
      afterDraw(chart: Chart) {
        const { ctx, chartArea, scales } = chart
        const avgY = scales.y.getPixelForValue(avg)
        ctx.save()
        ctx.strokeStyle = INK
        ctx.setLineDash([5, 4])
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(chartArea.left, avgY)
        ctx.lineTo(chartArea.right, avgY)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = INK
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'right'
        ctx.fillText(`日均 ${avg}h`, chartArea.right - 2, avgY - 4)
        ctx.restore()
      },
    }

    chartRef.current?.destroy()
    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            data: hours,
            backgroundColor: hours.map((h, i) => (isFuture[i] ? FUTURE_COLOR : shade(h, max))),
            borderRadius: 14,
            borderSkipped: false,
            categoryPercentage: 0.9,
            barPercentage: 0.55,
          },
        ],
      },
      // Animation relies on requestAnimationFrame; disabled so the chart
      // paints immediately (also matters in contexts where rAF is throttled,
      // e.g. a backgrounded tab, which otherwise leaves the canvas blank).
      plugins: [avgLinePlugin],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const i = ctx.dataIndex
                return isFuture[i] ? '尚未發生(日均預估)' : `${ctx.parsed.y} 小時`
              },
            },
          },
        },
        scales: {
          x: {
            ticks: { color: '#52514e', font: { size: 9 }, autoSkip: false, maxRotation: 0 },
            grid: { display: false },
          },
          y: {
            min: 0,
            ticks: { stepSize: 2, color: '#898781', font: { size: 10 } },
            grid: { color: '#e1e0d9' },
          },
        },
      },
    })

    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [monthStart, monthEnd, dailyHoursMap, today, avgDailyHours])

  return (
    <div style={{ position: 'relative', width: '100%', height: '180px' }}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="每日工時橫條圖，顯示這個月每天的工作時數，未來日期以淺色日均高度佔位"
      />
    </div>
  )
}

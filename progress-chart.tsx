import { useEffect, useRef } from "react";
import type { Habit } from "@shared/schema";

interface ProgressChartProps {
  habits: Habit[];
}

export default function ProgressChart({ habits }: ProgressChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const loadChart = async () => {
      // Dynamically import Chart.js to avoid SSR issues
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Destroy existing chart if it exists
      const existingChart = Chart.getChart(canvas);
      if (existingChart) {
        existingChart.destroy();
      }

      // Calculate completion rates for the last 7 days
      const data = [];
      const labels = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        labels.push(dayName);

        const totalHabits = habits.filter(h => h.isActive).length;
        const completedHabits = habits.filter(h => 
          h.completionHistory.includes(dateString)
        ).length;

        const completionRate = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;
        data.push(completionRate);
      }

      new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Completion Rate',
            data,
            borderColor: 'hsl(158, 64%, 52%)',
            backgroundColor: 'hsla(158, 64%, 52%, 0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: 'hsl(158, 64%, 52%)',
            pointBorderColor: 'hsl(158, 64%, 52%)',
            pointHoverBackgroundColor: 'hsl(158, 64%, 52%)',
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: {
                callback: function(value) {
                  return value + '%';
                },
                color: 'hsl(215, 16%, 47%)',
              },
              grid: {
                color: 'hsl(214, 32%, 91%)',
              }
            },
            x: {
              ticks: {
                color: 'hsl(215, 16%, 47%)',
              },
              grid: {
                color: 'hsl(214, 32%, 91%)',
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'hsl(222, 84%, 4.9%)',
              titleColor: 'hsl(210, 40%, 98%)',
              bodyColor: 'hsl(210, 40%, 98%)',
              cornerRadius: 8,
              callbacks: {
                label: function(context) {
                  return `Completion: ${Math.round(context.parsed.y)}%`;
                }
              }
            }
          },
          elements: {
            point: {
              radius: 4,
              hoverRadius: 6,
            }
          }
        }
      });
    };

    loadChart();
  }, [habits]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Weekly Progress</h3>
      <div className="relative" style={{ height: '200px' }}>
        <canvas ref={canvasRef} width="300" height="200"></canvas>
      </div>
    </div>
  );
}

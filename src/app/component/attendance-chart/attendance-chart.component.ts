import {
  Component,
  Input,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-attendance-chart',
  templateUrl: './attendance-chart.component.html',
  styleUrls: ['./attendance-chart.component.css']
})
export class AttendanceChartComponent implements AfterViewInit, OnChanges {
  @Input() attendanceData: any[] = [];
  @Input() totalEmployees: number = 100; // can be overridden by parent

  @ViewChild('chartCanvas') chartRef!: ElementRef;
  chart!: Chart;

  ngAfterViewInit() {
    this.renderChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['attendanceData'] || changes['totalEmployees']) && this.chartRef) {
      this.renderChart();
    }
  }
  formatDate(date: string): string {
    if (!date) return '';
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  } 

  renderChart() {
    if (this.chart) this.chart.destroy();

    const statsByDate: Record<string, { OnTime: number; Late: number; OverTime: number }> = {};

    this.attendanceData.forEach(entry => {
  if (!entry.date || !entry.status) return;

  const date = entry.date;
  const normalizedStatus = this.normalizeStatus(entry.status);
  if (!normalizedStatus) return;  // ✅ check for null early

  if (!statsByDate[date]) {
    statsByDate[date] = { OnTime: 0, Late: 0, OverTime: 0 };
  }

  statsByDate[date][normalizedStatus]++;
});


    const labels = Object.keys(statsByDate).sort();
    const onTimeData = labels.map(d => statsByDate[d].OnTime || 0);
    const lateData = labels.map(d => statsByDate[d].Late || 0);
    const overTimeData = labels.map(d => statsByDate[d].OverTime || 0);

    this.chart = new Chart(this.chartRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'On Time', data: onTimeData, backgroundColor: '#28a745' },
          { label: 'Late', data: lateData, backgroundColor: '#ff0000' },
          { label: 'Over Time', data: overTimeData, backgroundColor: '#ffc107' }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { color: '#fff' } },
          title: { display: true, text: 'Attendance Overview', color: '#fff' }
        },
        scales: {
          x: { ticks: { color: '#fff',
            callback: (value, index) => {
              const label = labels[index];
              return this.formatDate(label);
            }
           } },
          y: {
            min: 0,
            max: this.totalEmployees,
            ticks: {
              stepSize: 1,
              color: '#ccc'
            },
            title: {
              display: true,
              text: 'Number of Employees',
              color: '#ccc'
            },
            beginAtZero: true
          }
        }
      }
    });
  }

  normalizeStatus(status: string): 'OnTime' | 'Late' | 'OverTime' | null {
    const s = status.trim().toLowerCase();
    if (s === 'on time') return 'OnTime';
    if (s === 'late') return 'Late';
    if (s === 'over time') return 'OverTime';
    return null;
  }
}

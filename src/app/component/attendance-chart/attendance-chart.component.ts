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
  @Input() attendanceData: any[] = []; // expects [{ date: 'YYYY-MM-DD', status: 'Present' | 'Late' | 'Absent' }, ...]

  @ViewChild('chartCanvas') chartRef!: ElementRef;
  chart!: Chart;

  ngAfterViewInit() {
    this.renderChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['attendanceData'] && this.chartRef) {
      this.renderChart();
    }
  }

  renderChart() {
    if (this.chart) this.chart.destroy();
  
    const statsByDate: Record<string, { Present: number; Late: number; Absent: number }> = {};
  
    const validStatuses = ['Present', 'Late', 'Absent'] as const;
    type StatusType = (typeof validStatuses)[number];
  
    this.attendanceData.forEach(entry => {
      if (!entry.date || !validStatuses.includes(entry.status)) return;
  
      const date = entry.date;
      const status = entry.status as StatusType;
  
      if (!statsByDate[date]) {
        statsByDate[date] = { Present: 0, Late: 0, Absent: 0 };
      }
  
      statsByDate[date][status]++;
    });
  
    const labels = Object.keys(statsByDate).sort();
    const presentData = labels.map(d => statsByDate[d].Present || 0);
    const lateData = labels.map(d => statsByDate[d].Late || 0);
    const absentData = labels.map(d => statsByDate[d].Absent || 0);
  
    this.chart = new Chart(this.chartRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Present', data: presentData, backgroundColor: '#28a745' },
          { label: 'Late', data: lateData, backgroundColor: '#ffc107' },
          { label: 'Absent', data: absentData, backgroundColor: '#dc3545' }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { color: '#fff' } },
          title: { display: true, text: 'Attendance Overview', color: '#fff' }
        },
        scales: {
          x: { ticks: { color: '#fff' } },
          y: {
            min: 0,
            max: 200,
            ticks: {
              stepSize: 10,
              color: '#ccc'
            },
            title: {
              display: true,
              text: 'Number of Employees',
              color: '#ccc'
            }, beginAtZero: true }
        }
      }
    });
  }
  
}

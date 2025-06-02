import { Component, Input, OnInit } from '@angular/core';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-attendance-chart',
  templateUrl: './attendance-chart.component.html',
  styleUrls: ['./attendance-chart.component.css'],
})
export class AttendanceChartComponent implements OnInit {
  @Input() data: any[] = [];
  chart: any;

  ngOnInit() {
    this.createChart();
  }

  createChart() {
    const statusCounts = this.data.reduce((acc, entry) => {
      acc[entry.status] = (acc[entry.status] || 0) + 1;
      return acc;
    }, {});

    this.chart = new Chart('attendanceChart', {
      type: 'pie',
      data: {
        labels: Object.keys(statusCounts),
        datasets: [
          {
            data: Object.values(statusCounts),
            backgroundColor: ['#4CAF50', '#FFC107', '#F44336'], // Green, Yellow, Red
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: false,
            text: 'Attendance Chart',
            font: {
              size: 16,
            },
          },
          legend: {
            position: 'bottom',
          },
        },
      },
    });
  }
}
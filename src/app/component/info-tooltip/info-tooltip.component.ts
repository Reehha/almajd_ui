import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-info-tooltip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="tooltip-container">
      <ng-content></ng-content>
      <span class="tooltip-text">{{ message }}</span>
    </span>
  `,
  styles: [`
    .tooltip-container {
      position: relative;
      display: inline-flex; /* changed from inline-block to inline-flex */
      align-items: center; /* vertically center if checkbox */
    }

  
.tooltip.left {
  left: 0;
  transform: translateX(-100%);
}

.tooltip.right {
  left: 100%;
  transform: translateX(0);
}
    .tooltip-text {
      visibility: hidden;
      width: max-content;
      max-width: 250px;
      background-color: #333;
      color: #fff;
      text-align: left;
      border-radius: 4px;
      padding: 6px 10px;
      position: absolute;
      z-index: 100;
      bottom: 125%; /* above the checkbox */
      left: 50%;
      transform: translateX(-50%);
      opacity: 0;
      font-size: 12px;
      line-height: 1.4;
      transition: opacity 0.3s;
      pointer-events: none; /* avoid interfering with hover */
      white-space: nowrap; /* prevent wrapping */
    }

    .tooltip-container:hover .tooltip-text {
      visibility: visible;
      opacity: 1;
    }

    .tooltip-text::after {
      content: "";
      position: absolute;
      top: 100%; /* arrow pointing down */
      left: 50%;
      margin-left: -5px;
      border-width: 5px;
      border-style: solid;
      border-color: #333 transparent transparent transparent;
    }
  `]
})
export class InfoTooltipComponent {
  @Input() message: string = '';
}

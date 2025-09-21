import { Component, Input, ElementRef, HostListener, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'info-tooltip',
  standalone: true,
  template: `<ng-content></ng-content>`,
})
export class InfoTooltipComponent implements OnInit, OnDestroy {
  @Input() text: string = '';
  @Input() position: 'top' | 'bottom' | 'left' | 'right' = 'top';

  private tooltipEl!: HTMLElement;

  constructor(private host: ElementRef) {}

  ngOnInit(): void {
    // Create tooltip element
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'global-tooltip';
    this.tooltipEl.innerText = this.text;
    document.body.appendChild(this.tooltipEl);
  }

  @HostListener('mouseenter')
show() {
  const hostRect = this.host.nativeElement.getBoundingClientRect();
  this.tooltipEl.classList.add('show');
  this.tooltipEl.setAttribute('data-position', this.position);

  const margin = 10; // more spacing
  switch (this.position) {
    case 'top':
      this.tooltipEl.style.left = `${hostRect.left + hostRect.width / 2}px`;
      this.tooltipEl.style.top = `${hostRect.top - margin}px`;
      this.tooltipEl.style.transform = 'translate(-50%, -100%)';
      break;
    case 'bottom':
      this.tooltipEl.style.left = `${hostRect.left + hostRect.width / 2}px`;
      this.tooltipEl.style.top = `${hostRect.bottom + margin}px`;
      this.tooltipEl.style.transform = 'translate(-50%, 0)';
      break;
    case 'left':
      this.tooltipEl.style.left = `${hostRect.left - margin}px`;
      this.tooltipEl.style.top = `${hostRect.top + hostRect.height / 2}px`;
      this.tooltipEl.style.transform = 'translate(-100%, -50%)';
      break;
    case 'right':
      this.tooltipEl.style.left = `${hostRect.right + margin}px`;
      this.tooltipEl.style.top = `${hostRect.top + hostRect.height / 2}px`;
      this.tooltipEl.style.transform = 'translate(0, -50%)';
      break;
  }
}

@HostListener('mouseleave')
hide() {
  this.tooltipEl.classList.remove('show');
}


  ngOnDestroy(): void {
    if (this.tooltipEl && document.body.contains(this.tooltipEl)) {
      document.body.removeChild(this.tooltipEl);
    }
  }
}

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeDashboardComponent } from './employee-dashboard.component';

describe('EmployeeMenuComponent', () => {
  let component: EmployeeDashboardComponent;
  let fixture: ComponentFixture<EmployeeDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

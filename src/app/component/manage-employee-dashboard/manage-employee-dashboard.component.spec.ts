import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageEmployeeDashboardComponent } from './manage-employee-dashboard.component';

describe('ManageEmployeeDashboardComponent', () => {
  let component: ManageEmployeeDashboardComponent;
  let fixture: ComponentFixture<ManageEmployeeDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageEmployeeDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageEmployeeDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

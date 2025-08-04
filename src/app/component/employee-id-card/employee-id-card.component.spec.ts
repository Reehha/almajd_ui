import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeIdCardComponent } from './employee-id-card.component';

describe('EmployeeIdCardComponent', () => {
  let component: EmployeeIdCardComponent;
  let fixture: ComponentFixture<EmployeeIdCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeIdCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeIdCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

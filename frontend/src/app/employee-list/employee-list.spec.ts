import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmployeeList } from './employee-list';

describe('EmployeeList', () => {
  let component: EmployeeList;
  let fixture: ComponentFixture<EmployeeList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeList]
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have employees list', () => {
    expect(component.employees.length).toBeGreaterThan(0);
  });

  it('should display employee names', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const employeeNames = compiled.querySelectorAll('.employee-name');
    expect(employeeNames.length).toBe(component.employees.length);
    expect(employeeNames[0].textContent).toContain('John Smith');
  });

  it('should display employee departments', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const departments = compiled.querySelectorAll('.employee-department');
    expect(departments.length).toBe(component.employees.length);
    expect(departments[0].textContent).toContain('Engineering');
  });
});

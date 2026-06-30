import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Employee } from '../models/employee.model';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.css'
})
export class EmployeeList {
  employees: Employee[] = [
    { id: 1, name: 'John Smith', department: 'Engineering', designation: 'Software Engineer' },
    { id: 2, name: 'Jane Doe', department: 'Marketing', designation: 'Marketing Manager' },
    { id: 3, name: 'Robert Johnson', department: 'Finance', designation: 'Financial Analyst' },
    { id: 4, name: 'Emily Davis', department: 'Human Resources', designation: 'HR Specialist' },
    { id: 5, name: 'Michael Wilson', department: 'Engineering', designation: 'Senior Developer' },
    { id: 6, name: 'Sarah Brown', department: 'Design', designation: 'UX Designer' },
    { id: 7, name: 'David Lee', department: 'Engineering', designation: 'DevOps Engineer' },
    { id: 8, name: 'Lisa Anderson', department: 'Sales', designation: 'Sales Executive' }
  ];
}

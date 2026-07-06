import { Component } from '@angular/core';
import { EmployeeList } from './employee-list/employee-list';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [EmployeeList],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'Employee Display';
}

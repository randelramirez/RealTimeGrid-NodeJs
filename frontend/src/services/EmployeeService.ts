import { Employee } from '../types/Employee';

const API_BASE_URL = 'http://localhost:5047/api';

export class EmployeeService {
  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    if (response.status === 204) {
      return null as T; // No content
    }
    
    return await response.json();
  }

  static async getAllEmployees(): Promise<Employee[]> {
    const response = await fetch(`${API_BASE_URL}/employees`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return EmployeeService.handleResponse<Employee[]>(response);
  }

  static async getEmployee(id: number): Promise<Employee> {
    const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return EmployeeService.handleResponse<Employee>(response);
  }

  static async createEmployee(employee: Omit<Employee, 'id'>): Promise<Employee> {
    const response = await fetch(`${API_BASE_URL}/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employee),
    });
    
    return EmployeeService.handleResponse<Employee>(response);
  }

  static async updateEmployee(employee: Employee): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/employees/${employee.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employee),
    });
    
    return EmployeeService.handleResponse<void>(response);
  }

  static async deleteEmployee(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return EmployeeService.handleResponse<void>(response);
  }
}

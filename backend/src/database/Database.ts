import sqlite3 from 'sqlite3';
import { Employee, CreateEmployeeRequest } from '../models/Employee.js';

export class Database {
  private db: sqlite3.Database;

  constructor() {
    const dbPath = './realtimegrid.db';
    this.db = new sqlite3.Database(dbPath);
    this.init();
  }

  private init(): void {
    this.db.serialize(() => {
      // Create employees table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS employees (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          sex TEXT NOT NULL,
          salary REAL NOT NULL
        )
      `);

      // Insert sample data if table is empty
      this.db.get('SELECT COUNT(*) as count FROM employees', (err: Error | null, row: any) => {
        if (err) {
          console.error('Error checking employee count:', err);
          return;
        }
        
        if (row.count === 0) {
          console.log('Inserting sample employee data...');
          const sampleEmployees = [
            { name: 'John Doe', email: 'john.doe@example.com', sex: 'Male', salary: 75000 },
            { name: 'Jane Smith', email: 'jane.smith@example.com', sex: 'Female', salary: 82000 },
            { name: 'Bob Johnson', email: 'bob.johnson@example.com', sex: 'Male', salary: 68000 },
            { name: 'Alice Brown', email: 'alice.brown@example.com', sex: 'Female', salary: 90000 },
            { name: 'Charlie Wilson', email: 'charlie.wilson@example.com', sex: 'Male', salary: 73000 },
            { name: 'Diana Davis', email: 'diana.davis@example.com', sex: 'Female', salary: 85000 },
            { name: 'Frank Miller', email: 'frank.miller@example.com', sex: 'Male', salary: 71000 },
            { name: 'Grace Lee', email: 'grace.lee@example.com', sex: 'Female', salary: 88000 }
          ];

          const stmt = this.db.prepare('INSERT INTO employees (name, email, sex, salary) VALUES (?, ?, ?, ?)');
          sampleEmployees.forEach(emp => {
            stmt.run(emp.name, emp.email, emp.sex, emp.salary);
          });
          stmt.finalize();
          console.log('Sample data inserted successfully');
        }
      });
    });
  }

  async getAllEmployees(): Promise<Employee[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM employees ORDER BY id', (err: Error | null, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as Employee[]);
        }
      });
    });
  }

  async getEmployeeById(id: number): Promise<Employee | null> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM employees WHERE id = ?', [id], (err: Error | null, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row as Employee || null);
        }
      });
    });
  }

  async createEmployee(employee: CreateEmployeeRequest): Promise<Employee> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO employees (name, email, sex, salary) VALUES (?, ?, ?, ?)',
        [employee.name, employee.email, employee.sex, employee.salary],
        function(this: sqlite3.RunResult, err: Error | null) {
          if (err) {
            reject(err);
          } else {
            // Get the created employee
            resolve({ id: this.lastID!, ...employee } as Employee);
          }
        }
      );
    });
  }

  async updateEmployee(id: number, employee: Partial<Employee>): Promise<Employee | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (employee.name !== undefined) {
      fields.push('name = ?');
      values.push(employee.name);
    }
    if (employee.email !== undefined) {
      fields.push('email = ?');
      values.push(employee.email);
    }
    if (employee.sex !== undefined) {
      fields.push('sex = ?');
      values.push(employee.sex);
    }
    if (employee.salary !== undefined) {
      fields.push('salary = ?');
      values.push(employee.salary);
    }

    if (fields.length === 0) {
      return this.getEmployeeById(id);
    }

    values.push(id);

    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE employees SET ${fields.join(', ')} WHERE id = ?`,
        values,
        function(this: sqlite3.RunResult, err: Error | null) {
          if (err) {
            reject(err);
          } else if (this.changes === 0) {
            resolve(null); // Employee not found
          } else {
            // Get the updated employee
            db.getEmployeeById(id).then(resolve).catch(reject);
          }
        }
      );
    });
  }

  async deleteEmployee(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM employees WHERE id = ?', [id], function(this: sqlite3.RunResult, err: Error | null) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes! > 0);
        }
      });
    });
  }

  close(): void {
    this.db.close();
  }
}

export const db = new Database();

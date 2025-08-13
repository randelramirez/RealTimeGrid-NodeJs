import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { Employee, CreateEmployeeRequest } from '../models/Employee.js';

export class Database {
  private db: sqlite3.Database;

  constructor() {
    const dbPath = './realtimegrid.db';
    this.db = new sqlite3.Database(dbPath);
  }

  async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Drop existing table if it exists
        this.db.run(`DROP TABLE IF EXISTS employees`);
        
        // Create employees table
        this.db.run(`
          CREATE TABLE employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            sex TEXT NOT NULL,
            salary REAL NOT NULL
          )
        `);

        console.log('Database table recreated, inserting seed data...');
        
        // Seed data from your C# snippet
        const seedEmployees = [
          { id: 1, name: "John Doe", email: "john.doe@company.com", sex: "Male", salary: 50000 },
          { id: 2, name: "Jane Smith", email: "jane.smith@company.com", sex: "Female", salary: 60000 },
          { id: 3, name: "Bob Johnson", email: "bob.johnson@company.com", sex: "Male", salary: 55000 },
          { id: 4, name: "Alice Brown", email: "alice.brown@company.com", sex: "Female", salary: 65000 },
          { id: 5, name: "Charlie Davis", email: "charlie.davis@company.com", sex: "Male", salary: 58000 },
          { id: 6, name: "Emma Wilson", email: "emma.wilson@company.com", sex: "Female", salary: 62000 },
          { id: 7, name: "Michael Torres", email: "michael.torres@company.com", sex: "Male", salary: 53000 },
          { id: 8, name: "Sarah Martinez", email: "sarah.martinez@company.com", sex: "Female", salary: 67000 },
          { id: 9, name: "David Anderson", email: "david.anderson@company.com", sex: "Male", salary: 59000 },
          { id: 10, name: "Lisa Garcia", email: "lisa.garcia@company.com", sex: "Female", salary: 61000 },
          { id: 11, name: "James Miller", email: "james.miller@company.com", sex: "Male", salary: 56000 },
          { id: 12, name: "Michelle Thompson", email: "michelle.thompson@company.com", sex: "Female", salary: 63000 },
          { id: 13, name: "Robert Lee", email: "robert.lee@company.com", sex: "Male", salary: 52000 },
          { id: 14, name: "Jennifer White", email: "jennifer.white@company.com", sex: "Female", salary: 64000 },
          { id: 15, name: "Christopher Martin", email: "christopher.martin@company.com", sex: "Male", salary: 57000 },
          { id: 16, name: "Amanda Jackson", email: "amanda.jackson@company.com", sex: "Female", salary: 66000 },
          { id: 17, name: "Matthew Harris", email: "matthew.harris@company.com", sex: "Male", salary: 54000 },
          { id: 18, name: "Ashley Clark", email: "ashley.clark@company.com", sex: "Female", salary: 68000 },
          { id: 19, name: "Daniel Lewis", email: "daniel.lewis@company.com", sex: "Male", salary: 51000 },
          { id: 20, name: "Jessica Rodriguez", email: "jessica.rodriguez@company.com", sex: "Female", salary: 69000 },
          { id: 21, name: "Anthony Walker", email: "anthony.walker@company.com", sex: "Male", salary: 58000 },
          { id: 22, name: "Nicole Hall", email: "nicole.hall@company.com", sex: "Female", salary: 62000 },
          { id: 23, name: "Joshua Young", email: "joshua.young@company.com", sex: "Male", salary: 55000 },
          { id: 24, name: "Elizabeth Allen", email: "elizabeth.allen@company.com", sex: "Female", salary: 65000 },
          { id: 25, name: "Andrew King", email: "andrew.king@company.com", sex: "Male", salary: 53000 },
          { id: 26, name: "Megan Wright", email: "megan.wright@company.com", sex: "Female", salary: 67000 },
          { id: 27, name: "Kevin Scott", email: "kevin.scott@company.com", sex: "Male", salary: 56000 },
          { id: 28, name: "Stephanie Green", email: "stephanie.green@company.com", sex: "Female", salary: 64000 },
          { id: 29, name: "Brian Adams", email: "brian.adams@company.com", sex: "Male", salary: 59000 },
          { id: 30, name: "Rachel Baker", email: "rachel.baker@company.com", sex: "Female", salary: 61000 },
          { id: 31, name: "Steven Nelson", email: "steven.nelson@company.com", sex: "Male", salary: 52000 },
          { id: 32, name: "Lauren Hill", email: "lauren.hill@company.com", sex: "Female", salary: 63000 },
          { id: 33, name: "Timothy Ramirez", email: "timothy.ramirez@company.com", sex: "Male", salary: 57000 },
          { id: 34, name: "Samantha Campbell", email: "samantha.campbell@company.com", sex: "Female", salary: 66000 },
          { id: 35, name: "Ryan Mitchell", email: "ryan.mitchell@company.com", sex: "Male", salary: 54000 },
          { id: 36, name: "Katherine Roberts", email: "katherine.roberts@company.com", sex: "Female", salary: 68000 },
          { id: 37, name: "Jason Carter", email: "jason.carter@company.com", sex: "Male", salary: 51000 },
          { id: 38, name: "Heather Phillips", email: "heather.phillips@company.com", sex: "Female", salary: 69000 },
          { id: 39, name: "Eric Evans", email: "eric.evans@company.com", sex: "Male", salary: 58000 },
          { id: 40, name: "Christine Turner", email: "christine.turner@company.com", sex: "Female", salary: 62000 },
          { id: 41, name: "Jeffrey Parker", email: "jeffrey.parker@company.com", sex: "Male", salary: 55000 },
          { id: 42, name: "Deborah Collins", email: "deborah.collins@company.com", sex: "Female", salary: 65000 },
          { id: 43, name: "Gregory Edwards", email: "gregory.edwards@company.com", sex: "Male", salary: 53000 },
          { id: 44, name: "Maria Stewart", email: "maria.stewart@company.com", sex: "Female", salary: 67000 },
          { id: 45, name: "Jacob Sanchez", email: "jacob.sanchez@company.com", sex: "Male", salary: 56000 },
          { id: 46, name: "Susan Morris", email: "susan.morris@company.com", sex: "Female", salary: 64000 },
          { id: 47, name: "Patrick Rogers", email: "patrick.rogers@company.com", sex: "Male", salary: 59000 },
          { id: 48, name: "Helen Reed", email: "helen.reed@company.com", sex: "Female", salary: 61000 },
          { id: 49, name: "Nathan Cook", email: "nathan.cook@company.com", sex: "Male", salary: 52000 },
          { id: 50, name: "Kimberly Bell", email: "kimberly.bell@company.com", sex: "Female", salary: 63000 },
          { id: 51, name: "Carl Murphy", email: "carl.murphy@company.com", sex: "Male", salary: 57000 },
          { id: 52, name: "Amy Bailey", email: "amy.bailey@company.com", sex: "Female", salary: 66000 },
          { id: 53, name: "Harold Rivera", email: "harold.rivera@company.com", sex: "Male", salary: 54000 },
          { id: 54, name: "Donna Cooper", email: "donna.cooper@company.com", sex: "Female", salary: 68000 },
          { id: 55, name: "Arthur Richardson", email: "arthur.richardson@company.com", sex: "Male", salary: 51000 }
        ];

        const stmt = this.db.prepare('INSERT INTO employees (id, name, email, sex, salary) VALUES (?, ?, ?, ?, ?)');
        seedEmployees.forEach(emp => {
          stmt.run(emp.id, emp.name, emp.email, emp.sex, emp.salary);
        });
        stmt.finalize(() => {
          console.log(`Successfully seeded database with ${seedEmployees.length} employees`);
          resolve();
        });
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

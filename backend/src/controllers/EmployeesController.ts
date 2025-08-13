import { Request, Response } from 'express';
import { db } from '../database/Database.js';
import { CreateEmployeeRequest, UpdateEmployeeRequest } from '../models/Employee.js';
import { EmployeeSocketController } from '../sockets/EmployeeSocketController.js';

export class EmployeesController {
  private employeeHub: EmployeeSocketController | null = null;

  setEmployeeHub(hub: EmployeeSocketController): void {
    this.employeeHub = hub;
  }

  async getEmployees(req: Request, res: Response): Promise<void> {
    try {
      const employees = await db.getAllEmployees();
      res.json(employees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getEmployee(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid employee ID' });
        return;
      }

      const employee = await db.getEmployeeById(id);
      if (!employee) {
        res.status(404).json({ error: 'Employee not found' });
        return;
      }

      res.json(employee);
    } catch (error) {
      console.error('Error fetching employee:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createEmployee(req: Request, res: Response): Promise<void> {
    try {
      const employeeData: CreateEmployeeRequest = req.body;

      // Basic validation
      if (!employeeData.name || !employeeData.email || !employeeData.sex || employeeData.salary == null) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const newEmployee = await db.createEmployee(employeeData);
      
      // Broadcast to all connected clients
      if (this.employeeHub) {
        this.employeeHub.broadcastEmployeeCreated(newEmployee);
      }

      res.status(201).json(newEmployee);
    } catch (error) {
      console.error('Error creating employee:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateEmployee(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid employee ID' });
        return;
      }

      const employeeData: UpdateEmployeeRequest = req.body;
      if (employeeData.id !== id) {
        res.status(400).json({ error: 'Employee ID mismatch' });
        return;
      }

      const updatedEmployee = await db.updateEmployee(id, employeeData);
      if (!updatedEmployee) {
        res.status(404).json({ error: 'Employee not found' });
        return;
      }

      res.status(204).send(); // No content for successful update
    } catch (error) {
      console.error('Error updating employee:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteEmployee(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid employee ID' });
        return;
      }

      const deleted = await db.deleteEmployee(id);
      if (!deleted) {
        res.status(404).json({ error: 'Employee not found' });
        return;
      }

      // Broadcast to all connected clients
      if (this.employeeHub) {
        this.employeeHub.broadcastEmployeeDeleted(id);
      }

      res.status(204).send(); // No content for successful deletion
    } catch (error) {
      console.error('Error deleting employee:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

// Export a singleton instance
export const employeesController = new EmployeesController();

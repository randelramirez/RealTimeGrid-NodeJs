import { Router } from 'express';
import { employeesController } from '../controllers/EmployeesController.js';

const router = Router();

// GET /api/employees - Get all employees
router.get('/', employeesController.getEmployees.bind(employeesController));

// GET /api/employees/:id - Get employee by ID
router.get('/:id', employeesController.getEmployee.bind(employeesController));

// POST /api/employees - Create new employee
router.post('/', employeesController.createEmployee.bind(employeesController));

// PUT /api/employees/:id - Update employee
router.put('/:id', employeesController.updateEmployee.bind(employeesController));

// DELETE /api/employees/:id - Delete employee
router.delete('/:id', employeesController.deleteEmployee.bind(employeesController));

export default router;

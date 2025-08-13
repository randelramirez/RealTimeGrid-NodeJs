import { Server as SocketServer, Socket } from 'socket.io';
import { db } from '../utils/Database.js';

// In-memory storage for locked employees (employeeId -> socketId)
const lockedEmployees = new Map<number, string>();

// Track which employees each connection has locked
const connectionMappings = new Map<string, Set<number>>();

export class EmployeeSocketController {
  private io: SocketServer;

  constructor(io: SocketServer) {
    this.io = io;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log('Client connected:', socket.id);
      
      // Initialize connection mappings
      connectionMappings.set(socket.id, new Set<number>());

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        this.handleDisconnect(socket);
      });

      // Handle lock employee
      socket.on('lock', (employeeId: number) => {
        this.handleLock(socket, employeeId);
      });

      // Handle unlock employee
      socket.on('unlock', (employeeId: number) => {
        this.handleUnlock(socket, employeeId);
      });

      // Handle employee update
      socket.on('updateEmployee', async (employeeId: number, propertyName: string, value: any) => {
        await this.handleUpdateEmployee(socket, employeeId, propertyName, value);
      });

      // Handle get lock status
      socket.on('getLockStatus', () => {
        this.handleGetLockStatus(socket);
      });
    });
  }

  private handleDisconnect(socket: Socket): void {
    const lockedEmployeeIds = connectionMappings.get(socket.id);
    
    if (lockedEmployeeIds) {
      // Unlock all employees that were locked by this connection
      lockedEmployeeIds.forEach(employeeId => {
        lockedEmployees.delete(employeeId);
        socket.broadcast.emit('unlockEmployee', employeeId);
      });
      
      connectionMappings.delete(socket.id);
    }
  }

  private handleLock(socket: Socket, employeeId: number): void {
    // Check if employee is already locked by another connection
    if (!lockedEmployees.has(employeeId)) {
      // Successfully lock the employee
      lockedEmployees.set(employeeId, socket.id);
      
      const connectionLocks = connectionMappings.get(socket.id);
      if (connectionLocks) {
        connectionLocks.add(employeeId);
      }
      
      // Notify other clients that this employee is now locked
      socket.broadcast.emit('lockEmployee', employeeId, socket.id);
      
      console.log(`Employee ${employeeId} locked by ${socket.id}`);
    } else {
      // Employee is already locked, notify the caller
      socket.emit('lockFailed', employeeId);
      console.log(`Lock failed for employee ${employeeId} by ${socket.id}`);
    }
  }

  private handleUnlock(socket: Socket, employeeId: number): void {
    // Check if this connection owns the lock
    const lockingSocketId = lockedEmployees.get(employeeId);
    
    if (lockingSocketId === socket.id) {
      lockedEmployees.delete(employeeId);
      
      const connectionLocks = connectionMappings.get(socket.id);
      if (connectionLocks) {
        connectionLocks.delete(employeeId);
      }
      
      // Notify other clients that this employee is now unlocked
      socket.broadcast.emit('unlockEmployee', employeeId);
      
      console.log(`Employee ${employeeId} unlocked by ${socket.id}`);
    }
  }

  private async handleUpdateEmployee(socket: Socket, employeeId: number, propertyName: string, value: any): Promise<void> {
    // Only allow updates if the current connection has the employee locked
    const lockingSocketId = lockedEmployees.get(employeeId);
    
    if (lockingSocketId !== socket.id) {
      console.log(`Update rejected for employee ${employeeId} by ${socket.id} - not locked by this connection`);
      return;
    }

    try {
      const employee = await db.getEmployeeById(employeeId);
      if (!employee) {
        console.log(`Employee ${employeeId} not found`);
        return;
      }

      // Create update object based on property name
      const updateData: any = {};
      switch (propertyName.toLowerCase()) {
        case 'name':
          updateData.name = String(value || '');
          break;
        case 'email':
          updateData.email = String(value || '');
          break;
        case 'sex':
          updateData.sex = String(value || '');
          break;
        case 'salary':
          const numValue = Number(value);
          if (!isNaN(numValue)) {
            updateData.salary = numValue;
          } else {
            console.log(`Invalid salary value: ${value}`);
            return;
          }
          break;
        default:
          console.log(`Unknown property: ${propertyName}`);
          return;
      }

      await db.updateEmployee(employeeId, updateData);
      
      // Notify only OTHER clients (not the caller) of the update
      socket.broadcast.emit('employeeUpdated', employeeId, propertyName, value, socket.id);
      
      console.log(`Employee ${employeeId} updated: ${propertyName} = ${value} by ${socket.id}`);
    } catch (error) {
      console.error('Error updating employee:', error);
    }
  }

  private handleGetLockStatus(socket: Socket): void {
    // Convert Map to plain object for transmission
    const lockStatus: Record<number, string> = {};
    lockedEmployees.forEach((socketId, employeeId) => {
      lockStatus[employeeId] = socketId;
    });
    
    socket.emit('lockStatusUpdate', lockStatus);
  }

  // Public method to broadcast employee changes from REST API
  public broadcastEmployeeCreated(employee: any): void {
    this.io.emit('employeeCreated', employee);
  }

  public broadcastEmployeeDeleted(employeeId: number): void {
    this.io.emit('employeeDeleted', employeeId);
    
    // Remove any locks for the deleted employee
    if (lockedEmployees.has(employeeId)) {
      const socketId = lockedEmployees.get(employeeId);
      lockedEmployees.delete(employeeId);
      
      if (socketId) {
        const connectionLocks = connectionMappings.get(socketId);
        if (connectionLocks) {
          connectionLocks.delete(employeeId);
        }
      }
    }
  }
}

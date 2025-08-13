import { io, Socket } from 'socket.io-client';

export class SocketIOService {
  private socket: Socket | null = null;
  private callbacks: Map<string, ((...args: unknown[]) => void)[]> = new Map();
  private eventHandlersSetup = false;

  async connect(): Promise<void> {
    // Add a small delay before initial connection to ensure backend is ready
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      this.socket = io('http://localhost:5047', {
        timeout: 30000,
        transports: ['websocket', 'polling'],
        forceNew: true,
      });

      // Set up event handlers - only once
      if (!this.eventHandlersSetup) {
        this.socket.on('lockEmployee', (id: number, socketId: string) => {
          this.trigger('LockEmployee', id, socketId);
        });

        this.socket.on('unlockEmployee', (id: number) => {
          this.trigger('UnlockEmployee', id);
        });

        this.socket.on('lockFailed', (id: number) => {
          this.trigger('LockFailed', id);
        });

        this.socket.on('lockStatusUpdate', (lockStatus: Record<number, string>) => {
          this.trigger('LockStatusUpdate', lockStatus);
        });

        this.socket.on('employeeUpdated', (id: number, propertyName: string, value: unknown, updatedBySocketId: string) => {
          this.trigger('EmployeeUpdated', id, propertyName, value, updatedBySocketId);
        });

        this.socket.on('employeeCreated', (employee: any) => {
          this.trigger('EmployeeCreated', employee);
        });

        this.socket.on('employeeDeleted', (employeeId: number) => {
          this.trigger('EmployeeDeleted', employeeId);
        });

        this.eventHandlersSetup = true;
      }

      // Set up connection state change handlers
      this.socket.on('disconnect', () => {
        console.log('Socket.IO connection closed');
        this.eventHandlersSetup = false;
        this.trigger('ConnectionClosed');
      });

      this.socket.on('connect', () => {
        console.log('Socket.IO connected successfully with socket ID:', this.socket?.id);
        this.trigger('ConnectionReconnected');
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        this.trigger('ConnectionError', error);
      });

      // Wait for connection to be established
      await new Promise<void>((resolve, reject) => {
        if (!this.socket) {
          reject(new Error('Socket not initialized'));
          return;
        }

        if (this.socket.connected) {
          resolve();
          return;
        }

        this.socket.once('connect', () => resolve());
        this.socket.once('connect_error', (error) => reject(error));
      });

      console.log('Socket.IO connected successfully with socket ID:', this.socket.id);
    } catch (error) {
      console.error('Failed to connect to Socket.IO:', error);
      this.eventHandlersSetup = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private ensureConnection(): void {
    if (!this.socket) {
      throw new Error('Cannot send data if the socket is not initialized.');
    }
    
    if (!this.socket.connected) {
      throw new Error('Cannot send data if the socket is not connected.');
    }
  }

  async lockEmployee(id: number): Promise<void> {
    this.ensureConnection();
    if (this.socket) {
      this.socket.emit('lock', id);
    }
  }

  async unlockEmployee(id: number): Promise<void> {
    this.ensureConnection();
    if (this.socket) {
      this.socket.emit('unlock', id);
    }
  }

  async updateEmployee(id: number, propertyName: string, value: unknown): Promise<void> {
    this.ensureConnection();
    if (this.socket) {
      this.socket.emit('updateEmployee', id, propertyName, value);
    }
  }

  async getLockStatus(): Promise<void> {
    this.ensureConnection();
    if (this.socket) {
      this.socket.emit('getLockStatus');
    }
  }

  on(event: string, callback: (...args: unknown[]) => void): void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)!.push(callback);
  }

  off(event: string, callback: (...args: unknown[]) => void): void {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  clearAllEvents(): void {
    // Clear all internal callbacks
    this.callbacks.clear();
    
    // Clear Socket.IO event handlers if socket exists
    if (this.socket) {
      this.socket.off('lockEmployee');
      this.socket.off('unlockEmployee');
      this.socket.off('lockFailed');
      this.socket.off('lockStatusUpdate');
      this.socket.off('employeeUpdated');
      this.socket.off('employeeCreated');
      this.socket.off('employeeDeleted');
    }
  }

  private trigger(event: string, ...args: unknown[]): void {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(...args));
    }
  }

  getSocketId(): string | null {
    return this.socket?.id || null;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

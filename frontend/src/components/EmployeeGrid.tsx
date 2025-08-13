import React, { useState, useEffect, useRef } from 'react';
import type { Employee } from '../types/Employee';
import { useEmployees, useUpdateEmployee, useEmployeeRealtimeUpdates, useCreateEmployee, useDeleteEmployee } from '../hooks/useEmployees';
import { SocketIOService } from '../services/SocketIOService';
import toast from 'react-hot-toast';
import './EmployeeGrid.css';

interface EmployeeRowProps {
  employee: Employee;
  isLocked: boolean;
  isEditing: boolean;
  onEdit: (id: number) => void;
  onSave: (id: number) => void;
  onCancel: (id: number) => void;
  onDelete: (id: number) => void;
  onFieldChange: (field: string, value: string) => void;
  editingData: Partial<Employee>;
}

const EmployeeRow: React.FC<EmployeeRowProps> = ({
  employee,
  isLocked,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onFieldChange,
  editingData
}) => {
  if (isLocked && !isEditing) {
    return (
      <tr className="locked-row">
        <td>
          <button className="btn btn-danger" disabled>Locked</button>
        </td>
        <td style={{ color: 'blue' }}>{employee.name}</td>
        <td style={{ color: 'blue' }}>{employee.sex}</td>
        <td style={{ color: 'blue' }}>{employee.email}</td>
        <td style={{ color: 'blue' }}>${employee.salary.toLocaleString()}</td>
      </tr>
    );
  }

  if (isEditing) {
    return (
      <tr className="editing-row">
        <td>
          <button className="btn btn-success" onClick={() => onSave(employee.id)}>Save</button>
          <button className="btn btn-secondary ml-2" onClick={() => onCancel(employee.id)}>Cancel</button>
        </td>
        <td>
          <input
            type="text"
            value={editingData.name || ''}
            onChange={(e) => onFieldChange('name', e.target.value)}
            className="form-control"
          />
        </td>
        <td>
          <select
            value={editingData.sex || ''}
            onChange={(e) => onFieldChange('sex', e.target.value)}
            className="form-control"
          >
            <option value="">Select...</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </td>
        <td>
          <input
            type="email"
            value={editingData.email || ''}
            onChange={(e) => onFieldChange('email', e.target.value)}
            className="form-control"
          />
        </td>
        <td>
          <input
            type="number"
            value={editingData.salary || 0}
            onChange={(e) => onFieldChange('salary', e.target.value)}
            className="form-control"
          />
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>
        <button className="btn btn-primary" onClick={() => onEdit(employee.id)}>Edit</button>
        <button className="btn btn-danger ml-2" onClick={() => onDelete(employee.id)}>Delete</button>
      </td>
      <td style={{color: 'blue'}}>{employee.name}</td>
      <td style={{color: 'blue'}}>{employee.sex}</td>
      <td style={{color: 'blue'}}>{employee.email}</td>
      <td style={{color: 'blue'}}>${employee.salary.toLocaleString()}</td>
    </tr>
  );
};

const EmployeeGrid: React.FC = () => {
  // Use TanStack Query for employees data
  const { data: employees = [], isLoading, error } = useEmployees();
  const updateEmployeeMutation = useUpdateEmployee();
  const createEmployeeMutation = useCreateEmployee();
  const deleteEmployeeMutation = useDeleteEmployee();
  const { updateEmployeeInCache, addEmployeeToCache, removeEmployeeFromCache } = useEmployeeRealtimeUpdates();
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Partial<Employee>>({});
  const [lockedEmployees, setLockedEmployees] = useState<Set<number>>(new Set());
  const [connectionStatus, setConnectionStatus] = useState<'initial-connecting' | 'connected' | 'reconnecting' | 'disconnected'>('initial-connecting');
  const [hasEverConnected, setHasEverConnected] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEmployeeData, setNewEmployeeData] = useState<Omit<Employee, 'id'>>({
    name: '',
    email: '',
    sex: '',
    salary: 0
  });
  const initialConnectionAttemptedRef = useRef(false);
  const socketIOService = useRef<SocketIOService>(new SocketIOService());

  useEffect(() => {
    // Define event handlers as stable references (only created once)
    const handleLockEmployee = (...args: unknown[]) => {
      const [id, lockingSocketId] = args as [number, string];
      const currentSocketId = socketIOService.current.getSocketId();
      
      // Only show notification if it's not from this connection
      if (lockingSocketId !== currentSocketId) {
        setLockedEmployees(prev => new Set([...prev, id]));
        toast.success(`Employee ${id} locked by another user`);
      } else {
        // Still update the state for our own locks
        setLockedEmployees(prev => new Set([...prev, id]));
      }
    };

    const handleUnlockEmployee = (...args: unknown[]) => {
      const [id] = args as [number];
      setLockedEmployees(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    };

    const handleLockFailed = (...args: unknown[]) => {
      const [id] = args as [number];
      toast.error(`Cannot edit employee ${id} - already locked by another user`);
    };

    const handleLockStatusUpdate = (...args: unknown[]) => {
      const [lockStatus] = args as [Record<number, string>];
      setLockedEmployees(new Set(Object.keys(lockStatus).map(Number)));
    };

    const handleEmployeeUpdated = (...args: unknown[]) => {
      const [id, propertyName, value, updatedBySocketId] = args as [number, string, unknown, string];
      const currentSocketId = socketIOService.current.getSocketId();
      
      // Update the employee data in the React Query cache
      updateEmployeeInCache(id, propertyName, value);
      
      // Only show notification if it's not from this connection
      if (updatedBySocketId !== currentSocketId) {
        toast.success(`Employee ${id} updated by another user`);
      }
    };

    const handleEmployeeCreated = (...args: unknown[]) => {
      const [employee] = args as [Employee];
      addEmployeeToCache(employee);
      toast.success(`New employee ${employee.name} added by another user`);
    };

    const handleEmployeeDeleted = (...args: unknown[]) => {
      const [employeeId] = args as [number];
      removeEmployeeFromCache(employeeId);
      toast.success(`Employee ${employeeId} deleted by another user`);
    };

    // Add connection state monitoring
    const handleConnectionClosed = () => {
      console.log('Connection lost, attempting to reconnect...');
      if (hasEverConnected) {
        setConnectionStatus('reconnecting');
      }
    };

    const handleConnectionReconnected = () => {
      console.log('Socket.IO reconnected successfully');
      setConnectionStatus('connected');
      toast.success('Real-time connection restored!');
    };

    const handleConnectionError = (...args: unknown[]) => {
      const [error] = args as [Error];
      console.error('Socket.IO connection error:', error);
      setConnectionStatus('disconnected');
    };

    // Register event handlers only once
    const service = socketIOService.current;
    service.on('LockEmployee', handleLockEmployee);
    service.on('UnlockEmployee', handleUnlockEmployee);
    service.on('LockFailed', handleLockFailed);
    service.on('LockStatusUpdate', handleLockStatusUpdate);
    service.on('EmployeeUpdated', handleEmployeeUpdated);
    service.on('EmployeeCreated', handleEmployeeCreated);
    service.on('EmployeeDeleted', handleEmployeeDeleted);
    service.on('ConnectionClosed', handleConnectionClosed);
    service.on('ConnectionReconnected', handleConnectionReconnected);
    service.on('ConnectionError', handleConnectionError);

    const connectSocketIO = async () => {
      // Prevent multiple connection attempts
      if (initialConnectionAttemptedRef.current) {
        return;
      }
      
      initialConnectionAttemptedRef.current = true;
      setConnectionStatus('initial-connecting');
      
      try {
        await service.connect();
        setConnectionStatus('connected');
        setHasEverConnected(true);
        console.log('Socket.IO connected successfully');

        // Get initial lock status
        try {
          await service.getLockStatus();
        } catch (lockStatusError) {
          console.warn('Failed to get initial lock status:', lockStatusError);
        }
      } catch (error) {
        console.error('Failed to connect to Socket.IO on initial attempt:', error);
        setConnectionStatus('disconnected');
        
        // Only show error toast for initial connection failure
        toast.error('Could not establish real-time connection. Some features may be limited.');
      }
    };

    connectSocketIO();

    return () => {
      // Clean up event handlers
      service.off('LockEmployee', handleLockEmployee);
      service.off('UnlockEmployee', handleUnlockEmployee);
      service.off('LockFailed', handleLockFailed);
      service.off('LockStatusUpdate', handleLockStatusUpdate);
      service.off('EmployeeUpdated', handleEmployeeUpdated);
      service.off('EmployeeCreated', handleEmployeeCreated);
      service.off('EmployeeDeleted', handleEmployeeDeleted);
      service.off('ConnectionClosed', handleConnectionClosed);
      service.off('ConnectionReconnected', handleConnectionReconnected);
      service.off('ConnectionError', handleConnectionError);
      service.disconnect();
    };
  }, []); // Empty dependency array intentional - we want this to run only once on mount

  const handleEdit = async (id: number) => {
    const employee = employees.find(emp => emp.id === id);
    if (!employee) return;

    // Check if employee is already locked
    if (lockedEmployees.has(id)) {
      toast.error('This employee is currently being edited by another user');
      return;
    }

    // Check if Socket.IO is connected
    if (!socketIOService.current.isConnected()) {
      toast.error('Real-time connection is not available. Cannot edit employee.');
      return;
    }

    try {
      await socketIOService.current.lockEmployee(id);
      setEditingId(id);
      setEditingData({ ...employee });
    } catch (error) {
      console.error('Failed to lock employee:', error);
      toast.error('Failed to lock employee for editing. Please check your connection.');
    }
  };

  const handleSave = async (id: number) => {
    try {
      const updatedEmployee = { id, ...editingData } as Employee;
      
      // Use the mutation to update the employee
      await updateEmployeeMutation.mutateAsync(updatedEmployee);

      // Send updates through Socket.IO for each changed field (only if connected)
      if (socketIOService.current.isConnected()) {
        const originalEmployee = employees.find(emp => emp.id === id);
        if (originalEmployee) {
          for (const [key, value] of Object.entries(editingData)) {
            if (originalEmployee[key as keyof Employee] !== value) {
              try {
                await socketIOService.current.updateEmployee(id, key, value);
              } catch (socketError) {
                console.warn('Failed to send real-time update:', socketError);
              }
            }
          }
        }
      }

      // Unlock the employee (with error handling)
      if (socketIOService.current.isConnected()) {
        try {
          await socketIOService.current.unlockEmployee(id);
        } catch (socketError) {
          console.warn('Failed to unlock employee via Socket.IO:', socketError);
        }
      }
      
      setEditingId(null);
      setEditingData({});
      
      // Remove from locked state locally (will be confirmed by Socket.IO if connected)
      setLockedEmployees(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (error) {
      console.error('Failed to save employee:', error);
      // Error toast is handled by the mutation
    }
  };

  const handleCancel = async (id: number) => {
    try {
      // Unlock the employee (with error handling)
      if (socketIOService.current.isConnected()) {
        try {
          await socketIOService.current.unlockEmployee(id);
        } catch (socketError) {
          console.warn('Failed to unlock employee via Socket.IO:', socketError);
        }
      }
      
      setEditingId(null);
      setEditingData({});
      
      // Remove from locked state locally (will be confirmed by Socket.IO if connected)
      setLockedEmployees(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (error) {
      console.error('Failed to cancel edit:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) {
      return;
    }

    try {
      await deleteEmployeeMutation.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete employee:', error);
      // Error toast is handled by the mutation
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setEditingData(prev => ({
      ...prev,
      [field]: field === 'salary' ? parseFloat(value) || 0 : value
    }));
  };

  const handleCreateEmployee = async () => {
    try {
      await createEmployeeMutation.mutateAsync(newEmployeeData);
      setNewEmployeeData({ name: '', email: '', sex: '', salary: 0 });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create employee:', error);
      // Error toast is handled by the mutation
    }
  };

  const handleNewEmployeeFieldChange = (field: keyof Omit<Employee, 'id'>, value: string) => {
    setNewEmployeeData(prev => ({
      ...prev,
      [field]: field === 'salary' ? parseFloat(value) || 0 : value
    }));
  };

  if (isLoading) {
    return <div className="loading">Loading employees...</div>;
  }

  if (error) {
    return <div className="error">Error loading employees. Please try refreshing the page.</div>;
  }

  const getConnectionStatusInfo = () => {
    switch (connectionStatus) {
      case 'initial-connecting':
        return {
          backgroundColor: '#fff3cd',
          borderColor: '#ffeaa7',
          message: '🔄 Connecting to real-time updates...'
        };
      case 'reconnecting':
        return {
          backgroundColor: '#fff3cd',
          borderColor: '#ffeaa7',
          message: '🔄 Reconnecting to real-time updates...'
        };
      case 'connected':
        return {
          backgroundColor: '#d4edda',
          borderColor: '#c3e6cb',
          message: '✅ Connected to real-time updates'
        };
      case 'disconnected':
        return {
          backgroundColor: '#f8d7da',
          borderColor: '#f5c6cb',
          message: hasEverConnected 
            ? '❌ Real-time updates disconnected - Please refresh the page'
            : '❌ Could not establish real-time connection - Limited functionality'
        };
      default:
        return {
          backgroundColor: '#f8d7da',
          borderColor: '#f5c6cb',
          message: '❌ Connection status unknown'
        };
    }
  };

  const statusInfo = getConnectionStatusInfo();

  return (
    <div className="employee-grid">
      <h1 style={{color:'blue'}}>Real-time Employee Grid</h1>
      <div className="status-bar" style={{ 
        marginBottom: '1rem', 
        padding: '0.5rem', 
        backgroundColor: statusInfo.backgroundColor, 
        border: '1px solid ' + statusInfo.borderColor, 
        borderRadius: '0.25rem' 
      }}>
        <strong>Connection Status:</strong> {statusInfo.message}
      </div>
      <p className="instructions">
        Open this page in multiple browser windows/tabs to see real-time collaborative editing in action!
      </p>
      
      <div style={{ marginBottom: '1rem' }}>
        <button 
          className="btn btn-success" 
          onClick={() => setShowCreateForm(!showCreateForm)}
          disabled={createEmployeeMutation.isPending}
        >
          {showCreateForm ? 'Cancel' : 'Add New Employee'}
        </button>
      </div>

      {showCreateForm && (
        <div style={{ 
          marginBottom: '1rem', 
          padding: '1rem', 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #dee2e6', 
          borderRadius: '0.25rem' 
        }}>
          <h3>Add New Employee</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Name"
              value={newEmployeeData.name}
              onChange={(e) => handleNewEmployeeFieldChange('name', e.target.value)}
              className="form-control"
            />
            <select
              value={newEmployeeData.sex}
              onChange={(e) => handleNewEmployeeFieldChange('sex', e.target.value)}
              className="form-control"
            >
              <option value="">Select Sex...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <input
              type="email"
              placeholder="Email"
              value={newEmployeeData.email}
              onChange={(e) => handleNewEmployeeFieldChange('email', e.target.value)}
              className="form-control"
            />
            <input
              type="number"
              placeholder="Salary"
              value={newEmployeeData.salary}
              onChange={(e) => handleNewEmployeeFieldChange('salary', e.target.value)}
              className="form-control"
            />
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <button 
              className="btn btn-success" 
              onClick={handleCreateEmployee}
              disabled={createEmployeeMutation.isPending || !newEmployeeData.name || !newEmployeeData.email || !newEmployeeData.sex}
            >
              {createEmployeeMutation.isPending ? 'Creating...' : 'Create Employee'}
            </button>
          </div>
        </div>
      )}
      
      <table className="table">
        <thead>
          <tr>
            <th>Action</th>
            <th>Name</th>
            <th>Sex</th>
            <th>Email</th>
            <th>Salary</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(employee => (
            <EmployeeRow
              key={employee.id}
              employee={employee}
              isLocked={lockedEmployees.has(employee.id)}
              isEditing={editingId === employee.id}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={handleCancel}
              onDelete={handleDelete}
              onFieldChange={handleFieldChange}
              editingData={editingData}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeGrid;

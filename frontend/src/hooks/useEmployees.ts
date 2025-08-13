import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmployeeService } from '../services/EmployeeService';
import type { Employee } from '../types/Employee';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

export const EMPLOYEE_QUERY_KEY = 'employees';

export const useEmployees = () => {
  const query = useQuery({
    queryKey: [EMPLOYEE_QUERY_KEY],
    queryFn: EmployeeService.getAllEmployees,
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnMount: true, // Refetch when component mounts
    staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
  });

  // Handle error when it occurs
  useEffect(() => {
    if (query.error) {
      console.error('Failed to load employees:', query.error);
      toast.error('Failed to load employees');
    }
  }, [query.error]);

  return query;
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employee: Omit<Employee, 'id'>) => EmployeeService.createEmployee(employee),
    onSuccess: (newEmployee) => {
      // Add the new employee to the cache
      queryClient.setQueryData<Employee[]>([EMPLOYEE_QUERY_KEY], (old) => {
        if (!old) return [newEmployee];
        return [...old, newEmployee];
      });
      toast.success('Employee created successfully');
    },
    onError: (error: unknown) => {
      console.error('Failed to create employee:', error);
      toast.error('Failed to create employee');
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employee: Employee) => EmployeeService.updateEmployee(employee),
    
    // Optimistic update
    onMutate: async (employee) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: [EMPLOYEE_QUERY_KEY] });

      // Snapshot the previous value
      const previousEmployees = queryClient.getQueryData<Employee[]>([EMPLOYEE_QUERY_KEY]);

      // Optimistically update to the new value
      queryClient.setQueryData<Employee[]>([EMPLOYEE_QUERY_KEY], (old) => {
        if (!old) return old;
        return old.map((emp) => (emp.id === employee.id ? employee : emp));
      });

      // Return a context with the previous and new data
      return { previousEmployees, employee };
    },
    
    // If the mutation fails, use the context to roll back
    onError: (error: unknown, _variables, context) => {
      if (context?.previousEmployees) {
        queryClient.setQueryData([EMPLOYEE_QUERY_KEY], context.previousEmployees);
      }
      console.error('Failed to save employee:', error);
      toast.error('Failed to save employee');
    },
    
    // Always refetch after error or success to ensure we have the latest data
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [EMPLOYEE_QUERY_KEY] });
    },
    
    onSuccess: () => {
      toast.success('Employee updated successfully');
    },
  });
};

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => EmployeeService.deleteEmployee(id),
    onSuccess: (_, deletedId) => {
      // Remove the employee from the cache
      queryClient.setQueryData<Employee[]>([EMPLOYEE_QUERY_KEY], (old) => {
        if (!old) return old;
        return old.filter((emp) => emp.id !== deletedId);
      });
      toast.success('Employee deleted successfully');
    },
    onError: (error: unknown) => {
      console.error('Failed to delete employee:', error);
      toast.error('Failed to delete employee');
    },
  });
};

// Hook for real-time updates from Socket.IO
export const useEmployeeRealtimeUpdates = () => {
  const queryClient = useQueryClient();

  const updateEmployeeInCache = (id: number, field: string, value: unknown) => {
    queryClient.setQueryData<Employee[]>([EMPLOYEE_QUERY_KEY], (old) => {
      if (!old) return old;
      return old.map((emp) => (emp.id === id ? { ...emp, [field]: value } : emp));
    });
  };

  const addEmployeeToCache = (employee: Employee) => {
    queryClient.setQueryData<Employee[]>([EMPLOYEE_QUERY_KEY], (old) => {
      if (!old) return [employee];
      // Check if employee already exists
      const exists = old.some((emp) => emp.id === employee.id);
      if (exists) return old;
      return [...old, employee];
    });
  };

  const removeEmployeeFromCache = (id: number) => {
    queryClient.setQueryData<Employee[]>([EMPLOYEE_QUERY_KEY], (old) => {
      if (!old) return old;
      return old.filter((emp) => emp.id !== id);
    });
  };

  return { 
    updateEmployeeInCache, 
    addEmployeeToCache, 
    removeEmployeeFromCache 
  };
};

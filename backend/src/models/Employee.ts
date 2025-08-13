export interface Employee {
  id: number;
  name: string;
  email: string;
  sex: string;
  salary: number;
}

export interface CreateEmployeeRequest {
  name: string;
  email: string;
  sex: string;
  salary: number;
}

export interface UpdateEmployeeRequest {
  id: number;
  name: string;
  email: string;
  sex: string;
  salary: number;
}

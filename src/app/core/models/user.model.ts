export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'FUNCIONARIO' | 'CLIENTE';
  active: boolean;
}

export interface LoginResponse {
  token: string;
  email: string;
  name: string;
  role: string;
}

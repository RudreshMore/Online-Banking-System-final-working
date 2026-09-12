export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  mobileNumber: string;
  password: string;
}

export interface AuthResponseData {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    active: boolean;
  };
}

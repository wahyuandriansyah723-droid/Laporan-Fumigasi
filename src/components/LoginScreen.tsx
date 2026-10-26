import React from 'react';
import { LoginDashboard } from './LoginDashboard';
import { AuthUser } from '../types/auth';
import { InventoryItem, StockTransaction } from '../types/inventory';
import { FumigationJobReport } from '../types/jobs';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  onBackToApp?: () => void;
  items?: InventoryItem[];
  transactions?: StockTransaction[];
  jobReports?: FumigationJobReport[];
}

export const LoginScreen: React.FC<LoginScreenProps> = (props) => {
  return <LoginDashboard {...props} />;
};

export default LoginScreen;

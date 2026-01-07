import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => (
  <div className="min-h-screen w-full bg-gray-50">
    <h1>Auth Layout</h1>
    {/* Add auth-specific layout elements here if needed */}
    <Outlet />
  </div>
);

export default AuthLayout;

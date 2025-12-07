
import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import DefaultLayout from './layouts/DefaultLayout.js';
import AuthLayout from './layouts/AuthLayout.js';
import HomePage from './pages/HomePage.js';
import SettingsPage from './pages/SettingsPage.js';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.js';
import LoginPage from './pages/auth/LoginPage.js';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.js';
import SignupPage from './pages/auth/SignupPage.js';

const router = createBrowserRouter([
  {
    path: 'auth',
    element: <AuthLayout />, // auth layout
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
    ],
  },
  {
    path: '/',
    element: <DefaultLayout />, // default layout
    children: [
      { index: true, element: <HomePage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;

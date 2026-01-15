
import React from 'react';
import { ViewportProvider } from './global/provider/ViewportProvider.js';
import { BrowserFontsizeProvider } from './global/provider/BrowserFontsizeProvider.js';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import DefaultLayout from './layouts/DefaultLayout.js';
import AuthLayout from './layouts/AuthLayout.js';
import HomePage from './pages/HeroPage.js';
import SettingsPage from './pages/SettingsPage.js';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.js';
import LoginPage from './pages/auth/LoginPage.js';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.js';
import SignupPage from './pages/auth/SignupPage.js';
import AccountRegisterPage from './pages/auth/AccountRegisterPage.js';
import UserHome from './pages/home/UserHome.js';
import HomeLayout from './layouts/HomeLayout.js';

const router = createBrowserRouter([
  {
    path: 'auth',
    element: <AuthLayout />, // auth layout
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
      { path: 'account-register', element: <AccountRegisterPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
    ],
  },
  {
    path: '/',
    element: <DefaultLayout />, // default layout
    children: [
      { path: 'settings', element: <SettingsPage /> },
      { index: true, element: <HomePage /> },
    ],
  },
  {
    path: 'note',
    element: <HomeLayout />, // default layout
    children: [
      { path : 'home', element: <UserHome /> },
    ],
  }
]);

function App() {
  return (
    <BrowserFontsizeProvider>
      <ViewportProvider>
        <RouterProvider router={router} />
      </ViewportProvider>
    </BrowserFontsizeProvider>
  );
}

export default App;

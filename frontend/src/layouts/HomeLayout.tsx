import React from 'react';
import { Outlet } from 'react-router-dom';

const HomeLayout = () => (
  <div className="min-h-screen w-full bg-gray-50">
    <h1 className="text-3xl font-bold underline">
      Home Layout
    </h1>
    {/* Add header, sidebar, etc. here if needed */}
    <Outlet />
  </div>
);

export default HomeLayout;

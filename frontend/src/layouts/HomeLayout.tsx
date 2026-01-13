import React, { useContext } from 'react';
import { Outlet } from 'react-router-dom';
import { viewportContext } from '@/global/provider/ViewportProvider.js';

const HomeLayout = () => {
  const { width, height } = useContext(viewportContext);

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <h1 className="text-3xl font-bold underline">
        Home Layout
      </h1>
      {/* Add header, sidebar, etc. here if needed */}
      <p>Viewport Size: {width} x {height}</p>
      <Outlet />
    </div>
  );
};

export default HomeLayout;

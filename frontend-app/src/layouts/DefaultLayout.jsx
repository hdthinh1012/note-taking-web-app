import React from 'react';
import { Outlet } from 'react-router-dom';

const DefaultLayout = () => (
  <div>
     <h1 class="text-3xl font-bold underline">
    Hello world!
  </h1>
    <h1>Default Layout</h1>
    {/* Add header, sidebar, etc. here if needed */}
    <Outlet />
  </div>
);

export default DefaultLayout;

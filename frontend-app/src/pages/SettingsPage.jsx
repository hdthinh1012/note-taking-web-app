import React from 'react';

const SettingsPage = () => (
  <main>
    <h1>Settings</h1>
    <input placeholder="Search by title, content, or tags" />
    <section>
      <h2>Color Theme</h2>
      <p>Choose your color theme:</p>
      <button>Light Mode</button>
      <button>Dark Mode</button>
      <button>System</button>
      <button>Apply Changes</button>
    </section>
    <section>
      <h2>Font Theme</h2>
      <p>Choose your font theme:</p>
      <button>Sans-serif</button>
      <button>Serif</button>
      <button>Monospace</button>
      <button>Apply Changes</button>
    </section>
    <section>
      <h2>Change Password</h2>
      <button>Change Password</button>
    </section>
    <button>Logout</button>
  </main>
);

export default SettingsPage;

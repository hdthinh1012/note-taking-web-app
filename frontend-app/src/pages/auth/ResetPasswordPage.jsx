import React from 'react';

const ResetPasswordPage = () => (
  <main>
    <h1>Reset Your Password</h1>
    <p>Choose a new password to secure your account.</p>
    <label>New Password</label>
    <input type="password" placeholder="At least 8 characters" />
    <label>Confirm New Password</label>
    <input type="password" />
    <button>Reset Password</button>
  </main>
);

export default ResetPasswordPage;

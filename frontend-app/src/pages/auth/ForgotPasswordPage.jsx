import React from 'react';

const ForgotPasswordPage = () => (
  <main>
    <h1>Forgotten your password?</h1>
    <p>Enter your email below, and we'll send you a link to reset it.</p>
    <label>Email Address</label>
    <input type="email" placeholder="email@example.com" />
    <button>Send Reset Link</button>
  </main>
);

export default ForgotPasswordPage;

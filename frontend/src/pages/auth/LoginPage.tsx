import React from 'react';

const LoginPage = () => (
  <main>
    <h1>Welcome to Notes</h1>
    <p>Please log in to continue</p>
    <label>Email Address</label>
    <input type="email" placeholder="email@example.com" />
    <label>Password</label>
    <input type="password" />
    <button>Forgot</button>
    <button>Login</button>
    <p>Or log in with:</p>
    <button>Google</button>
    <p>No account yet? <a href="/signup">Sign Up</a></p>
  </main>
);

export default LoginPage;

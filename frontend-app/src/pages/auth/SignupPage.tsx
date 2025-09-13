import React from 'react';

const SignupPage = () => (
  <main>
    <h1>Create Your Account</h1>
    <p>Sign up to start organizing your notes and boost your productivity.</p>
    <label>Email Address</label>
    <input type="email" placeholder="email@example.com" />
    <label>Password</label>
    <input type="password" placeholder="At least 8 characters" />
    <button>Sign Up</button>
    <p>Or log in with:</p>
    <button>Google</button>
    <p>Already have an account? <a href="/login">Login</a></p>
  </main>
);

export default SignupPage;

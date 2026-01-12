import React from 'react';
import { set, useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import CookieService from '@/logic/cookie/cookieService.js';
import { useNavigate } from 'react-router-dom';
import { JwtService } from '@/logic/jwt/jwtService.js';

type SignupInputs = {
  username: string;
  password: string;
};

const LoginPage = () => {
  const navigate = useNavigate();
  const {
      register,
      handleSubmit,
      watch,
      formState: { errors },
  } = useForm<SignupInputs>();

  const onSubmit: SubmitHandler<SignupInputs> = (data) => {
      // Handle signup logic here
      fetch(`${import.meta.env.VITE_SERVER_URL}/auth/user-authentication/login/userpass`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: data.username, password: data.password }),
      })
      .then(response => {
          console.log('Status code:', response.status); // Access status code here
          console.log('Status OK:', response.ok); // true if status is 200-299
          
          // Check if request was successful
          if (!response.ok) {
            return response.json().then(errData => {
              throw new Error(errData.error || 'Login failed');
            });
          }
          return response.json();
      })
      .then(data => {
          const token = data.token;
          const payload = JwtService.decodeToken(token);
          CookieService.setCookie('authZToken', token, new Date((payload?.exp ?? 0) * 1000));
          navigate('/note/home');
      })
      .catch((error) => {
          console.error('Error:', error);
          // Handle login failure (e.g., show error message)
      });
  };

  return (
    <main className='bg-white rounded-lg shadow-md p-6 mx-auto max-w-md d-flex justify-center items-center'>
      <div className='flex justify-center items-center gap-2 mb-4'>
        <img src='/public/ntwa-logo.svg'/><span style={{ fontFamily: 'Pacifico, cursive' }}>Notes</span>
      </div>
      <div className="flex justify-center items-center gap-2 mb-4">
        <h2 className='max-w text-center text-3xl font-bold' style={{ fontFamily: 'Inter, sans-serif' }}>Create Your Account</h2>
      </div>
      <div className="flex justify-center items-center gap-2 mb-4">
        <p className='max-w text-center text-sm text-neutral-400'>Sign up to start organizing your notes and boost your productivity.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col w-full [&>*]:w-full">
          <label className='text-sm font-semibold my-2'>Username</label>
          <input className='p-3 rounded-md border border-neutral-200 outline-none focus:border-neutral-400 transition-colors' type="text" placeholder="username" {...register('username', { required: true })} />
          {errors.username && <span className='text-sm text-red-500 mt-1'>This field is required</span>}
          <label className='text-sm font-semibold my-2'>Password</label>
          <input className='p-3 rounded-md border border-neutral-200 outline-none focus:border-neutral-400 transition-colors' type="password" placeholder="password" {...register('password', { required: true })} />
          {errors.password && <span className='text-sm text-red-500 mt-1'>This field is required</span>}
          <button type="submit" className='my-5 max-w bg-blue-600 text-neutral-200'>Sign Up</button>
        </div>
      </form>
    </main>
  );
};

export default LoginPage;

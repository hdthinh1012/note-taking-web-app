import React from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';

type SignupInputs = {
  email: string;
};

const SignupPage = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupInputs>();

  const onSubmit: SubmitHandler<SignupInputs> = (data) => {
    // Handle signup logic here
    alert('Signup form submitted with email: ' + data.email);
  };

  const postEmailSignup = (email: string) => {
    // Implement the logic to post email for signup
    console.log('Posting email for signup:', email);
  }
  
  return (
    <main className='bg-white rounded-lg shadow-md p-6 mx-auto max-w-md'>
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
          <label className='text-sm font-semibold my-2'>Email Address</label>
          <input className='p-3 rounded-md border border-neutral-200 outline-none focus:border-neutral-400 transition-colors' type="email" placeholder="email@example.com" {...register('email', { required: true })} />
          {errors.email && <span className='text-sm text-red-500 mt-1'>This field is required</span>}
          <button type="submit" className='my-5 max-w bg-blue-600 text-neutral-200'>Sign Up</button>
        </div>
      </form>
    </main>
  );
};

export default SignupPage;

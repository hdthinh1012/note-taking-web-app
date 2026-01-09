import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';

type AccountRegisterInputs = {
    csrfToken: string;
    username: string;
    password: string;
    confirmPassword: string;
};

const AccountRegisterPage = () => {
    const [searchParams] = useSearchParams();
    const ssoUuid = searchParams.get('sso_uuid');
    const [token, setToken] = React.useState<string | null>(null);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<AccountRegisterInputs>();

    const password = watch('password');

    if (!ssoUuid) {
        alert('ERROR: Missing sso_uuid in query parameters');
    } else {
        fetch(`${import.meta.env.VITE_SERVER_URL}/auth/account-registration/gen-csrf-token/${ssoUuid}`)
            .then(response => response.json())
            .then(data => setToken(data.csrfToken))
            .catch(error => console.error('Error fetching CSRF token:', error));
    }

    const onSubmit: SubmitHandler<AccountRegisterInputs> = (data) => {
        // Handle signup logic here
        alert('Register account form submitted: ' + JSON.stringify(data));
    };


    return (
        <div>
            <h1>Account Register Page</h1>
            <main className='bg-white rounded-lg shadow-md p-6 mx-auto max-w-md'>
                {token ? (
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className='flex justify-center items-center gap-2 mb-4'>
                            <img src='/public/ntwa-logo.svg' /><span style={{ fontFamily: 'Pacifico, cursive' }}>Notes</span>
                        </div>
                        <div className="flex justify-center items-center gap-2 mb-4">
                            <h2 className='max-w text-center text-3xl font-bold' style={{ fontFamily: 'Inter, sans-serif' }}>Create Your Account</h2>
                        </div>
                        <div className="flex justify-center items-center gap-2 mb-4">
                            <p className='max-w text-center text-sm text-neutral-400'>Sign up to start organizing your notes and boost your productivity.</p>
                        </div>
                        <div className="flex flex-col w-full [&>*]:w-full">
                            <input type="hidden" value={token} {...register('csrfToken')} />
                            <label className='text-sm font-semibold my-2'>Username</label>
                            <input className='p-3 rounded-md border border-neutral-200 outline-none focus:border-neutral-400 transition-colors' type="text" placeholder="username" {...register('username', { required: true })} />
                            {errors.username && <span className='text-sm text-red-500 mt-1'>This field is required</span>}
                            <label className='text-sm font-semibold my-2'>Password</label>
                            <input className='p-3 rounded-md border border-neutral-200 outline-none focus:border-neutral-400 transition-colors' type="password" placeholder="password" {...register('password', { required: true })} />
                            {errors.password && <span className='text-sm text-red-500 mt-1'>This field is required</span>}
                            <label className='text-sm font-semibold my-2'>Confirm Password</label>
                            <input className='p-3 rounded-md border border-neutral-200 outline-none focus:border-neutral-400 transition-colors' type="password" placeholder="confirm password" {...register('confirmPassword', {
                                required: 'This field is required',
                                validate: (value) => value === password || 'Passwords do not match'
                            })} />
                            {errors.confirmPassword && <span className='text-sm text-red-500 mt-1'>{errors.confirmPassword.message}</span>}
                            <button type="submit" className='my-5 max-w bg-blue-600 text-neutral-200'>Register</button>
                        </div>
                    </form>
                ) : (
                    <p>Loading CSRF token...</p>
                )}
            </main>
            {/* Add your account registration form or content here */}
        </div>
    );
};

export default AccountRegisterPage;
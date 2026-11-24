import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { TextField, Button, Alert } from '@mui/material';
import { registerValidationSchema } from '../validations/schemas';
import { useAuthStore } from '../store/useAuthStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const registerUser = useAuthStore((s) => s.register);
  const [serverError, setServerError] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(registerValidationSchema),
    defaultValues: { full_name: '', email: '', phone: '', password: '' },
  });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await registerUser(values);
      navigate('/account', { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-xl items-center justify-center px-4 py-12">
      <div className="w-full rounded-3xl border border-[#D9A0A9]/50 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-[#3D1023]">Create Your Taantira Account</h1>
        <p className="mt-1 text-sm text-[#641B32]/80">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-[#A83F5E] underline">
            Sign in here
          </Link>
        </p>

        {serverError && (
          <Alert severity="error" className="mt-4">
            {serverError}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <Controller
            name="full_name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Full Name"
                fullWidth
                error={Boolean(errors.full_name)}
                helperText={errors.full_name?.message}
              />
            )}
          />
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Email Address"
                type="email"
                fullWidth
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
              />
            )}
          />
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Phone Number"
                fullWidth
                error={Boolean(errors.phone)}
                helperText={errors.phone?.message}
              />
            )}
          />
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Password (min. 8 characters)"
                type="password"
                fullWidth
                error={Boolean(errors.password)}
                helperText={errors.password?.message}
              />
            )}
          />
          <Button type="submit" variant="contained" color="primary" fullWidth size="large" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Account...' : 'Register'}
          </Button>
        </form>
      </div>
    </div>
  );
}

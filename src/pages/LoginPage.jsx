import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { TextField, Button, Alert } from '@mui/material';
import { loginValidationSchema } from '../validations/schemas';
import { useAuthStore } from '../store/useAuthStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const [serverError, setServerError] = useState('');

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(loginValidationSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const user = await login(values);
      const from = location.state?.from;
      if (from) {
        navigate(from, { replace: true });
      } else if ((user.roles || []).includes('delivery_partner')) {
        navigate('/delivery', { replace: true });
      } else if ((user.roles || []).some((r) => r !== 'customer')) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/account', { replace: true });
      }
    } catch (err) {
      setServerError(err.response?.data?.message || 'Unable to sign in. Verify backend & MySQL connection.');
    }
  };

  const fillCredential = (email, password) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
  };

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-5xl items-center justify-center px-4 py-12">
      <div className="grid w-full grid-cols-1 overflow-hidden rounded-3xl border border-[#D9A0A9]/50 bg-white shadow-lg md:grid-cols-12">
        <div className="flex flex-col justify-between bg-[#641B32] p-8 text-[#FFF9F2] md:col-span-5">
          <div>
            <p className="font-serif text-2xl font-bold tracking-[0.22em]">TAANTIRA</p>
            <p className="mt-2 text-xs uppercase tracking-widest text-[#C39A52]">Welcome Back</p>
            <p className="mt-4 text-sm leading-relaxed text-[#F5E7E8]/90">
              Sign in to access your saved wardrobe, live delivery OTP, courier tracking, and loyalty privileges.
            </p>
          </div>
          <div className="mt-8 space-y-2 rounded-2xl bg-[#3D1023]/70 p-4 text-xs">
            <p className="font-semibold text-[#C39A52]">Seeded Account Quick-Fill (Local Dev):</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => fillCredential('ananya@taantira.com', 'TaantiraUser@2026')}
                className="rounded-md bg-[#A83F5E] px-2.5 py-1 text-[11px] font-medium text-white hover:bg-[#C39A52] hover:text-[#3D1023]"
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => fillCredential('admin@taantira.com', 'TaantiraAdmin@2026')}
                className="rounded-md bg-[#A83F5E] px-2.5 py-1 text-[11px] font-medium text-white hover:bg-[#C39A52] hover:text-[#3D1023]"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => fillCredential('rider@taantira.com', 'TaantiraRider@2026')}
                className="rounded-md bg-[#A83F5E] px-2.5 py-1 text-[11px] font-medium text-white hover:bg-[#C39A52] hover:text-[#3D1023]"
              >
                Delivery Partner
              </button>
            </div>
          </div>
        </div>

        <div className="p-8 md:col-span-7">
          <h1 className="text-2xl font-bold text-[#3D1023]">Sign In to Taantira</h1>
          <p className="mt-1 text-sm text-[#641B32]/80">
            New to Taantira?{' '}
            <Link to="/register" className="font-semibold text-[#A83F5E] underline">
              Create your account
            </Link>
          </p>

          {serverError && (
            <Alert severity="error" className="mt-4">
              {serverError}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
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
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Password"
                  type="password"
                  fullWidth
                  error={Boolean(errors.password)}
                  helperText={errors.password?.message}
                />
              )}
            />

            <Button type="submit" variant="contained" color="primary" fullWidth size="large" disabled={isSubmitting}>
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

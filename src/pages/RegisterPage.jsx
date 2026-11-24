import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { TextField, Button, Alert, InputAdornment, IconButton } from '@mui/material';
import { CheckCircle2, Eye, EyeOff, Sparkles, UserPlus } from 'lucide-react';
import { registerValidationSchema } from '../validations/schemas';
import { useAuthStore } from '../store/useAuthStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const registerUser = useAuthStore((s) => s.register);
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const fromPath = location.state?.from || '';

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(registerValidationSchema),
    defaultValues: { full_name: '', email: '', phone: '', password: '', confirm_password: '' },
  });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await registerUser({
        full_name: values.full_name,
        email: values.email,
        phone: values.phone,
        password: values.password,
      });
      navigate(fromPath && fromPath !== '/register' ? fromPath : '/account', { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Unable to register right now. Please try again.');
    }
  };

  return (
    <div className="mx-auto flex min-h-[82vh] max-w-5xl items-center justify-center px-4 py-10 sm:px-6">
      <div className="grid w-full grid-cols-1 overflow-hidden rounded-3xl border border-[#D9A0A9]/50 bg-white shadow-xl md:grid-cols-12">
        {/* Editorial Saree Panel */}
        <div className="relative flex flex-col justify-between overflow-hidden bg-[#3D1023] text-[#FFF9F2] md:col-span-5">
          <img
            src="/assets/products/saree-paithani-maroon.jpg"
            alt="Taantira Paithani Heritage Saree"
            className="absolute inset-0 h-full w-full object-cover object-top opacity-35"
          />
          <div className="relative z-10 flex h-full flex-col justify-between bg-gradient-to-t from-[#3D1023] via-[#3D1023]/75 to-[#3D1023]/60 p-8">
            <div className="flex flex-col gap-3">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#C39A52]/60 bg-[#641B32]/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-[#C39A52]">
                <Sparkles className="h-3.5 w-3.5" /> Taantira Patron Membership
              </span>
              <h2 className="font-serif text-2xl font-bold leading-snug text-[#FFF9F2]">
                Curated Sarees &amp; Heirloom Jewellery
              </h2>
              <p className="text-xs leading-relaxed text-[#F5E7E8]/90">
                Create your personal account for seamless saree tailoring, wishlist curation, and insured doorstep delivery.
              </p>
            </div>

            <ul className="mt-8 flex flex-col gap-2.5 border-t border-[#D9A0A9]/25 pt-5 text-xs text-[#F5E7E8]/90">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#C39A52]" />
                <span>Save custom blouse &amp; fall-pico tailoring preferences</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#C39A52]" />
                <span>Earn loyalty points on every handloom saree purchase</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#C39A52]" />
                <span>View secure Delivery OTP &amp; live route map</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Clean Registration Form */}
        <div className="flex flex-col justify-center p-8 sm:p-10 md:col-span-7">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A83F5E]">New Client Registration</p>
            <h1 className="font-serif text-3xl font-bold text-[#3D1023]">Create Your Taantira Account</h1>
            <p className="text-sm text-[#641B32]/80">
              Already have an account?{' '}
              <Link
                to="/login"
                state={{ from: fromPath }}
                className="font-semibold text-[#641B32] underline decoration-[#C39A52] underline-offset-4 hover:text-[#A83F5E]"
              >
                Sign in here
              </Link>
            </p>
          </div>

          {serverError && (
            <Alert severity="error" className="mt-5">
              {serverError}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
            <Controller
              name="full_name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Full Name"
                  placeholder="Ananya Deshmukh"
                  autoComplete="name"
                  fullWidth
                  error={Boolean(errors.full_name)}
                  helperText={errors.full_name?.message}
                />
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email Address"
                    placeholder="ananya@example.com"
                    type="email"
                    autoComplete="email"
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
                    label="Mobile Number"
                    placeholder="9820020001"
                    autoComplete="tel"
                    fullWidth
                    error={Boolean(errors.phone)}
                    helperText={errors.phone?.message}
                  />
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Password (min. 8 chars)"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    fullWidth
                    error={Boolean(errors.password)}
                    helperText={errors.password?.message}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                              onClick={() => setShowPassword((s) => !s)}
                              edge="end"
                              size="small"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4 text-[#641B32]" /> : <Eye className="h-4 w-4 text-[#641B32]" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                )}
              />

              <Controller
                name="confirm_password"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Confirm Password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    fullWidth
                    error={Boolean(errors.confirm_password)}
                    helperText={errors.confirm_password?.message}
                  />
                )}
              />
            </div>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={isSubmitting}
              startIcon={<UserPlus className="h-4 w-4" />}
              className="py-3 text-sm font-semibold"
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-[#F5E7E8] pt-4 text-xs text-[#641B32]/80">
            <span>Looking to join our delivery fleet?</span>
            <Link to="/delivery" className="font-semibold text-[#641B32] hover:text-[#A83F5E] hover:underline">
              Register as Delivery Partner &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

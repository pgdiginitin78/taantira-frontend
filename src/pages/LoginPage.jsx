import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { TextField, Button, Alert, InputAdornment, IconButton } from '@mui/material';
import { Eye, EyeOff, Lock, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { loginValidationSchema } from '../validations/schemas';
import { useAuthStore } from '../store/useAuthStore';

const getContextCopy = (fromPath = '') => {
  if (fromPath.startsWith('/checkout')) {
    return {
      badge: 'Checkout Authentication',
      title: 'Complete Your Saree Order',
      subtitle: 'Sign in to verify your delivery PIN code, choose COD or manual UPI, and generate your secure delivery OTP.',
    };
  }
  if (fromPath.startsWith('/cart') || fromPath.includes('wishlist')) {
    return {
      badge: 'Saved Trousseau',
      title: 'Access Your Shopping Bag',
      subtitle: 'Sign in to sync your selected handloom sarees, matching blouse preferences, and saved jewellery across devices.',
    };
  }
  if (fromPath.startsWith('/delivery')) {
    return {
      badge: 'Fleet Partner Access',
      title: 'Delivery Partner Sign In',
      subtitle: 'Sign in with your verified Taantira delivery partner account to manage assignments and live route tracking.',
    };
  }
  if (fromPath.startsWith('/admin')) {
    return {
      badge: 'Operations Console',
      title: 'Taantira Staff Sign In',
      subtitle: 'Authorized role-based access for Catalogue, Order, Inventory, Finance, Delivery, and Support managers.',
    };
  }
  return {
    badge: 'Client Atelier',
    title: 'Welcome Back to Taantira',
    subtitle: 'Sign in to explore curated Banarasi, Kanjivaram, and Paithani weaves, track deliveries, and manage custom blouse tailoring.',
  };
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fromPath = location.state?.from || '';
  const contextCopy = getContextCopy(fromPath);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(loginValidationSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const user = await login(values);
      if (fromPath && fromPath !== '/login') {
        navigate(fromPath, { replace: true });
      } else if ((user.roles || []).includes('delivery_partner')) {
        navigate('/delivery', { replace: true });
      } else if ((user.roles || []).some((r) => r !== 'customer')) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/account', { replace: true });
      }
    } catch (err) {
      setServerError(
        err.response?.data?.message || 'Unable to sign in right now. Please check your credentials and server connection.'
      );
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center px-4 py-10 sm:px-6">
      <div className="grid w-full grid-cols-1 overflow-hidden rounded-3xl border border-[#D9A0A9]/50 bg-white shadow-xl md:grid-cols-12">
        {/* Editorial Saree Panel */}
        <div className="relative flex flex-col justify-between overflow-hidden bg-[#3D1023] text-[#FFF9F2] md:col-span-5">
          <img
            src="/assets/products/saree-kanjivaram-berry.jpg"
            alt="Taantira Kanjivaram Silk Saree"
            className="absolute inset-0 h-full w-full object-cover object-top opacity-35"
          />
          <div className="relative z-10 flex h-full flex-col justify-between bg-gradient-to-t from-[#3D1023] via-[#3D1023]/75 to-[#3D1023]/60 p-8">
            <div className="flex flex-col gap-3">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#C39A52]/60 bg-[#641B32]/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-[#C39A52]">
                <Sparkles className="h-3.5 w-3.5" /> {contextCopy.badge}
              </span>
              <h2 className="font-serif text-2xl font-bold leading-snug text-[#FFF9F2]">
                {contextCopy.title}
              </h2>
              <p className="text-xs leading-relaxed text-[#F5E7E8]/90">{contextCopy.subtitle}</p>
            </div>

            <div className="mt-8 flex flex-col gap-2.5 border-t border-[#D9A0A9]/25 pt-5 text-xs text-[#F5E7E8]/90">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[#C39A52]" />
                <span>Authenticated Delivery OTP &amp; Verified Payments</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 shrink-0 text-[#C39A52]" />
                <span>Live Order Tracking across India</span>
              </div>
            </div>
          </div>
        </div>

        {/* Clean Form Column */}
        <div className="flex flex-col justify-center p-8 sm:p-10 md:col-span-7">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A83F5E]">Account Sign In</p>
            <h1 className="font-serif text-3xl font-bold text-[#3D1023]">Sign In to Taantira</h1>
            <p className="text-sm text-[#641B32]/80">
              New to Taantira Sarees?{' '}
              <Link
                to="/register"
                state={{ from: fromPath }}
                className="font-semibold text-[#641B32] underline decoration-[#C39A52] underline-offset-4 hover:text-[#A83F5E]"
              >
                Create your client account
              </Link>
            </p>
          </div>

          {serverError && (
            <Alert severity="error" className="mt-5">
              {serverError}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-7 flex flex-col gap-5">
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
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
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

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={isSubmitting}
              startIcon={<Lock className="h-4 w-4" />}
              className="py-3 text-sm font-semibold"
            >
              {isSubmitting ? 'Signing In...' : 'Sign In Securely'}
            </Button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-[#F5E7E8] pt-4 text-xs text-[#641B32]/80">
            <span>Delivering with Taantira?</span>
            <Link to="/delivery" className="font-semibold text-[#641B32] hover:text-[#A83F5E] hover:underline">
              Delivery Partner Portal &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

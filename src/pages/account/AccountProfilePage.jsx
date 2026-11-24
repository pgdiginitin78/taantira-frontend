import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { TextField, Button, Checkbox, FormControlLabel, Alert } from '@mui/material';
import api from '../../services/api';
import { profileValidationSchema } from '../../validations/schemas';

export default function AccountProfilePage() {
  const [savedMsg, setSavedMsg] = useState('');
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(profileValidationSchema),
    defaultValues: { full_name: '', phone: '', date_of_birth: '', preferred_size: '', marketing_opt_in: true },
  });

  useEffect(() => {
    api
      .get('/users/profile')
      .then((res) => {
        const u = res.data?.data;
        if (u) {
          reset({
            full_name: u.full_name || '',
            phone: u.phone || '',
            date_of_birth: u.customerProfile?.date_of_birth || '',
            preferred_size: u.customerProfile?.preferred_size || '',
            marketing_opt_in: Boolean(u.customerProfile?.marketing_opt_in ?? true),
          });
        }
      })
      .catch(() => {});
  }, [reset]);

  const onSubmit = async (values) => {
    setSavedMsg('');
    await api.put('/users/profile', values);
    setSavedMsg('Profile preferences updated.');
  };

  return (
    <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-6 shadow-sm">
      <h1 className="font-serif text-2xl font-bold text-[#3D1023]">Profile &amp; Fit Preferences</h1>
      {savedMsg && <Alert severity="success" className="mt-4">{savedMsg}</Alert>}
      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Controller name="full_name" control={control} render={({ field }) => <TextField {...field} label="Full Name" error={Boolean(errors.full_name)} helperText={errors.full_name?.message} />} />
        <Controller name="phone" control={control} render={({ field }) => <TextField {...field} label="Phone Number" error={Boolean(errors.phone)} helperText={errors.phone?.message} />} />
        <Controller name="date_of_birth" control={control} render={({ field }) => <TextField {...field} type="date" label="Date of Birth" InputLabelProps={{ shrink: true }} />} />
        <Controller name="preferred_size" control={control} render={({ field }) => <TextField {...field} label="Preferred Size (e.g. S, M, L)" />} />
        <div className="sm:col-span-2">
          <Controller
            name="marketing_opt_in"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Checkbox checked={Boolean(field.value)} onChange={(e) => field.onChange(e.target.checked)} size="small" />}
                label={<span className="text-xs">Receive new weave alerts and seasonal invitations</span>}
              />
            )}
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}

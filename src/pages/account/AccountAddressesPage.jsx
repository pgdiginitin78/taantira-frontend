import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { TextField, Button, Checkbox, FormControlLabel, Alert } from '@mui/material';
import { Trash2, MapPin } from 'lucide-react';
import api from '../../services/api';
import { addressValidationSchema } from '../../validations/schemas';

export default function AccountAddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [msg, setMsg] = useState('');

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(addressValidationSchema),
    defaultValues: {
      label: 'Home',
      recipient_name: '',
      phone: '',
      address_line1: '',
      address_line2: '',
      landmark: '',
      city: '',
      state: '',
      pincode: '',
      is_default: true,
    },
  });

  const loadAddresses = () => {
    api.get('/users/addresses').then((res) => setAddresses(res.data?.data || [])).catch(() => {});
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const onSubmit = async (values) => {
    setMsg('');
    await api.post('/users/addresses', values);
    setMsg('Address saved successfully.');
    reset();
    loadAddresses();
  };

  const deleteAddr = async (id) => {
    await api.delete(`/users/addresses/${id}`);
    loadAddresses();
  };

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold text-[#3D1023]">Saved Delivery Addresses</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {addresses.map((addr) => (
          <div key={addr.id} className="flex flex-col justify-between rounded-2xl border border-[#D9A0A9]/40 bg-white p-5 shadow-sm">
            <div className="text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 font-bold text-[#641B32]">
                  <MapPin className="h-3.5 w-3.5" /> {addr.label}
                </span>
                {addr.is_default && <span className="rounded bg-[#F5E7E8] px-2 py-0.5 text-[10px] font-bold text-[#641B32]">Default</span>}
              </div>
              <p className="pt-1 text-sm font-semibold text-[#3D1023]">{addr.recipient_name}</p>
              <p>{addr.address_line1} {addr.address_line2}</p>
              <p>{addr.city}, {addr.state} - {addr.pincode}</p>
              <p>Phone: {addr.phone}</p>
            </div>
            <button type="button" onClick={() => deleteAddr(addr.id)} className="mt-4 inline-flex cursor-pointer items-center gap-1 self-end text-xs text-red-700 hover:underline">
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-[#3D1023]">Add New Address</h2>
        {msg && <Alert severity="success" className="mt-3">{msg}</Alert>}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller name="label" control={control} render={({ field }) => <TextField {...field} size="small" label="Label (Home / Work)" error={Boolean(errors.label)} helperText={errors.label?.message} />} />
          <Controller name="recipient_name" control={control} render={({ field }) => <TextField {...field} size="small" label="Recipient Name" error={Boolean(errors.recipient_name)} helperText={errors.recipient_name?.message} />} />
          <Controller name="phone" control={control} render={({ field }) => <TextField {...field} size="small" label="Phone" error={Boolean(errors.phone)} helperText={errors.phone?.message} />} />
          <Controller name="pincode" control={control} render={({ field }) => <TextField {...field} size="small" label="6-Digit PIN Code" error={Boolean(errors.pincode)} helperText={errors.pincode?.message} />} />
          <Controller name="address_line1" control={control} render={({ field }) => <TextField {...field} size="small" label="Address Line 1" className="sm:col-span-2" error={Boolean(errors.address_line1)} helperText={errors.address_line1?.message} />} />
          <Controller name="city" control={control} render={({ field }) => <TextField {...field} size="small" label="City" error={Boolean(errors.city)} helperText={errors.city?.message} />} />
          <Controller name="state" control={control} render={({ field }) => <TextField {...field} size="small" label="State" error={Boolean(errors.state)} helperText={errors.state?.message} />} />
          <div className="sm:col-span-2">
            <Controller
              name="is_default"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox checked={Boolean(field.value)} onChange={(e) => field.onChange(e.target.checked)} size="small" />}
                  label={<span className="text-xs">Set as default address</span>}
                />
              )}
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
              Save Address
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

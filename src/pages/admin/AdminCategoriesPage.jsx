import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Alert,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  TextField,
} from '@mui/material';
import { FolderTree, Pencil, PlusCircle, ShieldAlert, Trash2, Upload, Layers } from 'lucide-react';
import api, { API_ORIGIN } from '../../services/api';
import DataTable from '../../components/DataTable';

const categoryFormSchema = yup.object({
  name: yup.string().trim().min(2, 'Enter at least 2 characters').max(120).required('Category name is required'),
  slug: yup
    .string()
    .trim()
    .lowercase()
    .matches(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and hyphens only')
    .required('Slug is required'),
  description: yup.string().nullable(),
  image_url: yup.string().max(500).nullable(),
  sort_order: yup.number().typeError('Enter valid number').integer().default(0),
  is_active: yup.boolean().default(true),
  supports_blouse_option: yup.boolean().default(true),
  supports_petticoat_option: yup.boolean().default(true),
  supports_customisation: yup.boolean().default(true),
  supports_gift_options: yup.boolean().default(true),
});

const slugify = (val) =>
  String(val || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export default function AdminCategoriesPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      image_url: '',
      sort_order: 1,
      is_active: true,
      supports_blouse_option: true,
      supports_petticoat_option: true,
      supports_customisation: true,
      supports_gift_options: true,
    },
  });

  const watchedName = useWatch({ control, name: 'name' });
  const watchedImage = useWatch({ control, name: 'image_url' });

  const loadCategories = () => {
    api
      .get('/categories', { params: { includeInactive: 'true' } })
      .then((res) => {
        setCategories(res.data?.data || []);
        setErr('');
      })
      .catch((e) => {
        setErr(
          e.response?.data?.message ||
            'Backend MySQL connection is not active yet. Start MySQL and run migrations/seeders to manage live categories.'
        );
      });
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const mainCategories = useMemo(
    () => categories.filter((c) => !c.parent_id),
    [categories]
  );
  const totalSubcategories = useMemo(
    () => categories.filter((c) => Boolean(c.parent_id)).length,
    [categories]
  );
  const totalProducts = useMemo(
    () => mainCategories.reduce((sum, c) => sum + Number(c.product_count || 0), 0),
    [mainCategories]
  );

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErr('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setValue('image_url', `${API_ORIGIN}${res.data.data.url}`);
      setMsg('Category banner uploaded securely to MySQL.');
    } catch (uploadErr) {
      setErr(uploadErr.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    reset({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      image_url: cat.image_url || '',
      sort_order: Number(cat.sort_order || 0),
      is_active: Boolean(cat.is_active),
      supports_blouse_option: Boolean(cat.supports_blouse_option),
      supports_petticoat_option: Boolean(cat.supports_petticoat_option),
      supports_customisation: Boolean(cat.supports_customisation),
      supports_gift_options: Boolean(cat.supports_gift_options),
    });
    setMsg('');
    setErr('');
  };

  const resetForm = () => {
    setEditingId(null);
    reset({
      name: '',
      slug: '',
      description: '',
      image_url: '',
      sort_order: mainCategories.length + 1,
      is_active: true,
      supports_blouse_option: true,
      supports_petticoat_option: true,
      supports_customisation: true,
      supports_gift_options: true,
    });
  };

  const onSubmit = async (values) => {
    setMsg('');
    setErr('');
    const payload = { ...values, parent_id: null };
    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, payload);
        setMsg(`Updated main category "${values.name}".`);
      } else {
        await api.post('/categories', payload);
        setMsg(`Created new main category "${values.name}".`);
      }
      resetForm();
      loadCategories();
    } catch (submitErr) {
      setErr(submitErr.response?.data?.message || 'Unable to save category.');
    }
  };

  const handleDelete = async (cat) => {
    setMsg('');
    setErr('');
    try {
      await api.delete(`/categories/${cat.id}`);
      setMsg(`Deleted main category "${cat.name}".`);
      if (editingId === cat.id) resetForm();
      loadCategories();
    } catch (delErr) {
      setErr(delErr.response?.data?.message || 'Unable to delete category.');
    }
  };

  const columns = [
    { header: 'Order', accessorKey: 'sort_order' },
    {
      header: 'Main Category',
      accessorFn: (row) => row.name,
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          {row.original.image_url ? (
            <img src={row.original.image_url} alt={row.original.name} className="h-9 w-7 rounded object-cover" />
          ) : (
            <div className="flex h-9 w-7 items-center justify-center rounded bg-[#F5E7E8] text-[#641B32]">
              <FolderTree className="h-3.5 w-3.5" />
            </div>
          )}
          <div>
            <p className="font-semibold text-[#3D1023]">{row.original.name}</p>
            <p className="text-[11px] text-[#A83F5E]">/{row.original.slug}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Subcategories',
      accessorFn: (row) => (row.children || []).length,
    },
    {
      header: 'Sarees',
      accessorFn: (row) => Number(row.product_count || 0),
    },
    {
      header: 'Status',
      accessorFn: (row) => (row.is_active ? 'Active' : 'Hidden'),
      cell: ({ row }) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            row.original.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'
          }`}
        >
          {row.original.is_active ? 'Active' : 'Hidden'}
        </span>
      ),
    },
    {
      header: 'Super Admin Actions',
      cell: ({ row }) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => navigate(`/admin/subcategories?parent=${row.original.id}`)}
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#D9A0A9] px-2 py-1 text-[11px] font-semibold text-[#641B32] hover:bg-[#F5E7E8]"
          >
            <Layers className="h-3 w-3" /> Subcategories
          </button>
          <button
            type="button"
            onClick={() => startEdit(row.original)}
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#641B32]/40 px-2 py-1 text-[11px] font-semibold text-[#641B32] hover:bg-[#F5E7E8]"
          >
            <Pencil className="h-3 w-3" /> Edit
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row.original)}
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3" /> Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#3D1023] px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-[#C39A52]">
            <ShieldAlert className="h-3.5 w-3.5" /> Super Admin Exclusive Panel
          </span>
          <h1 className="mt-2 font-serif text-2xl font-bold text-[#3D1023]">
            Main Saree &amp; Jewellery Categories
          </h1>
          <p className="text-xs text-[#641B32]/80">
            Create, reorder, or configure top-level saree weaves and capsule collections (Client / Super Admin only).
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outlined" color="primary" onClick={() => navigate('/admin/subcategories')}>
            Manage Subcategories
          </Button>
          <Button variant="contained" color="primary" onClick={() => navigate('/admin/products')}>
            Manage Products
          </Button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-[#A83F5E]">Main Categories</p>
          <p className="mt-1 text-2xl font-bold text-[#3D1023]">{mainCategories.length}</p>
        </div>
        <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-[#A83F5E]">Subcategories</p>
          <p className="mt-1 text-2xl font-bold text-[#3D1023]">{totalSubcategories}</p>
        </div>
        <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-[#A83F5E]">Total Mapped Products</p>
          <p className="mt-1 text-2xl font-bold text-[#3D1023]">{totalProducts}</p>
        </div>
      </div>

      {msg && <Alert severity="success">{msg}</Alert>}
      {err && <Alert severity="error">{err}</Alert>}

      {/* Create / Edit Main Category Form */}
      <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-bold text-[#3D1023]">
            <PlusCircle className="h-4 w-4 text-[#641B32]" />
            {editingId ? 'Edit Main Category' : 'Add New Main Category'}
          </h2>
          {editingId && (
            <Button size="small" variant="text" color="secondary" onClick={resetForm}>
              Cancel Edit
            </Button>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                label="Main Category Name"
                onChange={(e) => {
                  field.onChange(e);
                  if (!editingId) setValue('slug', slugify(e.target.value));
                }}
                error={Boolean(errors.name)}
                helperText={errors.name?.message}
              />
            )}
          />
          <Controller
            name="slug"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                label="URL Slug"
                error={Boolean(errors.slug)}
                helperText={errors.slug?.message || `e.g. ${slugify(watchedName || 'silk-sarees')}`}
              />
            )}
          />
          <Controller
            name="sort_order"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                type="number"
                label="Display Order"
                error={Boolean(errors.sort_order)}
                helperText={errors.sort_order?.message}
              />
            )}
          />

          <div className="flex items-center gap-2 sm:col-span-2">
            <Controller
              name="image_url"
              control={control}
              render={({ field }) => (
                <TextField {...field} size="small" fullWidth label="Category Cover Image URL" />
              )}
            />
            <label className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-[#641B32] px-3 py-2 text-xs font-semibold text-[#641B32] hover:bg-[#F5E7E8]">
              <Upload className="h-4 w-4" /> Upload
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            {watchedImage && (
              <img src={watchedImage} alt="Preview" className="h-10 w-8 rounded border object-cover" />
            )}
          </div>

          <Controller
            name="is_active"
            control={control}
            render={({ field }) => (
              <TextField
                select
                size="small"
                label="Visibility"
                value={field.value ? 'active' : 'hidden'}
                onChange={(e) => field.onChange(e.target.value === 'active')}
              >
                <MenuItem value="active">Active (Visible on Storefront)</MenuItem>
                <MenuItem value="hidden">Hidden (Draft)</MenuItem>
              </TextField>
            )}
          />

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                multiline
                rows={2}
                label="Category Description"
                className="sm:col-span-3"
              />
            )}
          />

          <div className="flex flex-wrap gap-3 sm:col-span-3">
            <Controller
              name="supports_blouse_option"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox size="small" checked={Boolean(field.value)} onChange={(e) => field.onChange(e.target.checked)} />}
                  label={<span className="text-xs">Custom Blouse Option</span>}
                />
              )}
            />
            <Controller
              name="supports_petticoat_option"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox size="small" checked={Boolean(field.value)} onChange={(e) => field.onChange(e.target.checked)} />}
                  label={<span className="text-xs">Matching Petticoat Option</span>}
                />
              )}
            />
            <Controller
              name="supports_customisation"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox size="small" checked={Boolean(field.value)} onChange={(e) => field.onChange(e.target.checked)} />}
                  label={<span className="text-xs">Fall-Pico &amp; Customisation</span>}
                />
              )}
            />
            <Controller
              name="supports_gift_options"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox size="small" checked={Boolean(field.value)} onChange={(e) => field.onChange(e.target.checked)} />}
                  label={<span className="text-xs">Gift Wrap &amp; Box Options</span>}
                />
              )}
            />
          </div>

          <div className="sm:col-span-3">
            <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
              {editingId ? 'Save Category Changes' : 'Create Main Category'}
            </Button>
          </div>
        </form>
      </div>

      <DataTable data={mainCategories} columns={columns} searchPlaceholder="Search main categories..." />
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Alert, Button, MenuItem, TextField } from '@mui/material';
import { Layers, Pencil, PlusCircle, ShieldAlert, ShoppingBag, Trash2 } from 'lucide-react';
import api from '../../services/api';
import DataTable from '../../components/DataTable';

const subcategorySchema = yup.object({
  parent_id: yup.number().typeError('Select a parent main category').positive().required('Parent main category is required'),
  name: yup.string().trim().min(2, 'Enter at least 2 characters').max(120).required('Subcategory name is required'),
  slug: yup
    .string()
    .trim()
    .lowercase()
    .matches(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and hyphens only')
    .required('Slug is required'),
  sort_order: yup.number().typeError('Enter valid number').integer().default(1),
  description: yup.string().nullable(),
  is_active: yup.boolean().default(true),
});

const slugify = (val) =>
  String(val || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export default function AdminSubcategoriesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const parentFilter = searchParams.get('parent') || '';

  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(subcategorySchema),
    defaultValues: {
      parent_id: parentFilter ? Number(parentFilter) : '',
      name: '',
      slug: '',
      sort_order: 1,
      description: '',
      is_active: true,
    },
  });

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
            'Backend MySQL connection is not active yet. Start MySQL and run migrations/seeders to manage live subcategories.'
        );
      });
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const mainCategories = useMemo(() => categories.filter((c) => !c.parent_id), [categories]);
  const subcategories = useMemo(() => {
    const subs = categories.filter((c) => Boolean(c.parent_id));
    if (!parentFilter) return subs;
    return subs.filter((s) => String(s.parent_id) === String(parentFilter));
  }, [categories, parentFilter]);

  const startEdit = (sub) => {
    setEditingId(sub.id);
    reset({
      parent_id: Number(sub.parent_id),
      name: sub.name,
      slug: sub.slug,
      sort_order: Number(sub.sort_order || 1),
      description: sub.description || '',
      is_active: Boolean(sub.is_active),
    });
    setMsg('');
    setErr('');
  };

  const resetForm = () => {
    setEditingId(null);
    reset({
      parent_id: parentFilter ? Number(parentFilter) : '',
      name: '',
      slug: '',
      sort_order: subcategories.length + 1,
      description: '',
      is_active: true,
    });
  };

  const onSubmit = async (values) => {
    setMsg('');
    setErr('');
    const parentCat = mainCategories.find((m) => Number(m.id) === Number(values.parent_id));
    const payload = {
      ...values,
      parent_id: Number(values.parent_id),
      supports_blouse_option: parentCat ? Boolean(parentCat.supports_blouse_option) : true,
      supports_petticoat_option: parentCat ? Boolean(parentCat.supports_petticoat_option) : true,
      supports_customisation: parentCat ? Boolean(parentCat.supports_customisation) : true,
      supports_gift_options: parentCat ? Boolean(parentCat.supports_gift_options) : true,
    };

    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, payload);
        setMsg(`Updated subcategory "${values.name}".`);
      } else {
        await api.post('/categories', payload);
        setMsg(`Created subcategory "${values.name}" under ${parentCat?.name || 'main category'}.`);
      }
      resetForm();
      loadCategories();
    } catch (submitErr) {
      setErr(submitErr.response?.data?.message || 'Unable to save subcategory.');
    }
  };

  const handleDelete = async (sub) => {
    setMsg('');
    setErr('');
    try {
      await api.delete(`/categories/${sub.id}`);
      setMsg(`Deleted subcategory "${sub.name}".`);
      if (editingId === sub.id) resetForm();
      loadCategories();
    } catch (delErr) {
      setErr(delErr.response?.data?.message || 'Unable to delete subcategory.');
    }
  };

  const columns = [
    { header: 'Order', accessorKey: 'sort_order' },
    {
      header: 'Subcategory',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-[#3D1023]">{row.original.name}</p>
          <p className="text-[11px] text-[#A83F5E]">/{row.original.slug}</p>
        </div>
      ),
    },
    {
      header: 'Parent Main Category',
      accessorFn: (row) => row.parent?.name || '—',
      cell: ({ row }) => (
        <span className="rounded-full bg-[#F5E7E8] px-2.5 py-1 text-xs font-semibold text-[#641B32]">
          {row.original.parent?.name || '—'}
        </span>
      ),
    },
    {
      header: 'Products',
      accessorFn: (row) => Number(row.direct_product_count || 0),
    },
    {
      header: 'Status',
      accessorFn: (row) => (row.is_active ? 'Active' : 'Hidden'),
    },
    {
      header: 'Super Admin Actions',
      cell: ({ row }) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => navigate(`/admin/products?category=${row.original.id}`)}
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#D9A0A9] px-2 py-1 text-[11px] font-semibold text-[#641B32] hover:bg-[#F5E7E8]"
          >
            <ShoppingBag className="h-3 w-3" /> Add Saree
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
            Saree Subcategories
          </h1>
          <p className="text-xs text-[#641B32]/80">
            Organize weave subcategories under Main Categories (e.g. Pure Banarasi Silk under Banarasi Sarees).
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outlined" color="primary" onClick={() => navigate('/admin/categories')}>
            Back to Main Categories
          </Button>
          <Button variant="contained" color="primary" onClick={() => navigate('/admin/products')}>
            Manage Products
          </Button>
        </div>
      </div>

      {/* Filter pills by Main Category */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSearchParams({})}
          className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
            !parentFilter ? 'bg-[#641B32] text-[#FFF9F2]' : 'border border-[#D9A0A9] bg-white text-[#641B32]'
          }`}
        >
          All Main Categories
        </button>
        {mainCategories.map((main) => (
          <button
            key={main.id}
            type="button"
            onClick={() => setSearchParams({ parent: String(main.id) })}
            className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              String(parentFilter) === String(main.id)
                ? 'bg-[#641B32] text-[#FFF9F2]'
                : 'border border-[#D9A0A9] bg-white text-[#641B32] hover:bg-[#F5E7E8]'
            }`}
          >
            {main.name}
          </button>
        ))}
      </div>

      {msg && <Alert severity="success">{msg}</Alert>}
      {err && <Alert severity="error">{err}</Alert>}

      {/* Create / Edit Subcategory Form */}
      <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-bold text-[#3D1023]">
            {editingId ? <Layers className="h-4 w-4 text-[#641B32]" /> : <PlusCircle className="h-4 w-4 text-[#641B32]" />}
            {editingId ? 'Edit Subcategory' : 'Add New Subcategory'}
          </h2>
          {editingId && (
            <Button size="small" variant="text" color="secondary" onClick={resetForm}>
              Cancel Edit
            </Button>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Controller
            name="parent_id"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                size="small"
                label="Parent Main Category"
                error={Boolean(errors.parent_id)}
                helperText={errors.parent_id?.message}
              >
                {mainCategories.map((main) => (
                  <MenuItem key={main.id} value={main.id}>
                    {main.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                label="Subcategory Name"
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
                helperText={errors.slug?.message}
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
                label="Sort Order"
                error={Boolean(errors.sort_order)}
                helperText={errors.sort_order?.message}
              />
            )}
          />

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
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="hidden">Hidden</MenuItem>
              </TextField>
            )}
          />

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField {...field} size="small" label="Description (Fabric / Weave Summary)" />
            )}
          />

          <div className="sm:col-span-3">
            <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
              {editingId ? 'Save Subcategory Changes' : 'Create Subcategory'}
            </Button>
          </div>
        </form>
      </div>

      <DataTable data={subcategories} columns={columns} searchPlaceholder="Search subcategories..." />
    </div>
  );
}

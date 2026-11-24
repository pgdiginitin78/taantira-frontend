import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { TextField, Button, MenuItem, Alert } from '@mui/material';
import { Camera, ExternalLink, Pencil, PlusCircle, ShieldAlert, Trash2, Upload } from 'lucide-react';
import api from '../../services/api';
import DataTable from '../../components/DataTable';
import { formatINR } from '../../utils/formatters';
import { REQUIRED_IMAGE_ANGLES } from '../../data/sareeCatalogueData';

const productStudioSchema = yup.object({
  name: yup.string().trim().min(3, 'Minimum 3 characters').max(200).required('Product name is required'),
  slug: yup
    .string()
    .trim()
    .lowercase()
    .matches(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and hyphens only')
    .required('URL slug is required'),
  sku: yup.string().trim().min(3).max(80).required('SKU is required'),
  primary_category_id: yup.number().typeError('Select a subcategory or jewellery category').positive().required('Category / Subcategory is required'),
  base_price: yup.number().typeError('Enter valid price').positive('Price must be positive').required('Base price is required'),
  sale_price: yup
    .number()
    .transform((v, orig) => (orig === '' || orig === null ? null : v))
    .positive()
    .nullable(),
  fabric: yup.string().trim().required('Fabric is required'),
  occasion: yup.string().trim().default('Handloom & Festive'),
  description: yup.string().trim().min(5, 'Enter short product description').required('Description is required'),
  variant_sku: yup.string().trim().required('Variant SKU is required'),
  variant_size: yup.string().trim().default('Free Size'),
  variant_stock_qty: yup.number().typeError('Enter stock qty').integer().min(0).default(12),
});

const slugify = (val) =>
  String(val || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const emptyAngleState = () =>
  REQUIRED_IMAGE_ANGLES.map((angle, idx) => ({
    angle_key: angle.key,
    label: angle.label,
    desc: angle.desc,
    sort_order: idx + 1,
    image_url: '',
  }));

export default function AdminProductsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetCatId = searchParams.get('category') || '';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedMainId, setSelectedMainId] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [angleSlots, setAngleSlots] = useState(emptyAngleState);
  const [uploadingSlot, setUploadingSlot] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(productStudioSchema),
    defaultValues: {
      name: '',
      slug: '',
      sku: '',
      primary_category_id: presetCatId ? Number(presetCatId) : '',
      base_price: '',
      sale_price: '',
      fabric: 'Pure Silk',
      occasion: 'Handloom & Festive',
      description: '',
      variant_sku: '',
      variant_size: 'Free Size',
      variant_stock_qty: 12,
    },
  });

  const mainCategories = useMemo(() => categories.filter((c) => !c.parent_id), [categories]);
  const subcategoriesForSelectedMain = useMemo(() => {
    if (!selectedMainId) return categories.filter((c) => Boolean(c.parent_id) || c.slug === 'jewellery');
    const main = mainCategories.find((m) => String(m.id) === String(selectedMainId));
    if (main?.slug === 'jewellery') return [main];
    return categories.filter((c) => String(c.parent_id) === String(selectedMainId));
  }, [categories, mainCategories, selectedMainId]);

  const loadData = () => {
    api
      .get('/products', { params: { includeInactive: 'true', limit: 250 } })
      .then((res) => {
        setProducts(res.data?.data?.products || []);
        setErr('');
      })
      .catch((e) => {
        setErr(
          e.response?.data?.message ||
            'Backend MySQL connection is not active yet. Start MySQL and run migrations/seeders to manage products live.'
        );
      });
    api
      .get('/categories', { params: { includeInactive: 'true' } })
      .then((res) => {
        const cats = res.data?.data || [];
        setCategories(cats);
        if (presetCatId) {
          const found = cats.find((c) => String(c.id) === String(presetCatId));
          if (found) setSelectedMainId(String(found.parent_id || found.id));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAngleUpload = async (slotIndex, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingSlot(slotIndex);
    setErr('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
      const uploadedUrl = `${apiBase}${res.data.data.url}`;
      setAngleSlots((prev) =>
        prev.map((slot, idx) => (idx === slotIndex ? { ...slot, image_url: uploadedUrl } : slot))
      );
      setMsg(`Uploaded Angle ${slotIndex + 1} (${angleSlots[slotIndex].label}) to MySQL media store.`);
    } catch (uploadErr) {
      setErr(uploadErr.response?.data?.message || 'Upload failed.');
    } finally {
      setUploadingSlot(null);
    }
  };

  const setAngleUrl = (slotIndex, url) => {
    setAngleSlots((prev) =>
      prev.map((slot, idx) => (idx === slotIndex ? { ...slot, image_url: url } : slot))
    );
  };

  const resetForm = () => {
    setEditingId(null);
    setAngleSlots(emptyAngleState);
    reset({
      name: '',
      slug: '',
      sku: '',
      primary_category_id: '',
      base_price: '',
      sale_price: '',
      fabric: 'Pure Silk',
      occasion: 'Handloom & Festive',
      description: '',
      variant_sku: '',
      variant_size: 'Free Size',
      variant_stock_qty: 12,
    });
  };

  const startEdit = (prod) => {
    setEditingId(prod.id);
    const parentId = prod.primaryCategory?.parent?.id || prod.primaryCategory?.id || '';
    setSelectedMainId(String(parentId));

    const existingImages = Array.isArray(prod.images) ? prod.images : [];
    setAngleSlots(
      REQUIRED_IMAGE_ANGLES.map((angle, idx) => {
        const match = existingImages.find((img) => Number(img.sort_order) === idx + 1) || (idx === 0 ? existingImages[0] : null);
        return {
          angle_key: angle.key,
          label: angle.label,
          desc: angle.desc,
          sort_order: idx + 1,
          image_url: match?.image_url || '',
        };
      })
    );

    const primaryVariant = prod.variants?.[0] || {};
    reset({
      name: prod.name,
      slug: prod.slug,
      sku: prod.sku,
      primary_category_id: Number(prod.primary_category_id || prod.primaryCategory?.id || ''),
      base_price: Number(prod.base_price || ''),
      sale_price: prod.sale_price ? Number(prod.sale_price) : '',
      fabric: prod.fabric || 'Pure Silk',
      occasion: prod.occasion || 'Handloom & Festive',
      description: prod.description || '',
      variant_sku: primaryVariant.sku || `${prod.sku}-FS`,
      variant_size: primaryVariant.size || 'Free Size',
      variant_stock_qty: Number(primaryVariant.stock_qty ?? 12),
    });
    setMsg('');
    setErr('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSaveProduct = async (values) => {
    setMsg('');
    setErr('');

    const filledAngles = angleSlots
      .map((s) => ({
        angle_key: s.angle_key,
        sort_order: s.sort_order,
        image_url: String(s.image_url || '').trim(),
        alt_text: `${values.name} — ${s.label}`,
      }))
      .filter((s) => Boolean(s.image_url));

    // Enforce unique URLs across the 5 angles
    const uniqueCheck = new Set(filledAngles.map((a) => a.image_url));
    if (uniqueCheck.size !== filledAngles.length) {
      setErr('Each viewing angle must use a distinct photo URL (do not repeat the same photo).');
      return;
    }

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, {
          name: values.name,
          slug: values.slug,
          sku: values.sku,
          primary_category_id: Number(values.primary_category_id),
          base_price: Number(values.base_price),
          sale_price: values.sale_price ? Number(values.sale_price) : null,
          fabric: values.fabric,
          occasion: values.occasion,
          description: values.description,
          stock_qty: Number(values.variant_stock_qty),
          gallery_images: filledAngles,
        });
        setMsg(`Updated "${values.name}" with ${filledAngles.length}/5 viewing angles.`);
      } else {
        await api.post('/products', {
          name: values.name,
          slug: values.slug,
          sku: values.sku,
          primary_category_id: Number(values.primary_category_id),
          base_price: Number(values.base_price),
          sale_price: values.sale_price ? Number(values.sale_price) : null,
          fabric: values.fabric,
          occasion: values.occasion,
          description: values.description,
          gallery_images: filledAngles,
          variants: [
            {
              sku: values.variant_sku,
              size: values.variant_size,
              color_name: 'Signature Hue',
              color_hex: '#641B32',
              stock_qty: Number(values.variant_stock_qty),
            },
          ],
        });
        setMsg(`Created saree "${values.name}" (${filledAngles.length}/5 photos).`);
      }
      resetForm();
      loadData();
    } catch (e) {
      setErr(e.response?.data?.message || 'Unable to save product.');
    }
  };

  const handleDelete = async (prod) => {
    setMsg('');
    setErr('');
    try {
      const res = await api.delete(`/products/${prod.id}`);
      setMsg(res.data?.message || `Removed "${prod.name}".`);
      if (editingId === prod.id) resetForm();
      loadData();
    } catch (e) {
      setErr(e.response?.data?.message || 'Unable to delete product.');
    }
  };

  const columns = [
    { header: 'SKU', accessorKey: 'sku' },
    {
      header: 'Product Name',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div className="min-w-44">
          <p className="font-semibold text-[#3D1023]">{row.original.name}</p>
          <p className="text-[11px] text-[#A83F5E]">{row.original.fabric}</p>
        </div>
      ),
    },
    {
      header: 'Category / Subcategory',
      accessorFn: (row) => row.primaryCategory?.name || '—',
      cell: ({ row }) => (
        <div className="text-xs">
          <p className="font-semibold text-[#641B32]">
            {row.original.primaryCategory?.parent?.name || row.original.category || '—'}
          </p>
          <p className="text-[#3D1023]/75">{row.original.primaryCategory?.name || ''}</p>
        </div>
      ),
    },
    { header: 'Price', accessorFn: (row) => formatINR(row.sale_price || row.base_price) },
    {
      header: 'Stock',
      accessorFn: (row) => (row.variants || []).reduce((s, v) => s + Number(v.stock_qty || 0), 0),
    },
    {
      header: '5-Angle Photos',
      accessorFn: (row) => (row.images || []).length,
      cell: ({ row }) => {
        const count = (row.images || []).length;
        return (
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              count >= 5
                ? 'bg-emerald-100 text-emerald-800'
                : count > 0
                ? 'bg-amber-100 text-amber-800'
                : 'bg-[#F5E7E8] text-[#641B32]'
            }`}
          >
            {count}/5 {count === 0 ? 'Needed' : 'Uploaded'}
          </span>
        );
      },
    },
    {
      header: 'Super Admin Actions',
      cell: ({ row }) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => startEdit(row.original)}
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#641B32] px-2 py-1 text-[11px] font-semibold text-[#641B32] hover:bg-[#F5E7E8]"
          >
            <Pencil className="h-3 w-3" /> Edit / Photos
          </button>
          <a
            href={`/products/${row.original.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-[#D9A0A9] px-2 py-1 text-[11px] font-semibold text-[#641B32] hover:bg-[#F5E7E8]"
          >
            <ExternalLink className="h-3 w-3" /> View
          </a>
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
            Saree Catalogue &amp; 5-Angle Photography Studio
          </h1>
          <p className="text-xs text-[#641B32]/80">
            Create or edit sarees and jewellery, assign Main Category &amp; Subcategory, and upload distinct photos for all 5 viewing angles.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outlined" color="primary" onClick={() => navigate('/admin/categories')}>
            Main Categories
          </Button>
          <Button variant="outlined" color="primary" onClick={() => navigate('/admin/subcategories')}>
            Subcategories
          </Button>
        </div>
      </div>

      {msg && <Alert severity="success">{msg}</Alert>}
      {err && <Alert severity="error">{err}</Alert>}

      <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-bold text-[#3D1023]">
            <PlusCircle className="h-4 w-4 text-[#641B32]" />
            {editingId ? 'Edit Saree & Upload 5-Angle Photos' : 'Add New Saree / Jewellery Product'}
          </h2>
          {editingId && (
            <Button size="small" variant="text" color="secondary" onClick={resetForm}>
              Cancel Edit
            </Button>
          )}
        </div>

        <form onSubmit={handleSubmit(onSaveProduct)} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextField
            select
            size="small"
            label="1. Select Main Category"
            value={selectedMainId}
            onChange={(e) => {
              setSelectedMainId(e.target.value);
              setValue('primary_category_id', '');
            }}
          >
            <MenuItem value="">All Main Categories</MenuItem>
            {mainCategories.map((m) => (
              <MenuItem key={m.id} value={String(m.id)}>
                {m.name}
              </MenuItem>
            ))}
          </TextField>

          <Controller
            name="primary_category_id"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                size="small"
                label="2. Select Subcategory / Category"
                error={Boolean(errors.primary_category_id)}
                helperText={errors.primary_category_id?.message}
              >
                {subcategoriesForSelectedMain.map((sub) => (
                  <MenuItem key={sub.id} value={sub.id}>
                    {sub.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <Controller
            name="fabric"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                label="Fabric (e.g. Pure Silk, Organza)"
                error={Boolean(errors.fabric)}
                helperText={errors.fabric?.message}
              />
            )}
          />

          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                label="Product Name"
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
            name="sku"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                label="SKU"
                onChange={(e) => {
                  field.onChange(e);
                  if (!editingId && e.target.value) setValue('variant_sku', `${e.target.value}-FS`);
                }}
                error={Boolean(errors.sku)}
                helperText={errors.sku?.message}
              />
            )}
          />

          <Controller
            name="base_price"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                label="Base Price (INR)"
                error={Boolean(errors.base_price)}
                helperText={errors.base_price?.message}
              />
            )}
          />

          <Controller
            name="sale_price"
            control={control}
            render={({ field }) => (
              <TextField {...field} size="small" label="Sale Price (Optional)" />
            )}
          />

          <Controller
            name="variant_stock_qty"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                type="number"
                label="Stock Quantity"
                error={Boolean(errors.variant_stock_qty)}
                helperText={errors.variant_stock_qty?.message}
              />
            )}
          />

          <Controller
            name="variant_sku"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                label="Primary Variant SKU"
                disabled={Boolean(editingId)}
                error={Boolean(errors.variant_sku)}
                helperText={errors.variant_sku?.message}
              />
            )}
          />

          <Controller
            name="variant_size"
            control={control}
            render={({ field }) => (
              <TextField {...field} size="small" label="Drape Length / Size" disabled={Boolean(editingId)} />
            )}
          />

          <Controller
            name="occasion"
            control={control}
            render={({ field }) => (
              <TextField {...field} size="small" label="Occasion / Edit" />
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
                label="Description"
                className="sm:col-span-3"
                error={Boolean(errors.description)}
                helperText={errors.description?.message}
              />
            )}
          />

          {/* 5-Angle Photography Uploader Studio */}
          <div className="flex flex-col gap-3 rounded-xl border border-[#D9A0A9]/50 bg-[#FFF9F2] p-4 sm:col-span-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#641B32]">
                5-Angle Saree Photography Uploader (Distinct Photo Per Angle)
              </p>
              <p className="text-[11px] text-[#3D1023]/75">
                Upload all 5 views of the exact saree (Front, Back, Side/3-Quarter, Zari/Border Close-Up, Fabric/Weave Close-Up). Files are stored directly in MySQL MediaFile storage.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {angleSlots.map((slot, idx) => (
                <div
                  key={slot.angle_key}
                  className="flex flex-col justify-between gap-2 rounded-xl border border-[#D9A0A9]/50 bg-white p-3"
                >
                  <div>
                    <p className="text-[11px] font-bold text-[#3D1023]">
                      {idx + 1}. {slot.label}
                    </p>
                    <div className="mt-2 aspect-[3/4] overflow-hidden rounded-lg bg-[#F5E7E8]">
                      {slot.image_url ? (
                        <img
                          src={slot.image_url}
                          alt={slot.label}
                          className="h-full w-full object-cover object-top"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center p-2 text-center text-[#A83F5E]">
                          <Camera className="h-5 w-5" />
                          <span className="mt-1 text-[10px] font-medium">Angle {idx + 1} Needed</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <TextField
                      size="small"
                      placeholder="Image URL"
                      value={slot.image_url}
                      onChange={(e) => setAngleUrl(idx, e.target.value)}
                    />
                    <label className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-lg border border-[#641B32] px-2 py-1.5 text-[11px] font-semibold text-[#641B32] hover:bg-[#F5E7E8]">
                      <Upload className="h-3.5 w-3.5" />
                      {uploadingSlot === idx ? 'Uploading...' : 'Upload Photo'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => handleAngleUpload(idx, e)}
                        className="hidden"
                        disabled={uploadingSlot !== null}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 sm:col-span-3">
            <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
              {editingId ? 'Save Product & Angles' : 'Create Product'}
            </Button>
          </div>
        </form>
      </div>

      <DataTable
        data={products}
        columns={columns}
        searchPlaceholder="Search SKU, saree name, category, fabric..."
      />
    </div>
  );
}

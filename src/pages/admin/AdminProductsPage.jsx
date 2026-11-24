import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { TextField, Button, MenuItem, Alert } from "@mui/material";
import { Upload } from "lucide-react";
import api from "../../services/api";
import DataTable from "../../components/DataTable";
import { productValidationSchema } from "../../validations/schemas";
import { formatINR } from "../../utils/formatters";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [uploading, setUploading] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(productValidationSchema),
    defaultValues: {
      name: "",
      slug: "",
      sku: "",
      primary_category_id: "",
      base_price: "",
      sale_price: "",
      fabric: "",
      occasion: "",
      description: "",
      image_url: "/assets/products/saree-burgundy.jpg",
      variant_sku: "",
      variant_size: "M",
      variant_color_name: "Deep Burgundy",
      variant_color_hex: "#641B32",
      variant_stock_qty: 10,
    },
  });

  const loadData = () => {
    api
      .get("/products", { params: { includeInactive: "true", limit: 48 } })
      .then((res) => setProducts(res.data?.data?.products || []))
      .catch(() => {});
    api
      .get("/categories")
      .then((res) => setCategories(res.data?.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBinaryUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErr("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const apiBase = (
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
      ).replace(/\/api$/, "");
      setValue("image_url", `${apiBase}${res.data.data.url}`);
      setMsg("Image uploaded to MySQL media storage.");
    } catch (uploadErr) {
      setErr(uploadErr.response?.data?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const onCreateProduct = async (values) => {
    setMsg("");
    setErr("");
    try {
      await api.post("/products", {
        name: values.name,
        slug: values.slug,
        sku: values.sku,
        primary_category_id: Number(values.primary_category_id),
        base_price: Number(values.base_price),
        sale_price: values.sale_price ? Number(values.sale_price) : null,
        fabric: values.fabric,
        occasion: values.occasion,
        description: values.description,
        image_url: values.image_url,
        variants: [
          {
            sku: values.variant_sku,
            size: values.variant_size,
            color_name: values.variant_color_name,
            color_hex: values.variant_color_hex,
            stock_qty: Number(values.variant_stock_qty),
          },
        ],
      });
      setMsg("Product & initial variant created.");
      reset();
      loadData();
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to create product.");
    }
  };

  const columns = [
    { header: "SKU", accessorKey: "sku" },
    { header: "Product Name", accessorKey: "name" },
    {
      header: "Category",
      accessorFn: (row) => row.primaryCategory?.name || "—",
    },
    { header: "Base Price", accessorFn: (row) => formatINR(row.base_price) },
    {
      header: "Sale Price",
      accessorFn: (row) => (row.sale_price ? formatINR(row.sale_price) : "—"),
    },
    {
      header: "Total Stock",
      accessorFn: (row) =>
        (row.variants || []).reduce((s, v) => s + Number(v.stock_qty || 0), 0),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold text-[#3D1023]">
        Catalogue &amp; Product Management
      </h1>
      {msg && <Alert severity="success">{msg}</Alert>}
      {err && <Alert severity="error">{err}</Alert>}

      <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-[#3D1023]">
          Create New Garment
        </h2>
        <form
          onSubmit={handleSubmit(onCreateProduct)}
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                label="Product Name"
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
                error={Boolean(errors.sku)}
                helperText={errors.sku?.message}
              />
            )}
          />
          <Controller
            name="primary_category_id"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                size="small"
                label="Category"
                error={Boolean(errors.primary_category_id)}
                helperText={errors.primary_category_id?.message}
              >
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
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
              <TextField
                {...field}
                size="small"
                label="Sale Price (Optional)"
              />
            )}
          />
          <Controller
            name="fabric"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                label="Fabric"
                error={Boolean(errors.fabric)}
                helperText={errors.fabric?.message}
              />
            )}
          />
          <Controller
            name="occasion"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                label="Occasion"
                error={Boolean(errors.occasion)}
                helperText={errors.occasion?.message}
              />
            )}
          />
          <div className="flex items-center gap-2">
            <Controller
              name="image_url"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  size="small"
                  fullWidth
                  label="Image Path / Binary URL"
                />
              )}
            />
            <label className="cursor-pointer rounded-lg border border-[#641B32] px-3 py-2 text-xs font-semibold text-[#641B32] hover:bg-[#F5E7E8]">
              <Upload className="h-4 w-4" />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleBinaryUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
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
          <Controller
            name="variant_sku"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                label="Initial Variant SKU"
                error={Boolean(errors.variant_sku)}
                helperText={errors.variant_sku?.message}
              />
            )}
          />
          <Controller
            name="variant_size"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                label="Size (e.g. M, Free Size)"
                error={Boolean(errors.variant_size)}
                helperText={errors.variant_size?.message}
              />
            )}
          />
          <Controller
            name="variant_color_name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                label="Color Name"
                error={Boolean(errors.variant_color_name)}
                helperText={errors.variant_color_name?.message}
              />
            )}
          />
          <Controller
            name="variant_color_hex"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                label="Color Hex (#641B32)"
                error={Boolean(errors.variant_color_hex)}
                helperText={errors.variant_color_hex?.message}
              />
            )}
          />
          <Controller
            name="variant_stock_qty"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                label="Opening Stock Qty"
                error={Boolean(errors.variant_stock_qty)}
                helperText={errors.variant_stock_qty?.message}
              />
            )}
          />
          <div className="flex items-center">
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting}
            >
              Create Product
            </Button>
          </div>
        </form>
      </div>

      <DataTable
        data={products}
        columns={columns}
        searchPlaceholder="Search SKU, garment, fabric..."
      />
    </div>
  );
}

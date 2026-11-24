import {
  MAIN_CATEGORIES,
  JEWELLERY_CATEGORY,
  MATCHING_JEWELLERY_BY_MAIN,
  REQUIRED_IMAGE_ANGLES,
} from '../data/sareeCatalogueData';

export const buildGalleryAngles = (product) => {
  const images = Array.isArray(product?.images) ? product.images : [];
  const mainSlug = product?.primaryCategory?.parent?.slug || product?.primaryCategory?.slug || '';

  if (mainSlug === 'jewellery') {
    if (images.length === 0) {
      return [
        {
          angleNumber: 1,
          key: 'front',
          label: 'Primary View',
          desc: 'Product studio photography',
          status: 'image-needed',
          image_url: null,
        },
      ];
    }
    return images.map((img, index) => ({
      angleNumber: index + 1,
      key: `view-${index + 1}`,
      label: index === 0 ? 'Primary View' : `View ${index + 1}`,
      desc: img.alt_text || product.name,
      status: 'available',
      image_url: img.image_url,
      alt_text: img.alt_text || product.name,
    }));
  }

  return REQUIRED_IMAGE_ANGLES.map((angle, index) => {
    const matched =
      images.find((img) => img.angle_key === angle.key || img.sort_order === index + 1) ||
      (index === 0 && images[0]?.image_url ? images[0] : null);

    return {
      angleNumber: index + 1,
      key: angle.key,
      label: angle.label,
      desc: angle.desc,
      status: matched?.image_url ? 'available' : 'image-needed',
      image_url: matched?.image_url || null,
      alt_text: matched?.alt_text || `${product?.name || 'Saree'} — ${angle.label}`,
    };
  });
};

export const getMatchingJewellery = (mainCategorySlug) =>
  MATCHING_JEWELLERY_BY_MAIN[mainCategorySlug] || MATCHING_JEWELLERY_BY_MAIN['banarasi-sarees'] || [];

const builtCategories = [];
const builtSubcategories = [];
const builtProducts = [];

let categoryIdSeq = 1;
let productIdSeq = 1;

MAIN_CATEGORIES.forEach((main) => {
  const mainId = categoryIdSeq++;
  const mainCatObj = {
    id: mainId,
    name: main.name,
    slug: main.slug,
    description: main.description,
    image_url: main.image_url,
    parent_id: null,
    sort_order: main.sort_order,
    supports_blouse_option: true,
    supports_petticoat_option: true,
    supports_customisation: true,
    supports_gift_options: true,
    children: [],
  };

  main.subcategories.forEach((sub, subIdx) => {
    const subId = categoryIdSeq++;
    const subCatObj = {
      id: subId,
      name: sub.name,
      slug: sub.slug,
      fabric: sub.fabric,
      parent_id: mainId,
      sort_order: subIdx + 1,
      supports_blouse_option: true,
      supports_petticoat_option: true,
      supports_customisation: true,
      supports_gift_options: true,
      parent: {
        id: mainId,
        name: main.name,
        slug: main.slug,
        sort_order: main.sort_order,
      },
    };
    mainCatObj.children.push(subCatObj);
    builtSubcategories.push(subCatObj);

    sub.products.forEach((prod) => {
      const prodId = productIdSeq++;
      const images = prod.image_url
        ? [
            {
              id: prodId,
              image_url: prod.image_url,
              alt_text: `${prod.name} — Main Front View`,
              angle_key: 'front',
              is_primary: true,
              sort_order: 1,
            },
          ]
        : [];

      const record = {
        id: prodId,
        name: prod.name,
        slug: prod.slug,
        sku: prod.sku,
        category: main.name,
        subcategory: sub.name,
        fabric: sub.fabric,
        base_price: prod.price,
        sale_price: prod.sale_price,
        is_featured: Boolean(prod.is_featured),
        is_new_arrival: Boolean(prod.is_new_arrival),
        is_best_seller: Boolean(prod.is_best_seller),
        is_trending: Boolean(prod.is_featured || prod.is_best_seller),
        is_nauvari: main.slug === 'nauvari-sarees',
        length_width: prod.length_width || null,
        wash_care: prod.wash_care || null,
        short_description: `${main.name} · ${sub.name} in ${sub.fabric}.`,
        description: `${prod.name} from Taantira's ${main.name} (${sub.name}) collection, crafted in ${sub.fabric}.`,
        primaryCategory: subCatObj,
        images,
        gallery_angles: [],
        matching_jewellery: getMatchingJewellery(main.slug),
        variants: [
          {
            id: prodId,
            sku: `${prod.sku}-FS`,
            size: main.slug === 'nauvari-sarees' ? '9 Yards (Nauvari)' : 'Free Size',
            stock_qty: 12,
            reserved_qty: 0,
          },
        ],
      };
      record.gallery_angles = buildGalleryAngles(record);
      builtProducts.push(record);
    });
  });

  builtCategories.push(mainCatObj);
});

const jewelleryId = categoryIdSeq++;
const jewelleryCatObj = {
  id: jewelleryId,
  name: JEWELLERY_CATEGORY.name,
  slug: JEWELLERY_CATEGORY.slug,
  description: JEWELLERY_CATEGORY.description,
  image_url: JEWELLERY_CATEGORY.image_url,
  parent_id: null,
  sort_order: JEWELLERY_CATEGORY.sort_order,
  supports_blouse_option: false,
  supports_petticoat_option: false,
  supports_customisation: false,
  supports_gift_options: true,
  children: [],
};
builtCategories.push(jewelleryCatObj);

const jProd = JEWELLERY_CATEGORY.product;
const jProdId = productIdSeq++;
const jewelleryProductRecord = {
  id: jProdId,
  name: jProd.name,
  slug: jProd.slug,
  sku: jProd.sku,
  category: JEWELLERY_CATEGORY.name,
  subcategory: JEWELLERY_CATEGORY.name,
  fabric: jProd.fabric,
  base_price: jProd.price,
  sale_price: jProd.sale_price,
  is_featured: true,
  is_new_arrival: true,
  is_best_seller: true,
  is_trending: true,
  is_nauvari: false,
  short_description: 'Heirloom saree jewellery curated to pair with Taantira handloom sarees.',
  description: `${jProd.name} crafted in ${jProd.fabric} to complement Banarasi, Organza, Jamdani, and festive saree drapes.`,
  primaryCategory: jewelleryCatObj,
  images: [
    {
      id: jProdId,
      image_url: jProd.image_url,
      alt_text: `${jProd.name} — Primary View`,
      angle_key: 'front',
      is_primary: true,
      sort_order: 1,
    },
  ],
  variants: [
    {
      id: jProdId,
      sku: `${jProd.sku}-OS`,
      size: 'One Size',
      stock_qty: 20,
      reserved_qty: 0,
    },
  ],
};
jewelleryProductRecord.gallery_angles = buildGalleryAngles(jewelleryProductRecord);
builtProducts.push(jewelleryProductRecord);

export const FALLBACK_MAIN_CATEGORIES = builtCategories.filter((c) => c.slug !== 'jewellery');
export const FALLBACK_CATEGORIES = builtCategories;
export const FALLBACK_SUBCATEGORIES = builtSubcategories;
export const FALLBACK_PRODUCTS = builtProducts;

export const FALLBACK_COLLECTIONS = [
  { id: 1, name: 'All Sarees', slug: 'sarees', subtitle: 'Explore all 7 main handloom & heritage saree weaves (210 sarees)', banner_image_url: '/assets/banners/hero-festive.jpg' },
  { id: 2, name: 'Nauvari / 9 Vaari Sarees', slug: 'nauvari-sarees', subtitle: 'Traditional Paithani, Brahmani, Peshwai, Koli, Kashta & Ready-to-Wear nine-yard sarees', banner_image_url: '/assets/banners/hero-festive.jpg' },
  { id: 3, name: 'Festive Saree Edit', slug: 'festive-collections', subtitle: 'Curated celebratory sarees woven across India', banner_image_url: '/assets/banners/hero-festive.jpg' },
  { id: 4, name: 'New Arrivals', slug: 'new-arrivals', subtitle: 'Newly catalogued Taantira heirloom sarees', banner_image_url: '/assets/banners/hero-festive.jpg' },
  { id: 5, name: 'Best Sellers', slug: 'best-sellers', subtitle: 'Most loved handwoven sarees by Taantira patrons', banner_image_url: '/assets/banners/hero-festive.jpg' },
  { id: 6, name: 'Saree Jewellery', slug: 'jewellery', subtitle: 'Heirloom saree jewellery curated to complement every drape', banner_image_url: '/assets/banners/hero-festive.jpg' },
];

export const getFallbackFacets = () => ({
  categories: FALLBACK_CATEGORIES.map((cat) => ({
    name: cat.name,
    slug: cat.slug,
    count: builtProducts.filter(
      (p) => (p.primaryCategory?.parent?.slug || p.primaryCategory?.slug) === cat.slug
    ).length,
  })),
  subcategories: FALLBACK_SUBCATEGORIES.map((sub) => ({
    name: sub.name,
    slug: sub.slug,
    parent_slug: sub.parent.slug,
    parent_name: sub.parent.name,
    fabric: sub.fabric,
    count: builtProducts.filter((p) => p.primaryCategory?.slug === sub.slug).length,
  })),
  fabrics: [...new Set(builtProducts.map((p) => p.fabric).filter(Boolean))].map((fabric) => ({
    name: fabric,
    count: builtProducts.filter((p) => p.fabric === fabric).length,
  })),
});

export const filterFallbackProducts = ({
  slug = 'sarees',
  categories = [],
  subcategories = [],
  fabrics = [],
  q = '',
  page = 1,
  limit = 24,
} = {}) => {
  const catList = Array.isArray(categories) ? categories.filter(Boolean) : [];
  const subList = Array.isArray(subcategories) ? subcategories.filter(Boolean) : [];
  const fabList = Array.isArray(fabrics) ? fabrics.filter(Boolean) : [];
  const query = String(q || '').trim().toLowerCase();

  let list = [...FALLBACK_PRODUCTS];

  // Route-level default scoping when explicit multi-select categories are empty
  if (slug && catList.length === 0 && subList.length === 0) {
    if (slug === 'sarees') {
      list = list.filter((p) => p.primaryCategory?.slug !== 'jewellery');
    } else if (slug === 'jewellery') {
      list = list.filter((p) => p.primaryCategory?.slug === 'jewellery');
    } else if (slug === 'new-arrivals') {
      list = list.filter((p) => p.is_new_arrival);
    } else if (slug === 'best-sellers') {
      list = list.filter((p) => p.is_best_seller);
    } else if (slug === 'festive-collections') {
      list = list.filter((p) => p.is_featured || p.is_best_seller || p.primaryCategory?.slug === 'jewellery');
    } else if (slug !== 'all') {
      const matchesSub = FALLBACK_SUBCATEGORIES.some((s) => s.slug === slug);
      const matchesMain = FALLBACK_CATEGORIES.some((c) => c.slug === slug);
      if (matchesSub) {
        list = list.filter((p) => p.primaryCategory?.slug === slug);
      } else if (matchesMain) {
        list = list.filter(
          (p) => (p.primaryCategory?.parent?.slug || p.primaryCategory?.slug) === slug
        );
      }
    }
  }

  if (catList.length > 0) {
    list = list.filter((p) => {
      const mainSlug = p.primaryCategory?.parent?.slug || p.primaryCategory?.slug;
      const subSlug = p.primaryCategory?.slug;
      return catList.includes(mainSlug) || catList.includes(subSlug);
    });
  }

  if (subList.length > 0) {
    list = list.filter((p) => subList.includes(p.primaryCategory?.slug));
  }

  if (fabList.length > 0) {
    list = list.filter((p) => fabList.includes(p.fabric));
  }

  if (query) {
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.category || '').toLowerCase().includes(query) ||
        (p.subcategory || '').toLowerCase().includes(query) ||
        (p.fabric || '').toLowerCase().includes(query)
    );
  }

  const total = list.length;
  const safeLimit = Math.max(1, Number(limit) || 24);
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const safePage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const start = (safePage - 1) * safeLimit;
  const products = list.slice(start, start + safeLimit);

  return {
    products,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages,
    },
    facets: getFallbackFacets(),
  };
};

export const buildFallbackHomepageData = () => {
  const sarees = FALLBACK_PRODUCTS.filter((p) => p.primaryCategory?.slug !== 'jewellery');
  const jewellery = FALLBACK_PRODUCTS.filter((p) => p.primaryCategory?.slug === 'jewellery');
  const nauvari = sarees.filter((p) => p.is_nauvari);
  const bestSellers = sarees.filter((p) => p.is_best_seller);
  const handwoven = sarees.filter((p) => Boolean(p.images?.length)).slice(0, 8);

  return {
    categories: FALLBACK_CATEGORIES,
    main_categories: FALLBACK_MAIN_CATEGORIES,
    collections: FALLBACK_COLLECTIONS,
    handwoven_sarees: handwoven,
    nauvari_sarees: nauvari.slice(0, 6),
    new_arrivals: sarees.filter((p) => p.is_new_arrival),
    best_sellers: bestSellers,
    trending_products: sarees.filter((p) => p.is_trending),
    jewellery_products: jewellery,
  };
};

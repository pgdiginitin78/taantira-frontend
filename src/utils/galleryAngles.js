export const REQUIRED_IMAGE_ANGLES = [
  { key: 'front', label: 'Main Front View', desc: 'Full-length model wearing the saree with blouse and draping visible' },
  { key: 'back', label: 'Back View', desc: 'Back draping showing complete pallu fall and consistent motifs' },
  { key: 'side', label: 'Side / Three-Quarter View', desc: 'Three-quarter silhouette showing natural pleats and fall' },
  { key: 'border', label: 'Zari / Border Close-Up', desc: 'Close-up of actual border embroidery, motifs, and zari work' },
  { key: 'weave', label: 'Fabric & Weave Close-Up', desc: 'Material texture, weave structure, and blouse piece detail' },
];

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

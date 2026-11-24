export const formatINR = (amount) => {
  const numeric = Number(amount || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(numeric);
};

export const formatDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateOnly = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const calcDiscountPercent = (basePrice, salePrice) => {
  const base = Number(basePrice || 0);
  const sale = Number(salePrice || 0);
  if (!sale || sale >= base || base <= 0) return 0;
  return Math.round(((base - sale) / base) * 100);
};

export const isLocationStale = (recordedAt, thresholdSeconds = 120) => {
  if (!recordedAt) return true;
  const diffSeconds = (Date.now() - new Date(recordedAt).getTime()) / 1000;
  return diffSeconds > thresholdSeconds;
};

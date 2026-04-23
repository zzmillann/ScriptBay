export const normalizeImageUrl = (url) => {
  const value = (url || '').trim();

  if (!value) {
    return '';
  }

  if (value.startsWith('data:') || value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  return `https://${value}`;
};

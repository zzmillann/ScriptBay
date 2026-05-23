const isBrowser = typeof window !== 'undefined';
const isLocalHost =
  isBrowser &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const fallbackOrigin = isLocalHost
  ? 'http://localhost:3000'
  : isBrowser
    ? window.location.origin
    : 'http://localhost:3000';

export const API_ORIGIN = import.meta.env.VITE_API_URL || fallbackOrigin;

export const apiUrl = (path = '') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_ORIGIN}${normalizedPath}`;
};

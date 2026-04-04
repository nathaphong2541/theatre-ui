import { environment } from 'src/environments/environment';

const base = environment.apiUrl.replace(/\/api\/?$/, '');

export const toFullUrl = (path?: string | null) => {
  if (!path) return null;

  const normalized = path.replace(/\\/g, '/');
  if (normalized.startsWith('http')) return normalized;

  return `${base}${normalized}`;
};

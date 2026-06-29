// In Docker: VITE_API_BASE=/api  → nginx proxies /api/* → backend container
// In local dev: falls back to http://localhost:5000/api
const BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:5000/api';

function getToken(): string | null {
  return localStorage.getItem('cr_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data as T;
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface College {
  _id: string;
  name: string;
  location: string;
  description?: string;
  website?: string;
  established?: number;
  createdBy?: { _id: string; name: string };
  createdAt: string;
  // aggregated
  avgRating?: number;
  reviewCount?: number;
}

export interface ReviewAuthor {
  _id: string;
  name: string;
  role: string;
}

export interface Review {
  _id: string;
  college: { _id: string; name: string; location: string } | string;
  author: ReviewAuthor | string;
  rating: number;
  title: string;
  body: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ListResponse<T> {
  success: boolean;
  data: T[];
  pagination: Pagination;
}

export interface SingleResponse<T> {
  success: boolean;
  data: T;
}

export interface UserSummary {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  createdAt: string;
}

// ── Colleges ───────────────────────────────────────────────────────────────

export const getColleges = () =>
  request<ListResponse<College>>('/colleges');

export const getCollege = (id: string) =>
  request<SingleResponse<College>>(`/colleges/${id}`);

export const createCollege = (body: Partial<College>) =>
  request<SingleResponse<College>>('/colleges', { method: 'POST', body: JSON.stringify(body) });

export const updateCollege = (id: string, body: Partial<College>) =>
  request<SingleResponse<College>>(`/colleges/${id}`, { method: 'PUT', body: JSON.stringify(body) });

export const deleteCollege = (id: string) =>
  request<{ success: boolean; message: string }>(`/colleges/${id}`, { method: 'DELETE' });

// ── Reviews ────────────────────────────────────────────────────────────────

export interface ReviewsQuery {
  page?: number;
  limit?: number;
  college?: string;
  rating?: number;
  search?: string;
}

export const getReviews = (q: ReviewsQuery = {}) => {
  const params = new URLSearchParams();
  if (q.page) params.set('page', String(q.page));
  if (q.limit) params.set('limit', String(q.limit));
  if (q.college) params.set('college', q.college);
  if (q.rating) params.set('rating', String(q.rating));
  if (q.search) params.set('search', q.search);
  const qs = params.toString();
  return request<ListResponse<Review>>(`/reviews${qs ? `?${qs}` : ''}`);
};

export const getReview = (id: string) =>
  request<SingleResponse<Review>>(`/reviews/${id}`);

export const createReview = (body: { college: string; rating: number; title: string; body: string }) =>
  request<SingleResponse<Review>>('/reviews', { method: 'POST', body: JSON.stringify(body) });

export const updateReview = (id: string, body: Partial<Review>) =>
  request<SingleResponse<Review>>(`/reviews/${id}`, { method: 'PUT', body: JSON.stringify(body) });

export const deleteReview = (id: string) =>
  request<{ success: boolean; message: string }>(`/reviews/${id}`, { method: 'DELETE' });

export interface DashboardStats {
  ratingDistribution: { name: string; value: number }[];
  reviewsOverTime: { month: string; reviews: number }[];
  avgRating: number | null;
  totalReviews: number;
}

export const getDashboardStats = () =>
  request<SingleResponse<DashboardStats>>('/reviews/stats/dashboard');

export const getUsers = () =>
  request<SingleResponse<UserSummary[]>>('/auth/users');

export const createUser = (body: { name: string; email: string; password: string; role: 'admin' | 'teacher' | 'student' }) =>
  request<SingleResponse<UserSummary>>('/auth/users', { method: 'POST', body: JSON.stringify(body) });

export const updateUser = (id: string, body: Partial<{ name: string; email: string; password: string; role: 'admin' | 'teacher' | 'student' }>) =>
  request<SingleResponse<UserSummary>>(`/auth/users/${id}`, { method: 'PUT', body: JSON.stringify(body) });

export const deleteUser = (id: string) =>
  request<{ success: boolean; message: string }>(`/auth/users/${id}`, { method: 'DELETE' });

// ── Helpers ────────────────────────────────────────────────────────────────

export function authorName(review: Review): string {
  return typeof review.author === 'object' ? review.author.name : 'Unknown';
}

export function authorRole(review: Review): string {
  return typeof review.author === 'object' ? review.author.role : review.role;
}

export function collegeName(review: Review): string {
  return typeof review.college === 'object' ? review.college.name : 'Unknown';
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

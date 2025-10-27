# Admin Dashboard Setup Guide

This guide will help you create a React-based admin dashboard for your CMS.

## Quick Setup

We'll create a modern React admin panel using:
- **React 18** with TypeScript
- **Vite** for fast development
- **TailwindCSS** for styling
- **React Router** for navigation
- **Axios** for API calls
- **React Query** for data fetching

## Step 1: Create React App

```bash
# From the project root
npm create vite@latest admin -- --template react-ts

# Navigate to admin folder
cd admin

# Install dependencies
npm install

# Install additional packages
npm install react-router-dom axios @tanstack/react-query
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## Step 2: Configure Tailwind CSS

**admin/tailwind.config.js:**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**admin/src/index.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-50 text-gray-900;
  }
}
```

## Step 3: Create API Service

**admin/src/services/api.ts:**
```typescript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// API Functions
export const auth = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }),
  getProfile: () => api.get('/auth/profile'),
};

export const posts = {
  getAll: (params?: any) => api.get('/posts', { params }),
  getById: (id: string) => api.get(`/posts/${id}`),
  create: (data: any) => api.post('/posts', data),
  update: (id: string, data: any) => api.put(`/posts/${id}`, data),
  delete: (id: string) => api.delete(`/posts/${id}`),
  search: (query: string) => api.get(`/posts/search?q=${query}`),
};

export const categories = {
  getAll: () => api.get('/categories'),
  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

export const tags = {
  getAll: () => api.get('/tags'),
  create: (data: any) => api.post('/tags', data),
  update: (id: string, data: any) => api.put(`/tags/${id}`, data),
  delete: (id: string) => api.delete(`/tags/${id}`),
};

export const comments = {
  getAll: (params?: any) => api.get('/comments', { params }),
  approve: (id: string) => api.put(`/comments/${id}`, { approved: true }),
  delete: (id: string) => api.delete(`/comments/${id}`),
};

export const upload = {
  single: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
```

## Step 4: Create Auth Context

**admin/src/contexts/AuthContext.tsx:**
```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const response = await auth.getProfile();
      setUser(response.data.data);
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await auth.login(email, password);
    const { token, user } = response.data.data;
    localStorage.setItem('token', token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

## Step 5: Create Login Page

**admin/src/pages/Login.tsx:**
```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold text-center mb-8">CMS Admin</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
```

## Step 6: Create Dashboard Layout

**admin/src/components/Layout.tsx:**
```typescript
import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-gray-800 text-white">
        <div className="p-4">
          <h1 className="text-2xl font-bold">CMS Admin</h1>
          <p className="text-sm text-gray-400 mt-1">{user?.name}</p>
        </div>

        <nav className="mt-8">
          <Link to="/dashboard" className="block px-4 py-2 hover:bg-gray-700">
            Dashboard
          </Link>
          <Link to="/dashboard/posts" className="block px-4 py-2 hover:bg-gray-700">
            Posts
          </Link>
          <Link to="/dashboard/categories" className="block px-4 py-2 hover:bg-gray-700">
            Categories
          </Link>
          <Link to="/dashboard/tags" className="block px-4 py-2 hover:bg-gray-700">
            Tags
          </Link>
          <Link to="/dashboard/comments" className="block px-4 py-2 hover:bg-gray-700">
            Comments
          </Link>
          <Link to="/dashboard/uploads" className="block px-4 py-2 hover:bg-gray-700">
            Upload Files
          </Link>
        </nav>

        <div className="absolute bottom-0 w-full p-4">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
```

## Step 7: Create Posts Management

**admin/src/pages/Posts.tsx:**
```typescript
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { posts } from '../services/api';
import { Link } from 'react-router-dom';

const Posts: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['posts', page],
    queryFn: () => posts.getAll({ page, limit: 10 }),
  });

  const deleteMutation = useMutation({
    mutationFn: posts.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  if (isLoading) return <div>Loading...</div>;

  const postsData = data?.data?.data?.posts || [];
  const pagination = data?.data?.data?.pagination;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Posts</h1>
        <Link
          to="/dashboard/posts/new"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create Post
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Author
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {postsData.map((post: any) => (
              <tr key={post.id}>
                <td className="px-6 py-4">{post.title}</td>
                <td className="px-6 py-4">{post.author.name}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      post.published
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {post.published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {new Date(post.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    to={`/dashboard/posts/${post.id}/edit`}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm('Delete this post?')) {
                        deleteMutation.mutate(post.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === pagination.totalPages}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Posts;
```

## Step 8: Create App Router

**admin/src/App.tsx:**
```typescript
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Posts from './pages/Posts';
import PostForm from './pages/PostForm';
import Categories from './pages/Categories';
import Tags from './pages/Tags';
import Comments from './pages/Comments';
import Uploads from './pages/Uploads';

const queryClient = new QueryClient();

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  return user ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="posts" element={<Posts />} />
              <Route path="posts/new" element={<PostForm />} />
              <Route path="posts/:id/edit" element={<PostForm />} />
              <Route path="categories" element={<Categories />} />
              <Route path="tags" element={<Tags />} />
              <Route path="comments" element={<Comments />} />
              <Route path="uploads" element={<Uploads />} />
            </Route>
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
```

## Step 9: Environment Variables

**admin/.env:**
```env
VITE_API_URL=http://localhost:3000/api
```

## Step 10: Update Package Scripts

**admin/package.json:**
```json
{
  "name": "cms-admin",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

## Running the Admin Dashboard

```bash
# From admin folder
npm run dev

# Dashboard will run on http://localhost:5173
```

## Quick Implementation Checklist

- [ ] Create React app with Vite
- [ ] Install dependencies (React Router, Axios, React Query, Tailwind)
- [ ] Configure Tailwind CSS
- [ ] Create API service with axios
- [ ] Set up Auth Context
- [ ] Build Login page
- [ ] Create Dashboard layout with sidebar
- [ ] Implement Posts management (list, create, edit, delete)
- [ ] Add Categories management
- [ ] Add Tags management
- [ ] Create Comments moderation interface
- [ ] Build File upload interface
- [ ] Add search functionality
- [ ] Implement pagination
- [ ] Add loading states and error handling

## Additional Pages to Create

Create these pages following the same pattern as Posts:

1. **Categories.tsx** - Manage categories
2. **Tags.tsx** - Manage tags
3. **Comments.tsx** - Moderate comments
4. **Uploads.tsx** - Upload and manage files
5. **Dashboard.tsx** - Show statistics
6. **PostForm.tsx** - Create/edit posts with rich editor

## Recommended Libraries

- **Rich Text Editor**: `@tinymce/tinymce-react` or `react-quill`
- **Icons**: `lucide-react` or `react-icons`
- **Forms**: `react-hook-form` with `zod` validation
- **Notifications**: `react-hot-toast`
- **Markdown**: `react-markdown` (if using markdown)

## Production Build

```bash
cd admin
npm run build

# Serve with your backend or deploy to Netlify/Vercel
```

## CORS Configuration

Update your backend to allow the admin dashboard:

**src/app.ts:**
```typescript
app.use(cors({
  origin: ['http://localhost:5173', 'https://your-admin-domain.com'],
  credentials: true,
}));
```

## Next Steps

1. Follow this guide to set up the admin dashboard
2. Customize the styling to match your brand
3. Add more features as needed
4. Deploy to production

Your admin dashboard will provide a complete UI for managing your CMS! 🎨

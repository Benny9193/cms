import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { posts, categories, tags, comments } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: postsData } = useQuery({
    queryKey: ['posts', { page: 1, limit: 1 }],
    queryFn: () => posts.getAll({ page: 1, limit: 1 }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categories.getAll(),
  });

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tags.getAll(),
  });

  const { data: commentsData } = useQuery({
    queryKey: ['comments', { page: 1, limit: 1 }],
    queryFn: () => comments.getAll({ page: 1, limit: 1 }),
    enabled: user?.role === 'admin',
  });

  const stats = [
    {
      label: 'Total Posts',
      value: postsData?.data?.data?.pagination?.total || 0,
      icon: '📝',
      color: 'bg-blue-500',
    },
    {
      label: 'Categories',
      value: categoriesData?.data?.data?.length || 0,
      icon: '📁',
      color: 'bg-green-500',
    },
    {
      label: 'Tags',
      value: tagsData?.data?.data?.length || 0,
      icon: '🏷️',
      color: 'bg-purple-500',
    },
    {
      label: 'Comments',
      value: commentsData?.data?.data?.pagination?.total || 0,
      icon: '💬',
      color: 'bg-yellow-500',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back, {user?.name}! Here's what's happening with your CMS.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-lg shadow-md p-6 border-l-4"
            style={{ borderLeftColor: stat.color.replace('bg-', '') }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className="text-4xl">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a
              href="/dashboard/posts/new"
              className="block w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <span className="text-lg">📝</span>
              <span className="ml-3 font-medium text-gray-900">Create New Post</span>
            </a>
            <a
              href="/dashboard/categories"
              className="block w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <span className="text-lg">📁</span>
              <span className="ml-3 font-medium text-gray-900">Manage Categories</span>
            </a>
            <a
              href="/dashboard/uploads"
              className="block w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <span className="text-lg">📤</span>
              <span className="ml-3 font-medium text-gray-900">Upload Files</span>
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">System Info</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600">Your Role</span>
              <span className="font-medium text-gray-900 capitalize">{user?.role}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600">Email</span>
              <span className="font-medium text-gray-900">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Status</span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                <span className="font-medium text-gray-900">Active</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

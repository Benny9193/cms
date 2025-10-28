import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { FaEye, FaComment, FaNewspaper, FaUsers } from 'react-icons/fa';
import { posts } from '../services/api';
import axios from 'axios';

const AnalyticsDashboard: React.FC = () => {
  const { data: stats } = useQuery({
    queryKey: ['analytics-stats'],
    queryFn: () => axios.get(`${import.meta.env.VITE_API_URL}/analytics/dashboard/stats`),
  });

  const { data: trend } = useQuery({
    queryKey: ['view-trend'],
    queryFn: () => axios.get(`${import.meta.env.VITE_API_URL}/analytics/views/trend?days=30`),
  });

  const { data: mostViewed } = useQuery({
    queryKey: ['most-viewed'],
    queryFn: () => axios.get(`${import.meta.env.VITE_API_URL}/analytics/posts/most-viewed?limit=10`),
  });

  const statsData = stats?.data?.data;
  const trendData = trend?.data?.data;
  const mostViewedPosts = mostViewed?.data?.data;

  // Convert trend object to array for chart
  const trendArray = trendData
    ? Object.entries(trendData).map(([date, count]) => ({
        date,
        views: count,
      }))
    : [];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Track your content performance and engagement
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Views</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {statsData?.total?.views?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-green-600 mt-1">
                +{statsData?.last30Days?.views || 0} last 30 days
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <FaEye className="text-2xl text-blue-600 dark:text-blue-300" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Posts</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {statsData?.total?.posts || 0}
              </p>
              <p className="text-sm text-green-600 mt-1">
                +{statsData?.last30Days?.posts || 0} last 30 days
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <FaNewspaper className="text-2xl text-green-600 dark:text-green-300" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Comments</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {statsData?.total?.comments || 0}
              </p>
              <p className="text-sm text-green-600 mt-1">
                +{statsData?.last30Days?.comments || 0} last 30 days
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
              <FaComment className="text-2xl text-yellow-600 dark:text-yellow-300" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {statsData?.total?.users || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <FaUsers className="text-2xl text-purple-600 dark:text-purple-300" />
            </div>
          </div>
        </div>
      </div>

      {/* View Trend Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          View Trend (Last 30 Days)
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendArray}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="views" stroke="#3B82F6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Most Viewed Posts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Top 10 Most Viewed Posts
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={mostViewedPosts || []} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="title" type="category" width={200} />
            <Tooltip />
            <Legend />
            <Bar dataKey="viewCount" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;

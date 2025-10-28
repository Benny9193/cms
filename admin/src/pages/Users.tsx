import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaBan, FaCheck, FaTrash, FaUserShield, FaUser, FaSearch } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const Users: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['users', { page, limit }],
    queryFn: () => axios.get(`${import.meta.env.VITE_API_URL}/users?page=${page}&limit=${limit}`),
    enabled: user?.role === 'admin',
  });

  const { data: searchResults } = useQuery({
    queryKey: ['users-search', search],
    queryFn: () => axios.get(`${import.meta.env.VITE_API_URL}/users/search?q=${search}`),
    enabled: search.length > 2,
  });

  const banMutation = useMutation({
    mutationFn: ({ id, banned }: { id: string; banned: boolean }) =>
      axios.post(`${import.meta.env.VITE_API_URL}/users/${id}/ban`, { banned }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User status updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update user');
    },
  });

  const roleChangeMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      axios.post(`${import.meta.env.VITE_API_URL}/users/${id}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User role updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update role');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`${import.meta.env.VITE_API_URL}/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    },
  });

  const handleBanToggle = (id: string, currentBanned: boolean) => {
    banMutation.mutate({ id, banned: !currentBanned });
  };

  const handleRoleToggle = (id: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (
      window.confirm(
        `Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`
      )
    ) {
      roleChangeMutation.mutate({ id, role: newRole });
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete user "${name}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const usersData = search.length > 2
    ? searchResults?.data?.data
    : data?.data?.data?.users || [];
  const pagination = data?.data?.data?.pagination;

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Admin access required</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Manage users, roles, and permissions</p>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {usersData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  usersData.map((usr: any) => (
                    <tr key={usr.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{usr.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{usr.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleRoleToggle(usr.id, usr.role)}
                          className={`flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full ${
                            usr.role === 'admin'
                              ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                          }`}
                        >
                          {usr.role === 'admin' ? <FaUserShield /> : <FaUser />}
                          {usr.role}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            usr.banned
                              ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
                              : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                          }`}
                        >
                          {usr.banned ? 'Banned' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {usr.postCount || 0} posts, {usr.commentCount || 0} comments
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleBanToggle(usr.id, usr.banned)}
                          className={`${
                            usr.banned
                              ? 'text-green-600 hover:text-green-900 dark:text-green-400'
                              : 'text-yellow-600 hover:text-yellow-900 dark:text-yellow-400'
                          }`}
                          disabled={banMutation.isPending}
                        >
                          {usr.banned ? <FaCheck className="inline" /> : <FaBan className="inline" />}
                          {usr.banned ? ' Unban' : ' Ban'}
                        </button>
                        {usr.id !== user?.id && (
                          <button
                            onClick={() => handleDelete(usr.id, usr.name)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400"
                            disabled={deleteMutation.isPending}
                          >
                            <FaTrash className="inline" /> Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!search && pagination && pagination.totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Users;

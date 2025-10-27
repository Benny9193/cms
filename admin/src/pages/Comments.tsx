import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { comments } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Comments: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const limit = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['comments', { page, limit }],
    queryFn: () => comments.getAll({ page, limit }),
    enabled: user?.role === 'admin',
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      comments.approve(id, approved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: comments.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      alert('Comment deleted successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to delete comment');
    },
  });

  const handleApprove = async (id: string, approved: boolean) => {
    try {
      await approveMutation.mutateAsync({ id, approved });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update comment');
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteMutation.mutate(id);
    }
  };

  const commentsData = data?.data?.data?.comments || [];
  const pagination = data?.data?.data?.pagination;

  const filteredComments = commentsData.filter((comment: any) => {
    if (filter === 'approved') return comment.approved;
    if (filter === 'pending') return !comment.approved;
    return true;
  });

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Only admins can view all comments.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Comments</h1>
        <p className="text-gray-600 mt-2">Moderate comments on your posts</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'approved'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Pending
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {filteredComments.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-500">
                No comments found.
              </div>
            ) : (
              filteredComments.map((comment: any) => (
                <div
                  key={comment.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-medium text-gray-900">{comment.author?.name}</p>
                      <p className="text-sm text-gray-500">{comment.author?.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(comment.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        comment.approved
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {comment.approved ? 'Approved' : 'Pending'}
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                      On post:{' '}
                      <span className="font-medium text-gray-900">
                        {comment.post?.title}
                      </span>
                    </p>
                    <p className="text-gray-800">{comment.content}</p>
                    {comment.parentId && (
                      <p className="text-sm text-blue-600 mt-2">
                        Reply to another comment
                      </p>
                    )}
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-gray-200">
                    {!comment.approved ? (
                      <button
                        onClick={() => handleApprove(comment.id, true)}
                        disabled={approveMutation.isPending}
                        className="text-sm font-medium text-green-600 hover:text-green-900"
                      >
                        Approve
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApprove(comment.id, false)}
                        disabled={approveMutation.isPending}
                        className="text-sm font-medium text-yellow-600 hover:text-yellow-900"
                      >
                        Unapprove
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(comment.id)}
                      disabled={deleteMutation.isPending}
                      className="text-sm font-medium text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-700">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
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

export default Comments;

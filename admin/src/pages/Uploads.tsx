import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { upload } from '../services/api';

const Uploads: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [error, setError] = useState<string>('');

  const singleUploadMutation = useMutation({
    mutationFn: upload.single,
    onSuccess: (response) => {
      const fileData = response.data.data;
      setUploadedFiles((prev) => [fileData, ...prev]);
      setSelectedFiles(null);
      setError('');
      alert('File uploaded successfully!');
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to upload file');
    },
  });

  const multipleUploadMutation = useMutation({
    mutationFn: upload.multiple,
    onSuccess: (response) => {
      const filesData = response.data.data;
      setUploadedFiles((prev) => [...filesData, ...prev]);
      setSelectedFiles(null);
      setError('');
      alert(`${filesData.length} files uploaded successfully!`);
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to upload files');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setSelectedFiles(e.target.files);
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      setError('Please select at least one file');
      return;
    }

    const formData = new FormData();

    if (selectedFiles.length === 1) {
      formData.append('file', selectedFiles[0]);
      singleUploadMutation.mutate(formData);
    } else {
      Array.from(selectedFiles).forEach((file) => {
        formData.append('files', file);
      });
      multipleUploadMutation.mutate(formData);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('URL copied to clipboard!');
  };

  const isPending = singleUploadMutation.isPending || multipleUploadMutation.isPending;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Uploads</h1>
        <p className="text-gray-600 mt-2">Upload and manage your files</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Upload Files</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Files
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              multiple
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-2">
              Supported formats: Images (PNG, JPG, GIF, WebP), PDFs, Videos (MP4, AVI, MOV)
            </p>
          </div>

          {selectedFiles && selectedFiles.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Selected files ({selectedFiles.length}):
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                {Array.from(selectedFiles).map((file, index) => (
                  <li key={index}>
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={isPending || !selectedFiles}
            className="btn-primary disabled:opacity-50"
          >
            {isPending ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Uploaded Files</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {file.mimetype.startsWith('image/') ? (
                  <img
                    src={file.url}
                    alt={file.filename}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                    <span className="text-6xl">
                      {file.mimetype === 'application/pdf'
                        ? '📄'
                        : file.mimetype.startsWith('video/')
                        ? '🎥'
                        : '📎'}
                    </span>
                  </div>
                )}
                <div className="p-4">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.originalName}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    onClick={() => handleCopyUrl(file.url)}
                    className="mt-3 w-full text-sm text-blue-600 hover:text-blue-900 font-medium"
                  >
                    Copy URL
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Uploads;

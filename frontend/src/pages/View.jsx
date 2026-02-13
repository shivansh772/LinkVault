import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, Copy, Lock, AlertCircle, FileText, CheckCircle, Trash2 } from 'lucide-react';
import { getContent, getContentMetadata, deleteContent } from '../services/api';

const View = () => {
  const { shortId } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchMetadata();
    }
  }, [shortId]);

  const fetchMetadata = async () => {
    try {
      const response = await getContentMetadata(shortId);
      setMetadata(response.data);
      
      if (response.data.requiresPassword) {
        setRequiresPassword(true);
        setLoading(false);
      } else {
        fetchContent();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load content');
      setLoading(false);
    }
  };

  const fetchContent = async (pwd = null) => {
    setLoading(true);
    setError('');

    try {
      const response = await getContent(shortId, pwd);
      setContent(response.data);
      setRequiresPassword(false);
    } catch (err) {
      if (err.response?.status === 401) {
        setRequiresPassword(true);
        setError('Incorrect password');
      } else {
        setError(err.response?.data?.message || 'Failed to load content');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password) {
      fetchContent(password);
    }
  };

  const copyText = () => {
    navigator.clipboard.writeText(content.textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      try {
        await deleteContent(shortId);
        alert('Content deleted successfully');
        navigate('/');
      } catch (err) {
        alert('Failed to delete content');
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  if (requiresPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <Lock className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Password Required</h2>
            <p className="text-gray-600">This content is password protected</p>
          </div>

          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Unlock Content
            </button>
          </form>

          <button
            onClick={() => navigate('/')}
            className="w-full mt-4 text-gray-600 hover:text-gray-800 transition"
          >
            Go back to home
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Content Not Available</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (!content) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">LinkVault</h1>
          <p className="text-gray-600">Secure Content Viewing</p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Metadata Bar */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="font-medium">Type:</span>
                <span>{content.type === 'text' ? 'Text' : 'File'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Expires:</span>
                <span>{new Date(content.expiresAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Views:</span>
                <span>{content.viewCount}{content.maxViews ? ` / ${content.maxViews}` : ''}</span>
              </div>
              {content.oneTimeView && (
                <div className="text-orange-600 font-medium">
                  ⚠️ One-time view
                </div>
              )}
            </div>
          </div>

          {/* Text Content */}
          {content.type === 'text' && (
            <div className="p-6">
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Text Content</h3>
                <button
                  onClick={copyText}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Text
                    </>
                  )}
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 break-words">
                  {content.textContent}
                </pre>
              </div>
            </div>
          )}

          {/* File Content */}
          {content.type === 'file' && (
            <div className="p-6">
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                  {content.fileName}
                </h3>
                <p className="text-gray-600 mb-6">
                  Size: {formatFileSize(content.fileSize)}
                </p>
                <a
                  href={content.fileUrl}
                  download={content.fileName}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  <Download className="w-5 h-5" />
                  Download File
                </a>
              </div>
            </div>
          )}

          {/* Warning for One-time View */}
          {content.oneTimeView && (
            <div className="bg-orange-50 border-t border-orange-200 px-6 py-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div className="text-sm text-orange-800">
                  <p className="font-medium">One-time View Warning</p>
                  <p>This content has been marked as one-time view and may no longer be accessible.</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-4">
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Create New
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default View;

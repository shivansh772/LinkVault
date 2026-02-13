import { useState } from 'react';
import { Upload, FileText, Lock, Eye, Calendar, Link2, CheckCircle } from 'lucide-react';
import { uploadContent } from '../services/api';

const Home = () => {
  const [contentType, setContentType] = useState('text');
  const [textContent, setTextContent] = useState('');
  const [file, setFile] = useState(null);
  const [expiryDate, setExpiryDate] = useState('');
  const [expiryTime, setExpiryTime] = useState('');
  const [password, setPassword] = useState('');
  const [oneTimeView, setOneTimeView] = useState(false);
  const [maxViews, setMaxViews] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('type', contentType);

      if (contentType === 'text') {
        if (!textContent.trim()) {
          setError('Please enter some text content');
          setLoading(false);
          return;
        }
        formData.append('textContent', textContent);
      } else {
        if (!file) {
          setError('Please select a file to upload');
          setLoading(false);
          return;
        }
        formData.append('file', file);
      }

      // Add expiry date/time if provided
      if (expiryDate && expiryTime) {
        const expiryDateTime = new Date(`${expiryDate}T${expiryTime}`);
        formData.append('expiresAt', expiryDateTime.toISOString());
      }

      // Add optional features
      if (password) {
        formData.append('password', password);
      }
      if (oneTimeView) {
        formData.append('oneTimeView', 'true');
      }
      if (maxViews) {
        formData.append('maxViews', maxViews);
      }

      const response = await uploadContent(formData);
      setResult(response.data);

      // Reset form
      setTextContent('');
      setFile(null);
      setPassword('');
      setOneTimeView(false);
      setMaxViews('');
      setExpiryDate('');
      setExpiryTime('');

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload content');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result.shareUrl);
    alert('Link copied to clipboard!');
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
              <Lock className="w-12 h-12 text-blue-600" />
              LinkVault
            </h1>
            <p className="text-gray-600 text-lg">
              Secure, temporary file and text sharing with encrypted links
            </p>
          </div>

          {/* Success Message */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    Upload Successful!
                  </h3>
                  <p className="text-green-700 mb-3">
                    Your content has been uploaded and is ready to share.
                  </p>
                  <div className="bg-white rounded-md p-4 border border-green-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Share this link:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={result.shareUrl}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                      />
                      <button
                        onClick={copyToClipboard}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-2"
                      >
                        <Link2 className="w-4 h-4" />
                        Copy
                      </button>
                    </div>
                    <div className="mt-3 text-sm text-gray-600">
                      <p>Expires: {new Date(result.expiresAt).toLocaleString()}</p>
                      {result.oneTimeView && <p className="text-orange-600">⚠️ One-time view only</p>}
                      {result.maxViews && <p>Maximum views: {result.maxViews}</p>}
                      {result.hasPassword && <p className="text-blue-600">🔒 Password protected</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Form */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <form onSubmit={handleSubmit}>
              {/* Content Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What would you like to share?
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setContentType('text')}
                    className={`p-4 rounded-lg border-2 transition ${
                      contentType === 'text'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <FileText className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <span className="block font-medium">Text</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentType('file')}
                    className={`p-4 rounded-lg border-2 transition ${
                      contentType === 'file'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <span className="block font-medium">File</span>
                  </button>
                </div>
              </div>

              {/* Text Input */}
              {contentType === 'text' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter your text
                  </label>
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    rows="8"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Paste your text here..."
                  />
                </div>
              )}

              {/* File Input */}
              {contentType === 'file' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Choose a file
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-input"
                    />
                    <label
                      htmlFor="file-input"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className="w-12 h-12 text-gray-400 mb-2" />
                      {file ? (
                        <p className="text-blue-600 font-medium">{file.name}</p>
                      ) : (
                        <>
                          <p className="text-gray-600">Click to upload a file</p>
                          <p className="text-sm text-gray-400 mt-1">Max size: 50MB</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              )}

              {/* Expiry Settings */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Expiry Date & Time (Optional)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="time"
                    value={expiryTime}
                    onChange={(e) => setExpiryTime(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  If not set, content will expire in 10 minutes
                </p>
              </div>

              {/* Advanced Options */}
              <div className="border-t border-gray-200 pt-6 mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-4">
                  Advanced Options (Optional)
                </h3>

                {/* Password Protection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Password Protection
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password (optional)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* One-time View */}
                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={oneTimeView}
                      onChange={(e) => setOneTimeView(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      One-time view (content deletes after first view)
                    </span>
                  </label>
                </div>

                {/* Max Views */}
                {!oneTimeView && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum View Count (Optional)
                    </label>
                    <input
                      type="number"
                      value={maxViews}
                      onChange={(e) => setMaxViews(e.target.value)}
                      min="1"
                      placeholder="e.g., 5"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload & Generate Link
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-gray-600 text-sm">
            <p>LinkVault - Secure temporary file sharing</p>
            <p className="mt-2">All content is automatically deleted after expiry</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

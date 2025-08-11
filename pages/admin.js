import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

const CATEGORY_OPTIONS = ['Programming', 'Design', 'Marketing', 'Management', 'Other'];

export default function Admin() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [issuer, setIssuer] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('');
  const [file, setFile] = useState(null);
  const [isPdf, setIsPdf] = useState(false);

  const [prompt, setPrompt] = useState({ message: '', type: '' }); // type: 'error' | 'success'
  const [isSubmitting, setIsSubmitting] = useState(false);

  const promptTimeout = useRef(null);

  // Show prompt and auto-hide after 5 seconds
  const showPrompt = (message, type = 'success') => {
    setPrompt({ message, type });
    if (promptTimeout.current) clearTimeout(promptTimeout.current);
    promptTimeout.current = setTimeout(() => setPrompt({ message: '', type: '' }), 5000);
  };

  const resetForm = () => {
    setTitle('');
    setIssuer('');
    setDate('');
    setCategory('');
    setFile(null);
    setIsPdf(false);
  };

  const validateForm = () => {
    if (!title.trim() || !issuer.trim() || !date || !category.trim()) {
      showPrompt('Please fill all required fields.', 'error');
      return false;
    }
    if (!file) {
      showPrompt('Please select a file (image or PDF).', 'error');
      return false;
    }
    return true;
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const base64data = await fileToBase64(file);
      const base64WithoutPrefix = base64data.split(',')[1];
      const payload = {
        title,
        issuer,
        date,
        category,
        fileBase64: base64WithoutPrefix,
        isPdf,
      };

      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        showPrompt('Certificate successfully added!', 'success');
        resetForm();
      } else {
        showPrompt(data.message || 'Failed to add certificate.', 'error');
      }
    } catch {
      showPrompt('An error occurred while uploading.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/') && selectedFile.type !== 'application/pdf') {
      showPrompt('Only image or PDF files are allowed.', 'error');
      return;
    }

    setFile(selectedFile);
    setIsPdf(selectedFile.type === 'application/pdf');
  };

  return (
    <>
      <div className="min-h-screen p-6 max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-md relative">
        <button
          onClick={() => router.push('/')}
          aria-label="Return to Home"
          className="fixed top-6 right-8 z-50 flex items-center gap-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white px-5 py-2 rounded-md hover:bg-gray-400 dark:hover:bg-gray-600 transition"
        >
          ⬅️ Return to Home
        </button>

        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">
          Admin Panel: Add/Edit Certificates
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="title" className="block mb-1 font-semibold text-gray-700 dark:text-gray-300">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:text-white dark:border-gray-600"
              required
              aria-required="true"
            />
          </div>

          <div>
            <label htmlFor="issuer" className="block mb-1 font-semibold text-gray-700 dark:text-gray-300">
              Issuer <span className="text-red-500">*</span>
            </label>
            <input
              id="issuer"
              type="text"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:text-white dark:border-gray-600"
              required
              aria-required="true"
            />
          </div>

          <div>
            <label htmlFor="date" className="block mb-1 font-semibold text-gray-700 dark:text-gray-300">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:text-white dark:border-gray-600"
              required
              aria-required="true"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <label htmlFor="category" className="block mb-1 font-semibold text-gray-700 dark:text-gray-300">
              Category <span className="text-red-500">*</span>
            </label>
            <input
              id="category"
              list="category-options"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Select or type category"
              className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:text-white dark:border-gray-600"
              required
              aria-required="true"
              autoComplete="off"
            />
            <datalist id="category-options">
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          <div>
            <label htmlFor="fileInput" className="block mb-1 font-semibold text-gray-700 dark:text-gray-300">
              Certificate File (Image or PDF) <span className="text-red-500">*</span>
            </label>
            <input
              id="fileInput"
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:text-white dark:border-gray-600"
              required
              aria-required="true"
            />
            {file && (
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Selected file: <strong>{file.name}</strong> ({isPdf ? 'PDF' : 'Image'})
              </p>
            )}
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 transition text-white px-6 py-2 rounded-md disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>

      {/* Floating prompt message */}
      {prompt.message && (
        <div
          role="alert"
          aria-live="assertive"
          className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-md shadow-md text-white font-semibold max-w-xl w-full text-center z-50
            ${prompt.type === 'error' ? 'bg-red-600' : 'bg-green-600'}
          `}
        >
          {prompt.message}
        </div>
      )}
    </>
  );
}

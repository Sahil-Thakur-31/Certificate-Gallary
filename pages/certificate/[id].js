import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CertificateView() {
  const router = useRouter();
  const { id } = router.query;

  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false); // State for copied message

  useEffect(() => {
    if (!id) return;

    async function fetchCertificate() {
      try {
        const res = await fetch('/api/certificates');
        if (!res.ok) throw new Error('Failed to fetch certificates');
        const data = await res.json();
        // Find certificate by id
        const cert = data.find(c => c._id === id);
        if (!cert) {
          setError('Certificate not found');
          setLoading(false);
          return;
        }
        setCertificate(cert);
        setLoading(false);
      } catch (err) {
        setError('Error loading certificate');
        setLoading(false);
      }
    }

    fetchCertificate();
  }, [id]);

  // Handle the copy link button click
  const handleCopy = () => {
    const shareLink = `${window.location.origin}/certificate/${id}`; // Generate shareable link
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset copied message after 2 seconds
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
        <p>Loading certificate...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
        <p>{error}</p>
        <Link href="/">
          <a className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Back to Gallery</a>
        </Link>
      </div>
    );
  }

  const { title, fileBase64, isPdf } = certificate;
  const fileType = isPdf ? 'application/pdf' : 'image/jpeg';
  const fileExtension = isPdf ? 'pdf' : 'jpg';

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">{title}</h1>

      {isPdf ? (
        <embed
          src={`data:${fileType};base64,${fileBase64}`}
          type={fileType}
          width="100%"
          height="600px"
          className="mb-6 rounded shadow-md"
        />
      ) : (
        <img
          src={`data:${fileType};base64,${fileBase64}`}
          alt={title}
          className="mb-6 max-w-full max-h-[600px] rounded shadow-md"
        />
      )}

      <a
        href={`data:${fileType};base64,${fileBase64}`}
        download={`${title}.${fileExtension}`}
        className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 shadow"
      >
        Download Certificate
      </a>

      {/* Copy Share Link Button */}
      <div className="mt-4 flex items-center space-x-3">
        <button
          onClick={handleCopy}
          className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 shadow"
        >
          Copy Share Link
        </button>
        {copied && (
          <span className="text-green-600 text-sm font-medium">Copied!</span>
        )}
      </div>

      <Link href="/" className="mt-6 text-blue-600 hover:underline">
        Back to Gallery
      </Link>
    </div>
  );
}

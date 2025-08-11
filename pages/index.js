import { useState, useEffect } from 'react';
import CertificateCard from '../components/CertificateCard';
import LightboxModal from '../components/LightboxModal';
import DarkModeToggle from '../components/DarkModeToggle';
import { motion } from 'framer-motion';
import Link from 'next/link';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function Home() {
  const [certificates, setCertificates] = useState([]);
  const [filteredCertificates, setFilteredCertificates] = useState([]);
  const [searchTitle, setSearchTitle] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCertificates, setSelectedCertificates] = useState([]);
  const [sortCriteria, setSortCriteria] = useState('newest');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetchCertificates();
  }, []);

  async function fetchCertificates() {
    try {
      const res = await fetch('/api/certificates');
      const data = await res.json();
      setCertificates(data);
      setFilteredCertificates(data);
      const cats = Array.from(new Set(data.map(c => c.category))).sort();
      setCategories(cats);
    } catch (err) {
      console.error('Failed to fetch certificates', err);
    }
  }

  const sortCertificates = (certificates) => {
    switch (sortCriteria) {
      case 'newest':
        return [...certificates].sort((a, b) => new Date(b.date) - new Date(a.date));
      case 'oldest':
        return [...certificates].sort((a, b) => new Date(a.date) - new Date(b.date));
      case 'titleAsc':
        return [...certificates].sort((a, b) => a.title.localeCompare(b.title));
      case 'titleDesc':
        return [...certificates].sort((a, b) => b.title.localeCompare(a.title));
      case 'type':
        return [...certificates].sort((a, b) => (a.isPdf === b.isPdf ? 0 : a.isPdf ? 1 : -1));
      default:
        return certificates;
    }
  };

  useEffect(() => {
    let filtered = certificates;
    if (searchTitle.trim()) {
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(searchTitle.toLowerCase())
      );
    }
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(c => c.category === categoryFilter);
    }
    if (startDate) {
      filtered = filtered.filter(c => new Date(c.date) >= new Date(startDate));
    }
    if (endDate) {
        filtered = filtered.filter(c => new Date(c.date) <= new Date(endDate));
    }
    filtered = sortCertificates(filtered);
    setFilteredCertificates(filtered);
  }, [searchTitle, categoryFilter, certificates, sortCriteria, startDate, endDate]);

  const openLightbox = (certificate) => {
    setSelectedCert(certificate);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setSelectedCert(null);
  };

  const handleDelete = async (ids) => {
    try {
      const res = await fetch(`/api/certificates`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids })
      });
      if (!res.ok) throw new Error();
      setCertificates(prev => prev.filter(cert => !ids.includes(cert._id)));
      setSelectedCertificates(prev => prev.filter(id => !ids.includes(id)));
    } catch {
      alert('Failed to delete selected certificates.');
    }
  };

  const handleSelectCertificate = (id) => {
    setSelectedCertificates(prev => 
      prev.includes(id) ? prev.filter(certId => certId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedCertificates.length === filteredCertificates.length) {
      setSelectedCertificates([]);
    } else {
      setSelectedCertificates(filteredCertificates.map(cert => cert._id));
    }
  };

  const handleShare = (certificate) => {
    const shareUrl = `${window.location.origin}/certificate/${certificate._id}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000); // Hide after 3s
      })
      .catch(err => {
        console.error('Failed to copy:', err);
      });
  };    

  const handleDownloadSelected = async () => {
    if (selectedCertificates.length === 0) return;

    const zip = new JSZip();
    const folder = zip.folder("certificates");

    for (const id of selectedCertificates) {
      const cert = certificates.find(c => c._id === id);
      if (!cert) continue;

      const { title, fileBase64, isPdf } = cert;
      const fileName = `${title}.${isPdf ? 'pdf' : 'jpg'}`;

      folder.file(fileName, fileBase64, { base64: true });
    }

    try {
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "certificates.zip");
    } catch (err) {
      console.error("Error generating zip file", err);
      alert("Failed to generate zip file for download.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <header className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between mb-6">
        <h1 className="text-4xl font-bold mb-4 sm:mb-0 text-gray-900 dark:text-white">
          Certificate Gallery
        </h1>
        <div className="flex items-center space-x-4">
          <DarkModeToggle />
          <Link
            href="/admin"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-md whitespace-nowrap"
          >
            Add Certificate
          </Link>
        </div>
      </header>

      {showToast && (
        <div className="fixed bottom-4 right-4 bg-black text-white px-4 py-2 rounded shadow-lg z-50 transition-opacity duration-450">
          Link copied to clipboard!
        </div>
      )}  

      <div className="max-w-7xl mx-auto mb-3 flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0">
        <input
          type="text"
          placeholder="Search by Title"
          value={searchTitle}
          onChange={(e) => setSearchTitle(e.target.value)}
          className="flex-grow p-2 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="p-2 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          value={sortCriteria}
          onChange={(e) => setSortCriteria(e.target.value)}
          className="p-2 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="titleAsc">Title A-Z</option>
          <option value="titleDesc">Title Z-A</option>
          <option value="type">Type</option>
        </select>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="p-2 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="p-2 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="h-10 mb-1">
        {selectedCertificates.length > 0 && (
          <div className="max-w-7xl mx-auto flex justify-end items-center space-x-2 transition-all duration-200">
            <button
              onClick={() => handleDelete(selectedCertificates)}
              className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1.5 rounded-md shadow-md"
            >
              Delete Selected
            </button>
            <button
              onClick={handleDownloadSelected}
              className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1.5 rounded-md shadow-md"
            >
              Download Selected
            </button>
            <button
              onClick={handleSelectAll}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded-md shadow-md"
            >
              {selectedCertificates.length === filteredCertificates.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        )}
      </div>

      <main className="max-w-7xl mx-auto mt-1">
        <motion.div layout className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredCertificates.map(cert => (
            <div key={cert._id} className="relative group rounded shadow-md bg-white dark:bg-gray-800">
              <CertificateCard
                certificate={cert}
                onClick={() => openLightbox(cert)}
                onDelete={handleDelete}
                isSelected={selectedCertificates.includes(cert._id)}
                onSelect={() => handleSelectCertificate(cert._id)}
                onShare={() => handleShare(cert)}
              />
            </div>
          ))}
          {filteredCertificates.length === 0 && (
            <p className="text-gray-700 dark:text-gray-300 col-span-full text-center">
              No certificates found matching your search/filter.
            </p>
          )}
        </motion.div>
      </main>

      <LightboxModal open={lightboxOpen} certificate={selectedCert} onClose={closeLightbox} onDelete={handleDelete} />
    </div>
  );
}

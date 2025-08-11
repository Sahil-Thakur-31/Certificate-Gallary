import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function CertificateCard({ certificate, onClick, onDelete, isSelected, onSelect, onShare }) {
  const { _id, title, issuer, date, category, fileBase64, isPdf } = certificate;
  const canvasRef = useRef(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !isPdf || !fileBase64 || !canvasRef.current) return;

    const loadPdfPreview = async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist/build/pdf');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

        const pdfData = atob(fileBase64);
        const loadingTask = pdfjsLib.getDocument({ data: pdfData });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;
      } catch (error) {
        console.error('Error rendering PDF preview:', error);
      }
    };

    loadPdfPreview();
  }, [isClient, fileBase64, isPdf]);

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.05, boxShadow: '0 8px 20px rgba(0,0,0,0.15)' }}
      className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md relative group cursor-pointer"
      onClick={onClick}
    >
      <div className="aspect-w-4 aspect-h-3">
        {isPdf && isClient ? (
          <canvas ref={canvasRef} className="w-full object-cover" />
        ) : isPdf ? (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-700" />
        ) : (
          <img
            src={`data:image/jpeg;base64,${fileBase64}`}
            alt={title}
            className="w-full object-cover"
          />
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate">{title}</h3>
        <p className="text-sm text-gray-700 dark:text-gray-300">Issuer: {issuer}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {category} – {new Date(date).toLocaleDateString()}
        </p>
      </div>

      <div className="absolute top-2 right-2 flex items-center space-x-2">
        <div
          onClick={(e) => {
            e.stopPropagation(); // Prevent lightbox opening
            onSelect();          // Toggle selection
          }}
          className={`bg-blue-600 text-white p-2 rounded-md cursor-pointer opacity-75 hover:opacity-100 transition-all ${
            isSelected ? 'bg-blue-700' : ''
          }`}
        >
          {isSelected ? 'Deselect' : 'Select'}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShare();
          }}
          className={`bg-blue-600 text-white p-2 rounded-md cursor-pointer opacity-75 hover:opacity-100 transition-all ${
            isSelected ? 'bg-blue-700' : ''
          }`}
          title="Share Certificate"
          aria-label={`Share certificate ${certificate.title}`}
        >
          Share
        </button>
      </div>
    </motion.div>
  );
}

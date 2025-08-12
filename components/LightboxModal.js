import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import PdfViewer from './pdf';

export default function LightboxModal({ open, onClose, certificate, onDelete }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!open || !certificate) return null;

  const { _id, title, fileBase64, isPdf } = certificate;
  const fileSrc = isPdf ? `data:application/pdf;base64,${fileBase64}` : `data:image/jpeg;base64,${fileBase64}`;

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this certificate?')) {
      onDelete([_id]);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      >
        <motion.div
          key="modal"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-lg w-[90vw] max-w-5xl max-h-[90vh] flex flex-col relative"
        >
          {/* Delete Button - Top Right Corner */}
          <button
            onClick={handleDelete}
            className="absolute top-3 right-3 p-2 bg-transparent"
          >
            <img
              src="/delete-120.png" 
              alt="Delete"
              className="w-7 h-7"
            />
          </button>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{title}</h2>
          <div className="w-full flex-1 min-h-[60vh] mb-4 overflow-auto">
            {isPdf ? (
              <PdfViewer base64={certificate.fileBase64} />
            ) : (
              <img
                src={fileSrc}
                alt={title}
                className="w-full h-auto max-h-[80vh] object-contain rounded-md"
              />
            )}
          </div>
          <div className="flex justify-end space-x-4">
            <a
              href={fileSrc}
              download={`${title}.${isPdf ? 'pdf' : 'jpg'}`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-md"
            >
              Download
            </a>
            <button
              onClick={onClose}
              className="bg-gray-300 dark:bg-gray-700 px-4 py-2 rounded-md shadow-md hover:bg-gray-400 dark:hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

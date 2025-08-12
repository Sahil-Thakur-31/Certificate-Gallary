"use client";

import { useEffect, useRef } from "react";

export default function PdfViewer({ base64, maxHeight = "70vh" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let renderTask = null;
    let isCancelled = false;

    const loadPdf = async () => {
      const pdfjsLib = await import("pdfjs-dist/build/pdf");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const pdf = await pdfjsLib.getDocument(bytes).promise;
      if (isCancelled) return;

      const page = await pdf.getPage(1);

      // Get container size
      const container = canvasRef.current.parentElement;
      const containerWidth = container.clientWidth;

      // Scale PDF to fit container width & height limit
      const initialViewport = page.getViewport({ scale: 1 });
      let scale = containerWidth / initialViewport.width;

      const maxPxHeight =
        (window.innerHeight * parseInt(maxHeight)) / 100 || window.innerHeight * 0.7;

      if (initialViewport.height * scale > maxPxHeight) {
        scale = maxPxHeight / initialViewport.height;
      }

      const viewport = page.getViewport({ scale });

      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      renderTask = page.render({ canvasContext: context, viewport });

      renderTask.promise.catch(() => {}).finally(() => {
        renderTask = null;
      });
    };

    loadPdf();

    return () => {
      isCancelled = true;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [base64, maxHeight]);

  return (
    <div
      className="flex items-center justify-center w-full"
      style={{ maxHeight, overflow: "hidden" }}
    >
      <canvas ref={canvasRef} className="h-auto max-w-full object-contain" />
    </div>
  );
}

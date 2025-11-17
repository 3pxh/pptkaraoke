import { useState, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import './PdfViewer.css'

// Set up the worker for pdfjs - use CDN to match the exact version
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PdfViewerProps {
  file: string | File | ArrayBuffer | null
}

function PdfViewer({ file }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSizes, setPageSizes] = useState<Map<number, { width: number; height: number }>>(new Map())

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setPageNumber(1) // Reset to first page when new document loads
  }, [])

  const onPageLoadSuccess = useCallback((pageNum: number) => ({ width, height }: { width: number; height: number }) => {
    setPageSizes((prev) => {
      const newMap = new Map(prev)
      newMap.set(pageNum, { width, height })
      return newMap
    })
  }, [])

  function goToNextPage() {
    if (numPages && pageNumber < numPages) {
      setPageNumber((prev) => prev + 1)
    }
  }

  function goToPreviousPage() {
    if (pageNumber > 1) {
      setPageNumber((prev) => prev - 1)
    }
  }

  // Calculate display dimensions based on actual PDF page size
  const maxWidth = Math.min(window.innerWidth - 100, 800)

  if (!file) {
    return null
  }

  return (
    <div className="pdf-viewer-container">
      <div className="pdf-container">
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div>Loading PDF...</div>}
          error={<div>Error loading PDF</div>}
        >
          <div className="pages-stack">
            {numPages && Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => {
              const pageSize = pageSizes.get(pageNum)
              const isVisible = pageNum === pageNumber
              
              // Calculate dimensions for this specific page
              let pageDisplayWidth = maxWidth
              let pageDisplayHeight: number | undefined = undefined
              
              if (pageSize) {
                const scale = maxWidth / pageSize.width
                pageDisplayWidth = pageSize.width * scale
                pageDisplayHeight = pageSize.height * scale
              }
              
              return (
                <div
                  key={pageNum}
                  className={`page-wrapper ${isVisible ? 'visible' : 'hidden'}`}
                >
                  {pageSize ? (
                    <Page
                      pageNumber={pageNum}
                      width={pageDisplayWidth}
                      height={pageDisplayHeight}
                      onLoadSuccess={onPageLoadSuccess(pageNum)}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                    />
                  ) : (
                    <Page
                      pageNumber={pageNum}
                      width={maxWidth}
                      onLoadSuccess={onPageLoadSuccess(pageNum)}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </Document>
      </div>
      <div className="controls">
        <p>
          Page {pageNumber} of {numPages || '--'}
        </p>
        <div className="button-group">
          <button
            onClick={goToPreviousPage}
            disabled={pageNumber <= 1}
            aria-label="Previous Page"
          >
            ←
          </button>
          <button
            onClick={goToNextPage}
            disabled={!numPages || pageNumber >= numPages}
            aria-label="Next Page"
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}

export default PdfViewer


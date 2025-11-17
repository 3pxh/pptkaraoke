import { useState, useCallback, useRef } from 'react'
import PdfViewer from './PdfViewer'
import './App.css'

function App() {
  const [pdfFiles, setPdfFiles] = useState<File[]>([])
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback((files: FileList) => {
    const pdfFilesArray = Array.from(files).filter(file => file.type === 'application/pdf')
    
    if (pdfFilesArray.length === 0) {
      alert('Please drop PDF files only')
      return
    }

    setPdfFiles(prev => {
      // Avoid duplicates by checking file name and size
      const newFiles = pdfFilesArray.filter(newFile => 
        !prev.some(existingFile => 
          existingFile.name === newFile.name && existingFile.size === newFile.size
        )
      )
      return [...prev, ...newFiles]
    })
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFiles(files)
    }
  }, [handleFiles])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFiles(files)
    }
  }, [handleFiles])

  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleSelectPdf = useCallback((file: File) => {
    setSelectedPdf(file)
  }, [])

  const handleBackToList = useCallback(() => {
    setSelectedPdf(null)
  }, [])

  const handleRemovePdf = useCallback((fileToRemove: File) => {
    setPdfFiles(prev => prev.filter(file => file !== fileToRemove))
    if (selectedPdf === fileToRemove) {
      setSelectedPdf(null)
    }
  }, [selectedPdf])

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }, [])

  if (selectedPdf) {
    return (
      <div className="app-container">
        <button className="back-button" onClick={handleBackToList}>
          ← Back to List
        </button>
        <PdfViewer file={selectedPdf} />
      </div>
    )
  }

  if (pdfFiles.length > 0) {
    return (
      <div className="app-container">
        <div
          className="pdf-list-container"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="pdf-list-header">
            <h2>Your PDFs ({pdfFiles.length})</h2>
            <button className="add-more-button" onClick={handleClick}>
              + Add More PDFs
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
          <div
            className={`drop-more-box ${isDragging ? 'dragging' : ''}`}
            onClick={handleClick}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>Drop more PDFs here</span>
          </div>
          <div className="pdf-list">
            {pdfFiles.map((file, index) => (
              <div key={`${file.name}-${file.size}-${index}`} className="pdf-list-item">
                <div className="pdf-list-item-content" onClick={() => handleSelectPdf(file)}>
                  <div className="pdf-icon">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                  <div className="pdf-list-item-info">
                    <div className="pdf-list-item-name">{file.name}</div>
                    <div className="pdf-list-item-size">{formatFileSize(file.size)}</div>
                  </div>
                </div>
                <button
                  className="remove-button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemovePdf(file)
                  }}
                  aria-label="Remove PDF"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          {isDragging && (
            <div className="drop-overlay">
              <div className="drop-overlay-content">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p>Drop PDF files here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
        <div className="drop-zone-content">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <h2>Drop PDF files here</h2>
          <p>or click to browse</p>
        </div>
      </div>
    </div>
  )
}

export default App

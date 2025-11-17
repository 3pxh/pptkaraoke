import { useState, useCallback, useRef, useEffect } from 'react'
import PdfViewer from './PdfViewer'
import './App.css'

interface Combination {
  player: string
  pdf: File
}

function App() {
  const [pdfFiles, setPdfFiles] = useState<File[]>([])
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [players, setPlayers] = useState<string[]>([])
  const [newPlayerName, setNewPlayerName] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPresenting, setIsPresenting] = useState(false)
  const [cyclingCombination, setCyclingCombination] = useState<Combination | null>(null)
  const [finalCombination, setFinalCombination] = useState<Combination | null>(null)
  const [usedCombinations, setUsedCombinations] = useState<Set<string>>(new Set())
  const [usedPdfs, setUsedPdfs] = useState<Set<string>>(new Set())
  const [crossedOutPlayers, setCrossedOutPlayers] = useState<Set<string>>(new Set())
  const [autoCrossedPlayers, setAutoCrossedPlayers] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cyclingIntervalRef = useRef<number | null>(null)
  const playersRef = useRef<string[]>([])
  const pdfFilesRef = useRef<File[]>([])
  const usedCombinationsRef = useRef<Set<string>>(new Set())
  const usedPdfsRef = useRef<Set<string>>(new Set())
  const crossedOutPlayersRef = useRef<Set<string>>(new Set())
  const presentationContainerRef = useRef<HTMLDivElement | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

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

  const getPdfKey = useCallback((pdf: File) => {
    return `${pdf.name}|${pdf.size}`
  }, [])

  const handleBackToList = useCallback(() => {
    setSelectedPdf(null)
  }, [])

  const handleRemovePdf = useCallback((fileToRemove: File) => {
    setPdfFiles(prev => prev.filter(file => file !== fileToRemove))
    const pdfKey = getPdfKey(fileToRemove)
    setUsedPdfs(prev => {
      if (!prev.has(pdfKey)) return prev
      const next = new Set(prev)
      next.delete(pdfKey)
      return next
    })
    setUsedCombinations(prev => {
      const targetSuffix = `|${pdfKey}`
      const next = new Set([...prev].filter(key => !key.endsWith(targetSuffix)))
      return next
    })
    if (selectedPdf === fileToRemove) {
      setSelectedPdf(null)
    }
  }, [selectedPdf, getPdfKey])

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }, [])

  const handleAddPlayer = useCallback(() => {
    const trimmedName = newPlayerName.trim()
    if (trimmedName && !players.includes(trimmedName)) {
      setPlayers(prev => [...prev, trimmedName])
      setNewPlayerName('')
    }
  }, [newPlayerName, players])

  const handleRemovePlayer = useCallback((playerToRemove: string) => {
    setPlayers(prev => prev.filter(player => player !== playerToRemove))
    setCrossedOutPlayers(prev => {
      if (!prev.has(playerToRemove)) return prev
      const next = new Set(prev)
      next.delete(playerToRemove)
      return next
    })
    setAutoCrossedPlayers(prev => {
      if (!prev.has(playerToRemove)) return prev
      const next = new Set(prev)
      next.delete(playerToRemove)
      return next
    })
  }, [])

  const handleToggleCrossOut = useCallback((player: string) => {
    const isAutoCrossed = autoCrossedPlayers.has(player)
    const isManuallyCrossed = crossedOutPlayers.has(player)

    if (isAutoCrossed || isManuallyCrossed) {
      if (isManuallyCrossed) {
        setCrossedOutPlayers(prev => {
          if (!prev.has(player)) return prev
          const next = new Set(prev)
          next.delete(player)
          return next
        })
      }
      if (isAutoCrossed) {
        setAutoCrossedPlayers(prev => {
          if (!prev.has(player)) return prev
          const next = new Set(prev)
          next.delete(player)
          return next
        })
      }
    } else {
      setCrossedOutPlayers(prev => {
        const next = new Set(prev)
        next.add(player)
        return next
      })
    }
  }, [autoCrossedPlayers, crossedOutPlayers])

  const isPlayerCrossedOut = useCallback((player: string) => {
    return crossedOutPlayers.has(player)
  }, [crossedOutPlayers])

  const handlePlayerInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddPlayer()
    }
  }, [handleAddPlayer])

  const getCombinationKey = useCallback((player: string, pdf: File) => {
    return `${player}|${pdf.name}|${pdf.size}`
  }, [])

  // Keep refs updated with latest values
  useEffect(() => {
    playersRef.current = players
  }, [players])

  useEffect(() => {
    pdfFilesRef.current = pdfFiles
  }, [pdfFiles])

  useEffect(() => {
    usedCombinationsRef.current = usedCombinations
  }, [usedCombinations])

  useEffect(() => {
    crossedOutPlayersRef.current = crossedOutPlayers
  }, [crossedOutPlayers])

  useEffect(() => {
    usedPdfsRef.current = usedPdfs
  }, [usedPdfs])

  const getAvailableCombinations = useCallback((): Combination[] => {
    const combinations: Combination[] = []
    players.forEach(player => {
      if (crossedOutPlayers.has(player)) {
        return
      }
      pdfFiles.forEach(pdf => {
        if (usedPdfs.has(getPdfKey(pdf))) {
          return
        }
        const key = getCombinationKey(player, pdf)
        if (!usedCombinations.has(key)) {
          combinations.push({ player, pdf })
        }
      })
    })
    return combinations
  }, [players, pdfFiles, usedCombinations, crossedOutPlayers, usedPdfs, getCombinationKey, getPdfKey])

  const handleForceSelectPlayer = useCallback((player: string) => {
    const availablePdfs = pdfFiles.filter(pdf => {
      if (usedPdfs.has(getPdfKey(pdf))) {
        return false
      }
      const key = getCombinationKey(player, pdf)
      return !usedCombinations.has(key)
    })

    if (availablePdfs.length === 0) {
      alert('No available PDFs for this player.')
      return
    }

    const chosenPdf = availablePdfs[Math.floor(Math.random() * availablePdfs.length)]
    const selection = { player, pdf: chosenPdf }

    if (cyclingIntervalRef.current) {
      clearInterval(cyclingIntervalRef.current)
      cyclingIntervalRef.current = null
    }

    setIsPlaying(false)
    setCyclingCombination(selection)
    setFinalCombination(selection)
    setCrossedOutPlayers(prev => {
      if (!prev.has(player)) {
        return prev
      }
      const next = new Set(prev)
      next.delete(player)
      return next
    })
    setAutoCrossedPlayers(prev => {
      if (!prev.has(player)) {
        return prev
      }
      const next = new Set(prev)
      next.delete(player)
      return next
    })
  }, [pdfFiles, usedCombinations, usedPdfs, getCombinationKey, getPdfKey])


  const handlePlay = useCallback(() => {
    const available = getAvailableCombinations()
    if (available.length === 0) {
      alert('No available combinations! All player-PDF pairs have been used.')
      return
    }
    setIsPlaying(true)
    setFinalCombination(null)
  }, [getAvailableCombinations])

  const handleEndPresentation = useCallback(() => {
    if (finalCombination) {
      const key = getCombinationKey(finalCombination.player, finalCombination.pdf)
      const pdfKey = getPdfKey(finalCombination.pdf)
      setUsedCombinations(prev => new Set([...prev, key]))
      setUsedPdfs(prev => {
        if (prev.has(pdfKey)) return prev
        const next = new Set(prev)
        next.add(pdfKey)
        return next
      })
      setAutoCrossedPlayers(prev => {
        if (prev.has(finalCombination.player)) return prev
        const next = new Set(prev)
        next.add(finalCombination.player)
        return next
      })
    }
    setIsPresenting(false)
    setSelectedPdf(null)
    setFinalCombination(null)
    setIsPlaying(false)
  }, [finalCombination, getCombinationKey, getPdfKey])

  const handlePresent = useCallback(() => {
    if (finalCombination) {
      setSelectedPdf(finalCombination.pdf)
      setIsPresenting(true)
      setIsPlaying(false)
    }
  }, [finalCombination])

  // Cycling animation effect
  useEffect(() => {
    if (isPlaying) {
      // Helper function to get available combinations using current refs
      const getAvailable = (): Combination[] => {
        const combinations: Combination[] = []
        playersRef.current.forEach(player => {
          if (crossedOutPlayersRef.current.has(player)) {
            return
          }
          pdfFilesRef.current.forEach(pdf => {
            if (usedPdfsRef.current.has(getPdfKey(pdf))) {
              return
            }
            const key = `${player}|${pdf.name}|${pdf.size}`
            if (!usedCombinationsRef.current.has(key)) {
              combinations.push({ player, pdf })
            }
          })
        })
        return combinations
      }

      // Get fresh available combinations
      const available = getAvailable()
      if (available.length === 0) {
        setIsPlaying(false)
        return
      }

      // Start cycling
      cyclingIntervalRef.current = window.setInterval(() => {
        // Get fresh available combinations on each cycle using refs
        const currentAvailable = getAvailable()
        if (currentAvailable.length > 0) {
          const random = currentAvailable[Math.floor(Math.random() * currentAvailable.length)]
          setCyclingCombination(random)
        }
      }, 100) // Change every 100ms

      // Stop after 2-3 seconds
      const stopTime = 2000 + Math.random() * 1000
      const stopTimeout = setTimeout(() => {
        if (cyclingIntervalRef.current) {
          clearInterval(cyclingIntervalRef.current)
          cyclingIntervalRef.current = null
        }
        // Get fresh available combinations for final selection using refs
        const finalAvailable = getAvailable()
        if (finalAvailable.length > 0) {
          const final = finalAvailable[Math.floor(Math.random() * finalAvailable.length)]
          setFinalCombination(final)
          setCyclingCombination(final)
        }
        setIsPlaying(false)
      }, stopTime)

      return () => {
        if (cyclingIntervalRef.current) {
          clearInterval(cyclingIntervalRef.current)
        }
        clearTimeout(stopTimeout)
      }
    } else {
      if (cyclingIntervalRef.current) {
        clearInterval(cyclingIntervalRef.current)
        cyclingIntervalRef.current = null
      }
    }
  }, [isPlaying, getPdfKey])

  const isCombinationUsed = useCallback((player: string, pdf: File) => {
    return usedCombinations.has(getCombinationKey(player, pdf))
  }, [usedCombinations, getCombinationKey])

  const isPdfUsed = useCallback((pdf: File) => {
    return usedPdfs.has(getPdfKey(pdf))
  }, [usedPdfs, getPdfKey])

  const handleEnterFullscreen = useCallback(() => {
    const container = presentationContainerRef.current
    if (!container) return

    if (container.requestFullscreen) {
      container.requestFullscreen().catch(() => {
        // Ignore failures silently (e.g., user gesture requirements)
      })
    }
  }, [])

  const handleExitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {
        // Ignore failures silently
      })
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = document.fullscreenElement === presentationContainerRef.current
      setIsFullscreen(isFull)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  useEffect(() => {
    if (!isPresenting && document.fullscreenElement === presentationContainerRef.current) {
      document.exitFullscreen().catch(() => {
        // Ignore failures silently
      })
    }
  }, [isPresenting])

  if (isPresenting && selectedPdf && finalCombination) {
    return (
      <div
        className={`app-container presentation-mode ${isFullscreen ? 'fullscreen-active' : ''}`}
        ref={presentationContainerRef}
      >
        <div className="presentation-controls">
          <button className="end-presentation-button" onClick={handleEndPresentation}>
            End Presentation
          </button>
          <button
            className="fullscreen-button"
            onClick={isFullscreen ? handleExitFullscreen : handleEnterFullscreen}
          >
            {isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
          </button>
        </div>
        <div className="presentation-info">
          <h2>{finalCombination.player}</h2>
          <p>{finalCombination.pdf.name}</p>
        </div>
        <PdfViewer file={selectedPdf} />
      </div>
    )
  }

  if (selectedPdf && !isPresenting) {
    return (
      <div className="app-container">
        <button className="back-button" onClick={handleBackToList}>
          ← Back to List
        </button>
        <PdfViewer file={selectedPdf} />
      </div>
    )
  }

  const availableCombinations = getAvailableCombinations()
  const canPlay = players.length > 0 && pdfFiles.length > 0 && availableCombinations.length > 0

  return (
    <div className="app-container">
      {(isPlaying || finalCombination) && (
        <div className="cycling-overlay">
          <div className="cycling-content">
            {isPlaying && cyclingCombination && (
              <>
                <div className="cycling-player">{cyclingCombination.player}</div>
                <div className="cycling-pdf">{cyclingCombination.pdf.name}</div>
              </>
            )}
            {finalCombination && !isPlaying && (
              <>
                <div className="final-combination">
                  <div className="final-player">{finalCombination.player}</div>
                  <div className="final-pdf">{finalCombination.pdf.name}</div>
                </div>
                <button className="present-button" onClick={handlePresent}>
                  Present!
                </button>
              </>
            )}
          </div>
        </div>
      )}
      <div className="main-layout">
        <div className="pdf-section">
          <div
            className="pdf-list-container"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="pdf-list-header">
              <h2>PDFs ({pdfFiles.length})</h2>
              <div className="header-buttons">
                {canPlay && !isPlaying && !finalCombination && (
                  <button className="play-button" onClick={handlePlay}>
                    ▶ Play
                  </button>
                )}
                <button className="add-more-button" onClick={handleClick}>
                  + Add PDFs
                </button>
              </div>
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
              <span>Drop PDFs here or click to browse</span>
            </div>
            <div className="pdf-list">
              {pdfFiles.length === 0 ? (
                <div className="empty-state">No PDFs added yet</div>
              ) : (
                pdfFiles.map((file, index) => {
                  const isUsed = isPdfUsed(file)
                  return (
                    <div 
                      key={`${file.name}-${file.size}-${index}`} 
                      className={`pdf-list-item ${isUsed ? 'used' : ''}`}
                    >
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
                  )
                })
              )}
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

        <div className="players-section">
          <div className="players-container">
            <div className="players-header">
              <h2>Players ({players.length})</h2>
            </div>
            <div className="add-player-input">
              <input
                type="text"
                placeholder="Enter player name..."
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyDown={handlePlayerInputKeyDown}
                className="player-input"
              />
              <button
                className="add-player-button"
                onClick={handleAddPlayer}
                disabled={!newPlayerName.trim()}
              >
                Add
              </button>
            </div>
            <div className="players-list">
              {players.length === 0 ? (
                <div className="empty-state">No players added yet</div>
              ) : (
                players.map((player, index) => {
                  const isCrossedManually = isPlayerCrossedOut(player)
                  const isAutoCrossed = autoCrossedPlayers.has(player)
                  const isPlayerCrossed = isCrossedManually || isAutoCrossed
                  const hasAvailablePdf = pdfFiles.some(pdf => !isPdfUsed(pdf) && !isCombinationUsed(player, pdf))
                  return (
                    <div
                      key={`${player}-${index}`}
                      className={`player-item ${isPlayerCrossed ? 'crossed-out' : ''}`}
                    >
                      <span className="player-name">{player}</span>
                      <div className="player-actions">
                        <button
                          className={`player-action-button ${isPlayerCrossed ? 'active' : ''}`}
                          onClick={() => handleToggleCrossOut(player)}
                          aria-pressed={isPlayerCrossed}
                        >
                          {isPlayerCrossed ? 'Undo Cross' : 'Cross Out'}
                        </button>
                        <button
                          className="player-action-button force"
                          onClick={() => handleForceSelectPlayer(player)}
                          disabled={!hasAvailablePdf || isPlaying}
                        >
                          Force Select
                        </button>
                        <button
                          className="remove-button"
                          onClick={() => handleRemovePlayer(player)}
                          aria-label="Remove player"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

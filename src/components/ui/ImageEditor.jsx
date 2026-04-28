import { useState, useRef, useEffect } from 'react'
import { Download, Copy, Trash2, Plus, Lock } from 'lucide-react'
import Button from './Button'

export default function ImageEditor({ imageUrl, onSave, onClose, userProfile = {} }) {
  const canvasRef = useRef(null)
  const [layers, setLayers] = useState([
    {
      id: 1,
      type: 'text',
      text: userProfile?.businessName || 'Your Business',
      x: 50,
      y: 100,
      fontSize: 48,
      color: '#ffffff',
      fontWeight: 'bold',
      dragging: false,
    },
    {
      id: 2,
      type: 'text',
      text: userProfile?.phone || '(555) 123-4567',
      x: 50,
      y: 180,
      fontSize: 24,
      color: '#ffffff',
      dragging: false,
    },
  ])
  const [selectedLayerId, setSelectedLayerId] = useState(1)
  const [image, setImage] = useState(null)
  const [canvas, setCanvas] = useState(null)

  useEffect(() => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setImage(img)
    img.src = imageUrl
  }, [imageUrl])

  useEffect(() => {
    if (!canvasRef.current || !image) return

    const ctx = canvasRef.current.getContext('2d')
    const ratio = image.height / image.width
    const width = 800
    const height = width * ratio

    canvasRef.current.width = width
    canvasRef.current.height = height

    ctx.drawImage(image, 0, 0, width, height)

    layers.forEach(layer => {
      if (layer.type === 'text') {
        ctx.font = `${layer.fontWeight} ${layer.fontSize}px Arial`
        ctx.fillStyle = layer.color
        ctx.shadowColor = 'rgba(0,0,0,0.5)'
        ctx.shadowBlur = 4
        ctx.fillText(layer.text, layer.x, layer.y)
        ctx.shadowColor = 'transparent'

        if (layer.id === selectedLayerId) {
          ctx.strokeStyle = '#00ff00'
          ctx.lineWidth = 2
          const metrics = ctx.measureText(layer.text)
          ctx.strokeRect(layer.x - 5, layer.y - layer.fontSize, metrics.width + 10, layer.fontSize + 10)
        }
      }
    })

    setCanvas(canvasRef.current)
  }, [image, layers, selectedLayerId])

  function updateLayer(id, updates) {
    setLayers(prev =>
      prev.map(l => (l.id === id ? { ...l, ...updates } : l))
    )
  }

  function addTextLayer() {
    const newId = Math.max(...layers.map(l => l.id), 0) + 1
    setLayers(prev => [
      ...prev,
      {
        id: newId,
        type: 'text',
        text: 'New Text',
        x: 50,
        y: layers.length * 60 + 100,
        fontSize: 32,
        color: '#ffffff',
        fontWeight: 'normal',
      },
    ])
    setSelectedLayerId(newId)
  }

  function deleteLayer(id) {
    if (layers.length <= 1) return
    setLayers(prev => prev.filter(l => l.id !== id))
    if (selectedLayerId === id) setSelectedLayerId(layers[0].id)
  }

  function downloadImage() {
    if (!canvas) return
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `content-${Date.now()}.png`
    link.click()
  }

  const selectedLayer = layers.find(l => l.id === selectedLayerId)

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-hub-card rounded-xl w-full max-w-5xl max-h-[90vh] overflow-auto border border-hub-border">
        <div className="flex items-center justify-between p-4 border-b border-hub-border sticky top-0 bg-hub-card">
          <h2 className="text-lg font-semibold text-hub-text">Edit Content</h2>
          <button onClick={onClose} className="text-hub-text-muted hover:text-hub-text">✕</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
          {/* Canvas */}
          <div className="lg:col-span-2 flex items-center justify-center bg-hub-input rounded-lg p-4">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-[500px] border border-hub-border rounded-lg"
              style={{ cursor: 'crosshair' }}
            />
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Layer list */}
            <div>
              <h3 className="text-xs font-semibold text-hub-text-muted uppercase mb-2">Layers</h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {layers.map(layer => (
                  <button
                    key={layer.id}
                    onClick={() => setSelectedLayerId(layer.id)}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-colors ${
                      selectedLayerId === layer.id
                        ? 'bg-hub-blue text-white'
                        : 'bg-hub-input text-hub-text-secondary hover:bg-hub-border'
                    }`}
                  >
                    {layer.text.substring(0, 20)}...
                  </button>
                ))}
              </div>
              <Button size="sm" variant="ghost" onClick={addTextLayer} className="w-full mt-2">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Text
              </Button>
            </div>

            {/* Selected layer editor */}
            {selectedLayer && (
              <div className="space-y-3 p-3 bg-hub-input/30 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-hub-text mb-1">Text</label>
                  <input
                    type="text"
                    value={selectedLayer.text}
                    onChange={e => updateLayer(selectedLayerId, { text: e.target.value })}
                    className="w-full bg-hub-input border border-hub-border rounded px-2 py-1.5 text-xs text-hub-text placeholder:text-hub-text-muted"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-hub-text mb-1">Size</label>
                    <input
                      type="number"
                      value={selectedLayer.fontSize}
                      onChange={e => updateLayer(selectedLayerId, { fontSize: parseInt(e.target.value) })}
                      min={12}
                      max={120}
                      className="w-full bg-hub-input border border-hub-border rounded px-2 py-1.5 text-xs text-hub-text"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-hub-text mb-1">Color</label>
                    <input
                      type="color"
                      value={selectedLayer.color}
                      onChange={e => updateLayer(selectedLayerId, { color: e.target.value })}
                      className="w-full h-8 bg-hub-input border border-hub-border rounded cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-hub-text mb-1">X Position</label>
                    <input
                      type="number"
                      value={selectedLayer.x}
                      onChange={e => updateLayer(selectedLayerId, { x: parseInt(e.target.value) })}
                      className="w-full bg-hub-input border border-hub-border rounded px-2 py-1.5 text-xs text-hub-text"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-hub-text mb-1">Y Position</label>
                    <input
                      type="number"
                      value={selectedLayer.y}
                      onChange={e => updateLayer(selectedLayerId, { y: parseInt(e.target.value) })}
                      className="w-full bg-hub-input border border-hub-border rounded px-2 py-1.5 text-xs text-hub-text"
                    />
                  </div>
                </div>

                {layers.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteLayer(selectedLayerId)}
                    className="w-full text-hub-red"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-4 border-t border-hub-border sticky bottom-0 bg-hub-card">
          <Button size="sm" onClick={downloadImage}>
            <Download className="w-3.5 h-3.5 mr-1" /> Download
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onSave?.(canvas)}>
            <Copy className="w-3.5 h-3.5 mr-1" /> Use in Scheduler
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  )
}

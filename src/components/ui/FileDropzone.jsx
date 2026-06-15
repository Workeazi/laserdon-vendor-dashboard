import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud } from 'lucide-react'

export default function FileDropzone({ onDrop, accept, maxSize = 20971520 }) {
  const handleDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length > 0) {
      onDrop(acceptedFiles[0])
    }
  }, [onDrop])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept,
    maxSize,
    multiple: false
  })

  return (
    <div 
      {...getRootProps()} 
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-brand bg-brand-light' : 'border-gray-300 hover:border-brand hover:bg-gray-50'}`}
    >
      <input {...getInputProps()} />
      <UploadCloud className={`w-12 h-12 mx-auto mb-4 ${isDragActive ? 'text-brand' : 'text-gray-400'}`} />
      <p className="text-sm text-gray-600">
        {isDragActive ? "Drop the file here..." : "Drag 'n' drop a file here, or click to select"}
      </p>
      <p className="text-xs text-gray-400 mt-2">Max size: {Math.round(maxSize / 1024 / 1024)}MB</p>
    </div>
  )
}

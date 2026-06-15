import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-auto bg-black bg-opacity-50 backdrop-blur-sm p-4 sm:p-6">
      <div className={`bg-white rounded-3xl shadow-2xl w-full ${maxWidth} h-auto animate-in fade-in zoom-in duration-200 flex flex-col`}>
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50/80 sticky top-0 z-10 backdrop-blur-md">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

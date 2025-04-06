"use client"

import type React from "react"

import { useState, useRef } from "react"
import { FileText, Upload, File, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FileUploaderProps {
  onFileSelected: (file: File | null) => void
}

export function FileUploader({ onFileSelected }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    onFileSelected(selectedFile)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files?.length) {
      const droppedFile = e.dataTransfer.files[0]
      setFile(droppedFile)
      onFileSelected(droppedFile)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    onFileSelected(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const getFileIcon = () => {
    if (!file) return <Upload className="h-8 w-8 text-gray-400" />

    const extension = file.name.split(".").pop()?.toLowerCase()

    if (extension === "pdf") {
      return <FileText className="h-10 w-10 text-red-500" />
    } else if (["jpg", "jpeg", "png", "gif"].includes(extension || "")) {
      return <File className="h-10 w-10 text-purple-500" />
    } else {
      return <File className="h-10 w-10 text-gray-500" />
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center space-y-2 transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-gray-300 dark:border-gray-700"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {!file ? (
          <>
            {getFileIcon()}
            <div className="text-center">
              <p className="text-sm font-medium">
                Drag and drop your file here, or{" "}
                <span
                  className="text-primary cursor-pointer hover:underline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  browse
                </span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Supports PDF, JPG, PNG (max 10MB)</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
            />
          </>
        ) : (
          <div className="w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getFileIcon()}
                <div>
                  <p className="text-sm font-medium truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleRemoveFile} className="h-8 w-8">
                <X className="h-4 w-4" />
                <span className="sr-only">Remove file</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {!file && (
        <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
          Select File
        </Button>
      )}
    </div>
  )
}


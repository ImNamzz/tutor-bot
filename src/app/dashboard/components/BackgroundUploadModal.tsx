"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { X, Upload, Image as ImageIcon } from "lucide-react";
// @ts-ignore - types may not be present until dependency is installed
import Cropper from "react-easy-crop";
import { toast } from "sonner";
import { ClassItem } from "@/app/lib/types/class";

interface BackgroundUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (classId: string, imageFile: File) => void;
  classItem: ClassItem | null;
}

export const BackgroundUploadModal: React.FC<BackgroundUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  classItem,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // original file
  const [originalUrl, setOriginalUrl] = useState<string | null>(null); // original data URL for cropping source
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    classItem?.bgImage || null
  ); // what we display (original or cropped)
  const [croppedFile, setCroppedFile] = useState<File | null>(null); // last cropped result
  const [cropOpen, setCropOpen] = useState(false);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset preview when opening modal for a different class
  useEffect(() => {
    if (isOpen) {
      if (classItem?.bgImage) {
        setPreviewUrl(classItem.bgImage);
      } else {
        setPreviewUrl(null);
      }
      // Clear transient state so previous class data doesn't bleed over
      setSelectedFile(null);
      setOriginalUrl(null);
      setCroppedFile(null);
      setCropOpen(false);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    }
  }, [isOpen, classItem?.id]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setOriginalUrl(dataUrl);
        setPreviewUrl(dataUrl);
        setCroppedFile(null);
        setCropOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const createCroppedImage = useCallback(async () => {
    // Always crop from originalUrl to avoid cumulative cropping artifacts
    if (!originalUrl || !croppedAreaPixels) return null;
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = originalUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );
    return new Promise<{ file: File; dataUrl: string } | null>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(null);
          const file = new File([blob], selectedFile?.name || "cropped.png", {
            type: blob.type,
          });
          // Produce a data URL for preview without re-reading file
          const dataUrl = canvas.toDataURL("image/png", 0.92);
          resolve({ file, dataUrl });
        },
        "image/png",
        0.92
      );
    });
  }, [originalUrl, croppedAreaPixels, selectedFile]);

  const handleUpload = async () => {
    if ((!selectedFile && !croppedFile) || !classItem) {
      toast.error("Please select an image file");
      return;
    }
    // Ensure we have final cropped file if user is still in crop mode
    let fileToUpload = croppedFile || selectedFile!;
    if (cropOpen && croppedAreaPixels) {
      const result = await createCroppedImage();
      if (result) {
        fileToUpload = result.file;
      }
    }
    onUpload(classItem.id, fileToUpload);
    setCropOpen(false);
  };

  const resetForm = () => {
    setSelectedFile(null);
    setOriginalUrl(null);
    setPreviewUrl(classItem?.bgImage || null);
    setCroppedFile(null);
    setCropOpen(false);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-900 rounded-lg w-full max-w-md mx-4 shadow-xl border border-border">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">
            Change Background for {classItem?.name}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-muted rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex justify-center">
            <div className="w-64 h-40 border-2 border-dashed border-border rounded-lg overflow-hidden bg-muted/50 relative">
              {previewUrl ? (
                cropOpen ? (
                  <>
                    <Cropper
                      image={originalUrl || previewUrl || ""}
                      crop={crop}
                      zoom={zoom}
                      aspect={16 / 10}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={(_: any, areaPixels: any) =>
                        setCroppedAreaPixels(areaPixels)
                      }
                      objectFit="cover"
                    />
                  </>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-12 w-12" />
                </div>
              )}
            </div>
          </div>
          {previewUrl && !cropOpen && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setCropOpen(true)}
                className="mt-2 px-3 py-1 rounded border border-border text-xs hover:bg-muted transition"
              >
                View Crop
              </button>
            </div>
          )}
          {cropOpen && (
            <div className="space-y-2">
              <label className="text-xs font-medium">Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={async () => {
                    // Generate cropped preview and persist
                    const result = await createCroppedImage();
                    if (result) {
                      setCroppedFile(result.file);
                      setPreviewUrl(result.dataUrl);
                    }
                    setCropOpen(false);
                  }}
                  className="px-3 py-1 rounded border border-border hover:bg-muted transition"
                >
                  Done
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCrop({ x: 0, y: 0 });
                    setZoom(1);
                  }}
                  className="px-3 py-1 rounded border border-border hover:bg-muted transition"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {/* File Input */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 px-4 border border-border rounded-lg flex items-center justify-center gap-2 hover:bg-muted transition-colors"
            >
              <Upload className="h-4 w-4" />
              {selectedFile ? "Change Image" : "Select Image"}
            </button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Supported formats: JPG, PNG, WebP. Max size: 5MB
            </p>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-border">
          <button
            onClick={handleClose}
            className="flex-1 py-2 px-4 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile}
            className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cropOpen ? "Crop & Upload" : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
};

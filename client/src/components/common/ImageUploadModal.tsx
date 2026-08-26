import React, { useState, useRef } from "react";
import { Upload, Link as LinkIcon, Image as ImageIcon, X, Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (url: string) => void;
  title?: string;
  description?: string;
  aspectRatio?: "square" | "banner" | "portrait" | "any";
  currentUrl?: string | null;
  presets?: { label: string; url: string }[];
}

export const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = "Upload Image",
  description = "Select an image from your device or enter a web image URL.",
  aspectRatio = "any",
  currentUrl,
  presets = [],
}) => {
  const [tab, setTab] = useState<"upload" | "url" | "presets">("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  const [inputUrl, setInputUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const defaultPresets = [
    { label: "CU CSE Red Banner", url: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&auto=format&fit=crop&q=80" },
    { label: "Cricket Stadium Grass", url: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1200&auto=format&fit=crop&q=80" },
    { label: "Football Field Sunset", url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&auto=format&fit=crop&q=80" },
    { label: "Championship Trophy", url: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1200&auto=format&fit=crop&q=80" },
    { label: "Batch Group Celebration", url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&auto=format&fit=crop&q=80" },
  ];

  const allPresets = presets.length > 0 ? presets : defaultPresets;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("File size exceeds 10MB limit.");
        return;
      }
      setSelectedFile(file);
      const objUrl = URL.createObjectURL(file);
      setPreviewUrl(objUrl);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setError(null);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      if (file.size > 10 * 1024 * 1024) {
        setError("File size exceeds 10MB limit.");
        return;
      }
      setSelectedFile(file);
      const objUrl = URL.createObjectURL(file);
      setPreviewUrl(objUrl);
    }
  };

  const handleUrlSubmit = () => {
    if (!inputUrl.trim()) {
      setError("Please provide a valid image URL.");
      return;
    }
    setPreviewUrl(inputUrl.trim());
    setSelectedFile(null);
    setError(null);
  };

  const handleSave = async () => {
    setError(null);
    setLoading(true);

    try {
      if (selectedFile) {
        // Upload file to server
        const res = await api.upload.image(selectedFile);
        onSuccess(res.url);
        onClose();
      } else if (previewUrl) {
        // Use external URL directly
        onSuccess(previewUrl);
        onClose();
      } else {
        setError("No image selected.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload image.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border-2 border-[#E5DACB] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-[#EFE8DC] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FAF0E6] text-[#9E2A2B] flex items-center justify-center font-bold">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#2C221E]">{title}</h3>
              <p className="text-[11px] text-[#7C6E63]">{description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-[#7C6E63] hover:text-[#2C221E] hover:bg-[#EFE8DC] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center border-b border-[#EFE8DC] px-5 bg-white text-xs font-bold">
          <button
            onClick={() => { setTab("upload"); setError(null); }}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 font-black transition-all ${
              tab === "upload"
                ? "border-[#9E2A2B] text-[#9E2A2B]"
                : "border-transparent text-[#7C6E63] hover:text-[#2C221E]"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>

          <button
            onClick={() => { setTab("url"); setError(null); }}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 font-black transition-all ${
              tab === "url"
                ? "border-[#9E2A2B] text-[#9E2A2B]"
                : "border-transparent text-[#7C6E63] hover:text-[#2C221E]"
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Image URL</span>
          </button>

          <button
            onClick={() => { setTab("presets"); setError(null); }}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 font-black transition-all ${
              tab === "presets"
                ? "border-[#9E2A2B] text-[#9E2A2B]"
                : "border-transparent text-[#7C6E63] hover:text-[#2C221E]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Presets Gallery</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="p-3 bg-[#FFF5F5] border border-[#FF8787] text-[#C92A2A] rounded-2xl font-bold flex items-center gap-2">
              <X className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: File Upload / Drag-and-drop */}
          {tab === "upload" && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#D8C7B3] hover:border-[#9E2A2B] bg-[#FAF7F2] hover:bg-[#FAF0E6] transition-all rounded-3xl p-8 text-center cursor-pointer flex flex-col items-center justify-center gap-3 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-white group-hover:scale-110 transition-transform shadow-xs flex items-center justify-center text-[#9E2A2B]">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="font-black text-sm text-[#2C221E]">
                  Click to browse or drag and drop image
                </p>
                <p className="text-[11px] text-[#7C6E63] mt-1">
                  Supports PNG, JPG, WEBP, SVG (Max 10MB)
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Image URL */}
          {tab === "url" && (
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-[#4A3E35] mb-1.5">Direct Image Link</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-xs font-mono"
                  />
                  <Button
                    type="button"
                    onClick={handleUrlSubmit}
                    className="bg-[#9E2A2B] text-white font-bold px-4 rounded-xl shrink-0"
                  >
                    Preview
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Presets Gallery */}
          {tab === "presets" && (
            <div className="space-y-2">
              <p className="text-[11px] text-[#7C6E63] font-medium">Select a curated high-definition sports or department banner:</p>
              <div className="grid grid-cols-2 gap-2.5">
                {allPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPreviewUrl(preset.url);
                      setSelectedFile(null);
                    }}
                    className={`group relative rounded-2xl overflow-hidden border-2 text-left transition-all ${
                      previewUrl === preset.url
                        ? "border-[#9E2A2B] shadow-md ring-2 ring-[#9E2A2B]/20"
                        : "border-[#E8DCCF] hover:border-[#D8C7B3]"
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-full h-20 object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="p-2 bg-white flex items-center justify-between text-[11px] font-bold text-[#2C221E]">
                      <span className="truncate">{preset.label}</span>
                      {previewUrl === preset.url && (
                        <Check className="w-3.5 h-3.5 text-[#9E2A2B] shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Live Preview Box */}
          {previewUrl && (
            <div className="pt-3 border-t border-[#EFE8DC] space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#7C6E63]">
                Live Preview
              </span>
              <div
                className={`rounded-2xl overflow-hidden border-2 border-[#E8DCCF] bg-[#FAF7F2] flex items-center justify-center p-2 relative ${
                  aspectRatio === "banner"
                    ? "aspect-video sm:aspect-21/9"
                    : aspectRatio === "square"
                    ? "w-32 h-32 mx-auto"
                    : "max-h-48"
                }`}
              >
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-xl"
                  onError={() => setError("Image failed to load. Please check the URL or file.")}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#EFE8DC] bg-[#FAF7F2] flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border-[#D8C7B3] text-xs font-bold"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={loading || !previewUrl}
            className="bg-[#9E2A2B] hover:bg-[#842021] text-white text-xs font-black px-6 rounded-xl shadow-md shadow-[#9E2A2B]/20 flex items-center gap-1.5"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Apply Photo</span>
          </Button>
        </div>

      </div>
    </div>
  );
};

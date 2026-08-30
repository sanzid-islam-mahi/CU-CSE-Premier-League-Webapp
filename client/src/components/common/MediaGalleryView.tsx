import React, { useState, useEffect } from "react";
import { 
  Camera, 
  Upload, 
  Trash2, 
  X, 
  ExternalLink 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { ImageUploadModal } from "./ImageUploadModal";

export interface MediaItem {
  id: number;
  title?: string | null;
  caption?: string | null;
  url: string;
  thumbnailUrl?: string | null;
  category: string;
  tournamentId?: number | null;
  matchId?: number | null;
  batchId?: number | null;
  teamId?: number | null;
  userId?: number | null;
  isFeatured?: boolean;
  createdAt: string;
  uploadedBy?: {
    id: number;
    name: string;
    studentId: string;
    avatarUrl?: string | null;
  } | null;
}

interface MediaGalleryViewProps {
  tournamentId?: number;
  batchId?: number;
  teamId?: number;
  matchId?: number;
  userId?: number;
  defaultCategory?: string;
  title?: string;
  description?: string;
  allowUpload?: boolean;
}

export const MediaGalleryView: React.FC<MediaGalleryViewProps> = ({
  tournamentId,
  batchId,
  teamId,
  matchId,
  userId,
  defaultCategory,
  title = "Photo Gallery & Highlights",
  description = "Memories, match action, squad portraits, and celebrations.",
  allowUpload = true,
}) => {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [lightboxItem, setLightboxItem] = useState<MediaItem | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [captionInput, setCaptionInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [categoryInput, setCategoryInput] = useState<string>(
    defaultCategory && defaultCategory !== "ALL" ? defaultCategory : "MATCH_PHOTO"
  );
  const [actionLoading, setActionLoading] = useState(false);

  const currentUser = api.auth.getCurrentUser();

  useEffect(() => {
    fetchMedia();
  }, [tournamentId, batchId, teamId, matchId, userId]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const res = await api.media.list({
        tournamentId,
        batchId,
        teamId,
        matchId,
        userId,
      });
      setMediaList(res);
    } catch (err: any) {
      console.error("Failed to load gallery photos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMediaAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedUrl) return;

    setActionLoading(true);
    try {
      await api.media.create({
        title: titleInput.trim() || undefined,
        caption: captionInput.trim() || undefined,
        url: uploadedUrl,
        category: categoryInput,
        tournamentId: tournamentId || null,
        batchId: batchId || null,
        teamId: teamId || null,
        matchId: matchId || null,
        userId: userId || null,
      });

      setUploadedUrl(null);
      setTitleInput("");
      setCaptionInput("");
      fetchMedia();
    } catch (err: any) {
      alert(err.message || "Failed to save photo to gallery.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMedia = async (id: number) => {
    if (!confirm("Are you sure you want to delete this photo from the gallery?")) return;
    try {
      await api.media.delete(id);
      setMediaList(prev => prev.filter(m => m.id !== id));
      if (lightboxItem?.id === id) setLightboxItem(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete photo.");
    }
  };

  const filteredList = mediaList.filter(m => {
    if (selectedCategory === "ALL") return true;
    if (selectedCategory === "PLAYER_AVATAR") {
      return m.category === "PLAYER_AVATAR" || m.category === "PLAYER_COVER";
    }
    if (selectedCategory === "BATCH_GALLERY") {
      return m.category === "BATCH_GALLERY" || m.category === "BATCH_BANNER" || m.category === "BATCH_AVATAR";
    }
    if (selectedCategory === "TEAM_BANNER") {
      return m.category === "TEAM_BANNER" || m.category === "TEAM_LOGO";
    }
    if (selectedCategory === "TOURNAMENT_GALLERY") {
      return m.category === "TOURNAMENT_GALLERY" || m.category === "TOURNAMENT_BANNER" || m.category === "TOURNAMENT_LOGO";
    }
    return m.category === selectedCategory;
  });

  const categories = [
    { id: "ALL", label: "✨ All Photos" },
    { id: "MATCH_PHOTO", label: "⚽/🏏 Match Action" },
    { id: "AWARD_CEREMONY", label: "🏆 Trophies & Awards" },
    { id: "BATCH_GALLERY", label: "📸 Batch Moments" },
    { id: "TEAM_BANNER", label: "👕 Squad Photos" },
    { id: "PLAYER_AVATAR", label: "🏃 Athlete Moments" },
    { id: "SPONSOR_LOGO", label: "🤝 Sponsors & Partners" },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header & Upload Action */}
      <div className="bg-white rounded-3xl border-2 border-[#E5DACB] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF0E6] text-[#9E2A2B] flex items-center justify-center font-black text-xl border border-[#E8D6C3]">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#2C221E] flex items-center gap-2">
              <span>{title}</span>
              <span className="text-xs font-mono font-bold text-[#7C6E63] bg-[#FAF7F2] px-2.5 py-0.5 rounded-full border">
                {mediaList.length} photos
              </span>
            </h2>
            <p className="text-xs text-[#7C6E63]">{description}</p>
          </div>
        </div>

        {allowUpload && (
          <Button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="bg-[#9E2A2B] hover:bg-[#842021] text-white text-xs font-black h-10 px-5 rounded-2xl shadow-md shadow-[#9E2A2B]/20 flex items-center gap-2 shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span>Add Photos / Moment</span>
          </Button>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? "bg-[#9E2A2B] text-white shadow-md shadow-[#9E2A2B]/20"
                : "bg-white text-[#7C6E63] hover:bg-[#FAF0E6] hover:text-[#9E2A2B] border border-[#E5DACB]"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs font-bold text-[#7C6E63]">
          <span className="animate-spin inline-block mr-2">🔄</span> Loading Gallery Photos...
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-[#E5DACB] p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-[#FAF0E6] text-[#9E2A2B] flex items-center justify-center text-3xl mx-auto border border-[#E8D6C3]">
            📷
          </div>
          <h3 className="font-black text-sm text-[#2C221E]">No Photos in this Category Yet</h3>
          <p className="text-xs text-[#7C6E63] max-w-sm mx-auto">
            Be the first to upload match moments, celebrations, or batch memories to this album!
          </p>
          {allowUpload && (
            <Button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="bg-[#9E2A2B] text-white text-xs font-bold rounded-xl mt-2"
            >
              Upload First Photo
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredList.map((item) => (
            <div
              key={item.id}
              onClick={() => setLightboxItem(item)}
              className="group relative bg-white rounded-3xl border-2 border-[#E8DCCF] overflow-hidden shadow-xs hover:shadow-md hover:border-[#9E2A2B] transition-all cursor-pointer flex flex-col"
            >
              {/* Photo Box */}
              <div className="relative aspect-4/3 overflow-hidden bg-[#FAF7F2]">
                <img
                  src={item.url}
                  alt={item.title || "Gallery image"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 text-white">
                  <span className="text-xs font-bold truncate">🔍 View Fullscreen</span>
                </div>
              </div>

              {/* Card Meta */}
              <div className="p-3.5 space-y-1 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-black text-xs text-[#2C221E] truncate">
                    {item.title || "CSEPL Match Highlight"}
                  </h4>
                  {item.caption && (
                    <p className="text-[11px] text-[#7C6E63] line-clamp-2 mt-0.5">
                      {item.caption}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-[#EFE8DC] flex items-center justify-between text-[10px] text-[#A89A8D] font-mono">
                  <span>{new Date(item.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                  {item.uploadedBy && (
                    <span className="truncate max-w-[100px] text-[#7C6E63] font-bold">
                      by {item.uploadedBy.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---------------- LIGHTBOX MODAL ---------------- */}
      {lightboxItem && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#1C1613] text-white border border-[#4A3E35] rounded-3xl overflow-hidden max-w-4xl w-full max-h-[95vh] flex flex-col relative shadow-2xl">
            
            {/* Top Toolbar */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-[#9E2A2B] text-white">
                  {lightboxItem.category.replace("_", " ")}
                </span>
                <span className="text-xs text-white/70 font-mono">
                  {new Date(lightboxItem.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={lightboxItem.url}
                  download="csepl-photo.jpg"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="Open Original Image"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>

                {(currentUser?.role === "ADMIN" || currentUser?.id === lightboxItem.uploadedBy?.id) && (
                  <button
                    onClick={() => handleDeleteMedia(lightboxItem.id)}
                    className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                    title="Delete Photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => setLightboxItem(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Photo Center */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-black/60">
              <img
                src={lightboxItem.url}
                alt={lightboxItem.title || "Full size image"}
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
              />
            </div>

            {/* Details Footer */}
            {(lightboxItem.title || lightboxItem.caption || lightboxItem.uploadedBy) && (
              <div className="p-5 border-t border-white/10 bg-black/40 space-y-1">
                {lightboxItem.title && (
                  <h3 className="text-base font-black text-white">{lightboxItem.title}</h3>
                )}
                {lightboxItem.caption && (
                  <p className="text-xs text-white/80">{lightboxItem.caption}</p>
                )}
                {lightboxItem.uploadedBy && (
                  <p className="text-[11px] text-white/50 pt-1">
                    Captured / Uploaded by <strong>{lightboxItem.uploadedBy.name}</strong> ({lightboxItem.uploadedBy.studentId})
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- IMAGE UPLOAD MODAL ---------------- */}
      <ImageUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={(url) => {
          setUploadedUrl(url);
          setShowUploadModal(false);
        }}
        title="Upload Gallery Photo"
        description="Select a photo from match day, batch celebration, or award presentation."
      />

      {/* ---------------- POST-UPLOAD CAPTION FORM MODAL ---------------- */}
      {uploadedUrl && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border-2 border-[#E5DACB] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-5 border-b border-[#EFE8DC] flex items-center justify-between bg-[#FAF7F2]">
              <h3 className="text-sm font-black text-[#2C221E]">Photo Details & Caption</h3>
              <button onClick={() => setUploadedUrl(null)} className="text-[#7C6E63]">✕</button>
            </div>

            <form onSubmit={handleCreateMediaAsset} className="p-5 space-y-4 text-xs">
              <div className="aspect-video rounded-2xl overflow-hidden border-2 border-[#E8DCCF] bg-[#FAF7F2]">
                <img src={uploadedUrl} alt="Upload preview" className="w-full h-full object-cover" />
              </div>

              <div>
                <label className="block font-bold text-[#4A3E35] mb-1">Title / Headline</label>
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="e.g. 20th Batch Winning Celebration 🏆"
                  className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#4A3E35] mb-1">Category</label>
                <select
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2]"
                >
                  <option value="MATCH_PHOTO">⚽/🏏 Match Action</option>
                  <option value="AWARD_CEREMONY">🏆 Trophies & Awards Ceremony</option>
                  <option value="BATCH_GALLERY">📸 Batch Moments & Class Photo</option>
                  <option value="TEAM_BANNER">👕 Team Squad Photo</option>
                  <option value="PLAYER_AVATAR">🏃 Athlete Action & Personal Moments</option>
                  <option value="SPONSOR_LOGO">🤝 Sponsor & Partner Logo</option>
                  <option value="TOURNAMENT_GALLERY">✨ General Tournament Highlight</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#4A3E35] mb-1">Story / Caption (Optional)</label>
                <textarea
                  value={captionInput}
                  onChange={(e) => setCaptionInput(e.target.value)}
                  placeholder="Write a memory or note about this moment..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2]"
                />
              </div>

              <div className="pt-2 border-t border-[#EFE8DC] flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setUploadedUrl(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={actionLoading} className="bg-[#9E2A2B] text-white font-bold">
                  {actionLoading ? "Publishing..." : "Publish to Gallery"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

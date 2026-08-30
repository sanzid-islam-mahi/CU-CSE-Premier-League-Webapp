import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Search, 
  Users, 
  Shield, 
  Camera, 
  Layers, 
  ArrowRight, 
  GraduationCap, 
  Loader2,
  Trophy,
  SlidersHorizontal,
  X
} from "lucide-react";
import { api, type BatchItem } from "@/lib/api";
import { SmartAvatar } from "@/components/common/SmartAvatar";

type SortOption = "number-desc" | "number-asc" | "students-desc" | "teams-desc";

export const BatchListPage: React.FC = () => {
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("number-desc");

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoading(true);
        const data = await api.batches.getAll();
        setBatches(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load batches:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBatches();
  }, []);

  // Filter & Search
  const filteredBatches = batches.filter((batch) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const matchName = batch.name?.toLowerCase().includes(q);
    const matchSession = batch.session?.toLowerCase().includes(q);
    const matchSlogan = batch.slogan?.toLowerCase().includes(q);
    const matchNumber = batch.batchNumber?.toString().includes(q) || `batch ${batch.batchNumber}`.includes(q) || `batch-${batch.batchNumber}`.includes(q);
    return matchName || matchSession || matchSlogan || matchNumber;
  });

  // Sort
  const sortedBatches = [...filteredBatches].sort((a, b) => {
    if (sortBy === "number-desc") {
      return (b.batchNumber || 0) - (a.batchNumber || 0);
    }
    if (sortBy === "number-asc") {
      return (a.batchNumber || 0) - (b.batchNumber || 0);
    }
    if (sortBy === "students-desc") {
      return (b.studentsCount || 0) - (a.studentsCount || 0);
    }
    if (sortBy === "teams-desc") {
      return (b.teamsCount || 0) - (a.teamsCount || 0);
    }
    return 0;
  });

  // Global summary statistics
  const totalStudents = batches.reduce((acc, b) => acc + (b.studentsCount || 0), 0);
  const totalTeams = batches.reduce((acc, b) => acc + (b.teamsCount || 0), 0);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C221E] flex flex-col">
      
      {/* Top Header Breadcrumb */}
      <div className="bg-white border-b border-[#E5DACB] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#6B5E53] hover:text-[#9E2A2B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to CSEPL Home</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase text-[#842021] bg-[#FAF0E6] px-3 py-1 rounded-full border border-[#E8D6C3]">
              CU CSE Directory
            </span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header Hero Banner */}
        <div className="bg-white rounded-3xl border-2 border-[#E5DACB] p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="h-3 w-full brick-gradient absolute top-0 left-0 right-0" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-[#FAF0E6] border border-[#E8D6C3] flex items-center justify-center text-[#9E2A2B]">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-[#2C221E] tracking-tight">
                    Department Batches Directory
                  </h1>
                  <p className="text-xs text-[#7C6E63] font-medium">
                    Department of Computer Science & Engineering, University of Chittagong
                  </p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-[#6B5E53] max-w-2xl pt-1">
                Explore all academic batches, view student rosters, relive class memories & gallery photos, and track batch sports teams across CSEPL tournaments.
              </p>
            </div>

            {/* Overall Quick Metrics */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 shrink-0">
              <div className="bg-[#FAF7F2] p-3 sm:p-4 rounded-2xl border border-[#E8DCCF] text-center min-w-[90px]">
                <div className="flex items-center justify-center gap-1 text-[#9E2A2B] mb-0.5">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <span className="font-mono text-xl sm:text-2xl font-black text-[#2C221E]">
                  {batches.length}
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-[#7C6E63] uppercase block">
                  Batches
                </span>
              </div>

              <div className="bg-[#FAF7F2] p-3 sm:p-4 rounded-2xl border border-[#E8DCCF] text-center min-w-[90px]">
                <div className="flex items-center justify-center gap-1 text-[#D96B27] mb-0.5">
                  <Users className="w-4 h-4" />
                </div>
                <span className="font-mono text-xl sm:text-2xl font-black text-[#2C221E]">
                  {totalStudents}
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-[#7C6E63] uppercase block">
                  Students
                </span>
              </div>

              <div className="bg-[#FAF7F2] p-3 sm:p-4 rounded-2xl border border-[#E8DCCF] text-center min-w-[90px]">
                <div className="flex items-center justify-center gap-1 text-[#2A7B54] mb-0.5">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="font-mono text-xl sm:text-2xl font-black text-[#2C221E]">
                  {totalTeams}
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-[#7C6E63] uppercase block">
                  Teams
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Sort Controls Bar */}
        <div className="bg-white rounded-2xl border border-[#E5DACB] p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Search Input */}
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7C6E63]" />
            <input
              type="text"
              placeholder="Search batches by name, number, or session..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-xs font-semibold placeholder:text-[#9B8C7E] focus:outline-hidden focus:border-[#9E2A2B] focus:ring-1 focus:ring-[#9E2A2B] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C6E63] hover:text-[#2C221E]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#7C6E63]">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#9E2A2B]" />
              <span>Sort by:</span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 rounded-xl border border-[#D8C7B3] bg-[#FAF7F2] text-xs font-bold text-[#2C221E] focus:outline-hidden focus:border-[#9E2A2B] cursor-pointer"
            >
              <option value="number-desc">Batch Number (Newest first)</option>
              <option value="number-asc">Batch Number (Oldest first)</option>
              <option value="students-desc">Most Students</option>
              <option value="teams-desc">Most Teams</option>
            </select>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between text-xs text-[#7C6E63] px-1">
          <span>
            Showing <strong className="text-[#2C221E]">{sortedBatches.length}</strong> of {batches.length} batches
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-[#9E2A2B] font-bold hover:underline"
            >
              Reset search
            </button>
          )}
        </div>

        {/* Batches Grid */}
        {loading ? (
          <div className="p-16 text-center text-[#7C6E63] flex flex-col items-center justify-center gap-3 text-xs font-bold bg-white rounded-3xl border border-[#E5DACB]">
            <Loader2 className="w-6 h-6 animate-spin text-[#9E2A2B]" />
            <span>Loading Department Batches...</span>
          </div>
        ) : sortedBatches.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-[#D8C7B3] p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#FAF0E6] text-[#9E2A2B] flex items-center justify-center text-2xl mx-auto border border-[#E8D6C3]">
              🔍
            </div>
            <h3 className="text-base font-black text-[#2C221E]">No batches found</h3>
            <p className="text-xs text-[#7C6E63] max-w-sm mx-auto">
              No batches matched your search query "{searchQuery}". Try searching with a different keyword or batch number.
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#9E2A2B] text-white text-xs font-bold shadow-xs hover:bg-[#842021] transition-all"
            >
              <span>Clear Search</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedBatches.map((batch) => (
              <Link
                key={batch.id}
                to={`/batches/${batch.slug || batch.id}`}
                className="bg-white rounded-3xl border-2 border-[#E5DACB] hover:border-[#9E2A2B] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer relative overflow-hidden"
              >
                {/* Header Strip & Crest */}
                <div>
                  {/* Subtle Class Photo Preview / Brick Gradient Banner */}
                  {batch.bannerUrl ? (
                    <div className="h-28 -mx-5 -mt-5 mb-4 relative overflow-hidden border-b border-[#E8DCCF]">
                      <img
                        src={batch.bannerUrl}
                        alt={batch.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
                      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-white text-[10px] font-bold">
                        <span className="bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Camera className="w-3 h-3 text-[#F59F00]" />
                          <span>Class Photo</span>
                        </span>
                        <span className="bg-[#9E2A2B] px-2 py-0.5 rounded-md uppercase tracking-wider font-black">
                          Batch #{batch.batchNumber || batch.id}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-4 -mx-5 -mt-5 mb-4 brick-gradient" />
                  )}

                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <SmartAvatar
                        src={batch.avatarUrl}
                        alt={batch.name}
                        fallbackText={`B${batch.batchNumber || batch.id}`}
                        size="md"
                        shape="rounded"
                        className="shadow-xs group-hover:scale-105 transition-transform shrink-0"
                      />
                      <div>
                        <h2 className="font-black text-lg text-[#2C221E] group-hover:text-[#9E2A2B] transition-colors leading-tight">
                          {batch.name}
                        </h2>
                        <p className="text-xs font-semibold text-[#7C6E63]">
                          Session {batch.session}
                        </p>
                      </div>
                    </div>

                    {!batch.bannerUrl && (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#FAF0E6] text-[#842021] border border-[#E8D6C3] shrink-0">
                        Batch #{batch.batchNumber || batch.id}
                      </span>
                    )}
                  </div>

                  {batch.slogan && (
                    <p className="text-xs font-medium text-[#9E2A2B] italic line-clamp-1 my-2 bg-[#FAF0E6]/50 px-2.5 py-1 rounded-lg border border-[#E8D6C3]/60">
                      "{batch.slogan}"
                    </p>
                  )}

                  {/* Batch Metrics Box */}
                  <div className="grid grid-cols-3 gap-2 my-4 p-2.5 bg-[#FAF7F2] rounded-2xl border border-[#E8DCCF] text-center">
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-center gap-1 text-[#D96B27]">
                        <Users className="w-3.5 h-3.5" />
                        <span className="font-mono text-xs font-black text-[#2C221E]">{batch.studentsCount || 0}</span>
                      </div>
                      <span className="text-[10px] text-[#7C6E63] font-bold uppercase block">Students</span>
                    </div>

                    <div className="space-y-0.5 border-x border-[#E8DCCF]">
                      <div className="flex items-center justify-center gap-1 text-[#9E2A2B]">
                        <Shield className="w-3.5 h-3.5" />
                        <span className="font-mono text-xs font-black text-[#2C221E]">{batch.teamsCount || 0}</span>
                      </div>
                      <span className="text-[10px] text-[#7C6E63] font-bold uppercase block">Teams</span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center justify-center gap-1 text-[#2A7B54]">
                        <Camera className="w-3.5 h-3.5" />
                        <span className="font-mono text-xs font-black text-[#2C221E]">{batch.photosCount || 0}</span>
                      </div>
                      <span className="text-[10px] text-[#7C6E63] font-bold uppercase block">Photos</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-2 border-t border-[#EFE8DC] flex items-center justify-between text-xs font-bold text-[#9E2A2B] group-hover:text-[#842021]">
                  <span>Explore Batch Showcase</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Bottom Tournaments Hub & Hall of Fame Banner */}
        <div className="p-6 bg-linear-to-r from-[#FAF0E6] via-[#FFF5F5] to-[#FAF0E6] rounded-3xl border-2 border-[#9E2A2B]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#9E2A2B]" />
              <span className="text-xs font-black text-[#842021] uppercase">Championship Legacy</span>
            </div>
            <h3 className="text-base font-black text-[#2C221E]">
              Track Batch Tournaments & Trophies
            </h3>
            <p className="text-xs text-[#7C6E63]">
              View all CSEPL Cricket & Football seasons, live matches, and batch champion rosters.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/tournaments"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#9E2A2B] text-white text-xs font-black shadow-md hover:bg-[#842021] transition-all shrink-0"
            >
              <span>Explore Tournaments 🏆</span>
            </Link>
          </div>
        </div>

      </main>
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Award, Users, Shield, ArrowRight } from "lucide-react";
import { api, type BatchItem } from "@/lib/api";
import { SmartAvatar } from "@/components/common/SmartAvatar";

export const BatchHallOfFameTeaser: React.FC = () => {
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchBatches = async () => {
      try {
        const data = await api.batches.getAll();
        if (isMounted) {
          setBatches(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load batches for hall of fame:", err);
        if (isMounted) setLoading(false);
      }
    };

    fetchBatches();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return null; // Silent while homepage loads other sections
  }

  if (batches.length === 0) {
    return null;
  }

  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#9E2A2B] mb-1">
              <Award className="w-4 h-4" />
              <span>Department Batches</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#2C221E] tracking-tight">
              Batch Showcase & Hall of Fame
            </h2>
          </div>

          <p className="text-xs text-[#6B5E53] max-w-sm">
            Explore department batch rosters, class memories, and championship glory across all academic sessions.
          </p>
        </div>

        {/* Batches Showcase Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {batches.slice(0, 4).map((batch) => (
            <Link
              key={batch.id}
              to={`/batches/${batch.slug || batch.id}`}
              className="bg-white rounded-3xl border border-[#E5DACB] p-5 shadow-xs hover:shadow-md hover:border-[#9E2A2B]/70 transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <SmartAvatar
                    src={batch.avatarUrl}
                    alt={batch.name}
                    fallbackText={`B${batch.batchNumber || batch.id}`}
                    size="lg"
                    shape="rounded"
                    className="shadow-xs group-hover:scale-105 transition-transform"
                  />
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#FAF0E6] text-[#842021] border border-[#E8D6C3]">
                    Batch #{batch.batchNumber || batch.id}
                  </span>
                </div>

                <h3 className="font-extrabold text-lg text-[#2C221E] group-hover:text-[#9E2A2B] transition-colors">{batch.name}</h3>
                {batch.slogan && (
                  <p className="text-xs font-semibold text-[#9E2A2B] italic line-clamp-1">{batch.slogan}</p>
                )}
                <p className="text-[11px] text-[#7C6E63] mt-0.5">Session: {batch.session}</p>

                {/* Batch Metrics Box */}
                <div className="my-4 p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8DCCF] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#2C221E]">
                    <Users className="w-4 h-4 text-[#D96B27]" />
                    <span>{batch.studentsCount || 0} Students</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#2C221E]">
                    <Shield className="w-4 h-4 text-[#9E2A2B]" />
                    <span>{batch.teamsCount || 0} Teams</span>
                  </div>
                </div>
              </div>

              {/* View Showcase Link */}
              <div className="pt-3 border-t border-[#EFE8DC] flex items-center justify-between text-xs text-[#9E2A2B] font-bold">
                <span>View Batch Showcase</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
};

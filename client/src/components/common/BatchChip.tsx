import React from "react";
import { Link } from "react-router-dom";
import { SmartAvatar } from "./SmartAvatar";

export interface BatchChipProps {
  name: string;
  session?: string | null;
  slug?: string | null;
  avatarUrl?: string | null;
  batchNumber?: number | null;
  size?: "xs" | "sm" | "md";
  variant?: "inline" | "pill" | "badge";
  linkable?: boolean;
  className?: string;
}

export const BatchChip: React.FC<BatchChipProps> = ({
  name,
  session,
  slug,
  avatarUrl,
  batchNumber,
  size = "sm",
  variant = "pill",
  linkable = true,
  className = "",
}) => {
  const fallback = batchNumber ? `B${batchNumber}` : name.slice(0, 2);

  const content = (
    <span className={`inline-flex items-center gap-1.5 align-middle select-none ${
      variant === "pill"
        ? "bg-[#FAF0E6] hover:bg-[#FAF7F2] text-[#842021] border border-[#E8D6C3] px-2.5 py-1 rounded-full text-xs font-black transition-colors shadow-2xs"
        : variant === "badge"
        ? "bg-white text-[#2C221E] border border-[#E5DACB] px-2 py-0.5 rounded-xl text-xs font-extrabold shadow-2xs"
        : "text-inherit font-bold"
    } ${className}`}>
      
      {/* Batch Crest Logo */}
      <SmartAvatar
        src={avatarUrl}
        alt={name}
        fallbackText={fallback}
        size={size}
        shape="circle"
        className="shrink-0 ring-1 ring-black/5"
      />

      {/* Batch Title */}
      <span className="truncate">
        <span>{name}</span>
        {session && (
          <span className="text-[10px] text-[#7C6E63] font-normal ml-1">
            ({session})
          </span>
        )}
      </span>
    </span>
  );

  if (linkable && (slug || batchNumber)) {
    const targetSlug = slug || `batch-${batchNumber}`;
    return (
      <Link
        to={`/batches/${targetSlug}`}
        className="inline-flex items-center text-inherit hover:opacity-90 transition-opacity group cursor-pointer"
        title={`View ${name} Batch Showcase`}
      >
        {content}
      </Link>
    );
  }

  return content;
};

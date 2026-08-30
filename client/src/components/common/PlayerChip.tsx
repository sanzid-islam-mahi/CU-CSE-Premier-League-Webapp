import React from "react";
import { Link } from "react-router-dom";
import { SmartAvatar } from "./SmartAvatar";

export interface PlayerChipProps {
  name: string;
  studentId?: string | null;
  avatarUrl?: string | null;
  jerseyNo?: number | string | null;
  isCaptain?: boolean;
  role?: string | null;
  size?: "xs" | "sm" | "md";
  variant?: "inline" | "badge" | "card";
  linkable?: boolean;
  className?: string;
  subtitle?: string | null;
}

export const PlayerChip: React.FC<PlayerChipProps> = ({
  name,
  studentId,
  avatarUrl,
  jerseyNo,
  isCaptain = false,
  role,
  size = "sm",
  variant = "inline",
  linkable = true,
  className = "",
  subtitle,
}) => {
  const content = (
    <span className={`inline-flex items-center gap-1.5 align-middle select-none ${
      variant === "badge" 
        ? "bg-[#FAF7F2] hover:bg-[#FAF0E6] border border-[#E8DCCF] hover:border-[#E8D6C3] px-2 py-0.5 rounded-full transition-colors shadow-2xs" 
        : variant === "card"
        ? "p-2.5 bg-white rounded-2xl border border-[#E5DACB] hover:border-[#9E2A2B] transition-all shadow-xs"
        : ""
    } ${className}`}>
      
      {/* Avatar Headshot */}
      <SmartAvatar
        src={avatarUrl}
        alt={name}
        fallbackText={name}
        size={size}
        shape="circle"
        className="shrink-0 ring-1 ring-black/5"
      />

      {/* Name and Tags */}
      <span className="flex items-center gap-1 text-inherit">
        <span className="font-extrabold tracking-tight truncate">
          {name}
        </span>

        {isCaptain && (
          <span className="text-[11px] shrink-0" title="Team Captain">👑</span>
        )}

        {jerseyNo !== null && jerseyNo !== undefined && (
          <span className="font-mono text-[10px] font-black text-[#9E2A2B] bg-[#FAF0E6] px-1.5 py-0.2 rounded border border-[#E8D6C3] shrink-0">
            #{jerseyNo}
          </span>
        )}

        {role && (
          <span className="text-[9px] font-bold text-[#7C6E63] bg-white px-1.5 py-0.2 rounded border border-[#E8DCCF] shrink-0">
            {role}
          </span>
        )}
      </span>

      {subtitle && (
        <span className="text-[10px] text-[#7C6E63] font-normal block truncate">
          {subtitle}
        </span>
      )}
    </span>
  );

  if (linkable && studentId) {
    return (
      <Link
        to={`/players/${studentId}`}
        className="inline-flex items-center text-inherit hover:text-[#9E2A2B] transition-colors group cursor-pointer"
        title={`View ${name}'s Player Profile`}
      >
        {content}
      </Link>
    );
  }

  return content;
};

import React, { useState, useEffect } from "react";

interface SmartAvatarProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackText?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  shape?: "circle" | "rounded" | "square";
  badge?: string;
}

export const SmartAvatar: React.FC<SmartAvatarProps> = ({
  src,
  alt,
  className = "",
  fallbackText,
  size = "md",
  shape = "circle",
  badge,
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const sizeClasses = {
    xs: "w-5 h-5 text-[9px] font-black",
    sm: "w-7 h-7 text-[10px] font-bold",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
    xl: "w-20 h-20 text-xl",
    "2xl": "w-28 h-28 text-2xl font-black",
  };

  const shapeClasses = {
    circle: "rounded-full",
    rounded: "rounded-2xl",
    square: "rounded-lg",
  };

  const initials = (fallbackText || alt || "?")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const showImage = Boolean(src) && !hasError;

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      {showImage ? (
        <img
          src={src!}
          alt={alt}
          onError={() => setHasError(true)}
          className={`${sizeClasses[size]} ${shapeClasses[shape]} object-cover border-2 border-white/80 shadow-xs bg-[#FAF0E6]`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} ${shapeClasses[shape]} brick-gradient text-white flex items-center justify-center font-black shadow-xs border-2 border-white/80 select-none`}
        >
          {initials}
        </div>
      )}

      {badge && (
        <span className="absolute -bottom-1 -right-1 bg-[#9E2A2B] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border border-white shadow-xs">
          {badge}
        </span>
      )}
    </div>
  );
};

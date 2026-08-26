import React from "react";

interface DummyBadgeProps {
  label?: string;
  className?: string;
  variant?: "warning" | "neutral" | "subtle";
}

export const DummyBadge: React.FC<DummyBadgeProps> = ({
  label = "DEMO / SAMPLE DATA",
  className = "",
  variant = "warning",
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-2xs border ${
        variant === "warning"
          ? "bg-[#FFF9DB] text-[#D9480F] border-[#FFD43B]"
          : variant === "subtle"
          ? "bg-[#FAF0E6] text-[#842021] border-[#E8D6C3]"
          : "bg-[#F1F3F5] text-[#495057] border-[#CED4DA]"
      } ${className}`}
      title="This section contains sample/mock demonstration data."
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[#E8590C] animate-pulse" />
      <span>{label}</span>
    </span>
  );
};

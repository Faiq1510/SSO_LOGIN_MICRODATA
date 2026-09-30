import React from "react";

type StatusValue = "menunggu" | "aktif" | "selesai" | "ditolak" | "hadir" | "izin" | "alpha";

interface BadgeStatusProps {
  status: StatusValue | string;
  size?: "sm" | "base";
}

const BadgeStatus: React.FC<BadgeStatusProps> = ({ status, size = "base" }) => {
  const normalizedStatus = status.toLowerCase() as StatusValue;

  let colorClasses: string;
  let displayLabel: string;

  switch (normalizedStatus) {
    case "aktif":
    case "hadir":
      colorClasses = "bg-status-active/10 text-status-active border-status-active/20";
      displayLabel = normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
      break;
    case "menunggu":
    case "izin":
      colorClasses = "bg-status-pending/10 text-status-pending border-status-pending/20";
      displayLabel = normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
      break;
    case "selesai":
      colorClasses = "bg-status-done/10 text-status-done border-status-done/20";
      displayLabel = "Selesai";
      break;
    case "ditolak":
    case "alpha":
      colorClasses = "bg-status-reject/10 text-status-reject border-status-reject/20";
      displayLabel = normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
      break;
    default:
      colorClasses = "bg-surface-2 text-text-muted border-border-base";
      displayLabel = status;
      break;
  }

  const showPulse = normalizedStatus === "aktif" || normalizedStatus === "hadir";
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs";

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium border rounded-full ${colorClasses} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full bg-current opacity-80 ${showPulse ? "animate-pulse" : ""}`} />
      {displayLabel}
    </span>
  );
};

export default BadgeStatus;

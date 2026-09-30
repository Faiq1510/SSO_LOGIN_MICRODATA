import React from "react";
import { Check, X } from "lucide-react";

interface PklLifecycleRailProps {
  stage: "belum_daftar" | "menunggu" | "aktif" | "selesai" | "ditolak";
  variant: "hero" | "sidebar" | "onboarding";
}

const PklLifecycleRail: React.FC<PklLifecycleRailProps> = ({ stage, variant }) => {
  const steps = [
    { id: "daftar", label: "Daftar", desc: "Pengajuan PKL" },
    { id: "aktif", label: "Aktif", desc: "Pelaksanaan PKL" },
    { id: "selesai", label: "Selesai", desc: "Penilaian & Sertifikat" },
  ];

  const getStepStatus = (stepIndex: number) => {
    if (stage === "ditolak" && stepIndex === 0) return "rejected";
    if (stage === "ditolak" && stepIndex > 0) return "muted";

    if (stage === "belum_daftar") {
      if (stepIndex === 0) return "current";
      return "muted";
    }

    if (stage === "menunggu") {
      if (stepIndex === 0) return "pending";
      return "muted";
    }

    if (stage === "aktif") {
      if (stepIndex === 0) return "completed";
      if (stepIndex === 1) return "current";
      return "muted";
    }

    if (stage === "selesai") {
      return "completed";
    }

    return "muted";
  };

  const isRailActive = (stepIndex: number) => {
    if (stage === "ditolak") return false;
    if (stage === "aktif" && stepIndex === 0) return true;
    if (stage === "selesai") return true;
    return false;
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "hero":
        return {
          container: "flex items-center justify-between max-w-sm mx-auto",
          nodeSize: "w-10 h-10",
          iconSize: "w-5 h-5",
          labelSize: "text-sm mt-3",
          descSize: "text-xs mt-1",
          lineWidth: "mx-4",
        };
      case "sidebar":
        return {
          container: "flex items-center justify-between px-2",
          nodeSize: "w-6 h-6",
          iconSize: "w-3 h-3",
          labelSize: "text-[10px] mt-2",
          descSize: "hidden",
          lineWidth: "mx-2",
        };
      case "onboarding":
        return {
          container: "flex items-center justify-between w-full max-w-2xl mx-auto",
          nodeSize: "w-10 h-10 sm:w-12 sm:h-12",
          iconSize: "w-5 h-5 sm:w-6 sm:h-6",
          labelSize: "text-xs sm:text-base mt-2 sm:mt-4",
          descSize: "text-[10px] sm:text-xs mt-1 sm:mt-2",
          lineWidth: "mx-2 sm:mx-4",
        };
      default:
        return {
          container: "flex items-center justify-between",
          nodeSize: "w-8 h-8",
          iconSize: "w-4 h-4",
          labelSize: "text-xs mt-2",
          descSize: "text-xs mt-1",
          lineWidth: "mx-2",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="w-full relative">
      <div className={styles.container}>
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const activeRailBefore = index > 0 ? isRailActive(index - 1) : false;

          let nodeClasses = "rounded-full flex items-center justify-center shrink-0 transition-all duration-500 z-10 ";
          let labelClasses = "font-mono-data font-medium text-center transition-colors duration-500 ";
          const descClasses = "font-mono-data text-text-muted text-center transition-colors duration-500 ";

          switch (status) {
            case "completed":
              nodeClasses += "bg-brand border-2 border-brand text-white";
              labelClasses += "text-text-primary";
              break;
            case "current":
              nodeClasses += "bg-surface-1 border-2 border-brand text-brand shadow-[0_0_15px_rgba(232,117,26,0.3)]";
              labelClasses += "text-brand";
              break;
            case "pending":
              nodeClasses += "bg-brand border-2 border-brand text-white animate-rail-pulse";
              labelClasses += "text-brand";
              break;
            case "rejected":
              nodeClasses += "bg-status-reject border-2 border-status-reject text-white";
              labelClasses += "text-status-reject";
              break;
            case "muted":
            default:
              nodeClasses += "bg-surface-2 border-2 border-border-base text-text-muted";
              labelClasses += "text-text-muted";
              break;
          }

          return (
            <React.Fragment key={step.id}>
              {index > 0 && <div className={`flex-1 h-px ${styles.lineWidth} transition-colors duration-500 ${activeRailBefore ? "bg-brand" : "bg-border-base"}`} />}
              <div className="flex flex-col items-center relative group">
                <div className={`${nodeClasses} ${styles.nodeSize}`}>
                  {status === "completed" && <Check className={styles.iconSize} strokeWidth={3} />}
                  {status === "rejected" && <X className={styles.iconSize} strokeWidth={3} />}
                  {(status === "current" || status === "muted") && <span className="w-2 h-2 rounded-full bg-current opacity-50" />}
                  {status === "pending" && <span className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-24 mt-2 flex flex-col items-center text-center">
                  <span className={`${labelClasses} ${styles.labelSize}`}>{step.label}</span>
                  {styles.descSize !== "hidden" && <span className={`${descClasses} ${styles.descSize}`}>{step.desc}</span>}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      {/* Spacer to account for absolute positioned labels below */}
      <div className={variant === "hero" ? "h-16" : variant === "onboarding" ? "h-16 sm:h-20" : "h-10"} />
    </div>
  );
};

export default PklLifecycleRail;

import React from "react";

interface SectionRuleProps {
  label?: string;
}

const SectionRule: React.FC<SectionRuleProps> = ({ label }) => {
  if (label) {
    return (
      <div className="flex items-center gap-4 my-8">
        <div className="flex-1 h-px bg-border-subtle" />
        <span className="font-mono-data text-xs text-text-muted uppercase tracking-widest shrink-0">{label}</span>
        <div className="flex-1 h-px bg-border-subtle" />
      </div>
    );
  }

  return <hr className="border-border-subtle my-8" />;
};

export default SectionRule;

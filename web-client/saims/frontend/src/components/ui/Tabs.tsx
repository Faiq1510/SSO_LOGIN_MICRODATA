import React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: React.ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  containerClassName?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  className,
  containerClassName,
}: TabsProps) {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
        containerClassName
      )}
    >
      <div className={cn("flex bg-gray-100 dark:bg-gray-800/50 p-1 rounded-lg gap-1 min-w-max", className)}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "flex-1 sm:flex-none text-xs px-3 py-1.5 font-bold rounded-md transition-all",
                isActive
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs"
                  : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1 opacity-70">({tab.count})</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderCardProps {
  moduleBadge?: string;
  badgeColorClass?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconColorClass?: string;
  rightContent?: ReactNode;
}

export default function PageHeaderCard({
  moduleBadge,
  badgeColorClass = 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  title,
  description,
  icon: Icon,
  iconColorClass = 'text-emerald-600',
  rightContent
}: PageHeaderCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
      <div className="space-y-1 w-full">
        {moduleBadge && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${badgeColorClass}`}>
            {moduleBadge}
          </span>
        )}
        <h2 className="text-xl font-bold font-display text-gray-900 dark:text-white mt-1 flex items-center gap-2">
          {Icon && <Icon className={`w-5 h-5 ${iconColorClass}`} />}
          {title}
        </h2>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {rightContent && (
        <div className="flex gap-4 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800 pt-4 md:pt-0 md:pl-6 w-full md:w-auto shrink-0 mt-2 md:mt-0 items-center justify-start md:justify-end">
          {rightContent}
        </div>
      )}
    </div>
  );
}

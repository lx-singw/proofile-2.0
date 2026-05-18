"use client";

import { Briefcase, Calendar, ShieldCheck, Users } from "lucide-react";

interface EligibilityBadgesProps {
  eligibility?: {
    age_min?: number;
    age_max?: number;
    citizenship?: string;
    employment_status?: string;
    disability_friendly?: boolean;
  };
  education_level?: string;
  experience_years?: {
    min?: number;
    max?: number;
  };
}

export function EligibilityBadges({ eligibility, education_level, experience_years }: EligibilityBadgesProps) {
  if (!eligibility && !education_level && !experience_years) return null;

  const hasAnyData = eligibility?.age_min || eligibility?.age_max || eligibility?.citizenship || 
                     eligibility?.employment_status || eligibility?.disability_friendly || 
                     education_level || experience_years;

  if (!hasAnyData) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {eligibility?.age_min && eligibility?.age_max && (
        <span className="flex items-center gap-1.5 px-3 py-2 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 text-sm font-medium rounded-lg border border-cyan-500/20">
          <Calendar size={14} />
          Age: {eligibility.age_min}-{eligibility.age_max} years
        </span>
      )}
      
      {eligibility?.citizenship && (
        <span className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 text-green-700 dark:text-green-400 text-sm font-medium rounded-lg border border-green-500/20">
          <ShieldCheck size={14} />
          {eligibility.citizenship} Citizen
        </span>
      )}
      
      {eligibility?.employment_status && (
        <span className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm font-medium rounded-lg border border-amber-500/20">
          <Briefcase size={14} />
          Must be {eligibility.employment_status}
        </span>
      )}
      
      {eligibility?.disability_friendly && (
        <span className="flex items-center gap-1.5 px-3 py-2 bg-purple-500/10 text-purple-700 dark:text-purple-400 text-sm font-medium rounded-lg border border-purple-500/20">
          <Users size={14} />
          Disability-friendly
        </span>
      )}
      
      {education_level && (
        <span className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-sm font-medium rounded-lg border border-indigo-500/20">
          🎓 {typeof education_level === 'string' 
            ? education_level.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
            : String(education_level)}
        </span>
      )}
      
      {experience_years && (experience_years.min || experience_years.max) && (
        <span className="flex items-center gap-1.5 px-3 py-2 bg-teal-500/10 text-teal-700 dark:text-teal-400 text-sm font-medium rounded-lg border border-teal-500/20">
          <Briefcase size={14} />
          {experience_years.min}{experience_years.max ? `-${experience_years.max}` : '+'} years exp
        </span>
      )}
    </div>
  );
}

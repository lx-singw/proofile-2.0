"use client";

interface RequiredDocumentsProps {
  documents: string[];
}

const DOC_LABELS: Record<string, { label: string; icon: string }> = {
  'cv': { label: 'CV / Resume', icon: '📄' },
  'id': { label: 'ID Copy', icon: '🪪' },
  'matric': { label: 'Matric Certificate', icon: '🎓' },
  'qualification': { label: 'Qualification', icon: '📜' },
  'academic_record': { label: 'Academic Record', icon: '📊' },
  'transcript': { label: 'Academic Transcript', icon: '📊' },
  'proof_residence': { label: 'Proof of Residence', icon: '🏠' },
  'drivers_license': { label: "Driver's License", icon: '🚗' },
  'reference': { label: 'References', icon: '✉️' },
  'cover_letter': { label: 'Cover Letter', icon: '📝' },
  'portfolio': { label: 'Portfolio', icon: '💼' },
};

export function RequiredDocuments({ documents }: RequiredDocumentsProps) {
  if (!documents || documents.length === 0) return null;

  const uniqueDocs = new Map();
  documents.forEach((doc: string) => {
    const lower = doc.toLowerCase();
    const mapped = DOC_LABELS[lower];
    const key = mapped ? mapped.label : lower;
    
    if (!uniqueDocs.has(key)) {
      uniqueDocs.set(key, { 
        label: mapped ? mapped.label : doc,
        icon: mapped ? mapped.icon : '📎' 
      });
    }
  });

  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from(uniqueDocs.values()).map((docInfo: any, i: number) => (
        <div 
          key={i} 
          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
        >
          <span className="text-lg">{docInfo.icon}</span>
          <span className="font-medium text-gray-900 dark:text-white text-sm">{docInfo.label}</span>
        </div>
      ))}
    </div>
  );
}

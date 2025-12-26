import { FileText, File, Sheet, Presentation, Image as ImageIcon, Code, Archive, Video, Music, FileSpreadsheet } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface FileTypeConfig {
  icon: LucideIcon;
  gradient: string;
  gradientColors: { from: string; to: string };
  bgColor: string;
  borderColor: string;
  textColor: string;
}

export const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

export const getFileTypeConfig = (filename: string): FileTypeConfig => {
  const extension = getFileExtension(filename);

  switch (extension) {
    // PDF
    case 'pdf':
      return {
        icon: FileText,
        gradient: 'from-red-500 to-red-600',
        gradientColors: { from: '#ef4444', to: '#dc2626' },
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-600'
      };

    // Word Documents
    case 'doc':
    case 'docx':
      return {
        icon: FileText,
        gradient: 'from-blue-500 to-blue-600',
        gradientColors: { from: '#3b82f6', to: '#2563eb' },
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-600'
      };

    // Excel/Spreadsheets
    case 'xls':
    case 'xlsx':
    case 'csv':
      return {
        icon: FileSpreadsheet,
        gradient: 'from-green-500 to-green-600',
        gradientColors: { from: '#22c55e', to: '#16a34a' },
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-600'
      };

    // PowerPoint
    case 'ppt':
    case 'pptx':
      return {
        icon: Presentation,
        gradient: 'from-orange-500 to-orange-600',
        gradientColors: { from: '#f97316', to: '#ea580c' },
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-600'
      };

    // Images
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'svg':
    case 'webp':
      return {
        icon: ImageIcon,
        gradient: 'from-purple-500 to-purple-600',
        gradientColors: { from: '#a855f7', to: '#9333ea' },
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        textColor: 'text-purple-600'
      };

    // Code Files
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'py':
    case 'java':
    case 'cpp':
    case 'c':
    case 'html':
    case 'css':
    case 'json':
    case 'xml':
      return {
        icon: Code,
        gradient: 'from-indigo-500 to-indigo-600',
        gradientColors: { from: '#6366f1', to: '#4f46e5' },
        bgColor: 'bg-indigo-50',
        borderColor: 'border-indigo-200',
        textColor: 'text-indigo-600'
      };

    // Archive Files
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return {
        icon: Archive,
        gradient: 'from-yellow-500 to-yellow-600',
        gradientColors: { from: '#eab308', to: '#ca8a04' },
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-600'
      };

    // Video Files
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'wmv':
    case 'flv':
    case 'webm':
      return {
        icon: Video,
        gradient: 'from-pink-500 to-pink-600',
        gradientColors: { from: '#ec4899', to: '#db2777' },
        bgColor: 'bg-pink-50',
        borderColor: 'border-pink-200',
        textColor: 'text-pink-600'
      };

    // Audio Files
    case 'mp3':
    case 'wav':
    case 'flac':
    case 'aac':
    case 'ogg':
      return {
        icon: Music,
        gradient: 'from-teal-500 to-teal-600',
        gradientColors: { from: '#14b8a6', to: '#0d9488' },
        bgColor: 'bg-teal-50',
        borderColor: 'border-teal-200',
        textColor: 'text-teal-600'
      };

    // Text Files
    case 'txt':
    case 'md':
      return {
        icon: File,
        gradient: 'from-gray-500 to-gray-600',
        gradientColors: { from: '#6b7280', to: '#4b5563' },
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-600'
      };

    // Default
    default:
      return {
        icon: FileText,
        gradient: 'from-slate-500 to-slate-600',
        gradientColors: { from: '#64748b', to: '#475569' },
        bgColor: 'bg-slate-50',
        borderColor: 'border-slate-200',
        textColor: 'text-slate-600'
      };
  }
};
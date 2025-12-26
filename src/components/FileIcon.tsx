import { FileText } from 'lucide-react';

interface FileIconProps {
  fileName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

const getFileTypeStyle = (extension: string) => {
  const styles: Record<string, { bg: string; label: string; text: string }> = {
    // Documents
    pdf: { bg: 'bg-gradient-to-br from-red-500 to-red-600', label: 'PDF', text: 'text-white' },
    doc: { bg: 'bg-gradient-to-br from-blue-500 to-blue-600', label: 'DOC', text: 'text-white' },
    docx: { bg: 'bg-gradient-to-br from-blue-500 to-blue-600', label: 'DOC', text: 'text-white' },
    
    // Spreadsheets
    xls: { bg: 'bg-gradient-to-br from-green-500 to-green-600', label: 'XLS', text: 'text-white' },
    xlsx: { bg: 'bg-gradient-to-br from-green-500 to-green-600', label: 'XLS', text: 'text-white' },
    csv: { bg: 'bg-gradient-to-br from-lime-500 to-lime-600', label: 'CSV', text: 'text-white' },
    
    // Presentations
    ppt: { bg: 'bg-gradient-to-br from-orange-500 to-orange-600', label: 'PPT', text: 'text-white' },
    pptx: { bg: 'bg-gradient-to-br from-orange-500 to-orange-600', label: 'PPT', text: 'text-white' },
    
    // Images
    jpg: { bg: 'bg-gradient-to-br from-cyan-500 to-cyan-600', label: 'JPG', text: 'text-white' },
    jpeg: { bg: 'bg-gradient-to-br from-cyan-500 to-cyan-600', label: 'JPG', text: 'text-white' },
    png: { bg: 'bg-gradient-to-br from-cyan-500 to-cyan-600', label: 'PNG', text: 'text-white' },
    gif: { bg: 'bg-gradient-to-br from-teal-500 to-teal-600', label: 'GIF', text: 'text-white' },
    svg: { bg: 'bg-gradient-to-br from-yellow-500 to-yellow-600', label: 'SVG', text: 'text-white' },
    webp: { bg: 'bg-gradient-to-br from-purple-500 to-purple-600', label: 'WEBP', text: 'text-white' },
    
    // Video
    mp4: { bg: 'bg-gradient-to-br from-red-500 to-red-600', label: 'MP4', text: 'text-white' },
    avi: { bg: 'bg-gradient-to-br from-purple-600 to-purple-700', label: 'AVI', text: 'text-white' },
    mov: { bg: 'bg-gradient-to-br from-pink-500 to-pink-600', label: 'MOV', text: 'text-white' },
    wmv: { bg: 'bg-gradient-to-br from-pink-500 to-pink-600', label: 'WMV', text: 'text-white' },
    
    // Audio
    mp3: { bg: 'bg-gradient-to-br from-red-500 to-red-600', label: 'MP3', text: 'text-white' },
    wav: { bg: 'bg-gradient-to-br from-pink-500 to-pink-600', label: 'WAV', text: 'text-white' },
    flac: { bg: 'bg-gradient-to-br from-pink-600 to-pink-700', label: 'FLAC', text: 'text-white' },
    
    // Code
    html: { bg: 'bg-gradient-to-br from-lime-500 to-lime-600', label: 'HTML', text: 'text-white' },
    css: { bg: 'bg-gradient-to-br from-green-500 to-green-600', label: 'CSS', text: 'text-white' },
    js: { bg: 'bg-gradient-to-br from-yellow-500 to-yellow-600', label: 'JS', text: 'text-white' },
    jsx: { bg: 'bg-gradient-to-br from-yellow-500 to-yellow-600', label: 'JSX', text: 'text-white' },
    ts: { bg: 'bg-gradient-to-br from-blue-500 to-blue-600', label: 'TS', text: 'text-white' },
    tsx: { bg: 'bg-gradient-to-br from-blue-500 to-blue-600', label: 'TSX', text: 'text-white' },
    py: { bg: 'bg-gradient-to-br from-blue-600 to-blue-700', label: 'PY', text: 'text-white' },
    xml: { bg: 'bg-gradient-to-br from-orange-500 to-orange-600', label: 'XML', text: 'text-white' },
    json: { bg: 'bg-gradient-to-br from-yellow-500 to-yellow-600', label: 'JSON', text: 'text-white' },
    
    // Archives
    zip: { bg: 'bg-gradient-to-br from-yellow-500 to-yellow-600', label: 'ZIP', text: 'text-white' },
    rar: { bg: 'bg-gradient-to-br from-purple-600 to-purple-700', label: 'RAR', text: 'text-white' },
    '7z': { bg: 'bg-gradient-to-br from-gray-600 to-gray-700', label: '7Z', text: 'text-white' },
    
    // Text
    txt: { bg: 'bg-gradient-to-br from-gray-500 to-gray-600', label: 'TXT', text: 'text-white' },
    md: { bg: 'bg-gradient-to-br from-gray-500 to-gray-600', label: 'MD', text: 'text-white' },
    
    // Special
    dll: { bg: 'bg-gradient-to-br from-purple-600 to-purple-700', label: 'DLL', text: 'text-white' },
    exe: { bg: 'bg-gradient-to-br from-gray-600 to-gray-700', label: 'EXE', text: 'text-white' },
  };

  return styles[extension] || { bg: 'bg-gradient-to-br from-gray-500 to-gray-600', label: 'FILE', text: 'text-white' };
};

export function FileIcon({ fileName, size = 'md', className = '' }: FileIconProps) {
  const extension = getFileExtension(fileName);
  const style = getFileTypeStyle(extension);

  const sizes = {
    sm: {
      container: 'w-10 h-12',
      label: 'text-[8px] px-1 py-0.5',
      icon: 'w-4 h-4'
    },
    md: {
      container: 'w-14 h-16',
      label: 'text-[9px] px-1.5 py-0.5',
      icon: 'w-6 h-6'
    },
    lg: {
      container: 'w-20 h-24',
      label: 'text-[10px] px-2 py-1',
      icon: 'w-8 h-8'
    }
  };

  const sizeConfig = sizes[size];

  return (
    <div className={`${sizeConfig.container} relative flex-shrink-0 ${className} transition-transform hover:scale-110 hover:animate-bounce cursor-pointer`}>
      {/* File Body */}
      <div className="absolute inset-0 bg-white rounded-sm shadow-md border border-gray-200 transition-shadow hover:shadow-lg">
        {/* Fold Corner */}
        <div className="absolute top-0 right-0 w-3 h-3 bg-gray-200" 
             style={{ 
               clipPath: 'polygon(100% 0, 100% 100%, 0 0)',
             }}
        />
        
        {/* File Icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <FileText className={sizeConfig.icon} />
        </div>
        
        {/* Document Lines */}
        <div className="absolute bottom-2 left-2 right-2 space-y-1 opacity-20">
          <div className="h-0.5 bg-gray-400 rounded w-3/4"></div>
          <div className="h-0.5 bg-gray-400 rounded w-full"></div>
          <div className="h-0.5 bg-gray-400 rounded w-2/3"></div>
        </div>
      </div>

      {/* File Type Label */}
      <div className={`absolute top-0 left-0 ${style.bg} ${style.text} ${sizeConfig.label} rounded-sm shadow-md z-10 transition-all`}>
        <span className="font-bold tracking-tight">{style.label}</span>
      </div>
    </div>
  );
}
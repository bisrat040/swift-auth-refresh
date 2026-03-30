import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

interface DocumentUploaderProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  existingDocuments?: { name: string; type: string; date: string }[];
  onRemoveExisting?: (name: string) => void;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({ 
  onFilesChange, 
  maxFiles = 5,
  existingDocuments = [],
  onRemoveExisting
}) => {
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      toast.error('Some files were rejected. Only PDF and DOCX are allowed.');
    }

    const newFiles = [...files, ...acceptedFiles].slice(0, maxFiles);
    setFiles(newFiles);
    onFilesChange(newFiles);
  }, [files, maxFiles, onFilesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc']
    },
    maxFiles
  });

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesChange(newFiles);
    toast.success('Temporary upload removed');
  };

  return (
    <div className="space-y-6">
      <div 
        {...getRootProps()} 
        className={cn(
          "border-2 border-dashed rounded-[2rem] p-10 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group shadow-inner",
          isDragActive ? "border-indigo-600 bg-indigo-50/50 shadow-indigo-100" : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50"
        )}
      >
        <input {...getInputProps()} />
        <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
          <Upload className="w-7 h-7" />
        </div>
        <div className="text-center">
          <p className="text-sm font-black text-slate-900">Click or drag documents here</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">PDF, DOCX up to 10MB (Max {maxFiles} files)</p>
        </div>
      </div>

      {(files.length > 0 || existingDocuments.length > 0) && (
        <div className="space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Active Agreement Attachments</p>
          
          <div className="space-y-2">
            {existingDocuments.map((doc, idx) => (
              <div key={`existing-${idx}`} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-inner">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-700">{doc.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Verified on {doc.date}</p>
                  </div>
                </div>
                <button 
                  onClick={() => onRemoveExisting?.(doc.name)}
                  className="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
                  title="Delete Document"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>
            ))}

            {files.map((file, idx) => (
              <div key={`new-${idx}`} className="flex items-center justify-between p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl shadow-sm group animate-in slide-in-from-left-2 duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shadow-inner">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-700">{file.name}</p>
                    <p className="text-[10px] text-indigo-500 uppercase font-black tracking-[0.1em]">New Upload • Ready</p>
                  </div>
                </div>
                <button 
                  onClick={() => removeFile(idx)}
                  className="p-2.5 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-90 shadow-sm border border-slate-100"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
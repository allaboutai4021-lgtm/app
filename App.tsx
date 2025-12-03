import React, { useState, useCallback, useRef } from 'react';
import { 
  AppState, 
  ImageFile, 
  ProcessingStatus, 
  UpscaleFactor, 
  DpiOutput,
  ImageSettings 
} from './types';
import { SettingsPanel } from './components/SettingsPanel';
import { ImageCard } from './components/ImageCard';
import { processImage } from './services/imageProcessor';
import { ICONS, MAX_FILES } from './constants';

const DEFAULT_SETTINGS: ImageSettings = {
  upscaleFactor: UpscaleFactor.X4,
  dpi: DpiOutput.DPI_300,
  preserveStyle: true,
  enabled: true
};

const App: React.FC = () => {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [globalSettings, setGlobalSettings] = useState<ImageSettings>(DEFAULT_SETTINGS);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---

  const handleFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;
    
    const validFiles = Array.from(newFiles).filter(file => file.type.startsWith('image/'));
    
    if (files.length + validFiles.length > MAX_FILES) {
      alert(`Maximum ${MAX_FILES} images allowed in a batch.`);
      return;
    }

    const processedFiles: ImageFile[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      originalName: file.name,
      previewUrl: URL.createObjectURL(file),
      status: ProcessingStatus.IDLE,
      settings: { ...globalSettings },
      width: 0,
      height: 0
    }));

    // Update dimensions async
    processedFiles.forEach(pf => {
      const img = new Image();
      img.onload = () => {
        setFiles(prev => prev.map(f => f.id === pf.id ? { ...f, width: img.width, height: img.height } : f));
      };
      img.src = pf.previewUrl;
    });

    setFiles(prev => [...prev, ...processedFiles]);
  }, [files, globalSettings]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const updateGlobalSettings = (newSettings: Partial<ImageSettings>) => {
    setGlobalSettings(prev => {
      const updated = { ...prev, ...newSettings };
      // Also update all IDLE files
      setFiles(files => files.map(f => 
        f.status === ProcessingStatus.IDLE 
          ? { ...f, settings: { ...f.settings, ...newSettings } } 
          : f
      ));
      return updated;
    });
  };

  const updateFileSettings = (id: string, newSettings: Partial<ImageSettings>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, settings: { ...f.settings, ...newSettings } } : f));
  };

  const updateFileAnalysis = (id: string, analysis: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, analysis } : f));
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const processBatch = async () => {
    setIsProcessingBatch(true);
    
    // Process strictly sequentially or parallel limited (let's do sequential for demo clarity/CPU)
    const filesToProcess = files.filter(f => f.status === ProcessingStatus.IDLE || f.status === ProcessingStatus.ERROR);
    
    for (const file of filesToProcess) {
      // Set status to processing
      setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: ProcessingStatus.PROCESSING } : f));
      
      try {
        const resultUrl = await processImage(file, (progress) => {
          // Could update progress state here if we had a progress bar per card
        });
        
        setFiles(prev => prev.map(f => f.id === file.id ? { 
          ...f, 
          status: ProcessingStatus.COMPLETED, 
          processedUrl: resultUrl 
        } : f));

      } catch (error) {
        setFiles(prev => prev.map(f => f.id === file.id ? { 
          ...f, 
          status: ProcessingStatus.ERROR, 
          error: "Processing failed" 
        } : f));
      }
    }

    setIsProcessingBatch(false);
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-emerald-400 rounded-lg flex items-center justify-center text-white font-bold">
              U
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              UltraArt<span className="text-blue-500">Pro</span>
            </h1>
          </div>
          <div className="flex gap-4 items-center">
             <span className="text-xs font-medium px-2 py-1 bg-emerald-900/30 text-emerald-400 border border-emerald-800/50 rounded-full flex items-center gap-1">
               {ICONS.Check} v2.2 Transparency Safe
             </span>
             <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Help</a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        
        {/* Global Controls & Drop Zone Container */}
        <div className="space-y-8">
          
          {/* Hero / Empty State */}
          {files.length === 0 ? (
             <div 
               className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                 isDragging 
                 ? 'border-blue-500 bg-blue-500/10 scale-[1.02]' 
                 : 'border-slate-700 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-900'
               }`}
               onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
               onDragLeave={() => setIsDragging(false)}
               onDrop={handleDrop}
             >
               <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500">
                 {ICONS.Upload}
               </div>
               <h2 className="text-2xl font-bold text-white mb-2">Drag & Drop your transparent clipart here</h2>
               <p className="text-slate-400 max-w-md mx-auto mb-8">
                 Supports PNG, JPG, WEBP. Batch upscale up to {MAX_FILES} images simultaneously. <span className="text-emerald-400 font-medium">Transparency is strictly preserved. No background will be added.</span>
               </p>
               <button 
                 onClick={() => fileInputRef.current?.click()}
                 className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-blue-900/20 active:scale-95"
               >
                 Select Images
               </button>
             </div>
          ) : (
            <>
               {/* Global Settings Bar */}
               <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl">
                 <div className="flex items-center justify-between mb-4">
                   <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                     {ICONS.Settings} Batch Upscale Settings
                   </h2>
                   <button 
                     className="text-xs text-blue-400 hover:text-blue-300"
                     onClick={() => setFiles([])}
                   >
                     Clear All
                   </button>
                 </div>
                 <SettingsPanel 
                   settings={globalSettings} 
                   onUpdate={updateGlobalSettings} 
                   isGlobal={true} 
                 />
               </div>

               {/* Upload More Bar */}
               <div 
                 className="border border-dashed border-slate-700 rounded-lg p-4 flex items-center justify-center gap-4 cursor-pointer hover:bg-slate-800/50 hover:border-slate-600 transition-colors"
                 onClick={() => fileInputRef.current?.click()}
               >
                 <span className="text-slate-400 text-sm font-medium flex items-center gap-2">
                   {ICONS.Upload} Add more images ({files.length}/{MAX_FILES})
                 </span>
               </div>
            </>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {files.map((file) => (
              <ImageCard 
                key={file.id} 
                image={file} 
                onRemove={removeFile}
                onUpdateSettings={updateFileSettings}
                onAnalyze={updateFileAnalysis}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Sticky Action Bar */}
      <div className={`fixed bottom-0 left-0 right-0 p-4 border-t border-slate-800 bg-slate-950/80 backdrop-blur-lg transform transition-transform duration-300 ${files.length > 0 ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="hidden md:block text-sm text-slate-400">
            {files.filter(f => f.status === ProcessingStatus.COMPLETED).length} completed • {files.filter(f => f.status === ProcessingStatus.IDLE).length} pending
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto justify-end">
            <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold hidden sm:block">
              {files.length} Files Ready
            </span>
            <button 
              onClick={processBatch}
              disabled={isProcessingBatch || files.every(f => f.status === ProcessingStatus.COMPLETED)}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-8 py-3 rounded-xl font-bold text-base shadow-lg shadow-blue-900/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isProcessingBatch ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Upscaling...
                </>
              ) : (
                <>
                  {ICONS.Zap} Upscale All Images
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <input 
        type="file" 
        multiple 
        ref={fileInputRef} 
        onChange={(e) => handleFiles(e.target.files)} 
        className="hidden" 
        accept="image/png, image/jpeg, image/webp"
      />
    </div>
  );
};

export default App;
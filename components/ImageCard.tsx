import React, { useState } from 'react';
import { ImageFile, ProcessingStatus } from '../types';
import { ICONS } from '../constants';
import { analyzeImage } from '../services/geminiService';

interface ImageCardProps {
  image: ImageFile;
  onRemove: (id: string) => void;
  onUpdateSettings: (id: string, settings: any) => void;
  onAnalyze: (id: string, result: string) => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({ image, onRemove, onUpdateSettings, onAnalyze }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleMagicAnalyze = async () => {
    setIsAnalyzing(true);
    const result = await analyzeImage(image.file);
    onAnalyze(image.id, result);
    setIsAnalyzing(false);
  };

  const isProcessing = image.status === ProcessingStatus.PROCESSING;
  const isComplete = image.status === ProcessingStatus.COMPLETED;

  return (
    <div className="group relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-600 transition-all duration-300 shadow-lg">
      <div className="flex p-3 gap-4">
        {/* Thumbnail */}
        <div className="relative w-20 h-20 flex-shrink-0 bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
           {/* Transparency grid background */}
           <div className="absolute inset-0 opacity-20" 
                style={{backgroundImage: 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)', backgroundSize: '10px 10px'}} 
           />
           <img 
            src={isComplete && image.processedUrl ? image.processedUrl : image.previewUrl} 
            alt="Preview" 
            className="absolute inset-0 w-full h-full object-contain z-10" 
           />
           
           {/* Transparency Badge */}
           <div className="absolute top-0 right-0 bg-emerald-500/90 text-white text-[8px] font-bold px-1 rounded-bl shadow-sm z-20">
             TRANSPARENT
           </div>

           {isProcessing && (
             <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
               <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
           )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-slate-200 truncate max-w-[150px] md:max-w-[200px]">
                {image.originalName}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {Math.round(image.file.size / 1024)}KB • {image.width}x{image.height}px
              </p>
            </div>
            <button 
              onClick={() => onRemove(image.id)}
              className="text-slate-600 hover:text-red-400 transition-colors p-1"
              disabled={isProcessing}
            >
              {ICONS.Close}
            </button>
          </div>

          {/* Analysis Result or Status */}
          <div className="mt-2">
             {image.analysis ? (
               <div className="text-[10px] text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-900/50 inline-flex items-center gap-1">
                 {ICONS.Zap} {image.analysis.substring(0, 40)}{image.analysis.length > 40 ? '...' : ''}
               </div>
             ) : (
                <div className="flex gap-2">
                   {!isComplete && (
                    <button 
                        onClick={handleMagicAnalyze}
                        disabled={isAnalyzing || isProcessing}
                        className={`text-xs px-2 py-1 rounded border flex items-center gap-1 transition-all ${isAnalyzing ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-800 text-blue-400 border-slate-700 hover:border-blue-500 hover:text-blue-300'}`}
                    >
                        {isAnalyzing ? <span className="animate-pulse">Analyzing...</span> : <>{ICONS.Magic} Analyze Quality</>}
                    </button>
                   )}
                   {isComplete && (
                     <div className="text-xs text-blue-400 flex items-center gap-1">
                       {ICONS.Check} Processed
                     </div>
                   )}
                </div>
             )}
          </div>
        </div>
      </div>

      {/* Footer controls */}
      <div className="bg-slate-950/50 px-3 py-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
         <div className="flex gap-3">
            <span className="flex items-center gap-1">
              {ICONS.Maximize} {image.settings.upscaleFactor}x Upscale
            </span>
         </div>
         {isComplete && (
           <a 
             href={image.processedUrl} 
             download={`PROCESSED_${image.originalName}`}
             className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
           >
             {ICONS.Download} Save
           </a>
         )}
      </div>
    </div>
  );
};
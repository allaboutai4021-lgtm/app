import React from 'react';
import { UpscaleFactor, DpiOutput, ImageSettings } from '../types';

interface SettingsPanelProps {
  settings: ImageSettings;
  onUpdate: (newSettings: Partial<ImageSettings>) => void;
  isGlobal?: boolean;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onUpdate, isGlobal = false }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      {/* Upscale Factor */}
      <div className="flex flex-col gap-2">
        <label className="text-slate-400 font-medium text-xs uppercase tracking-wider">
          Upscale Resolution
        </label>
        <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
          {[UpscaleFactor.NONE, UpscaleFactor.X2, UpscaleFactor.X4, UpscaleFactor.X8].map((factor) => (
            <button
              key={factor}
              onClick={() => onUpdate({ upscaleFactor: factor })}
              className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${
                settings.upscaleFactor === factor
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {factor === 1 ? 'Off' : `${factor}×`}
            </button>
          ))}
        </div>
      </div>

      {/* DPI Output */}
      <div className="flex flex-col gap-2">
        <label className="text-slate-400 font-medium text-xs uppercase tracking-wider">
          Target DPI
        </label>
        <select
          value={settings.dpi}
          onChange={(e) => onUpdate({ dpi: Number(e.target.value) as DpiOutput })}
          className="bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none hover:bg-slate-750"
        >
          {Object.values(DpiOutput)
            .filter(v => typeof v === 'number')
            .map((dpi) => (
            <option key={dpi} value={dpi}>{dpi} DPI</option>
          ))}
        </select>
      </div>
    </div>
  );
};
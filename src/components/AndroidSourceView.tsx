import React, { useState, useMemo } from 'react';
import { ANDROID_STAGE1_FILES, AndroidSourceFile } from '../data/androidStage1Files';

const LAYER_FILTERS: ('All' | AndroidSourceFile['layer'])[] = [
  'All',
  'Services',
  'Compose UI',
  'Domain',
  'Room & DataStore',
  'Gradle & Manifest',
  'Tests & Docs',
];

export const AndroidSourceView: React.FC = () => {
  const [selectedLayer, setSelectedLayer] = useState<'All' | AndroidSourceFile['layer']>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPath, setSelectedPath] = useState(ANDROID_STAGE1_FILES[0].path);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const filteredFiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ANDROID_STAGE1_FILES.filter((file) => {
      const matchesLayer = selectedLayer === 'All' || file.layer === selectedLayer;
      const matchesQuery =
        !q ||
        file.path.toLowerCase().includes(q) ||
        file.summary.toLowerCase().includes(q);
      return matchesLayer && matchesQuery;
    });
  }, [selectedLayer, searchQuery]);

  const activeFile =
    ANDROID_STAGE1_FILES.find((f) => f.path === selectedPath) ??
    filteredFiles[0] ??
    ANDROID_STAGE1_FILES[0];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeFile.content);
      setCopiedPath(activeFile.path);
      window.setTimeout(() => setCopiedPath(null), 1800);
    } catch {
      // Clipboard API unavailable in headless context
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#181B24] pb-5">
        <h1 className="font-display text-4xl font-bold tracking-tight text-slate-50">
          Android Project Source
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Kotlin, Jetpack Compose, Material 3, Room, WorkManager, UsageStatsManager, and Gradle files saved in{' '}
          <span className="font-mono text-slate-200">/android/</span> (Stages 1–7).
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter source files by layer">
          {LAYER_FILTERS.map((layer) => {
            const active = selectedLayer === layer;
            return (
              <button
                key={layer}
                type="button"
                onClick={() => setSelectedLayer(layer)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 min-h-[36px] ${
                  active
                    ? 'bg-red-700 text-white'
                    : 'bg-[#0D0F14] text-slate-400 border border-[#232734] hover:text-slate-100'
                }`}
              >
                {layer}
              </button>
            );
          })}
        </div>

        <div className="w-full md:w-72">
          <label htmlFor="source-search" className="sr-only">
            Filter Android files
          </label>
          <input
            id="source-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by file path or summary..."
            className="w-full rounded-md border border-[#232734] bg-[#0D0F14] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-red-600 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div
          aria-label="Android source file list"
          className="lg:col-span-4 rounded-lg border border-[#232734] bg-[#0D0F14] divide-y divide-[#1A1E29] max-h-[620px] overflow-y-auto"
        >
          {filteredFiles.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No files match &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            filteredFiles.map((file) => {
              const isSelected = file.path === activeFile.path;
              const shortName = file.path.split('/').pop() ?? file.path;
              return (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => setSelectedPath(file.path)}
                  className={`w-full px-4 py-3 text-left transition-colors ${
                    isSelected ? 'bg-[#171A24]' : 'hover:bg-[#12151D]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`font-mono text-xs font-medium truncate ${
                        isSelected ? 'text-red-400' : 'text-slate-200'
                      }`}
                    >
                      {shortName}
                    </span>
                    <span className="text-[11px] text-slate-500 shrink-0">
                      {file.stage} · {file.layer}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400 line-clamp-2">{file.summary}</p>
                </button>
              );
            })
          )}
        </div>

        <div className="lg:col-span-8 rounded-lg border border-[#232734] bg-[#0D0F14] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#232734] bg-[#12151D] px-4 py-3">
            <div className="min-w-0">
              <p
                data-testid="active-source-path"
                className="font-mono text-xs font-medium text-slate-100 truncate"
              >
                {activeFile.path}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">{activeFile.summary}</p>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-md border border-[#2A2F3D] bg-black px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-500 whitespace-nowrap shrink-0 min-h-[36px]"
            >
              {copiedPath === activeFile.path ? 'Copied' : 'Copy Code'}
            </button>
          </div>

          <div className="max-h-[560px] overflow-auto bg-black p-4">
            <pre className="font-mono text-xs leading-relaxed text-slate-200 whitespace-pre">
              <code>{activeFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

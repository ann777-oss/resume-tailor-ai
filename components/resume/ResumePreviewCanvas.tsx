'use client';

import { useState } from 'react';
import { Maximize2, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ResumeContent } from '@/lib/types';
import ResumePreview from './ResumePreview';

interface ResumePreviewCanvasProps {
  content: ResumeContent;
}

const PAGE_WIDTH = 816;
const PAGE_HEIGHT = 1056;
const FIT_ZOOM = 0.64;
const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.45;
const MAX_ZOOM = 1.2;

export default function ResumePreviewCanvas({ content }: ResumePreviewCanvasProps) {
  const [zoom, setZoom] = useState(FIT_ZOOM);

  const applyZoom = (next: number) => {
    const normalized = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(next.toFixed(2))));
    setZoom(normalized);
  };

  return (
    <div className="flex-1 bg-gray-100 rounded-xl border border-gray-200 overflow-hidden">
      <div className="h-12 px-4 bg-white border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => applyZoom(FIT_ZOOM)}
            className="h-7 px-2 text-xs text-gray-600"
          >
            <Maximize2 className="w-3.5 h-3.5 mr-1" />
            整页
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => applyZoom(0.75)}
            className="h-7 px-2 text-xs text-gray-600"
          >
            75%
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => applyZoom(1)}
            className="h-7 px-2 text-xs text-gray-600"
          >
            100%
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyZoom(zoom - ZOOM_STEP)}
            disabled={zoom <= MIN_ZOOM}
            className="h-8 w-8 p-0"
            aria-label="缩小简历预览"
          >
            <Minus className="w-3.5 h-3.5" />
          </Button>
          <span className="w-12 text-center text-xs font-semibold text-gray-600">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyZoom(zoom + ZOOM_STEP)}
            disabled={zoom >= MAX_ZOOM}
            className="h-8 w-8 p-0"
            aria-label="放大简历预览"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="h-[calc(100vh-220px)] min-h-[680px] overflow-auto p-4 flex justify-center">
        <div
          className="shadow-lg rounded-sm overflow-hidden bg-white flex-shrink-0"
          style={{
            width: PAGE_WIDTH * zoom,
            height: PAGE_HEIGHT * zoom,
          }}
        >
          <div
            style={{
              width: PAGE_WIDTH,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
            }}
          >
            <ResumePreview content={content} />
          </div>
        </div>
      </div>
    </div>
  );
}

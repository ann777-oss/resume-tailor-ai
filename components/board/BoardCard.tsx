'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { FileText, Star, Building2, Target, MoveHorizontal as MoreHorizontal, Copy, Archive, Trash2, ExternalLink, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ResumeVersion, BoardStatus } from '@/lib/types';
import { BOARD_COLUMNS } from './boardConfig';

interface BoardCardProps {
  resume: ResumeVersion & { job_descriptions?: { company_name: string; job_title: string; analysis?: { match_score?: number } } | null };
  onDragStart: (resumeId: string, fromStatus: BoardStatus) => void;
  onDuplicate: (resume: ResumeVersion) => void;
  onArchive: (resumeId: string) => void;
  onDelete: (resumeId: string) => void;
}

export default function BoardCard({ resume, onDragStart, onDuplicate, onArchive, onDelete }: BoardCardProps) {
  const dragHandleRef = useRef<HTMLDivElement>(null);

  const matchScore = resume.job_descriptions?.analysis?.match_score;
  const company = resume.job_descriptions?.company_name;
  const jobTitle = resume.job_descriptions?.job_title;
  const scoreColor = matchScore == null ? '' : matchScore >= 80 ? 'text-emerald-600 bg-emerald-50' : matchScore >= 60 ? 'text-amber-600 bg-amber-50' : 'text-red-500 bg-red-50';

  const updatedAt = new Date(resume.updated_at);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - updatedAt.getTime()) / 86400000);
  const timeLabel = diffDays === 0 ? '今天' : diffDays === 1 ? '昨天' : diffDays < 7 ? `${diffDays}天前` : updatedAt.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });

  return (
    <div
      draggable
      onDragStart={() => onDragStart(resume.id, resume.status as BoardStatus)}
      className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-150 cursor-grab active:cursor-grabbing group select-none min-h-[118px]"
    >
      <div className="p-3.5 h-full">
        <div className="flex items-start gap-2.5">
          <div ref={dragHandleRef} className="mt-0.5 text-gray-200 group-hover:text-gray-400 transition-colors flex-shrink-0">
            <GripVertical className="w-3.5 h-3.5" />
          </div>

          <div className="flex-1 min-w-0 min-h-[90px] flex flex-col">
            <div className="flex items-start justify-between gap-1.5 mb-1.5">
              <Link
                href={`/resumes/${resume.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors leading-snug line-clamp-2"
              >
                {resume.name}
              </Link>
              <div className="flex items-center gap-0.5 flex-shrink-0 -mt-0.5">
                {resume.is_starred && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(resume.id); }}
                  className="p-1 rounded-md hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="p-1 rounded-md hover:bg-gray-100 text-gray-300 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem asChild>
                      <Link href={`/resumes/${resume.id}`} className="flex items-center gap-2">
                        <ExternalLink className="w-3.5 h-3.5" />查看简历
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate(resume)} className="gap-2">
                      <Copy className="w-3.5 h-3.5" />复制
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onArchive(resume.id)}
                      className="gap-2 text-gray-500"
                      disabled={resume.status === 'archived'}
                    >
                      <Archive className="w-3.5 h-3.5" />归档
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(resume.id)} className="gap-2 text-red-600 focus:text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="min-h-[18px] mb-1.5">
            {(company || jobTitle) && (
              <div className="flex items-center gap-1">
                <Building2 className="w-3 h-3 text-gray-300 flex-shrink-0" />
                <span className="text-xs text-gray-400 truncate">
                  {[jobTitle, company].filter(Boolean).join(' · ')}
                </span>
              </div>
            )}
            </div>

            <div className="flex items-center justify-between gap-2 mt-auto">
              <span className="text-[11px] text-gray-300">{timeLabel}</span>
              {matchScore != null && (
                <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${scoreColor}`}>
                  <Target className="w-2.5 h-2.5" />{matchScore}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

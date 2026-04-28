'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Download, Save, Star, CreditCard as Edit3, Eye, FileText, ExternalLink, Calendar, Tag, SlidersHorizontal } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import ResumePreviewCanvas from '@/components/resume/ResumePreviewCanvas';
import ResumeEditor from '@/components/resume/ResumeEditor';
import ResumeDesignPanel from '@/components/resume/ResumeDesignPanel';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import type { ResumeVersion, ResumeContent, JobDescription, ResumeDesignSettings } from '@/lib/types';

export default function ResumeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [resume, setResume] = useState<ResumeVersion | null>(null);
  const [job, setJob] = useState<JobDescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [designSaving, setDesignSaving] = useState(false);
  const [activeView, setActiveView] = useState<'preview' | 'edit' | 'design'>('preview');

  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      const { data } = await supabase
        .from('resume_versions')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setResume(data as ResumeVersion);
        if (data.job_description_id) {
          const { data: jobData } = await supabase
            .from('job_descriptions')
            .select('*')
            .eq('id', data.job_description_id)
            .maybeSingle();
          setJob(jobData as JobDescription);
        }
      }
      setLoading(false);
    })();
  }, [user, id]);

  const handleToggleStar = async () => {
    if (!resume) return;
    const newStarred = !resume.is_starred;
    await supabase.from('resume_versions').update({ is_starred: newStarred }).eq('id', resume.id);
    setResume({ ...resume, is_starred: newStarred });
    toast({ title: newStarred ? '已加入收藏' : '已取消收藏' });
  };

  const handleSaveFinal = async () => {
    if (!resume) return;
    setSaving(true);
    await supabase.from('resume_versions').update({ status: 'final', updated_at: new Date().toISOString() }).eq('id', resume.id);
    setResume({ ...resume, status: 'final' });
    setSaving(false);
    toast({ title: '已设为定稿！' });
  };

  const handleExportPDF = () => {
    window.open(`/resumes/${id}/print`, '_blank');
  };

  const handleUpdateContent = async (newContent: ResumeContent) => {
    if (!resume) return;
    setResume({ ...resume, content: newContent as any });
    await supabase.from('resume_versions').update({ content: newContent as any, updated_at: new Date().toISOString() }).eq('id', resume.id);
    toast({ title: '更改已保存！' });
  };

  const handleDesignChange = (design: ResumeDesignSettings) => {
    if (!resume) return;
    const currentContent = resume.content as unknown as ResumeContent;
    setResume({ ...resume, content: { ...currentContent, design } as any });
  };

  const handleSaveDesign = async () => {
    if (!resume) return;
    setDesignSaving(true);
    await supabase.from('resume_versions').update({ content: resume.content as any, updated_at: new Date().toISOString() }).eq('id', resume.id);
    setDesignSaving(false);
    toast({ title: '排版已保存！' });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-8 max-w-6xl mx-auto">
          <div className="h-8 w-48 bg-gray-100 rounded animate-pulse mb-6" />
          <div className="h-[800px] bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </AppLayout>
    );
  }

  if (!resume) return <AppLayout><div className="p-8 text-gray-500">简历不存在。</div></AppLayout>;

  const content = resume.content as unknown as ResumeContent;

  return (
    <AppLayout>
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/resumes" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
              <ChevronLeft className="w-4 h-4" />简历历史
            </Link>
            <span className="text-gray-300">/</span>
            <h1 className="text-base font-semibold text-gray-900 truncate max-w-xs">{resume.name}</h1>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${resume.status === 'final' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
              {resume.status === 'final' ? '定稿' : '草稿'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleToggleStar} className={`gap-1.5 ${resume.is_starred ? 'text-amber-500' : 'text-gray-400'}`}>
              <Star className={`w-4 h-4 ${resume.is_starred ? 'fill-amber-400' : ''}`} />
              {resume.is_starred ? '已收藏' : '收藏'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-1.5">
              <Download className="w-3.5 h-3.5" />导出 PDF
            </Button>
            <Button size="sm" onClick={handleSaveFinal} disabled={saving || resume.status === 'final'} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
              {saving ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {resume.status === 'final' ? '已定稿' : '设为定稿'}
            </Button>
          </div>
        </div>

        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-5 w-fit">
          <button
            onClick={() => setActiveView('preview')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeView === 'preview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Eye className="w-3.5 h-3.5" />预览
          </button>
          <button
            onClick={() => setActiveView('edit')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeView === 'edit' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Edit3 className="w-3.5 h-3.5" />编辑
          </button>
          <button
            onClick={() => setActiveView('design')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeView === 'design' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />排版
          </button>
        </div>

        {activeView === 'edit' ? (
          <ResumeEditor content={content} onUpdate={handleUpdateContent} />
        ) : (
          <div className="flex gap-6">
            <ResumePreviewCanvas content={content} />
            <div className="w-72 flex-shrink-0 space-y-4">
              {activeView === 'design' ? (
                <ResumeDesignPanel
                  content={content}
                  onChange={handleDesignChange}
                  onSave={handleSaveDesign}
                  saving={designSaving}
                />
              ) : (
                <>
                  <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                      <FileText className="w-3 h-3" />简历信息
                    </p>
                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-start gap-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-gray-500">创建时间</p>
                          <p className="font-medium text-gray-700">{new Date(resume.created_at).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                      </div>
                      {job && (
                        <div className="flex items-start gap-2">
                          <Tag className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-gray-500">职位</p>
                            <p className="font-medium text-gray-700">{job.job_title}</p>
                            <p className="text-gray-400">{job.company_name}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {job && (
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">匹配分数</p>
                      <div className="flex items-center gap-3">
                        <span className={`text-2xl font-bold ${job.match_score >= 80 ? 'text-emerald-600' : job.match_score >= 60 ? 'text-amber-600' : 'text-red-500'}`}>
                          {job.match_score}%
                        </span>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${job.match_score >= 80 ? 'bg-emerald-500' : job.match_score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${job.match_score}%` }}
                          />
                        </div>
                      </div>
                      <Link href={`/jobs/${job.id}/analysis`} className="mt-2 text-xs text-blue-600 hover:underline flex items-center gap-1">
                        查看分析报告 <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

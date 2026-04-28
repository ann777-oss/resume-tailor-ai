'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Download, Save, Star, CircleCheck as CheckCircle2, CreditCard as Edit3, Eye, FileText, SlidersHorizontal } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import ResumePreviewCanvas from '@/components/resume/ResumePreviewCanvas';
import ResumeEditor from '@/components/resume/ResumeEditor';
import ResumeDesignPanel from '@/components/resume/ResumeDesignPanel';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import type { ResumeVersion, ResumeContent, ResumeDesignSettings } from '@/lib/types';

export default function ResumePage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const resumeId = searchParams.get('resumeId');
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [resume, setResume] = useState<ResumeVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [designSaving, setDesignSaving] = useState(false);
  const [starred, setStarred] = useState(false);
  const [activeView, setActiveView] = useState<'preview' | 'edit' | 'design'>('preview');

  useEffect(() => {
    if (!user || !resumeId) return;
    supabase
      .from('resume_versions')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setResume(data as ResumeVersion);
        setStarred(data?.is_starred ?? false);
        setLoading(false);
      });
  }, [user, resumeId]);

  const handleSaveFinal = async () => {
    if (!resume) return;
    setSaving(true);
    await supabase
      .from('resume_versions')
      .update({ status: 'final', updated_at: new Date().toISOString() })
      .eq('id', resume.id);
    setResume({ ...resume, status: 'final' });
    setSaving(false);
    toast({ title: '已保存为定稿', description: '这份简历已标记为最终版本。' });
  };

  const handleToggleStar = async () => {
    if (!resume) return;
    const newStarred = !starred;
    await supabase.from('resume_versions').update({ is_starred: newStarred }).eq('id', resume.id);
    setStarred(newStarred);
    toast({
      title: newStarred ? '已加入收藏' : '已取消收藏',
      description: newStarred ? '这份简历已加入收藏列表。' : '这份简历已从收藏列表移除。',
    });
  };

  const handleExportPDF = () => {
    if (!resumeId) return;
    window.open(`/resumes/${resumeId}/print`, '_blank');
  };

  const handleUpdateContent = async (newContent: ResumeContent) => {
    if (!resume) return;
    const updated = { ...resume, content: newContent };
    setResume(updated);
    await supabase
      .from('resume_versions')
      .update({ content: newContent as any, updated_at: new Date().toISOString() })
      .eq('id', resume.id);
  };

  const handleDesignChange = (design: ResumeDesignSettings) => {
    if (!resume) return;
    const currentContent = resume.content as unknown as ResumeContent;
    setResume({ ...resume, content: { ...currentContent, design } as any });
  };

  const handleSaveDesign = async () => {
    if (!resume) return;
    setDesignSaving(true);
    await supabase
      .from('resume_versions')
      .update({ content: resume.content as any, updated_at: new Date().toISOString() })
      .eq('id', resume.id);
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
            <Link href={`/jobs/${id}/analysis`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
              <ChevronLeft className="w-4 h-4" />返回分析
            </Link>
            <span className="text-gray-300">/</span>
            <h1 className="text-base font-semibold text-gray-900 truncate max-w-xs">{resume.name}</h1>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${resume.status === 'final' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
              {resume.status === 'final' ? '定稿' : '草稿'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleToggleStar} className={`gap-1.5 ${starred ? 'text-amber-500' : 'text-gray-400'}`}>
              <Star className={`w-4 h-4 ${starred ? 'fill-amber-400' : ''}`} />
              {starred ? '已收藏' : '收藏'}
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
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">简历信息</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">状态</span>
                        <span className={`font-medium ${resume.status === 'final' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {resume.status === 'final' ? '定稿' : '草稿'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">创建时间</span>
                        <span className="text-gray-700">{new Date(resume.created_at).toLocaleDateString('zh-CN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">包含板块</span>
                        <span className="text-gray-700">
                          {[content.summary ? 1 : 0, content.experience.length > 0 ? 1 : 0, content.education.length > 0 ? 1 : 0, content.skills.length > 0 ? 1 : 0].reduce((a, b) => a + b, 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
                    <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />已完成定制
                    </p>
                    <ul className="space-y-1 text-xs text-gray-600">
                      <li className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-400" />简介已针对岗位重写</li>
                      <li className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-400" />相关技能已优先排列</li>
                      <li className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-400" />经历亮点已精选</li>
                      <li className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-400" />已嵌入 ATS 关键词</li>
                    </ul>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => router.push('/resumes')}
                  >
                    <FileText className="w-3.5 h-3.5" />查看全部简历
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

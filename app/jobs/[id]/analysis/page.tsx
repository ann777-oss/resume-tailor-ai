'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, CircleCheck as CheckCircle2, Circle as XCircle, TrendingUp, Tag, ListChecks, TriangleAlert as AlertTriangle, ArrowRight, ChevronLeft, Building2, Target } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { getMasterProfile } from '@/lib/services/profile';
import { generateTailoredResume } from '@/lib/services/analysis';
import type { JobDescription } from '@/lib/types';
import TemplatePickerModal, { type TemplateSelection } from '@/components/resume/TemplatePickerModal';

export default function JobAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [job, setJob] = useState<JobDescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    supabase
      .from('job_descriptions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setJob(data as any as JobDescription);
        setLoading(false);
      });
  }, [user, id]);

  const handleGenerate = async (template: TemplateSelection) => {
    if (!user || !job) return;
    console.log('🔍 调试信息 - 生成简历时的job.job_title:', job.job_title);
    setGenerating(true);
    try {
      const profile = await getMasterProfile(user.id);
      const content = await generateTailoredResume(
        profile,
        job.analysis,
        job.raw_text,
        template,
        job.job_title
      );

      console.log('✅ generateTailoredResume返回的content.header:', content.header);

      const { data, error } = await supabase
        .from('resume_versions')
        .insert({
          user_id: user.id,
          job_description_id: job.id,
          name: `${job.job_title || '定制简历'} — ${job.company_name || '目标岗位'}`,
          content: content as any,
          status: 'draft',
        })

        .select('id')
        .single();

      if (!error && data) {
        router.push(`/jobs/${job.id}/resume?resumeId=${data.id}`);
      } else if (error) {
        toast({ title: '保存失败', description: error.message, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: '生成简历失败', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setGenerating(false);
      setTemplateModalOpen(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-8 max-w-5xl mx-auto space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </AppLayout>
    );
  }

  if (!job) return <AppLayout><div className="p-8 text-gray-500">未找到该职位记录。</div></AppLayout>;

  const analysis = job.analysis;
  const score = analysis.match_score;
  const scoreColor = score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-500';
  const scoreBg = score >= 80 ? 'bg-emerald-50 border-emerald-200' : score >= 60 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';
  const scoreRing = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/dashboard" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ChevronLeft className="w-4 h-4" />返回
          </Link>
        </div>

        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">{job.company_name || '未知公司'}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{job.job_title || '职位分析'}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {analysis.seniority_level} · {analysis.industry}
            </p>
          </div>
          <Button
            onClick={() => setTemplateModalOpen(true)}
            disabled={generating}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-5 h-11 flex-shrink-0"
          >
            {generating ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />生成中...</>
            ) : (
              <><Sparkles className="w-4 h-4" />生成定制简历</>
            )}
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-5 mb-6">
          <div className={`lg:col-span-1 rounded-xl border p-5 ${scoreBg}`}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" />档案匹配分数
            </p>
            <div className="flex items-center gap-4">
              <svg className="w-20 h-20 flex-shrink-0" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="32" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle
                  cx="40" cy="40" r="32" fill="none"
                  stroke={scoreRing} strokeWidth="8"
                  strokeDasharray={`${(score / 100) * 201} 201`}
                  strokeLinecap="round"
                  transform="rotate(-90 40 40)"
                  style={{ transition: 'stroke-dasharray 1s ease' }}
                />
                <text x="40" y="44" textAnchor="middle" className="text-lg font-bold" fill={scoreRing} fontSize="16" fontWeight="bold">{score}%</text>
              </svg>
              <div>
                <p className={`text-2xl font-bold ${scoreColor}`}>{score}%</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {score >= 80 ? '高度匹配' : score >= 60 ? '较好匹配' : '仍需完善'}
                </p>
                <p className="text-xs text-gray-400 mt-1">已匹配 {analysis.matched_skills.length} 项技能</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />关键词与 ATS 术语
            </p>
            <div className="flex flex-wrap gap-2">
              {analysis.keywords.map((kw: string) => {
                const isMatched = analysis.matched_skills.some((s: string) => s.toLowerCase() === kw.toLowerCase());
                return (
                  <span
                    key={kw}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${isMatched ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}
                  >
                    {isMatched ? <CheckCircle2 className="w-3 h-3" /> : null}
                    {kw}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-5 mb-5">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <ListChecks className="w-3.5 h-3.5" />岗位要求
            </p>
            <ul className="space-y-2">
              {analysis.requirements.map((req: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  {req}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />工作职责
            </p>
            <ul className="space-y-2">
              {analysis.responsibilities.map((resp: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  {resp}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />已匹配技能
            </p>
            <div className="flex flex-wrap gap-1.5">
              {analysis.matched_skills.length > 0 ? analysis.matched_skills.map((skill: string) => (
                <span key={skill} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs rounded-lg font-medium">{skill}</span>
              )) : (
                <p className="text-sm text-gray-400">暂无匹配技能，完善档案可提高匹配分数。</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />档案缺口
            </p>
            {analysis.gaps.length === 0 ? (
              <p className="text-sm text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />未发现明显缺口，匹配度很高！
              </p>
            ) : (
              <ul className="space-y-2">
                {analysis.gaps.map((gap: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <XCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    {gap}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-6 p-5 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-gray-900 text-sm">准备生成定制简历了吗？</p>
            <p className="text-xs text-gray-500 mt-0.5">我们将从您的职业档案中精选并重写与该职位最相关的内容。</p>
          </div>
          <Button onClick={() => setTemplateModalOpen(true)} disabled={generating} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 flex-shrink-0">
            {generating ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />生成中...</> : <><Sparkles className="w-3.5 h-3.5" />生成简历</>}
          </Button>
        </div>
      </div>

      <TemplatePickerModal
        open={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        onConfirm={handleGenerate}
        generating={generating}
      />
    </AppLayout>
  );
}

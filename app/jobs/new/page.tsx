'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Upload, Sparkles, CircleAlert as AlertCircle, ArrowRight, CircleCheck as CheckCircle2 } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getMasterProfile } from '@/lib/services/profile';
import { analyzeJobDescription } from '@/lib/services/analysis';

type InputMode = 'paste' | 'upload';

const SAMPLE_JD = `Senior Software Engineer - FinTech Platform

We are looking for a Senior Software Engineer to join our payments infrastructure team. You will design and build scalable microservices, lead technical discussions, and mentor junior engineers.

Requirements:
- 5+ years of full-stack development experience
- Strong proficiency in TypeScript and React
- Experience with cloud infrastructure (AWS or GCP)
- Experience with microservices and distributed systems
- Strong knowledge of REST APIs and CI/CD pipelines
- Excellent communication and collaboration skills

Responsibilities:
- Design and build scalable backend services in Node.js
- Collaborate with product and design teams on new features
- Lead code reviews and set engineering standards
- Mentor junior team members
- Drive adoption of best practices for testing and deployment

Nice to have: Python, GraphQL, Kubernetes`;

export default function JobInputPage() {
  const [mode, setMode] = useState<InputMode>('paste');
  const [jobText, setJobText] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const router = useRouter();

  const handleAnalyze = async () => {
    if (!companyName.trim()) { setError('请输入公司名称。'); return; }
    if (!jobTitle.trim()) { setError('请输入职位名称。'); return; }
    if (!jobText.trim()) { setError('请粘贴职位描述。'); return; }
    if (!user) return;
    setError('');
    setAnalyzing(true);

    try {
      console.log('🔍 调试信息 - 新建求职时的职位名称:', jobTitle);
      const profile = await getMasterProfile(user.id);
      const analysis = await analyzeJobDescription(jobText, profile);

      const { data, error: insertError } = await supabase
        .from('job_descriptions')
        .insert({
          user_id: user.id,
          company_name: companyName,
          job_title: jobTitle,
          raw_text: jobText,
          source_type: mode,
          analysis: analysis as any,
          match_score: analysis.match_score,
          status: 'analyzed',
        })
        .select('id')
        .single();

      console.log('✅ 保存到数据库的job_title:', jobTitle);

      if (insertError || !data) {
        setError('保存职位描述失败，请重试。');
        return;
      }

      router.push(`/jobs/${data.id}/analysis`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '分析失败，请重试。';
      setError(msg.includes('DeepSeek API Key') ? 'AI 服务未配置，请先填写 DeepSeek API Key。' : msg);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">新建求职</h1>
          <p className="text-sm text-gray-500 mt-0.5">粘贴职位描述，我们将与您的职业档案进行智能匹配分析。</p>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4 text-sm">职位信息（必填）</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">公司名称</Label>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="如 字节跳动" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">职位名称</Label>
                <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="如 AI 产品实习生" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setMode('paste')}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors flex-1 justify-center ${mode === 'paste' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <FileText className="w-4 h-4" />
                粘贴文字
              </button>
              <button
                onClick={() => setMode('upload')}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors flex-1 justify-center ${mode === 'upload' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Upload className="w-4 h-4" />
                上传图片（OCR）
              </button>
            </div>

            <div className="p-5">
              {mode === 'paste' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-gray-600">职位描述</Label>
                    <button
                      onClick={() => setJobText(SAMPLE_JD)}
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      加载示例 JD
                    </button>
                  </div>
                  <Textarea
                    value={jobText}
                    onChange={(e) => setJobText(e.target.value)}
                    placeholder="粘贴完整的职位描述——包括岗位要求、职责以及技术关键词..."
                    className="min-h-[280px] resize-none text-sm leading-relaxed"
                  />
                  <p className="text-xs text-gray-400">{jobText.split(/\s+/).filter(Boolean).length} 词</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center hover:border-blue-300 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-600 mb-1">拖放截图或图片到此处</p>
                    <p className="text-xs text-gray-400 mb-4">支持 PNG、JPG、WEBP</p>
                    <Button variant="outline" size="sm">浏览文件</Button>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700">OCR 功能即将上线，目前请直接粘贴职位描述文字。</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-600">或手动粘贴文字</Label>
                    <Textarea
                      value={jobText}
                      onChange={(e) => setJobText(e.target.value)}
                      placeholder="在此粘贴职位描述..."
                      className="min-h-[200px] resize-none text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900">接下来会发生什么？</p>
                <p className="text-xs text-gray-500 mt-0.5">我们将提取关键词、岗位要求和 ATS 术语，并生成与您档案的匹配分数。</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleAnalyze}
              disabled={analyzing || !companyName.trim() || !jobTitle.trim() || !jobText.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 gap-2 h-11"
            >
              {analyzing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  分析职位描述
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

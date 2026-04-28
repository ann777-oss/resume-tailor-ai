'use client';

import { useState, useEffect } from 'react';
import { Save, User, Sparkles, Upload, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import SectionCard from './SectionCard';
import { supabase, supabaseAnonKey, supabaseUrl } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import type { MasterProfile } from '@/lib/types';

interface Props {
  profile: MasterProfile | null;
  userId: string;
  onSaved: () => void;
}

export default function BasicInfoSection({ profile, userId, onSaved }: Props) {
  const p = profile?.profile;
  const [initialized, setInitialized] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    professional_title: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    linkedin: '',
    github: '',
    avatar_url: '',
    summary: '',
  });
  const [saving, setSaving] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (p && !initialized) {
      setForm({
        full_name: p.full_name ?? '',
        professional_title: p.professional_title ?? '',
        email: p.email ?? '',
        phone: p.phone ?? '',
        location: p.location ?? '',
        website: p.website ?? '',
        linkedin: p.linkedin ?? '',
        github: p.github ?? '',
        avatar_url: p.avatar_url ?? '',
        summary: p.summary ?? '',
      });
      setInitialized(true);
    }
  }, [p, initialized]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const getProfilePhotoPath = (url: string) => {
    const marker = '/storage/v1/object/public/profile-photos/';
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(url.slice(idx + marker.length));
  };

  const handlePhotoUpload = async (file: File | null) => {
    if (!file || !userId) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      window.alert('请上传 JPG、PNG 或 WebP 格式的图片。');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      window.alert('图片大小不能超过 5MB。');
      return;
    }

    setUploadingPhoto(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user || !session.access_token) throw new Error('请先登录后再上传照片');

      const authedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      });

      const oldPath = getProfilePhotoPath(form.avatar_url);
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `${session.user.id}/avatar-${Date.now()}.${ext}`;
      const { error } = await authedSupabase.storage.from('profile-photos').upload(filePath, file, {
        cacheControl: '3600',
      });

      if (error) {
        console.error('Profile photo upload failed', {
          bucket: 'profile-photos',
          filePath,
          authUserId: session.user.id,
          error,
        });
        throw error;
      }

      const { data } = authedSupabase.storage.from('profile-photos').getPublicUrl(filePath);
      handleChange('avatar_url', data.publicUrl);
      await supabase.from('user_profiles').upsert(
        {
          ...(p?.id ? { id: p.id } : {}),
          user_id: userId,
          avatar_url: data.publicUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      if (oldPath) {
        await supabase.storage.from('profile-photos').remove([oldPath]);
      }
    } catch (err) {
      const error = err as Error & { statusCode?: string; status?: number };
      window.alert(`照片上传失败：${error.message}${error.statusCode ? `（${error.statusCode}）` : ''}${error.status ? `（${error.status}）` : ''}`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    const oldPath = getProfilePhotoPath(form.avatar_url);
    handleChange('avatar_url', '');
    await supabase.from('user_profiles').upsert(
      {
        ...(p?.id ? { id: p.id } : {}),
        user_id: userId,
        avatar_url: '',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
    if (oldPath) {
      await supabase.storage.from('profile-photos').remove([oldPath]);
    }
  };

  const handleOptimize = async () => {
    if (!form.summary || form.summary.trim().length < 10) return;
    setOptimizing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/optimize-summary`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            summary: form.summary,
            full_name: form.full_name,
            professional_title: form.professional_title,
            skills: profile?.skills?.map((s) => s.name),
            work_experience: profile?.workExperience?.map((e) => `${e.role} @ ${e.company}`),
          }),
        }
      );
      const json = await res.json();
      if (json.optimized) {
        handleChange('summary', json.optimized);
      }
    } finally {
      setOptimizing(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { avatar_url, ...profileForm } = form;
    await supabase.from('user_profiles').upsert(
      {
        ...(p?.id ? { id: p.id } : {}),
        user_id: userId,
        ...profileForm,
        ...(avatar_url ? { avatar_url } : {}),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
    setSaving(false);
    onSaved();
  };

  return (
    <div className="space-y-5">
      <SectionCard icon={User} title="个人信息" description="您的姓名、当前身份和联系方式">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="w-20 h-[106px] rounded-lg bg-white border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
            {form.avatar_url ? (
              <img src={form.avatar_url} alt="个人证件照" className="w-full h-full object-cover" />
            ) : (
              <User className="w-7 h-7 text-gray-300" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">个人证件照</p>
            <p className="text-xs text-gray-500 mt-1">建议上传正面半身照，JPG/PNG/WebP 格式，大小不超过 5MB。生成简历时会自动带入照片。</p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <label className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-white border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                {uploadingPhoto ? (
                  <span className="w-3 h-3 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                {form.avatar_url ? '更换照片' : '上传照片'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploadingPhoto}
                  onChange={(e) => handlePhotoUpload(e.target.files?.[0] ?? null)}
                />
              </label>
              {form.avatar_url && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemovePhoto}
                  className="h-8 px-3 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  移除照片
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-600">姓名</Label>
            <Input value={form.full_name} onChange={(e) => handleChange('full_name', e.target.value)} placeholder="张三" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-600">当前身份 / 专业方向</Label>
            <Input value={form.professional_title} onChange={(e) => handleChange('professional_title', e.target.value)} placeholder="如 大三学生｜法学专业" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-600">邮箱地址</Label>
            <Input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="you@email.com" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-600">手机号码</Label>
            <Input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="+86 138 0000 0000" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-600">所在城市</Label>
            <Input value={form.location} onChange={(e) => handleChange('location', e.target.value)} placeholder="上海，中国" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-600">个人网站</Label>
            <Input value={form.website} onChange={(e) => handleChange('website', e.target.value)} placeholder="https://yoursite.com" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-600">LinkedIn 链接</Label>
            <Input value={form.linkedin} onChange={(e) => handleChange('linkedin', e.target.value)} placeholder="linkedin.com/in/yourprofile" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-600">GitHub 链接</Label>
            <Input value={form.github} onChange={(e) => handleChange('github', e.target.value)} placeholder="github.com/yourhandle" />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={User}
        title="自我评价"
        description="您的个人亮点概述（作为定制简历简介的基础）"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={handleOptimize}
            disabled={optimizing || form.summary.trim().length < 10}
            className="h-7 gap-1.5 text-xs border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40"
          >
            {optimizing ? (
              <><span className="w-3 h-3 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />AI 优化中...</>
            ) : (
              <><Sparkles className="w-3 h-3" />AI 一键优化</>
            )}
          </Button>
        }
      >
        <div className="space-y-1.5">
          <Textarea
            value={form.summary}
            onChange={(e) => handleChange('summary', e.target.value)}
            placeholder="用 2-3 句话概述您的经历、核心优势及能为团队带来的价值..."
            className="min-h-[120px] resize-none"
          />
          <p className="text-xs text-gray-400">{form.summary.length} 字符 · 建议 150-300 字符</p>
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          {saving ? (
            <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />保存中...</>
          ) : (
            <><Save className="w-3.5 h-3.5" />保存更改</>
          )}
        </Button>
      </div>
    </div>
  );
}

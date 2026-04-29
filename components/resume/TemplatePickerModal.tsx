'use client';

import { useRef, useState } from 'react';
import { X, Check, Upload, FileImage, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import type { TemplateSelection } from '@/lib/types';
export type { TemplateSelection } from '@/lib/types';

const BUILTIN_TEMPLATES: TemplateSelection[] = [
  {
    type: 'builtin',
    id: 'classic-chinese',
    label: '中文经典模板',
    imageUrl: '/resume-templates/338ee8019261e51e6986026b3b59fb5e.jpg',
    styleDescription:
      '左上角大字姓名，右上角照片，顶部紧凑联系信息行。各板块标题使用蓝色加粗并配横线分隔，日期、机构、职位采用三列排版，整体风格正式、紧凑、偏中文求职简历。',
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (template: TemplateSelection) => void;
  generating: boolean;
}

export default function TemplatePickerModal({ open, onClose, onConfirm, generating }: Props) {
  const [selected, setSelected] = useState<TemplateSelection>(BUILTIN_TEMPLATES[0]);
  const [customPreview, setCustomPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [analyzingTemplate, setAnalyzingTemplate] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('请上传图片文件（JPG / PNG / WEBP）。');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('文件大小不能超过 5MB。');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const url = ev.target?.result as string;
      setCustomPreview(url);
      setAnalyzingTemplate(true);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/analyze-template`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({ imageDataUrl: url }),
        });

        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.error || '模板分析失败');
        }

        setSelected({
          type: 'custom',
          id: 'custom-upload',
          label: file.name,
          imageUrl: url,
          styleDescription: json.styleDescription,
          config: json.config,
        });
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : '模板分析失败，请重试。');
        setSelected({
          type: 'custom',
          id: 'custom-upload',
          label: file.name,
          imageUrl: url,
          styleDescription: '请尽量参考用户上传模板的标题层级、分栏结构、留白密度、配色和条目排版，生成风格接近的简历版式。',
        });
      } finally {
        setAnalyzingTemplate(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleSelectBuiltin = (tpl: TemplateSelection) => {
    setSelected(tpl);
    setCustomPreview(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">选择简历模板</h2>
            <p className="text-xs text-gray-500 mt-0.5">内置模板直接应用排版，自定义模板会先分析图片结构，再尽量精准复刻样式。</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BUILTIN_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => handleSelectBuiltin(tpl)}
                className={`group relative rounded-xl border-2 overflow-hidden transition-all text-left ${
                  selected.id === tpl.id && selected.type === 'builtin'
                    ? 'border-blue-500 shadow-md shadow-blue-100'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                <div className="aspect-[3/4] w-full overflow-hidden bg-gray-50">
                  <img src={tpl.imageUrl} alt={tpl.label} className="w-full h-full object-cover object-top" />
                </div>
                <div className="px-3 py-2.5 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-800">{tpl.label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">内置模板</p>
                </div>
                {selected.id === tpl.id && selected.type === 'builtin' && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </button>
            ))}

            <button
              onClick={() => fileRef.current?.click()}
              className={`group relative rounded-xl border-2 border-dashed overflow-hidden transition-all text-left ${
                selected.type === 'custom'
                  ? 'border-blue-500 shadow-md shadow-blue-100'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              {customPreview ? (
                <>
                  <div className="aspect-[3/4] w-full overflow-hidden bg-gray-50">
                    <img src={customPreview} alt="自定义模板" className="w-full h-full object-cover object-top" />
                  </div>
                  <div className="px-3 py-2.5 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-800 truncate">{selected.label}</p>
                    <p className="text-[10px] text-blue-500 mt-0.5">点击重新上传</p>
                  </div>
                  {selected.type === 'custom' && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-[3/4] w-full flex flex-col items-center justify-center gap-3 p-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-blue-50 flex items-center justify-center transition-colors">
                    <Upload className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-700">上传自定义模板</p>
                    <p className="text-[10px] text-gray-400 mt-1">AI 会分析模板结构<br />尽量精准复刻版式</p>
                  </div>
                </div>
              )}
            </button>
          </div>

          {analyzingTemplate && (
            <div className="mt-3 p-3 rounded-lg border border-blue-100 bg-blue-50 text-xs text-blue-700 flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
              正在分析你上传的模板版式和样式，请稍等…
            </div>
          )}

          {uploadError && (
            <p className="mt-3 text-xs text-red-500 flex items-center gap-1.5">
              <FileImage className="w-3.5 h-3.5" />{uploadError}
            </p>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {selected && (
            <div className="mt-5 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs font-semibold text-blue-700 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />AI 将参考的样式要点
              </p>
              <p className="text-xs text-blue-800 leading-relaxed">{selected.styleDescription}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs text-gray-400">已选：<span className="font-medium text-gray-600">{selected.label ?? '未选择'}</span></p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>取消</Button>
            <Button
              size="sm"
              onClick={() => onConfirm(selected)}
              disabled={generating || analyzingTemplate || !selected}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              {generating ? (
                <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />生成中...</>
              ) : (
                <><Sparkles className="w-3.5 h-3.5" />确认并生成</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

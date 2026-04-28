'use client';

import { useState } from 'react';
import { Code, Plus, X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SectionCard from './SectionCard';
import { supabase } from '@/lib/supabase';
import type { Skill } from '@/lib/types';

interface Props {
  userId: string;
  skills: Skill[];
  onSaved: () => void;
}

const CATEGORIES = ['证书考试', '办公软件', '专业技能', '语言能力', '工具平台', '编程技术', '软技能', '其他'];
const PROFICIENCY = ['了解', '熟悉', '熟练', '精通'];

const CATEGORY_LABELS: Record<string, string> = {
  Technical: '专业技能',
  Languages: '编程语言',
  Frontend: '前端开发',
  Backend: '后端开发',
  Databases: '数据库',
  Cloud: '云服务',
  DevOps: '开发运维',
  Mobile: '移动开发',
  Tools: '工具平台',
  'Soft Skills': '软技能',
  Other: '其他',
};

const PROFICIENCY_LABELS: Record<string, string> = {
  Beginner: '了解',
  Intermediate: '熟悉',
  Advanced: '熟练',
  Expert: '精通',
};

function getCategoryLabel(category: string) {
  return CATEGORY_LABELS[category] ?? category;
}

function getProficiencyLabel(proficiency: string) {
  return PROFICIENCY_LABELS[proficiency] ?? proficiency;
}

const DEFAULT_SKILL = { name: '', category: '证书考试', proficiency: '熟悉' };

export default function SkillsSection({ userId, skills, onSaved }: Props) {
  const [newSkill, setNewSkill] = useState(DEFAULT_SKILL);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const grouped = skills.reduce<Record<string, Skill[]>>((acc, skill) => {
    const cat = skill.category || '其他';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {});

  const handleAdd = async () => {
    if (!newSkill.name.trim()) return;
    setSaving(true);
    await supabase.from('skills').insert({ ...newSkill, user_id: userId, sort_order: skills.length });
    setNewSkill(DEFAULT_SKILL);
    setSaving(false);
    setAdding(false);
    onSaved();
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await supabase.from('skills').delete().eq('id', id);
    setDeleting(null);
    onSaved();
  };

  return (
    <div className="space-y-4">
      <SectionCard
        icon={Code}
        title="技能"
        description="您希望重点展示的证书、工具、专业能力与软技能"
        action={
          <Button
            size="sm"
            onClick={() => setAdding(!adding)}
            className={adding ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-blue-600 hover:bg-blue-700 text-white'}
            variant={adding ? 'ghost' : 'default'}
          >
            {adding ? <X className="w-3.5 h-3.5 mr-1" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
            {adding ? '取消' : '添加技能'}
          </Button>
        }
      >
        {adding && (
          <div className="mb-5 p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">技能名称</Label>
                <Input
                  value={newSkill.name}
                  onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                  placeholder="如计算机二级"
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">分类</Label>
                <Select value={newSkill.category} onValueChange={(v) => setNewSkill({ ...newSkill, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">熟练程度</Label>
                <Select value={newSkill.proficiency} onValueChange={(v) => setNewSkill({ ...newSkill, proficiency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROFICIENCY.map((proficiency) => (
                      <SelectItem key={proficiency} value={proficiency}>{proficiency}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={handleAdd} disabled={saving || !newSkill.name.trim()} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                {saving ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                添加技能
              </Button>
            </div>
          </div>
        )}

        {skills.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">
            暂无技能。点击「添加技能」开始添加。
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([category, catSkills]) => (
              <div key={category}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{getCategoryLabel(category)}</p>
                <div className="flex flex-wrap gap-2">
                  {catSkills.map((skill) => (
                    <div key={skill.id} className="group flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                      <span className="text-sm text-gray-700 font-medium">{skill.name}</span>
                      <span className="text-[10px] text-gray-400 font-medium">{getProficiencyLabel(skill.proficiency)}</span>
                      <button
                        onClick={() => handleDelete(skill.id)}
                        disabled={deleting === skill.id}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

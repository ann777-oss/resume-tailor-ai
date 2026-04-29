import type { ResumeContent, ResumeDesignSettings, ResumeSectionId } from '@/lib/types';

export const SECTION_LABELS: Record<ResumeSectionId, string> = {
  header: '个人信息',
  summary: '个人简介',
  education: '教育背景',
  experience: '工作/实习经历',
  projects: '项目经验',
  campus: '校园经历',
  skills: '技能',
  certifications: '证书',
};

export const DEFAULT_SECTION_ORDER: ResumeSectionId[] = [
  'header',
  'summary',
  'experience',
  'projects',
  'campus',
  'education',
  'skills',
  'certifications',
];

export const CLASSIC_CHINESE_SECTION_ORDER: ResumeSectionId[] = [
  'header',
  'education',
  'experience',
  'projects',
  'campus',
  'summary',
  'skills',
  'certifications',
];

export const FONT_FAMILIES: Record<ResumeDesignSettings['fontFamily'], string> = {
  microsoft: '"Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", Arial, sans-serif',
  simsun: 'SimSun, "Songti SC", "Microsoft YaHei", serif',
  arial: 'Arial, "Helvetica Neue", "Microsoft YaHei", sans-serif',
};

export function getTemplateSectionOrder(content: ResumeContent): ResumeSectionId[] {
  if (content.template?.config?.sectionOrder?.length) {
    return content.template.config.sectionOrder;
  }
  return content.template?.id === 'classic-chinese'
    ? CLASSIC_CHINESE_SECTION_ORDER
    : DEFAULT_SECTION_ORDER;
}

export function getDefaultResumeDesign(content: ResumeContent): ResumeDesignSettings {
  const customConfig = content.template?.config;
  return {
    sectionOrder: getTemplateSectionOrder(content),
    hiddenSections: [],
    marginX: customConfig?.marginX ?? 40,
    marginY: customConfig?.marginY ?? 32,
    fontFamily: customConfig?.fontFamily ?? 'microsoft',
    fontScale: customConfig?.fontScale ?? 100,
    lineHeight: customConfig?.lineHeight ?? (content.template?.id === 'classic-chinese' ? 1.45 : 1.5),
  };
}

export function normalizeResumeDesign(content: ResumeContent): ResumeDesignSettings {
  const fallback = getDefaultResumeDesign(content);
  const design = content.design;
  if (!design) return fallback;

  const known = new Set<ResumeSectionId>(fallback.sectionOrder);
  const ordered = (design.sectionOrder ?? []).filter((id): id is ResumeSectionId => known.has(id as ResumeSectionId));
  const missing = fallback.sectionOrder.filter((id) => !ordered.includes(id));
  const hidden = (design.hiddenSections ?? []).filter((id): id is ResumeSectionId => known.has(id as ResumeSectionId));

  return {
    sectionOrder: [...ordered, ...missing],
    hiddenSections: hidden,
    marginX: clampNumber(design.marginX, 24, 64, fallback.marginX),
    marginY: clampNumber(design.marginY, 20, 56, fallback.marginY),
    fontFamily: design.fontFamily && design.fontFamily in FONT_FAMILIES ? design.fontFamily : fallback.fontFamily,
    fontScale: clampNumber(design.fontScale, 88, 112, fallback.fontScale),
    lineHeight: clampNumber(design.lineHeight, 1.25, 1.75, fallback.lineHeight),
  };
}

function clampNumber(value: number | undefined, min: number, max: number, fallback: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

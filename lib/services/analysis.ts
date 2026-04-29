import type { JobAnalysis, MasterProfile, ResumeContent, TemplateSelection } from '@/lib/types';
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase';

export async function analyzeJobDescription(
  jobText: string,
  profile: MasterProfile
): Promise<JobAnalysis> {
  const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase 配置缺失，请刷新页面重试');

  const response = await fetch(`${url}/functions/v1/analyze-job`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'Apikey': key,
    },
    body: JSON.stringify({ jobText, profile }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: '未知错误' }));
    throw new Error(err.error || `请求失败 (${response.status})`);
  }

  const analysis: JobAnalysis = await response.json();

  if (typeof analysis.match_score !== 'number') analysis.match_score = 50;
  if (!Array.isArray(analysis.keywords)) analysis.keywords = [];
  if (!Array.isArray(analysis.requirements)) analysis.requirements = [];
  if (!Array.isArray(analysis.responsibilities)) analysis.responsibilities = [];
  if (!Array.isArray(analysis.ats_terms)) analysis.ats_terms = [];
  if (!Array.isArray(analysis.gaps)) analysis.gaps = [];
  if (!Array.isArray(analysis.matched_skills)) analysis.matched_skills = [];
  if (!analysis.seniority_level) analysis.seniority_level = 'Mid-level';
  if (!analysis.industry) analysis.industry = '互联网';

  return analysis;
}

export async function generateTailoredResume(
  profile: MasterProfile,
  analysis: JobAnalysis,
  jobText?: string,
  template?: TemplateSelection,
  jobTitle?: string
): Promise<ResumeContent> {
  const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase 配置缺失，请刷新页面重试');

  const response = await fetch(`${url}/functions/v1/generate-resume`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'Apikey': key,
    },
    body: JSON.stringify({
      profile,
      analysis,
      jobText,
      jobTitle,
      templateStyleDescription: template?.styleDescription,
      templateConfig: template?.config,
      templateImageUrl: template?.imageUrl,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: '未知错误' }));
    throw new Error(err.error || `简历生成失败 (${response.status})`);
  }

  const generated = await response.json();

  const p = profile.profile!;
  const savedTemplate = template
    ? {
        type: template.type,
      id: template.id,
      label: template.label,
      imageUrl: template.imageUrl,
      styleDescription: template.styleDescription,
      ...(template.config ? { config: template.config } : {}),
    }
    : undefined;

  const resume: ResumeContent = {
    core_keywords: Array.isArray(generated.core_keywords) ? generated.core_keywords : [],
    template: savedTemplate,
    header: {
      name: p.full_name,
      email: p.email,
      phone: p.phone,
      location: p.location,
      linkedin: p.linkedin,
      github: p.github,
      website: p.website,
      title: p.professional_title,
      avatar_url: p.avatar_url,
      ...(generated.header ?? {}),
      ...(jobTitle ? { job_title: jobTitle } : {}),
    },
    summary: generated.summary ?? p.summary ?? '',
    experience: Array.isArray(generated.experience) ? generated.experience : [],
    education: Array.isArray(generated.education)
      ? generated.education
      : profile.education.map((edu) => ({
          id: edu.id,
          institution: edu.institution,
          degree: edu.degree,
          field_of_study: edu.field_of_study,
          start_date: edu.start_date,
          end_date: edu.end_date,
          gpa: edu.gpa,
        })),
    skills: Array.isArray(generated.skills) ? generated.skills : [],
    projects: Array.isArray(generated.projects) ? generated.projects : [],
    campusActivities: Array.isArray(generated.campusActivities)
      ? generated.campusActivities
      : Array.isArray(generated.campus_activities)
        ? generated.campus_activities
        : profile.campusActivities.map((activity) => ({
            id: activity.id,
            organization: activity.organization,
            role: activity.role,
            activity_type: activity.activity_type,
            start_date: activity.start_date,
            end_date: activity.end_date,
            is_current: activity.is_current,
            description: activity.description,
            highlights: activity.highlights,
          })),
    certifications: Array.isArray(generated.certifications)
      ? generated.certifications
      : profile.certifications.map((cert) => ({
          id: cert.id,
          name: cert.name,
          issuer: cert.issuer,
          issue_date: cert.issue_date,
        })),
  };

  return resume;
}

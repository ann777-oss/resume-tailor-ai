export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  professional_title: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  avatar_url: string;
  summary: string;
  profile_completion: number;
  created_at: string;
  updated_at: string;
}

export interface Education {
  id: string;
  user_id: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string;
  gpa: string;
  activities: string;
  description: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface WorkExperience {
  id: string;
  user_id: string;
  company: string;
  role: string;
  location: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  bullets: string[];
  description: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string;
  tech_stack: string[];
  live_url: string;
  repo_url: string;
  start_date: string;
  end_date: string;
  highlights: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  user_id: string;
  name: string;
  category: string;
  proficiency: string;
  sort_order: number;
  created_at: string;
}

export interface Certification {
  id: string;
  user_id: string;
  name: string;
  issuer: string;
  issue_date: string;
  expiry_date: string;
  credential_id: string;
  credential_url: string;
  sort_order: number;
  created_at: string;
}

export interface ProfileLink {
  id: string;
  user_id: string;
  label: string;
  url: string;
  sort_order: number;
  created_at: string;
}

export interface JobAnalysis {
  keywords: string[];
  requirements: string[];
  responsibilities: string[];
  ats_terms: string[];
  match_score: number;
  gaps: string[];
  matched_skills: string[];
  seniority_level: string;
  industry: string;
}

export interface JobDescription {
  id: string;
  user_id: string;
  company_name: string;
  job_title: string;
  raw_text: string;
  source_type: string;
  analysis: JobAnalysis;
  match_score: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ResumeContent {
  core_keywords?: string[];
  design?: ResumeDesignSettings;
  template?: {
    type: 'builtin' | 'custom';
    id?: string;
    label?: string;
    imageUrl?: string;
    styleDescription?: string;
    config?: CustomTemplateConfig;
  };
  header: {
    name: string;
    title: string;
    job_title?: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    github: string;
    website: string;
    avatar_url?: string;
  };
  summary: string;
  experience: Array<{
    id: string;
    company: string;
    role: string;
    location: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
    bullets: string[];
  }>;
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    field_of_study: string;
    start_date: string;
    end_date: string;
    gpa: string;
  }>;
  skills: Array<{
    category: string;
    items: string[];
  }>;
  projects: Array<{
    id: string;
    name: string;
    description: string;
    tech_stack: string[];
    live_url: string;
    repo_url: string;
    highlights: string[];
  }>;
  campusActivities: Array<{
    id: string;
    organization: string;
    role: string;
    activity_type: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
    description: string;
    highlights: string[];
  }>;
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    issue_date: string;
  }>;
}

export type ResumeSectionId = 'header' | 'summary' | 'education' | 'experience' | 'projects' | 'campus' | 'skills' | 'certifications';

export interface ResumeDesignSettings {
  sectionOrder: ResumeSectionId[];
  hiddenSections: ResumeSectionId[];
  marginX: number;
  marginY: number;
  fontFamily: 'microsoft' | 'simsun' | 'arial';
  fontScale: number;
  lineHeight: number;
}

export interface CustomTemplateConfig {
  layout: 'default' | 'classic';
  sectionOrder: ResumeSectionId[];
  accentColor: string;
  titleStyle: 'line' | 'filled' | 'minimal';
  headerAlignment: 'left' | 'center';
  showPhoto: boolean;
  dateLayout: 'inline' | 'stacked' | 'three-column';
  bulletStyle: 'dot' | 'dash';
  marginX: number;
  marginY: number;
  fontFamily: ResumeDesignSettings['fontFamily'];
  fontScale: number;
  lineHeight: number;
}

export interface TemplateSelection {
  type: 'builtin' | 'custom';
  id?: string;
  label?: string;
  imageUrl?: string;
  styleDescription?: string;
  config?: CustomTemplateConfig;
}

export interface ResumeVersion {
  id: string;
  user_id: string;
  job_description_id: string | null;
  name: string;
  content: ResumeContent;
  status: string;
  is_starred: boolean;
  created_at: string;
  updated_at: string;
}

export type BoardStatus = 'draft' | 'pending' | 'applied' | 'interviewing' | 'archived';

export interface ResumeEvent {
  id: string;
  resume_id: string;
  user_id: string;
  from_status: string | null;
  to_status: string;
  note: string;
  created_at: string;
}

export interface CampusActivity {
  id: string;
  user_id: string;
  organization: string;
  role: string;
  activity_type: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
  highlights: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface MasterProfile {
  profile: UserProfile | null;
  education: Education[];
  workExperience: WorkExperience[];
  projects: Project[];
  skills: Skill[];
  certifications: Certification[];
  links: ProfileLink[];
  campusActivities: CampusActivity[];
}

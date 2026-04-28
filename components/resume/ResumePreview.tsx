import type { CSSProperties, ReactNode } from 'react';
import type { ResumeContent, ResumeSectionId } from '@/lib/types';
import { FONT_FAMILIES, normalizeResumeDesign } from '@/lib/resume-design';

interface ResumePreviewProps {
  content: ResumeContent;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month] = dateStr.split('-');
  if (!year) return dateStr;
  if (!month) return year;
  return `${year}.${month}`;
}

function DefaultSectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2 mt-4">
      <h2 className="font-bold text-gray-900 tracking-wide whitespace-nowrap">{children}</h2>
      <div className="flex-1 h-[1.5px] bg-gray-900" />
    </div>
  );
}

function ClassicSectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 mb-1.5">
      <h2 className="font-bold text-[#244f72] leading-none text-[1.35em]">{children}</h2>
      <div className="mt-1 h-[2px] bg-[#244f72]" />
    </div>
  );
}

function BulletList({ items, dark = false }: { items: string[]; dark?: boolean }) {
  const cleanItems = items.filter(Boolean);
  if (cleanItems.length === 0) return null;
  return (
    <ul className="space-y-0.5">
      {cleanItems.map((item, i) => (
        <li key={i} className={`flex gap-1.5 leading-[inherit] ${dark ? 'text-black' : 'text-gray-700'}`}>
          <span className="flex-shrink-0 mt-[0.15em] text-[1.15em] leading-none">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ClassicRow({
  date,
  center,
  right,
  children,
}: {
  date: string;
  center: string;
  right?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-1.5">
      <div className="grid grid-cols-[150px_1fr_190px] items-baseline gap-2 leading-tight">
        <span className="font-bold text-black">{date}</span>
        <span className="font-bold text-center text-black">{center}</span>
        <span className="font-bold text-right text-black">{right}</span>
      </div>
      {children && <div className="mt-1">{children}</div>}
    </div>
  );
}

function getResumeStyle(content: ResumeContent, classic: boolean): CSSProperties {
  const design = normalizeResumeDesign(content);
  return {
    padding: `${design.marginY}px ${design.marginX}px`,
    fontFamily: classic ? FONT_FAMILIES[design.fontFamily].replace('Arial', 'SimHei, SimSun, Arial') : FONT_FAMILIES[design.fontFamily],
    fontSize: `${(classic ? 11 : 11) * (design.fontScale / 100)}px`,
    lineHeight: design.lineHeight,
  };
}

function DefaultHeader({ content }: ResumePreviewProps) {
  const { core_keywords, header } = content;
  const intendedRole = header.job_title || header.title;
  return (
    <>
      <div className={`relative mb-1.5 ${header.avatar_url ? 'min-h-[106px]' : ''}`}>
        <div className={header.avatar_url ? 'pr-24 text-center' : 'text-center'}>
          <h1 className="text-[2em] font-bold mb-1 tracking-widest">{header.name}</h1>
          {intendedRole && <p className="mb-1 text-[1em] font-semibold text-gray-700">求职意向：{intendedRole}</p>}
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[0.95em] text-gray-500">
            {header.phone && <span>{header.phone}</span>}
            {header.email && <><span className="text-gray-300">|</span><span>{header.email}</span></>}
            {header.location && <><span className="text-gray-300">|</span><span>{header.location}</span></>}
            {header.linkedin && <><span className="text-gray-300">|</span><span>{header.linkedin}</span></>}
            {header.github && <><span className="text-gray-300">|</span><span>{header.github}</span></>}
            {header.website && <><span className="text-gray-300">|</span><span>{header.website}</span></>}
          </div>
        </div>
        {header.avatar_url && (
          <img
            src={header.avatar_url}
            alt="个人证件照"
            className="absolute right-0 top-0 w-20 h-[106px] object-cover border border-gray-200"
          />
        )}
      </div>

      {core_keywords && core_keywords.length > 0 && (
        <div className="mb-1">
          <div className="flex items-center justify-center gap-1 flex-wrap py-1.5 border-y border-gray-200">
            {core_keywords.map((kw, i) => (
              <span key={kw} className="flex items-center gap-1">
                {i > 0 && <span className="text-gray-300">|</span>}
                <span className="font-semibold text-gray-700">{kw}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function DefaultSection({ content, section }: ResumePreviewProps & { section: ResumeSectionId }) {
  const { summary, experience, education, skills, projects, campusActivities = [], certifications } = content;

  if (section === 'summary' && summary) {
    return (
      <>
        <DefaultSectionTitle>个人简介</DefaultSectionTitle>
        <p className="text-gray-700 leading-[inherit]">{summary}</p>
      </>
    );
  }

  if (section === 'experience' && experience.length > 0) {
    return (
      <>
        <DefaultSectionTitle>实习 / 工作经历</DefaultSectionTitle>
        <div className="space-y-3">
          {experience.map((exp, idx) => (
            <div key={exp.id ?? idx}>
              <div className="flex items-baseline justify-between mb-0.5">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="font-bold">{exp.company}</span>
                  {exp.location && <span className="text-gray-500">{exp.location}</span>}
                  <span className="text-gray-400">·</span>
                  <span className="font-semibold text-gray-800">{exp.role}</span>
                </div>
                <span className="text-gray-500 flex-shrink-0 ml-3">
                  {formatDate(exp.start_date)} — {exp.is_current ? '至今' : formatDate(exp.end_date)}
                </span>
              </div>
              <BulletList items={exp.bullets} />
            </div>
          ))}
        </div>
      </>
    );
  }

  if (section === 'projects' && projects.length > 0) {
    return (
      <>
        <DefaultSectionTitle>项目经历</DefaultSectionTitle>
        <div className="space-y-2.5">
          {projects.map((proj, idx) => (
            <div key={proj.id ?? idx}>
              <div className="flex items-baseline justify-between mb-0.5">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="font-bold">{proj.name}</span>
                  {proj.tech_stack.length > 0 && (
                    <span className="text-gray-500">· {proj.tech_stack.join(' / ')}</span>
                  )}
                </div>
                <div className="flex gap-2 text-blue-600 flex-shrink-0 ml-3">
                  {proj.live_url && <span>{proj.live_url}</span>}
                  {proj.repo_url && <span>{proj.repo_url}</span>}
                </div>
              </div>
              {proj.description && <p className="text-gray-700 mb-0.5">{proj.description}</p>}
              <BulletList items={proj.highlights} />
            </div>
          ))}
        </div>
      </>
    );
  }

  if (section === 'education' && education.length > 0) {
    return (
      <>
        <DefaultSectionTitle>教育背景</DefaultSectionTitle>
        <div className="space-y-1.5">
          {education.map((edu, idx) => (
            <div key={edu.id ?? idx} className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="font-bold">{edu.institution}</span>
                <span className="text-gray-500">
                  {edu.degree}{edu.field_of_study ? ` — ${edu.field_of_study}` : ''}
                </span>
                {edu.gpa && <span className="text-gray-500">GPA {edu.gpa}</span>}
              </div>
              <span className="text-gray-500 flex-shrink-0 ml-3">
                {formatDate(edu.start_date)} — {formatDate(edu.end_date)}
              </span>
            </div>
          ))}
        </div>
      </>
    );
  }

  if (section === 'campus' && campusActivities.length > 0) {
    return (
      <>
        <DefaultSectionTitle>校园经历</DefaultSectionTitle>
        <div className="space-y-2.5">
          {campusActivities.map((activity, idx) => (
            <div key={activity.id ?? idx}>
              <div className="flex items-baseline justify-between mb-0.5">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="font-bold">{activity.organization}</span>
                  {activity.activity_type && <span className="text-gray-500">· {activity.activity_type}</span>}
                  <span className="text-gray-400">·</span>
                  <span className="font-semibold text-gray-800">{activity.role}</span>
                </div>
                <span className="text-gray-500 flex-shrink-0 ml-3">
                  {formatDate(activity.start_date)} — {activity.is_current ? '至今' : formatDate(activity.end_date)}
                </span>
              </div>
              {activity.description && <p className="text-gray-700 mb-0.5">{activity.description}</p>}
              <BulletList items={activity.highlights} />
            </div>
          ))}
        </div>
      </>
    );
  }

  if (section === 'skills' && skills.length > 0) {
    return (
      <>
        <DefaultSectionTitle>专业技能</DefaultSectionTitle>
        <div className="space-y-1">
          {skills.map((group) => (
            <div key={group.category} className="flex gap-1.5">
              <span className="font-semibold text-gray-700 flex-shrink-0 min-w-[5rem]">{group.category}：</span>
              <span className="text-gray-600">{group.items.join(' · ')}</span>
            </div>
          ))}
        </div>
      </>
    );
  }

  if (section === 'certifications' && certifications.length > 0) {
    return (
      <>
        <DefaultSectionTitle>证书 & 奖项</DefaultSectionTitle>
        <div className="space-y-1">
          {certifications.map((cert, idx) => (
            <div key={cert.id ?? idx} className="flex items-center justify-between">
              <span className="font-semibold">{cert.name}</span>
              <span className="text-gray-500">{cert.issuer} · {formatDate(cert.issue_date)}</span>
            </div>
          ))}
        </div>
      </>
    );
  }

  return null;
}

function ClassicHeader({ content }: ResumePreviewProps) {
  const { header } = content;
  const intendedRole = header.job_title || header.title;
  return (
    <div className={`relative ${header.avatar_url ? 'min-h-[132px]' : ''}`}>
      <div className={header.avatar_url ? 'pr-36' : ''}>
        <h1 className="text-[2.35em] font-black text-black tracking-wide mb-1.5">{header.name}</h1>
        {intendedRole && <p className="mb-2 text-[1.05em] font-bold text-black">求职意向：{intendedRole}</p>}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-black">
          {header.phone && <span>电话： {header.phone}</span>}
          {header.email && <><span>|</span><span>邮箱： {header.email}</span></>}
          {header.linkedin && <><span>|</span><span>LinkedIn： {header.linkedin}</span></>}
          {header.github && <><span>|</span><span>GitHub： {header.github}</span></>}
          {header.website && <><span>|</span><span>网站： {header.website}</span></>}
          {header.location && <><span>|</span><span>{header.location}</span></>}
        </div>
      </div>
      {header.avatar_url && (
        <img
          src={header.avatar_url}
          alt="个人证件照"
          className="absolute right-0 top-0 w-[106px] h-[132px] object-cover"
        />
      )}
    </div>
  );
}

function ClassicSection({ content, section }: ResumePreviewProps & { section: ResumeSectionId }) {
  const { summary, experience, education, skills, projects, campusActivities = [], certifications } = content;

  if (section === 'education' && education.length > 0) {
    return (
      <>
        <ClassicSectionTitle>教育背景</ClassicSectionTitle>
        {education.map((edu, idx) => (
          <ClassicRow
            key={edu.id ?? idx}
            date={`${formatDate(edu.start_date)}-${formatDate(edu.end_date)}`}
            center={edu.institution}
            right={[edu.field_of_study, edu.degree].filter(Boolean).join(' ')}
          >
            <BulletList
              dark
              items={[
                [edu.gpa ? `GPA：${edu.gpa}` : '', edu.field_of_study ? `专业：${edu.field_of_study}` : ''].filter(Boolean).join('；'),
              ].filter(Boolean)}
            />
          </ClassicRow>
        ))}
      </>
    );
  }

  if (section === 'experience' && experience.length > 0) {
    return (
      <>
        <ClassicSectionTitle>实习经历</ClassicSectionTitle>
        {experience.map((exp, idx) => (
          <ClassicRow
            key={exp.id ?? idx}
            date={`${formatDate(exp.start_date)}-${exp.is_current ? '至今' : formatDate(exp.end_date)}`}
            center={exp.company}
            right={exp.role}
          >
            <BulletList dark items={exp.bullets} />
          </ClassicRow>
        ))}
      </>
    );
  }

  if (section === 'projects' && projects.length > 0) {
    return (
      <>
        <ClassicSectionTitle>项目经历</ClassicSectionTitle>
        {projects.map((proj, idx) => (
          <ClassicRow key={proj.id ?? idx} date="" center={proj.name} right={proj.tech_stack.join(' / ')}>
            <BulletList dark items={[proj.description, ...proj.highlights].filter(Boolean)} />
          </ClassicRow>
        ))}
      </>
    );
  }

  if (section === 'summary' && summary) {
    return (
      <>
        <ClassicSectionTitle>个人简介</ClassicSectionTitle>
        <BulletList dark items={[summary]} />
      </>
    );
  }

  if (section === 'campus' && campusActivities.length > 0) {
    return (
      <>
        <ClassicSectionTitle>校园经历</ClassicSectionTitle>
        {campusActivities.map((activity, idx) => (
          <ClassicRow
            key={activity.id ?? idx}
            date={`${formatDate(activity.start_date)}-${activity.is_current ? '至今' : formatDate(activity.end_date)}`}
            center={activity.organization}
            right={activity.role}
          >
            <BulletList dark items={[activity.description, ...activity.highlights].filter(Boolean)} />
          </ClassicRow>
        ))}
      </>
    );
  }

  if (section === 'skills' && skills.length > 0) {
    return (
      <>
        <ClassicSectionTitle>技能特长</ClassicSectionTitle>
        <ul className="space-y-0.5">
          {skills.map((group) => (
            <li key={group.category} className="flex gap-1.5 text-black leading-[inherit]">
              <span className="mt-[0.15em] text-[1.15em] leading-none">•</span>
              <span><strong>{group.category}：</strong>{group.items.join('；')}</span>
            </li>
          ))}
        </ul>
      </>
    );
  }

  if (section === 'certifications' && certifications.length > 0) {
    return (
      <>
        <ClassicSectionTitle>证书奖项</ClassicSectionTitle>
        <BulletList dark items={certifications.map((cert) => [cert.name, cert.issuer].filter(Boolean).join(' - '))} />
      </>
    );
  }

  return null;
}

export default function ResumePreview({ content }: ResumePreviewProps) {
  const design = normalizeResumeDesign(content);
  const classic = content.template?.id === 'classic-chinese';
  const visibleSections = design.sectionOrder.filter((section) => !design.hiddenSections.includes(section));

  return (
    <div
      className={`bg-white min-h-[1056px] ${classic ? 'text-black' : 'text-gray-900'}`}
      style={getResumeStyle(content, classic)}
    >
      {visibleSections.map((section) => {
        if (section === 'header') {
          return classic
            ? <ClassicHeader key={section} content={content} />
            : <DefaultHeader key={section} content={content} />;
        }

        return classic
          ? <ClassicSection key={section} content={content} section={section} />
          : <DefaultSection key={section} content={content} section={section} />;
      })}
    </div>
  );
}

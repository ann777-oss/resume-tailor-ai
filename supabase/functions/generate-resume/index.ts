import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    if (!DEEPSEEK_API_KEY) {
      return new Response(
        JSON.stringify({ error: "DeepSeek API Key 未配置" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const {
      profile,
      analysis,
      jobText,
      jobTitle,
      templateStyleDescription,
      templateConfig,
      templateImageUrl,
    } = await req.json();

    if (!profile || !analysis) {
      return new Response(
        JSON.stringify({ error: "缺少必要参数" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const p = profile.profile;
    const expJson = JSON.stringify(profile.workExperience?.slice(0, 4) ?? []);
    const projJson = JSON.stringify(profile.projects?.slice(0, 3) ?? []);
    const skillsJson = JSON.stringify(profile.skills ?? []);
    const eduJson = JSON.stringify(profile.education ?? []);
    const certJson = JSON.stringify(profile.certifications ?? []);
    const campusJson = JSON.stringify(profile.campusActivities?.slice(0, 4) ?? []);

    const templateStyleNote = templateStyleDescription
      ? `\n7. 【模板风格要求】请严格参考以下模板风格描述来组织内容结构、语气和信息密度，使结果在前端渲染时尽量贴近目标模板：${templateStyleDescription}`
      : "";

    const templateConfigNote = templateConfig
      ? `\n8. 【模板结构配置】这是前端从用户上传模板中提取的结构化配置，请优先遵循：${JSON.stringify(templateConfig)}`
      : "";

    const systemPrompt = `你是一位资深中文求职简历撰写专家，擅长根据岗位 JD 把候选人的真实经历改写成高匹配度、可投递、不过度虚构的定制简历。

要求：
1. 每一段经历都要围绕岗位 JD 改写，但只能使用候选人真实档案中的信息，不得捏造不存在的经历。
2. 开头必须输出 4-6 个核心能力关键词，尽量贴近岗位要求。
3. summary 要简洁、有判断力，突出候选人与岗位最相关的优势。
4. bullet 必须尽量量化，用强动作词开头，并自然融入 JD 关键词。
5. skills 只保留与岗位最相关的 2-4 类。
6. 严格返回 JSON，不要输出 markdown。
7. 不要在任何字段中生成“求职意向”“目标职位”等文本，这些信息由系统单独处理。${templateStyleNote}${templateConfigNote}`;

    const userPrompt = `请根据以下岗位信息和候选人档案，生成一份高质量定制简历。

## 目标岗位 JD
${jobText || `岗位要求：${analysis.requirements?.join("；") ?? ""}`}

## 岗位关键资料
- 目标职位名称：${jobTitle || "未提供"}
- 岗位关键词：${analysis.keywords?.join("、") ?? ""}
- 核心要求：${analysis.requirements?.join("；") ?? ""}
- 已匹配技能：${analysis.matched_skills?.join("、") ?? ""}
- 行业：${analysis.industry || ""}
- 级别：${analysis.seniority_level || ""}
- 模板图片：${templateImageUrl ? "已提供，前端已完成图片分析" : "未提供"}

## 候选人原始档案
- 姓名：${p?.full_name || ""}
- 原始简介：${p?.summary || ""}

### 工作经历（原始）
${expJson}

### 项目经历（原始）
${projJson}

### 技能
${skillsJson}

### 教育背景
${eduJson}

### 证书
${certJson}

### 校园经历（原始）
${campusJson}

## 输出格式（严格 JSON）
{
  "core_keywords": ["关键词1", "关键词2", "关键词3", "关键词4", "关键词5"],
  "summary": "3-4 句中文简介",
  "experience": [
    {
      "id": "原 id",
      "company": "公司名称",
      "role": "职位名称",
      "location": "地点",
      "start_date": "YYYY-MM",
      "end_date": "YYYY-MM",
      "is_current": false,
      "bullets": ["量化 bullet 1", "量化 bullet 2"]
    }
  ],
  "projects": [
    {
      "id": "原 id",
      "name": "项目名称",
      "description": "一句话描述",
      "tech_stack": ["技术1", "技术2"],
      "live_url": "",
      "repo_url": "",
      "highlights": ["项目亮点 1", "项目亮点 2"]
    }
  ],
  "campusActivities": [
    {
      "id": "原 id",
      "organization": "组织名称",
      "role": "角色",
      "activity_type": "活动类型",
      "start_date": "YYYY-MM",
      "end_date": "YYYY-MM",
      "is_current": false,
      "description": "一句话概括",
      "highlights": ["亮点 1", "亮点 2"]
    }
  ],
  "skills": [
    { "category": "分类", "items": ["技能 1", "技能 2"] }
  ],
  "education": [
    {
      "id": "原 id",
      "institution": "学校",
      "degree": "学位",
      "field_of_study": "专业",
      "start_date": "YYYY-MM",
      "end_date": "YYYY-MM",
      "gpa": ""
    }
  ],
  "certifications": [
    {
      "id": "原 id",
      "name": "证书名称",
      "issuer": "颁发机构",
      "issue_date": "YYYY-MM"
    }
  ]
}

补充规则：
- bullet 尽量以“负责 / 主导 / 推动 / 搭建 / 优化 / 实现 / 协同”等动作词开头。
- bullet 至少尽量包含一个量化结果或明确成果。
- bullet 优先自然融入岗位关键词。
- 不要生成候选人原档案中完全不存在的新经历。`;

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(
        JSON.stringify({ error: `DeepSeek API 调用失败: ${errText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return new Response(
        JSON.stringify({ error: "DeepSeek 返回内容为空" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const generated = JSON.parse(content);
    const header = {
      name: p?.full_name || "",
      title: p?.professional_title || "",
      job_title: jobTitle || "",
      email: p?.email || "",
      phone: p?.phone || "",
      location: p?.location || "",
      linkedin: p?.linkedin || "",
      github: p?.github || "",
      website: p?.website || "",
      avatar_url: p?.avatar_url || "",
    };

    return new Response(
      JSON.stringify({
        ...generated,
        header: {
          ...(generated.header ?? {}),
          ...header,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `服务器内部错误: ${(err as Error).message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

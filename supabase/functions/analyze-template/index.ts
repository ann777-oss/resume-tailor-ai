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

    const { imageDataUrl } = await req.json();
    if (!imageDataUrl) {
      return new Response(
        JSON.stringify({ error: "缺少 imageDataUrl 参数" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const systemPrompt = `你是专业的简历模板分析专家。请分析用户上传的简历模板图片，输出可用于前端复刻排版的结构化配置。不要输出 markdown，只返回 JSON。`;

    const userPrompt = `请仔细分析这张简历模板图片，提取它的版式与样式特征，并返回如下 JSON：
{
  "styleDescription": "用中文详细描述这个模板的排版和视觉风格，至少覆盖：页边距、标题样式、头部对齐方式、照片位置、分栏/三栏布局、日期/机构/职位的排列、项目符号、留白密度、整体正式程度。",
  "config": {
    "layout": "default 或 classic",
    "sectionOrder": ["header", "education", "experience", "projects", "campus", "summary", "skills", "certifications"],
    "accentColor": "#244f72",
    "titleStyle": "line 或 filled 或 minimal",
    "headerAlignment": "left 或 center",
    "showPhoto": true,
    "dateLayout": "inline 或 stacked 或 three-column",
    "bulletStyle": "dot 或 dash",
    "marginX": 40,
    "marginY": 32,
    "fontFamily": "microsoft 或 simsun 或 arial",
    "fontScale": 100,
    "lineHeight": 1.45
  }
}

规则：
- 如果模板明显是中文求职简历、教育在前、日期/学校/专业同一行对齐，优先判断为 classic。
- accentColor 返回十六进制颜色。
- sectionOrder 只能从 header/summary/education/experience/projects/campus/skills/certifications 中选。
- marginX 范围 24-64，marginY 范围 20-56，fontScale 范围 88-112，lineHeight 范围 1.25-1.75。
- 输出必须是合法 JSON。`;

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
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: imageDataUrl } },
              { type: "text", text: userPrompt },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 2500,
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
        JSON.stringify({ error: "模板分析结果为空" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(content, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `服务器内部错误: ${(err as Error).message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

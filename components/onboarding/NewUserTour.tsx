'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type TourStep = {
  title: string;
  description: string;
  selector?: string;
};

type HighlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const TOUR_VERSION = 'v1';

interface NewUserTourProps {
  userId: string;
}

export default function NewUserTour({ userId }: NewUserTourProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null);

  const storageKey = useMemo(() => `resume-tailor:onboarding:${TOUR_VERSION}:${userId}`, [userId]);

  const steps = useMemo<TourStep[]>(() => [
    {
      title: '欢迎来到 ResumeTailor AI',
      description: '左侧是你的主导航区。后续大部分操作都会从这里开始，先熟悉这几个核心入口。',
      selector: '[data-tour="app-logo"]',
    },
    {
      title: '先完善职业档案',
      description: '“职业档案”是生成简历的基础资料库。把教育背景、实习经历、项目、技能和证书补全，生成效果会更稳定。',
      selector: '[data-tour="nav-profile"]',
    },
    {
      title: '再新建一次求职',
      description: '点击“新建求职”，填入职位名称并粘贴职位描述，系统会先分析岗位，再生成对应简历。',
      selector: '[data-tour="nav-new-job"]',
    },
    {
      title: '这里查看生成结果',
      description: '后续生成的简历版本会沉淀到“简历历史”里，方便你回看、对比和继续修改。',
      selector: '[data-tour="nav-resumes"]',
    },
    {
      title: '账号信息和退出入口',
      description: '底部可以看到当前登录账号；如果你换设备或账号，也是在这里退出登录。',
      selector: '[data-tour="account-panel"]',
    },
    {
      title: '开始使用',
      description: '建议第一步先去完善职业档案，第二步再新建求职。这样生成的简历内容会更贴近目标岗位。',
    },
  ], []);

  const closeTour = useCallback((finished: boolean) => {
    setOpen(false);
    setHighlightRect(null);
    if (finished) {
      window.localStorage.setItem(storageKey, 'done');
    }
  }, [storageKey]);

  const updateHighlight = useCallback(() => {
    const selector = steps[currentStep]?.selector;
    if (!selector) {
      setHighlightRect(null);
      return;
    }

    const element = document.querySelector(selector);
    if (!element) {
      setHighlightRect(null);
      return;
    }

    const rect = element.getBoundingClientRect();
    setHighlightRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
  }, [currentStep, steps]);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) {
      setOpen(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!open) return;

    updateHighlight();

    const handleWindowChange = () => updateHighlight();
    window.addEventListener('resize', handleWindowChange);
    window.addEventListener('scroll', handleWindowChange, true);

    return () => {
      window.removeEventListener('resize', handleWindowChange);
      window.removeEventListener('scroll', handleWindowChange, true);
    };
  }, [open, currentStep, updateHighlight]);

  if (!open) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const cardTop = highlightRect
    ? Math.min(window.innerHeight - 240, Math.max(24, highlightRect.top + highlightRect.height + 18))
    : Math.max(40, window.innerHeight / 2 - 120);
  const cardLeft = highlightRect
    ? Math.min(window.innerWidth - 380, Math.max(24, highlightRect.left))
    : Math.max(24, window.innerWidth / 2 - 180);

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-slate-950/55" />

      {highlightRect && (
        <div
          className="absolute rounded-2xl border-2 border-blue-400 shadow-[0_0_0_9999px_rgba(2,6,23,0.55)] transition-all duration-200"
          style={{
            top: highlightRect.top - 8,
            left: highlightRect.left - 8,
            width: highlightRect.width + 16,
            height: highlightRect.height + 16,
          }}
        />
      )}

      <div
        className="absolute w-[min(360px,calc(100vw-32px))] rounded-2xl bg-white p-5 shadow-2xl border border-slate-200"
        style={{ top: cardTop, left: cardLeft }}
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
              <Sparkles className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-blue-600">新手引导</p>
              <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => closeTour(true)}
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="关闭引导"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm leading-6 text-slate-600">{step.description}</p>

        <div className="mt-4 flex items-center gap-1.5">
          {steps.map((_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full transition-all ${index === currentStep ? 'w-6 bg-blue-600' : 'w-1.5 bg-slate-200'}`}
            />
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            第 {currentStep + 1} 步，共 {steps.length} 步
          </span>
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={() => setCurrentStep((prev) => prev - 1)}>
                上一步
              </Button>
            )}
            {!isLastStep ? (
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setCurrentStep((prev) => prev + 1)}>
                下一步
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    closeTour(true);
                    router.push('/profile');
                  }}
                >
                  去完善档案
                </Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => closeTour(true)}>
                  我知道了
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  BookOpen,
  Calculator,
  Camera,
  Activity,
  Music,
  Users,
  UserCheck,
  Leaf,
  CheckCircle2,
  Award,
  ArrowRight,
  TrendingUp,
  Loader2,
} from "lucide-react";
import API from "@/lib/api";

export interface IntelligenceItem {
  id: string;
  title: string;
  alias: string;
  iconName: string;
  color: string;
  gradient: string;
  bgLight: string;
  borderColor: string;
  questionText: string;
}

export const INTELLIGENCE_QUESTIONS: IntelligenceItem[] = [
  {
    id: "linguistic",
    title: "Verbal-Linguistic",
    alias: "Word Smart",
    iconName: "BookOpen",
    color: "#993333", // Brown / Red
    gradient: "from-red-800 to-amber-900",
    bgLight: "bg-red-50",
    borderColor: "border-red-200",
    questionText: "How easily can you express your thoughts clearly through speaking or writing?",
  },
  {
    id: "logical",
    title: "Logical-Mathematical",
    alias: "Logic Smart",
    iconName: "Calculator",
    color: "#6D28D9", // Purple / Violet
    gradient: "from-purple-700 to-indigo-900",
    bgLight: "bg-purple-50",
    borderColor: "border-purple-200",
    questionText: "How naturally do you enjoy solving problems, identifying patterns, and understanding how things work?",
  },
  {
    id: "spatial",
    title: "Visual-Spatial",
    alias: "Picture Smart",
    iconName: "Camera",
    color: "#059669", // Emerald / Green
    gradient: "from-emerald-600 to-teal-800",
    bgLight: "bg-emerald-50",
    borderColor: "border-emerald-200",
    questionText: "How easily can you visualize objects, designs, places, or ideas in your mind?",
  },
  {
    id: "kinesthetic",
    title: "Bodily-Kinesthetic",
    alias: "Body Smart",
    iconName: "Activity",
    color: "#9333EA", // Fuchsia / Purple
    gradient: "from-fuchsia-600 to-purple-800",
    bgLight: "bg-fuchsia-50",
    borderColor: "border-fuchsia-200",
    questionText: "How easily do you learn or perform things through physical movement and hands-on practice?",
  },
  {
    id: "musical",
    title: "Musical",
    alias: "Music Smart",
    iconName: "Music",
    color: "#0284C7", // Sky Blue
    gradient: "from-sky-500 to-cyan-700",
    bgLight: "bg-sky-50",
    borderColor: "border-sky-200",
    questionText: "How easily do you recognize, remember, or understand rhythms, melodies, and sounds?",
  },
  {
    id: "interpersonal",
    title: "Interpersonal",
    alias: "People Smart",
    iconName: "Users",
    color: "#65A30D", // Lime / Green
    gradient: "from-lime-600 to-emerald-700",
    bgLight: "bg-lime-50",
    borderColor: "border-lime-200",
    questionText: "How easily can you understand other people's feelings, communicate with them, and work together?",
  },
  {
    id: "intrapersonal",
    title: "Intrapersonal",
    alias: "Self Smart",
    iconName: "UserCheck",
    color: "#D97706", // Yellow / Gold
    gradient: "from-amber-500 to-yellow-700",
    bgLight: "bg-yellow-50",
    borderColor: "border-yellow-200",
    questionText: "How well do you understand your own emotions, strengths, weaknesses, motivations, and goals?",
  },
  {
    id: "naturalistic",
    title: "Naturalistic",
    alias: "Nature Smart",
    iconName: "Leaf",
    color: "#2563EB", // Royal Blue
    gradient: "from-blue-600 to-indigo-800",
    bgLight: "bg-blue-50",
    borderColor: "border-blue-200",
    questionText: "How naturally do you notice, understand, and enjoy patterns in nature, plants, animals, or the environment?",
  },
];

export const RATING_OPTIONS = [
  { value: 1, label: "1 = Never", badge: "Never" },
  { value: 2, label: "2 = Rarely", badge: "Rarely" },
  { value: 3, label: "3 = Sometimes", badge: "Sometimes" },
  { value: 4, label: "4 = Often", badge: "Often" },
  { value: 5, label: "5 = Always", badge: "Always" },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  counselingType?: string;
  initialScores?: Record<string, number>;
  onSave: (data: {
    scores: Record<string, number>;
    primaryType: string;
    secondaryType: string;
    goalAlignmentScore: number;
    summaryReport: string;
  }) => void;
}

export const MultipleIntelligenceModal: React.FC<Props> = ({
  isOpen,
  onClose,
  counselingType = "Clinical Psychology & Psychotherapy",
  initialScores,
  onSave,
}) => {
  const [scores, setScores] = useState<Record<string, number>>(() => {
    if (initialScores && Object.keys(initialScores).length === 8) {
      return initialScores;
    }
    return {
      linguistic: 4,
      logical: 4,
      spatial: 3,
      kinesthetic: 3,
      musical: 3,
      interpersonal: 5,
      intrapersonal: 5,
      naturalistic: 3,
    };
  });

  const [activeTabId, setActiveTabId] = useState<string>("linguistic");
  const [isEvaluating, setIsEvaluating] = useState(false);

  if (!isOpen) return null;

  const handleScoreChange = (id: string, val: number) => {
    setScores((prev) => ({ ...prev, [id]: val }));
  };

  // Compute Intelligence Profile Insights
  const sortedTraits = [...INTELLIGENCE_QUESTIONS].sort(
    (a, b) => (scores[b.id] || 0) - (scores[a.id] || 0)
  );

  const primaryTrait = sortedTraits[0];
  const secondaryTrait = sortedTraits[1];

  // Calculate Goal Match Alignment Score
  const computeAlignmentScore = () => {
    const totalPossible = 40;
    const currentSum = Object.values(scores).reduce((a, b) => a + b, 0);

    // Key traits weighted for counseling careers (Interpersonal, Intrapersonal, Linguistic)
    const keyCounselingScore =
      (scores.interpersonal || 0) * 3 +
      (scores.intrapersonal || 0) * 3 +
      (scores.linguistic || 0) * 2 +
      (scores.logical || 0) * 1.5;

    const maxWeighted = 5 * 3 + 5 * 3 + 5 * 2 + 5 * 1.5; // 47.5
    const weightedPct = Math.min(100, Math.round((keyCounselingScore / maxWeighted) * 100));

    return Math.max(60, Math.min(99, weightedPct));
  };

  const alignmentPct = computeAlignmentScore();

  const generateSummaryReport = () => {
    return `Candidate demonstrates high proficiency in ${primaryTrait.title} (${primaryTrait.alias}) and ${secondaryTrait.title} (${secondaryTrait.alias}). With a ${alignmentPct}% goal compatibility match for ${counselingType}, their natural empathy, self-reflection, and problem-solving skills make them exceptionally suited for high-impact therapeutic practice and client guidance.`;
  };

  const handleSaveAssessment = async () => {
    setIsEvaluating(true);
    try {
      const res = await API.careerPrograms.evaluateAI({
        scores,
        counselingType,
      });

      if (res?.success && res?.evaluation) {
        onSave({
          scores,
          primaryType: res.evaluation.primaryType,
          secondaryType: res.evaluation.secondaryType,
          goalAlignmentScore: res.evaluation.goalAlignmentScore,
          summaryReport: res.evaluation.summaryReport,
        });
        setIsEvaluating(false);
        onClose();
        return;
      }
    } catch (e) {
      console.warn("Manas AI evaluation call fallback:", e);
    }

    // Fallback if network offline
    onSave({
      scores,
      primaryType: `${primaryTrait.title} (${primaryTrait.alias})`,
      secondaryType: `${secondaryTrait.title} (${secondaryTrait.alias})`,
      goalAlignmentScore: alignmentPct,
      summaryReport: generateSummaryReport(),
    });
    setIsEvaluating(false);
    onClose();
  };

  // Helper to render icon for question
  const getQuestionIcon = (iconName: string) => {
    switch (iconName) {
      case "BookOpen":
        return <BookOpen className="size-5" />;
      case "Calculator":
        return <Calculator className="size-5" />;
      case "Camera":
        return <Camera className="size-5" />;
      case "Activity":
        return <Activity className="size-5" />;
      case "Music":
        return <Music className="size-5" />;
      case "Users":
        return <Users className="size-5" />;
      case "UserCheck":
        return <UserCheck className="size-5" />;
      case "Leaf":
        return <Leaf className="size-5" />;
      default:
        return <Sparkles className="size-5" />;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-3 sm:p-6 overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-5xl bg-white rounded-[32px] shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        >
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-[#004038] to-[#01584c] px-6 sm:px-8 py-5 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-white/10 backdrop-blur border border-white/20 text-teal-300">
                <Sparkles className="size-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-display text-white">
                  Multiple Intelligences Assessment
                </h3>
                <p className="text-xs text-teal-100/90 font-medium">
                  Howard Gardner's 8 Intelligences Framework • Rate Questions 1–5
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-teal-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="size-6" />
            </button>
          </div>

          {/* Modal Body: Left Wheel (Pie Chart) & Right Questions */}
          <div className="p-5 sm:p-8 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT SIDE: Interactive 8-Slice Wheel & Live Score Preview (5 cols) */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center bg-slate-50/80 rounded-3xl p-6 border border-slate-200/80 space-y-6">
              <div className="text-center space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                  Multiple Intelligences Wheel
                </span>
                <p className="text-xs text-slate-500 font-medium">
                  Click any slice or trait below to jump to its question
                </p>
              </div>

              {/* Custom SVG 8-Slice Interactive Wheel */}
              <div className="relative size-64 sm:size-72 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="size-full drop-shadow-md">
                  {INTELLIGENCE_QUESTIONS.map((item, idx) => {
                    const sliceAngle = 360 / 8; // 45 degrees
                    const startAngle = idx * sliceAngle - 90;
                    const endAngle = (idx + 1) * sliceAngle - 90;

                    const startRad = (startAngle * Math.PI) / 180;
                    const endRad = (endAngle * Math.PI) / 180;

                    const radius = 95;
                    const x1 = 100 + radius * Math.cos(startRad);
                    const y1 = 100 + radius * Math.sin(startRad);
                    const x2 = 100 + radius * Math.cos(endRad);
                    const y2 = 100 + radius * Math.sin(endRad);

                    const midRad = ((startAngle + sliceAngle / 2) * Math.PI) / 180;
                    const textX = 100 + radius * 0.65 * Math.cos(midRad);
                    const textY = 100 + radius * 0.65 * Math.sin(midRad);

                    const isActive = activeTabId === item.id;
                    const score = scores[item.id] || 0;

                    return (
                      <g
                        key={item.id}
                        onClick={() => setActiveTabId(item.id)}
                        className="cursor-pointer transition-transform duration-200 hover:opacity-90"
                      >
                        <path
                          d={`M 100 100 L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`}
                          fill={item.color}
                          stroke="#ffffff"
                          strokeWidth="2.5"
                          opacity={isActive ? 1 : 0.82}
                        />
                        {/* Slice Label & Score Badge */}
                        <text
                          x={textX}
                          y={textY - 3}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#ffffff"
                          fontSize="8"
                          fontWeight="bold"
                        >
                          {item.alias}
                        </text>
                        <text
                          x={textX}
                          y={textY + 8}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#ffffff"
                          fontSize="9"
                          fontWeight="900"
                        >
                          {score}/5
                        </text>
                      </g>
                    );
                  })}
                  {/* Center Hub Circle */}
                  <circle cx="100" cy="100" r="32" fill="#ffffff" stroke="#e2e8f0" strokeWidth="3" />
                  <text
                    x="100"
                    y="94"
                    textAnchor="middle"
                    fill="#004038"
                    fontSize="7"
                    fontWeight="800"
                    letterSpacing="0.5"
                  >
                    MULTIPLE
                  </text>
                  <text
                    x="100"
                    y="105"
                    textAnchor="middle"
                    fill="#004038"
                    fontSize="7"
                    fontWeight="900"
                  >
                    INTELLIGENCES
                  </text>
                </svg>
              </div>

              {/* Goal Alignment Badge */}
              <div className="w-full bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Goal Compatibility
                  </span>
                  <p className="text-xs font-bold text-slate-800 truncate max-w-[170px]">
                    {counselingType}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-teal-700 font-mono">
                    {alignmentPct}%
                  </span>
                  <p className="text-[9px] font-bold text-emerald-600">High Match</p>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: 8 Multiple Intelligence Rating Questions (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Scale Header Guide */}
              <div className="bg-slate-100/80 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
                <span className="font-bold text-slate-900 block">
                  Rate each question from 1 to 5:
                </span>
                <div className="flex flex-wrap gap-2 text-[11px] font-medium text-slate-700">
                  {RATING_OPTIONS.map((opt) => (
                    <span
                      key={opt.value}
                      className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs"
                    >
                      {opt.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                {INTELLIGENCE_QUESTIONS.map((item, idx) => {
                  const currentVal = scores[item.id] || 3;
                  const isActive = activeTabId === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setActiveTabId(item.id)}
                      className={`p-4 rounded-2xl border transition-all duration-200 space-y-3 cursor-pointer ${
                        isActive
                          ? `${item.bgLight} ${item.borderColor} ring-2 ring-teal-500/30 shadow-md`
                          : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="size-9 rounded-xl text-white flex items-center justify-center shrink-0 shadow-sm"
                            style={{ backgroundColor: item.color }}
                          >
                            {getQuestionIcon(item.iconName)}
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              Question {idx + 1} of 8
                            </span>
                            <h4 className="font-bold text-slate-900 text-base leading-snug">
                              {item.title} – <span style={{ color: item.color }}>{item.alias}</span>
                            </h4>
                          </div>
                        </div>

                        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-white border border-slate-200 shadow-2xs text-slate-800">
                          {currentVal} / 5
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed font-medium pl-1">
                        {item.questionText}
                      </p>

                      {/* 1 to 5 Option Selector */}
                      <div className="grid grid-cols-5 gap-1.5 pt-1">
                        {RATING_OPTIONS.map((opt) => {
                          const isSelected = currentVal === opt.value;

                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleScoreChange(item.id, opt.value);
                              }}
                              className={`py-2 px-1 rounded-xl text-xs font-bold transition cursor-pointer flex flex-col items-center justify-center gap-0.5 border ${
                                isSelected
                                  ? "bg-[#004038] text-white border-[#004038] shadow-md scale-105"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                              }`}
                            >
                              <span className="text-sm font-mono">{opt.value}</span>
                              <span className="text-[9px] font-semibold opacity-90 truncate max-w-full">
                                {opt.badge}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Assessment Footer Action */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500 font-medium">
                  Primary Trait: <strong className="text-slate-900 font-bold">{primaryTrait.title}</strong>
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 sm:flex-none rounded-xl border border-slate-200 px-5 py-3 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isEvaluating}
                    onClick={handleSaveAssessment}
                    className="flex-1 sm:flex-none rounded-xl bg-[#004038] px-6 py-3 text-xs font-bold text-white shadow-lg hover:bg-[#002f29] transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isEvaluating ? (
                      <>
                        <Loader2 className="size-4 animate-spin text-teal-300" /> Calculating with Manas AI...
                      </>
                    ) : (
                      <>
                        Save & Attach Intelligence Profile <CheckCircle2 className="size-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

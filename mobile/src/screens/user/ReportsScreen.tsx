import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Dimensions, Modal } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Svg, { Line, Path, Circle, Text as SvgText, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { ArrowLeft, Calendar, AlertCircle, Sparkles, Clock, Heart, Smile, CheckCircle2, Wallet, Plus, Share2, FileText, Download, ChevronRight } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import API from '../../lib/api';
import { Theme } from '../../theme';
import { AdBannerCarousel } from '../../components/AdBannerCarousel';

interface ReportsScreenProps {
  navigation: any;
}

const AI_DOCTORS = [
  { name: 'Dr. Amy Reid', role: 'AI CBT Specialist', initials: 'AR', avatarBg: '#1E88E5' },
  { name: 'Dr. Soniya', role: 'AI Mindfulness Specialist', initials: 'DS', avatarBg: '#8E24AA' },
  { name: 'Dr. Lisa', role: 'AI Trauma-Informed Specialist', initials: 'DL', avatarBg: '#E91E63' },
  { name: 'Dr. Mohan', role: 'AI Positive Psychology Expert', initials: 'DM', avatarBg: '#FFB300' },
  { name: 'Dr. Ram', role: 'AI Clinical Wellness Counselor', initials: 'DR', avatarBg: '#43A047' }
];

const screenWidth = Dimensions.get('window').width;
const paddingX = Theme.spacing.margin * 2;

function moodColor(score: number) {
  if (score <= 3) return '#DE4E37';
  if (score <= 5) return '#E5963E';
  if (score <= 7) return '#7FB355';
  return '#429272';
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({ navigation }) => {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<'day' | 'week' | 'fortnight' | 'month'>('fortnight');
  const [selectedAIDoctor, setSelectedAIDoctor] = useState('Dr. Amy Reid');
  const [selectedTherapist, setSelectedTherapist] = useState<{ id: string; name: string } | null>(null);
  const [therapistModalVisible, setTherapistModalVisible] = useState(false);
  const [notes, setNotes] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { data: reportData, isLoading: reportLoading, refetch: refetchReport } = useQuery({
    queryKey: ['report', period],
    queryFn: () => API.user.getReport(period),
  });

  const calculateUrgency = () => {
    if (!reportData) return { score: 5, label: 'Moderate', color: '#E5963E' };
    let score = 5;
    
    if (reportData.avgMood !== null) {
      const avg = reportData.avgMood;
      if (avg <= 3) score += 3.5;
      else if (avg <= 5) score += 2.0;
      else if (avg >= 8) score -= 2.0;
      else if (avg >= 7) score -= 1.0;
    }
    
    const hasHighRiskChat = (reportData.chats || []).some((c: any) => c.riskLevel === 'high');
    const hasMedRiskChat = (reportData.chats || []).some((c: any) => c.riskLevel === 'medium');
    if (hasHighRiskChat) score += 2.5;
    else if (hasMedRiskChat) score += 1.2;
    
    const journalCount = reportData.journals?.length || 0;
    if (journalCount > 2) score += 1.0;
    
    const finalScore = Math.max(1, Math.min(10, Number(score.toFixed(1))));
    
    let label = 'Moderate';
    let color = '#E5963E'; // Amber
    if (finalScore <= 4.0) {
      label = 'Low Need';
      color = '#429272'; // Teal/Green
    } else if (finalScore >= 7.5) {
      label = 'High Need';
      color = '#DE4E37'; // Rose/Red
    }
    
    return { score: finalScore, label, color };
  };

  const getDoctorRecommendation = () => {
    switch (selectedAIDoctor) {
      case 'Dr. Amy Reid':
        return {
          endorsement: "Endorsement & Analysis: I have carefully reviewed your emotional log trends. Your automated thought patterns show active cognitive distortions (like catastrophizing or all-or-nothing thinking).",
          therapyNeed: "Why Therapy is Recommended: Engaging in structured CBT sessions with a professional therapist will help you build systematic tools to challenge and restructure these negative thoughts, preventing emotional spiral cycles."
        };
      case 'Dr. Soniya':
        return {
          endorsement: "Endorsement & Analysis: I have analyzed your mood logs and daily reflections. There is significant variation in your daily stress indicators and tension loops.",
          therapyNeed: "Why Therapy is Recommended: Taking therapy is highly recommended to build professional mindfulness and grounding practices. A therapist will guide you to observe thoughts without judgment and stabilize emotional reactivity."
        };
      case 'Dr. Lisa':
        return {
          endorsement: "Endorsement & Analysis: Looking at your journaling and chat summaries, there are repeated emotional triggers and deep-seated distress points.",
          therapyNeed: "Why Therapy is Recommended: Working with a trauma-informed professional therapist is crucial. Therapy provides a structured, safe environment to address core emotional wounds, process triggers, and develop somatic healing strategies."
        };
      case 'Dr. Mohan':
        return {
          endorsement: "Endorsement & Analysis: Reviewing your coverage period logs shows a tendency to focus on adverse outcomes and self-critical narratives.",
          therapyNeed: "Why Therapy is Recommended: I recommend taking positive psychology-informed therapy to cultivate optimism, identify character strengths, and build self-compassion. A therapist will help shift your default focus to growth."
        };
      case 'Dr. Ram':
      default:
        return {
          endorsement: "Endorsement & Analysis: Based on the density of your logs and average mood tracking, you are managing considerable day-to-day anxiety and mental workload.",
          therapyNeed: "Why Therapy is Recommended: Regular clinical therapy is highly recommended. A licensed counselor can provide objective support, validate your experiences, and help you design tailored wellness action plans for sustained recovery."
        };
    }
  };

  const urgency = calculateUrgency();
  const doctorRec = getDoctorRecommendation();

  const handleDownload = async () => {
    if (!reportData) {
      Alert.alert('Error', 'No report data loaded to download.');
      return;
    }
    setDownloading(true);
    try {
      const normalSummaryHtml = reportData.normalSummary ? `
        <div class="section">
          <h2>Summary</h2>
          <p>${reportData.normalSummary}</p>
        </div>
      ` : '';

      const clinicalAnalysisHtml = reportData.aiReport?.paid ? `
        <div class="section clinical">
          <h2>Clinical Therapist Evaluation</h2>
          <p class="doctor">Reviewed & signed by: <strong>${selectedAIDoctor}</strong></p>
          <p style="font-style: italic; font-size: 13px; color: #2E6E65;">
            "${reportData.aiReport.aiAnalysis.replaceAll('Dr. Manas', selectedAIDoctor)}"
          </p>
        </div>
      ` : '';

      const moodsHtml = (reportData.moods || []).map((m: any) => {
        const tagsHtml = m.tags && m.tags.length > 0 ? `
          <div class="mood-tags">
            ${m.tags.slice(0, 3).map((t: string) => `<span class="mood-tag">${t}</span>`).join('')}
          </div>
        ` : '';
        return `
          <div class="grid-item">
            <span class="date">${new Date(m.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
            <span class="score" style="background-color: ${moodColor(m.score)};">${m.score}</span>
            ${m.note ? `<p class="note">"${m.note}"</p>` : ''}
            ${tagsHtml}
          </div>
        `;
      }).join('');

      const journalsHtml = (reportData.journals || []).map((j: any) => {
        const aiRefHtml = j.aiResponse ? `
          <div class="journal-ai">
            <p class="ai-title">Manas AI Reflection</p>
            <p class="ai-body">"${j.aiResponse}"</p>
          </div>
        ` : '';
        return `
          <div class="journal-card">
            <div class="journal-header">
              <strong>Prompt: ${j.prompt}</strong>
              <span class="date">${new Date(j.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
            </div>
            <table class="journal-table">
              <tr><td><strong>Situation</strong></td><td>${j.situation || 'N/A'}</td></tr>
              <tr><td><strong>Automatic Thought</strong></td><td>${j.thought || 'N/A'}</td></tr>
              <tr><td><strong>Emotional Feeling</strong></td><td>${j.feeling || 'N/A'}</td></tr>
              <tr><td><strong>Reframed Narrative</strong></td><td style="color: #0d564d; font-weight: bold;">${j.reframe || 'N/A'}</td></tr>
            </table>
            ${aiRefHtml}
          </div>
        `;
      }).join('');

      const chatsHtml = (reportData.chats || []).map((c: any) => `
        <div class="chat-card">
          <div class="chat-header" style="display: flex; justify-content: space-between; align-items: center;">
            <strong>Session ID: #${c.sessionId?.slice(-6) || 'N/A'}</strong>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span class="badge ${c.riskLevel === 'high' ? 'risk-high' : c.riskLevel === 'medium' ? 'risk-med' : 'risk-low'}">Risk: ${c.riskLevel.toUpperCase()}</span>
              <span style="font-size: 10px; color: #6F7977; font-weight: bold;">${new Date(c.updatedAt).toLocaleDateString('en-IN')}</span>
            </div>
          </div>
          <p style="margin-top: 8px; font-size: 11px; color: #1A1C1C;">${c.summary}</p>
        </div>
      `).join('');

      const urgencyHtml = `
        <div class="section urgency-card">
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <h3 style="margin: 0; color: #0d564d; font-size: 14px;">Therapy Urgency Index</h3>
            <span style="font-size: 11px; font-weight: bold; color: ${urgency.color}; background-color: ${urgency.color}15; padding: 3px 8px; border-radius: 10px;">
              ${urgency.label} (${urgency.score}/10)
            </span>
          </div>
          <div style="height: 8px; background-color: #ECEFF1; border-radius: 4px; margin: 10px 0 6px 0; position: relative; width: 100%;">
            <div style="height: 100%; width: ${urgency.score * 10}%; background-color: ${urgency.color}; border-radius: 4px;"></div>
          </div>
          <p style="margin: 0; font-size: 10px; color: #6F7977;">
            Calculated from your average mood of ${reportData.avgMood !== null ? `${reportData.avgMood}/10` : 'None'} over ${reportData.moods?.length || 0} logs and recent activity indicators.
          </p>
        </div>
      `;

      const recommendationHtml = `
        <div class="section clinical" style="border-left: 5px solid #0d564d; background-color: #FFF; margin-bottom: 25px;">
          <h2 style="color: #0d564d; font-size: 14px; margin-top: 0; margin-bottom: 5px;">Doctor Recommendation & Referral</h2>
          <p class="doctor" style="margin-bottom: 5px;">Endorsed & Signed by: <strong>${selectedAIDoctor}</strong></p>
          <p style="font-size: 12px; color: #3F4947; margin: 4px 0;">${doctorRec.endorsement}</p>
          <p style="font-size: 12px; font-weight: bold; color: #0d564d; margin: 6px 0 0 0;">${doctorRec.therapyNeed}</p>
        </div>
      `;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Wellness Report - MyMindTherapyFriend</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              padding: 40px;
              color: #1A1C1C;
              background-color: #FCFAF7;
              line-height: 1.5;
            }
            .header {
              border-bottom: 2px solid #0d564d;
              padding-bottom: 20px;
              margin-bottom: 30px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .header h1 {
              color: #0d564d;
              margin: 0 0 5px 0;
              font-size: 28px;
            }
            .header p {
              margin: 0;
              font-size: 12px;
              color: #6F7977;
            }
            .meta {
              text-align: right;
              font-size: 12px;
            }
            .meta p {
              margin: 2px 0;
            }
            .overview-grid {
              display: flex;
              background-color: rgba(255,255,255,0.7);
              border-radius: 12px;
              padding: 15px;
              margin-bottom: 30px;
              border: 1px solid rgba(0,0,0,0.05);
            }
            .overview-cell {
              flex: 1;
              text-align: center;
            }
            .overview-cell span {
              display: block;
            }
            .cell-label {
              font-size: 10px;
              font-weight: bold;
              color: #6F7977;
            }
            .cell-val {
              font-size: 16px;
              font-weight: bold;
              color: #0d564d;
              margin-top: 4px;
            }
            .section {
              margin-bottom: 30px;
            }
            .section h2 {
              color: #0d564d;
              font-size: 18px;
              border-bottom: 1px solid #E8E8E7;
              padding-bottom: 6px;
              margin-bottom: 15px;
            }
            .clinical {
              background-color: #fff;
              border: 1px solid #BFC9C6;
              padding: 20px;
              border-radius: 12px;
              border-left: 5px solid #FE8C66;
            }
            .clinical h2 {
              border: none;
              padding: 0;
              margin-top: 0;
            }
            .urgency-card {
              background-color: #fff;
              border: 1px solid #E8E8E7;
              border-radius: 12px;
              padding: 15px;
              margin-bottom: 25px;
            }
            .doctor {
              font-size: 11px;
              color: #6F7977;
              margin-bottom: 10px;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
            }
            .grid-item {
              background-color: #fff;
              border: 1px solid #E8E8E7;
              border-radius: 8px;
              padding: 12px;
              position: relative;
            }
            .grid-item .score {
              display: inline-block;
              width: 24px;
              height: 24px;
              border-radius: 12px;
              color: #FFF;
              text-align: center;
              line-height: 24px;
              font-weight: bold;
              font-size: 11px;
              position: absolute;
              top: 12px;
              right: 12px;
            }
            .grid-item .date {
              font-size: 10px;
              color: #6F7977;
            }
            .grid-item .note {
              margin: 8px 0 0 0;
              font-size: 11px;
              color: #3F4947;
              font-style: italic;
            }
            .journal-card, .chat-card {
              background-color: #fff;
              border: 1px solid #E8E8E7;
              border-radius: 12px;
              padding: 15px;
              margin-bottom: 15px;
            }
            .journal-header, .chat-header {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              margin-bottom: 10px;
            }
            .journal-table {
              width: 100%;
              border-collapse: collapse;
            }
            .journal-table td {
              padding: 6px;
              font-size: 11px;
              vertical-align: top;
            }
            .journal-table tr td:first-child {
              width: 30%;
              color: #6F7977;
              font-weight: bold;
            }
            .badge {
              font-size: 9px;
              font-weight: bold;
              padding: 3px 8px;
              border-radius: 10px;
            }
            .risk-high { background-color: #FFEBEE; color: #C62828; }
            .risk-med { background-color: #FFF8E1; color: #F57F17; }
            .risk-low { background-color: #E8F5E9; color: #2E7D32; }
            .mood-tags {
              display: flex;
              flex-wrap: wrap;
              gap: 4px;
              margin-top: 8px;
            }
            .mood-tag {
              font-size: 8px;
              font-weight: bold;
              background-color: rgba(13, 86, 77, 0.1);
              color: #0d564d;
              padding: 2px 6px;
              border-radius: 4px;
            }
            .journal-ai {
              margin-top: 10px;
              padding: 10px;
              background-color: #F0F4F4;
              border-radius: 8px;
              border-left: 3px solid #FE8C66;
            }
            .ai-title {
              font-size: 9px;
              font-weight: bold;
              color: #742406;
              margin: 0 0 4px 0;
            }
            .ai-body {
              font-size: 11px;
              font-style: italic;
              color: #3F4947;
              margin: 0;
            }
            .footer {
              border-top: 1px solid #E8E8E7;
              padding-top: 15px;
              text-align: center;
              font-size: 9px;
              color: #6F7977;
              margin-top: 50px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <p>WELLNESS REPORT</p>
              <h1>MyMindTherapyFriend</h1>
              <p>Your emotional wellness & therapy companion</p>
            </div>
            <div class="meta">
              <p><strong>Generated on:</strong> ${new Date(reportData.endDate).toLocaleDateString('en-IN')}</p>
              <p><strong>Coverage Period:</strong> ${period.toUpperCase()}</p>
            </div>
          </div>

          <div class="overview-grid">
            <div class="overview-cell">
              <span class="cell-label">PATIENT</span>
              <span class="cell-val">${reportData.user?.fullName || 'Anonymous Patient'}</span>
            </div>
            <div class="overview-cell">
              <span class="cell-label">STREAK</span>
              <span class="cell-val">${reportData.user?.streak ?? 0} Days</span>
            </div>
            <div class="overview-cell">
              <span class="cell-label">AVERAGE MOOD</span>
              <span class="cell-val">${reportData.avgMood !== null ? `${reportData.avgMood}/10` : 'None'}</span>
            </div>
          </div>

          ${urgencyHtml}

          ${recommendationHtml}

          ${clinicalAnalysisHtml}

          ${normalSummaryHtml}

          <div class="section">
            <h2>Mood Logs (${reportData.moods?.length || 0})</h2>
            ${reportData.moods?.length === 0 ? '<p style="font-style: italic; font-size:12px;">No mood logs recorded in this period.</p>' : `
              <div class="grid">
                ${moodsHtml}
              </div>
            `}
          </div>

          <div class="section">
            <h2>CBT Journal Reflections (${reportData.journals?.length || 0})</h2>
            ${reportData.journals?.length === 0 ? '<p style="font-style: italic; font-size:12px;">No journal entries logged in this period.</p>' : `
              <div>
                ${journalsHtml}
              </div>
            `}
          </div>

          <div class="section">
            <h2>Manas AI Chat Summaries (${reportData.chats?.length || 0})</h2>
            ${reportData.chats?.length === 0 ? '<p style="font-style: italic; font-size:12px;">No AI chat activity logged in this period.</p>' : `
              <div>
                ${chatsHtml}
              </div>
            `}
          </div>

          <div class="footer">
            <p>MyMindTherapyFriend is an emotional wellness platform. This summary is intended to assist in personal reflection and therapy, and is not a clinical diagnosis.</p>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (err: any) {
      Alert.alert('Download Failed', err.message || 'Failed to generate PDF report.');
    } finally {
      setDownloading(false);
    }
  };

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => API.subscription.get(),
    retry: false,
  });
  const currentTier = subscription?.tier ?? 'free';

  useEffect(() => {
    if (currentTier === 'free') {
      setPeriod('fortnight');
    } else {
      setPeriod('week');
    }
  }, [currentTier]);

  const { data: walletData } = useQuery({
    queryKey: ['walletBalance'],
    queryFn: () => API.payment.getWalletBalance(),
  });
  const walletBalance = walletData?.walletBalance ?? 0;

  const { data: therapistsData } = useQuery({
  queryKey: ['therapists'],
  queryFn: () => API.therapist.list(),
});

  const { data: sharesData, isLoading: sharesLoading } = useQuery({
    queryKey: ['reportShares'],
    queryFn: () => API.user.shares(),
  });

  const shareMutation = useMutation({
    mutationFn: (data: { therapistId: string; period: string; notes?: string }) =>
      API.user.shareReport(data),
    onSuccess: () => {
      Alert.alert('Success', 'Report shared successfully with your therapist!');
      queryClient.invalidateQueries({ queryKey: ['reportShares'] });
      setNotes('');
      setSelectedTherapist(null);
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to share report');
    }
  });

  const handleUnlockAIReport = async () => {
    if (!reportData?.startDate || !reportData?.endDate) {
      Alert.alert('Error', 'No report data loaded yet.');
      return;
    }
    if (walletBalance < 29) {
      Alert.alert(
        'Insufficient Balance',
        'You need ₹29 to unlock the report. Go to Wallet?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Wallet', onPress: () => navigation.navigate('Wallet') }
        ]
      );
      return;
    }

    setUnlocking(true);
    try {
      await API.payment.payReportWallet({
        startDate: reportData.startDate,
        endDate: reportData.endDate,
      });
      Alert.alert('Unlocked!', 'AI Therapist Analysis unlocked successfully using wallet!');
      queryClient.invalidateQueries({ queryKey: ['walletBalance'] });
      refetchReport();
    } catch (err: any) {
      Alert.alert('Unlock Failed', err.message || 'Failed to unlock therapist analysis');
    } finally {
      setUnlocking(false);
    }
  };

  const handleShare = () => {
    if (!selectedTherapist) {
      Alert.alert('Required', 'Please select a therapist to share with.');
      return;
    }
    shareMutation.mutate({
      therapistId: selectedTherapist.id,
      period,
      notes: notes.trim() || undefined
    });
  };

  const uniqueTherapists = therapistsData?.therapists ?? [];

  const shares = sharesData?.shares || [];
  const sortedMoods = [...(reportData?.moods || [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // SVG Chart Dimensions
  const chartWidth = screenWidth - paddingX - 32;
  const chartHeight = 150;

  // Build SVG Points
  const points: { x: number; y: number; score: number; dateStr: string }[] = [];
  sortedMoods.forEach((m, i) => {
    const x = sortedMoods.length > 1 ? (i / (sortedMoods.length - 1)) * (chartWidth - 50) + 30 : chartWidth / 2;
    const y = chartHeight - (m.score / 10) * (chartHeight - 50) - 25;
    points.push({
      x,
      y,
      score: m.score,
      dateStr: new Date(m.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    });
  });

  let pathD = '';
  points.forEach((p, idx) => {
    if (idx === 0) {
      pathD += `M ${p.x} ${p.y}`;
    } else {
      pathD += ` L ${p.x} ${p.y}`;
    }
  });

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerClassName="p-5 pb-8 gap-4">
      {/* Header back button */}
      <View className="flex-row items-center pt-12 gap-2">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-[38px] h-[38px] rounded-full bg-white justify-center items-center border border-[#E0E2E0]">
          <ArrowLeft size={20} color={Theme.colors.onSurface} />
        </TouchableOpacity>
        <Text className="font-sora text-lg text-onSurface">Wellness Reports</Text>
      </View>

      {/* Target Ad Banners */}
      <AdBannerCarousel target="user" navigation={navigation} />

      {/* Period Selection */}
      <View className="bg-white rounded-3xl p-4 border border-[#E0E2E0] gap-1">
        <View className="flex-row items-center gap-2">
          <Calendar size={18} color={Theme.colors.secondary} />
          <Text className="font-sora text-[15px] text-onSurface">Choose Timeframe</Text>
        </View>
        <View className="flex-row gap-2 mt-2">
          {(currentTier === 'free' ? (['day', 'fortnight', 'month'] as const) : (['day', 'week', 'month'] as const)).map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              className={`flex-1 h-10 rounded-2xl justify-center items-center ${
                period === p ? 'bg-primary' : 'bg-[#F0F2F1]'
              }`}
            >
              <Text className={`font-jakarta-bold text-[11px] ${period === p ? 'text-white' : 'text-[#71787D]'}`}>
                {p === 'fortnight' ? '15 Days' : p.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Select Doctor Card */}
      <View className="bg-white rounded-3xl p-4 border border-[#E0E2E0] gap-1">
        <View className="flex-row items-center gap-2">
          <Sparkles size={18} color={Theme.colors.primary} />
          <Text className="font-sora text-[15px] text-onSurface">Select Doctor Reviewer</Text>
        </View>
        <Text className="font-jakarta text-xs text-[#71787D]">Choose who signs the clinical analysis.</Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 py-1.5">
          {AI_DOCTORS.map((doc) => {
            const active = selectedAIDoctor === doc.name;
            return (
              <TouchableOpacity
                key={doc.name}
                onPress={() => setSelectedAIDoctor(doc.name)}
                className={`w-[120px] border rounded-2xl p-2.5 items-center bg-[#F0F2F1] gap-1 ${
                  active ? 'border-primary border-[1.5px] bg-primary/5' : 'border-[#E0E2E0]'
                }`}
              >
                <View className="w-11 h-11 rounded-full justify-center items-center" style={{ backgroundColor: doc.avatarBg }}>
                  <Text className="text-white font-sora text-sm">{doc.initials}</Text>
                </View>
                <Text className="font-jakarta-bold text-xs text-onSurface text-center">{doc.name}</Text>
                <Text className="font-jakarta text-[9px] text-[#71787D] text-center">{doc.role}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Clinical Summary & Unlocking Card */}
      {(period === 'week' || period === 'fortnight') && reportData && (
        <View className="bg-white rounded-3xl p-4 border border-[#E0E2E0] gap-1">
          <View className="flex-row justify-between items-center border-b border-[#F0F2F1] pb-2">
            <View className="flex-row items-center gap-1.5">
              <Sparkles size={18} color={Theme.colors.secondary} />
              <Text className="font-sora text-[15px] text-onSurface">
                {period === 'week' ? 'Weekly' : '15-Day'} Clinical Evaluation
              </Text>
            </View>
            {reportData.aiReport?.paid && (
              <View className="flex-row items-center bg-[#E8F5E9] px-2 py-0.5 rounded-full gap-1">
                <CheckCircle2 size={12} color="#2E7D32" />
                <Text className="font-jakarta-bold text-[8px] text-[#2E7D32]">UNLOCKED</Text>
              </View>
            )}
          </View>

          {reportData.aiReport?.paid ? (
            <View className="mt-1 gap-3">
              <View className="flex-row items-center gap-2.5">
                <View className="w-8 h-8 rounded-full justify-center items-center" style={{ backgroundColor: AI_DOCTORS.find(d => d.name === selectedAIDoctor)?.avatarBg || Theme.colors.secondaryContainer }}>
                  <Text className="text-white font-sora text-[11px]">{AI_DOCTORS.find(d => d.name === selectedAIDoctor)?.initials || 'DM'}</Text>
                </View>
                <View>
                  <Text className="font-jakarta text-[10px] text-[#71787D]">Clinical evaluation signed by:</Text>
                  <Text className="font-jakarta-bold text-[11px] text-onSurface">{selectedAIDoctor} ({AI_DOCTORS.find(d => d.name === selectedAIDoctor)?.role})</Text>
                </View>
              </View>
              <Text className="font-jakarta text-[13px] text-onSurfaceVariant leading-5 italic border-l-[3px] border-secondaryContainer pl-2.5">
                {reportData.aiReport.aiAnalysis.replaceAll('Dr. Manas', selectedAIDoctor)}
              </Text>
            </View>
          ) : (
            <View className="mt-2 gap-3">
              {/* Normal Summary */}
              <View className="p-3 bg-[#F0F2F1] rounded-2xl border border-[#E0E2E0] gap-1">
                <Text className="font-jakarta-bold text-[9px] text-[#71787D] tracking-wider">Free Summary</Text>
                <Text className="font-jakarta text-[13px] text-onSurface leading-[18px]">{reportData.normalSummary}</Text>
              </View>

              {/* Unlock Banner */}
              <View className="bg-primary rounded-2xl p-4 gap-2">
                <Sparkles size={24} color="#FFF" className="self-start" />
                <Text className="font-sora-bold text-base text-white">Unlock Expert Clinical Evaluation</Text>
                <Text className="font-jakarta text-xs text-white/80 leading-4">
                  Receive a deep psychological analysis of your journal entries, chats, and mood logs reviewed by our AI counselor.
                </Text>
                <View className="h-[1px] bg-white/15 my-1" />
                <View className="flex-row justify-between items-center">
                  <View>
                    <Text className="font-jakarta text-[9px] text-white/70">Report Fee</Text>
                    <Text className="font-sora-bold text-xl text-white">₹29.00</Text>
                  </View>
                  {walletBalance >= 29 ? (
                    <TouchableOpacity
                      disabled={unlocking}
                      onPress={handleUnlockAIReport}
                      className="flex-row items-center bg-white px-4 h-10 rounded-2xl gap-1.5"
                    >
                      {unlocking ? (
                        <ActivityIndicator color={Theme.colors.primary} />
                      ) : (
                        <>
                          <Wallet size={14} color={Theme.colors.primary} />
                          <Text className="font-sora text-xs text-primary">Pay from Wallet</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <View className="items-end gap-1">
                      <Text className="font-jakarta text-[10px] text-white/80">Wallet Balance: ₹{walletBalance.toFixed(2)}</Text>
                      <TouchableOpacity
                        onPress={() => navigation.navigate('Wallet')}
                        className="flex-row items-center bg-secondaryContainer px-3 h-[30px] rounded-lg gap-1"
                      >
                        <Plus size={12} color="#FFF" />
                        <Text className="font-sora text-[11px] text-white">Add Funds</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Share Report with Therapist */}
      <View className="bg-white rounded-3xl p-4 border border-[#E0E2E0] gap-1">
        <View className="flex-row items-center gap-2">
          <Share2 size={18} color={Theme.colors.primary} />
          <Text className="font-sora text-[15px] text-onSurface">Share with Therapist</Text>
        </View>

        {uniqueTherapists.length === 0 ? (
          <View className="items-center py-4 gap-1.5">
            <AlertCircle size={28} color={Theme.colors.textMuted} />
            <Text className="font-jakarta text-xs text-[#71787D]">You haven't booked any sessions yet.</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Therapists')}
              className="bg-primary px-4 h-9 rounded-2xl justify-center mt-1"
            >
              <Text className="font-sora text-xs text-white">Find a Therapist</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="gap-1 mt-1.5">
            <Text className="font-jakarta-bold text-[11px] text-[#71787D]">1. Select Therapist</Text>
            <TouchableOpacity 
              onPress={() => setTherapistModalVisible(true)} 
              className="flex-row justify-between items-center h-12 border border-[#E0E2E0] rounded-2xl bg-[#F0F2F1] px-3"
            >
              <Text className="font-jakarta text-[13px] text-onSurface">
                {selectedTherapist ? selectedTherapist.name : 'Select a therapist'}
              </Text>
              <ChevronRight size={18} color={Theme.colors.outline} />
            </TouchableOpacity>

            <Text className="font-jakarta-bold text-[11px] text-[#71787D]">2. Message / Notes (Optional)</Text>
            <TextInput
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
              placeholder="Hi Doctor, sharing my wellness logs for our next session..."
              placeholderTextColor={Theme.colors.outline}
              className="border border-[#E0E2E0] rounded-2xl bg-[#F0F2F1] p-3 text-[13px] font-jakarta text-onSurface h-[70px]"
              textAlignVertical="top"
            />

            <TouchableOpacity
              disabled={shareMutation.isPending}
              onPress={handleShare}
              className="flex-row items-center justify-center bg-secondary h-[46px] rounded-2xl gap-2 mt-1.5"
            >
              {shareMutation.isPending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Share2 size={16} color="#FFF" />
                  <Text className="font-sora text-[13px] text-white">Share Report</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Share History */}
      <View className="bg-white rounded-3xl p-4 border border-[#E0E2E0] gap-1">
        <View className="flex-row items-center gap-2">
          <Clock size={18} color={Theme.colors.secondary} />
          <Text className="font-sora text-[15px] text-onSurface">Sharing History</Text>
        </View>
        {sharesLoading ? (
          <ActivityIndicator color={Theme.colors.primary} />
        ) : shares.length === 0 ? (
          <Text className="font-jakarta text-xs text-[#71787D] text-center py-3">No reports shared yet.</Text>
        ) : (
          <View className="gap-2 mt-1.5">
            {shares.map((s: any) => (
              <View key={s.id || s._id} className="bg-[#F0F2F1] rounded-2xl p-3 border border-[#E0E2E0] gap-1">
                <View className="flex-row justify-between items-center">
                  <Text className="font-jakarta-bold text-xs text-onSurface">Shared with {s.therapistName}</Text>
                  <Text className="font-jakarta-bold text-[9px] text-secondary">{s.period.toUpperCase()}</Text>
                </View>
                <Text className="font-jakarta text-[10px] text-[#71787D]">
                  {new Date(s.sharedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </Text>
                {s.notes && (
                  <Text className="font-jakarta text-[11px] italic text-onSurfaceVariant mt-1 border-l-2 border-primary/30 pl-1.5">"{s.notes}"</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Download Action Widget */}
      <View className="flex-row items-center justify-between bg-[#EEF6F5] rounded-3xl p-4 border border-[#2E6E6530] gap-1">
        <View className="flex-row items-center gap-3 flex-1">
          <View className="w-11 h-11 rounded-2xl bg-[#0D564D10] justify-center items-center">
            <FileText size={22} color={Theme.colors.primary} />
          </View>
          <View className="flex-1">
            <Text className="font-sora text-[15px] text-primary">Download PDF Report</Text>
            <Text className="font-jakarta text-[11px] text-[#71787D]">Get a physical copy of your emotional logs.</Text>
          </View>
        </View>
        <TouchableOpacity
          disabled={downloading || reportLoading}
          onPress={handleDownload}
          className="flex-row items-center bg-primary h-10 rounded-2xl px-4 gap-1.5"
        >
          {downloading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Download size={16} color="#FFF" />
              <Text className="font-sora text-xs text-white">Download</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Report Preview Document */}
      <View className="bg-[#FCFAF7] rounded-3xl border border-[#E0E2E0] p-4 gap-4">
        <View className="flex-row justify-between items-start border-b border-primary/30 pb-2">
          <View>
            <Text className="font-jakarta-bold text-[9px] text-secondary tracking-widest">Previewing Wellness Report</Text>
            <Text className="font-sora-bold text-lg text-primary">MyMindTherapyFriend</Text>
          </View>
          <View className="items-end">
            <Text className="font-jakarta-bold text-[10px] text-onSurface">
              {reportData ? new Date(reportData.endDate).toLocaleDateString('en-IN') : ''}
            </Text>
            <Text className="font-jakarta text-[9px] text-[#71787D]">Coverage: {period.toUpperCase()}</Text>
          </View>
        </View>

        {reportLoading ? (
          <View className="py-10">
            <ActivityIndicator color={Theme.colors.primary} />
          </View>
        ) : reportData ? (
          <View className="gap-4">
            {/* Patient overview grid */}
            <View className="flex-row bg-white/60 rounded-2xl p-2.5 border border-black/5">
              <View className="flex-1 items-center gap-0.5">
                <Text className="font-jakarta-bold text-[8px] text-[#71787D]">PATIENT</Text>
                <Text className="font-sora text-xs text-primary">{reportData.user?.fullName || 'Anonymous'}</Text>
              </View>
              <View className="flex-1 items-center gap-0.5">
                <Text className="font-jakarta-bold text-[8px] text-[#71787D]">STREAK</Text>
                <Text className="font-sora text-xs text-primary">{reportData.user?.streak ?? 0} Days</Text>
              </View>
              <View className="flex-1 items-center gap-0.5">
                <Text className="font-jakarta-bold text-[8px] text-[#71787D]">AVG MOOD</Text>
                <Text className="font-sora text-xs text-primary">
                  {reportData.avgMood !== null ? `${reportData.avgMood}/10` : 'None'}
                </Text>
              </View>
            </View>

            {/* Therapy Urgency Gauge */}
            <View className="bg-white p-3.5 rounded-2xl border border-black/5 gap-2">
              <View className="flex-row justify-between items-center">
                <Text className="font-sora text-[13px] text-onSurface">Therapy Urgency Index</Text>
                <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: urgency.color + '15' }}>
                  <Text className="font-jakarta-bold text-[10px]" style={{ color: urgency.color }}>{urgency.label} ({urgency.score}/10)</Text>
                </View>
              </View>
              <View className="h-2 rounded-full bg-[#ECEFF1] relative my-1.5">
                <View className="absolute inset-0 bg-[#ECEFF1] rounded-full" />
                <View className="h-full rounded-full" style={{ width: `${urgency.score * 10}%`, backgroundColor: urgency.color }} />
                <View className="absolute w-3 h-3 rounded-full bg-white border-2 -top-0.5 -ml-1.5" style={{ left: `${urgency.score * 10}%`, borderColor: urgency.color }} />
              </View>
              <Text className="font-jakarta text-[10px] text-[#71787D]">
                Computed from your average mood of {reportData.avgMood !== null ? `${reportData.avgMood}/10` : 'None'}, {reportData.journals?.length || 0} journal entries, and chat safety levels.
              </Text>
            </View>

            {/* Doctor Endorsement & Referral Recommendation */}
            <View className="bg-white rounded-2xl p-3.5 border border-black/5 border-l-4 border-l-primary gap-1">
              <View className="flex-row items-center gap-1.5">
                <Sparkles size={16} color={Theme.colors.primary} />
                <Text className="font-sora text-[13px] text-onSurface">Doctor Recommendation & Referral</Text>
              </View>
              <Text className="font-jakarta text-[10px] text-[#71787D]">Endorsed & Signed by: {selectedAIDoctor}</Text>
              <View className="h-[1px] bg-[#ECEFF1] my-1" />
              <Text className="font-jakarta text-[11px] text-onSurfaceVariant leading-4">
                {doctorRec.endorsement}
              </Text>
              <Text className="font-jakarta-bold text-[11px] text-primary mt-2">
                {doctorRec.therapyNeed}
              </Text>
            </View>

            {/* SVG Trend Chart */}
            {sortedMoods.length > 0 && (
              <View className="bg-white p-3 rounded-2xl border border-black/5 gap-2">
                <Text className="font-sora text-[13px] text-onSurface border-b border-[#F0F2F1] pb-1">Mood Trend Graph</Text>
                <View className="items-center">
                  <Svg width={chartWidth} height={chartHeight}>
                    <Defs>
                      <LinearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0%" stopColor={Theme.colors.primary} stopOpacity="0.25" />
                        <Stop offset="100%" stopColor={Theme.colors.primary} stopOpacity="0" />
                      </LinearGradient>
                    </Defs>

                    {/* Level guidelines */}
                    {[2, 4, 6, 8, 10].map((level) => {
                      const y = chartHeight - (level / 10) * (chartHeight - 50) - 25;
                      return (
                        <G key={level}>
                          <Line
                            x1="30"
                            y1={y}
                            x2={chartWidth - 20}
                            y2={y}
                            stroke="#ECEFF1"
                            strokeWidth="1"
                            strokeDasharray="4, 4"
                          />
                          <SvgText x="15" y={y + 3} fill={Theme.colors.textMuted} fontSize="8" fontWeight="bold">
                            {level}
                          </SvgText>
                        </G>
                      );
                    })}

                    {/* Path area */}
                    {points.length > 1 && (
                      <Path
                        d={`M 30 ${chartHeight - 25} L ${points.map((p) => `${p.x} ${p.y}`).join(' L ')} L ${points[points.length - 1].x} ${chartHeight - 25} Z`}
                        fill="url(#moodGrad)"
                      />
                    )}

                    {/* Path line */}
                    {pathD ? (
                      <Path
                        d={pathD}
                        fill="none"
                        stroke={Theme.colors.primary}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ) : null}

                    {/* Highlight circles & score labels */}
                    {points.map((p, idx) => (
                      <G key={idx}>
                        <Circle cx={p.x} cy={p.y} r="4" fill="#FFF" stroke={Theme.colors.primary} strokeWidth="2" />
                        <Circle cx={p.x} cy={p.y} r="2" fill={Theme.colors.secondary} />
                        <SvgText x={p.x} y={p.y - 8} fill={Theme.colors.primary} fontSize="8" fontWeight="bold" textAnchor="middle">
                          {p.score}
                        </SvgText>
                        <SvgText x={p.x} y={chartHeight - 8} fill={Theme.colors.textMuted} fontSize="7" textAnchor="middle">
                          {p.dateStr}
                        </SvgText>
                      </G>
                    ))}
                  </Svg>
                </View>
              </View>
            )}

            {/* Mood Logs List */}
            <View className="gap-2">
              <Text className="font-sora text-[13px] text-onSurface border-b border-[#F0F2F1] pb-1">Mood Logs ({reportData.moods?.length || 0})</Text>
              {reportData.moods?.length === 0 ? (
                <Text className="font-jakarta text-[11px] italic text-[#71787D]">No mood check-ins recorded.</Text>
              ) : (
                <View className="flex-row flex-wrap gap-2">
                  {reportData.moods.map((m: any) => (
                    <View key={m.id || m._id} className="bg-white rounded-xl p-2.5 border border-black/5 gap-1" style={{ width: (screenWidth - paddingX - 40) / 2 }}>
                      <View className="flex-row justify-between items-center">
                        <Text className="font-jakarta text-[9px] text-[#71787D]">
                          {new Date(m.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </Text>
                        <View className="w-5 h-5 rounded-full justify-center items-center" style={{ backgroundColor: moodColor(m.score) }}>
                          <Text className="text-white font-jakarta-bold text-[9px]">{m.score}</Text>
                        </View>
                      </View>
                      {m.note ? <Text className="font-jakarta text-[10px] text-onSurfaceVariant italic">"{m.note}"</Text> : null}
                      {m.tags && m.tags.length > 0 ? (
                        <View className="flex-row flex-wrap gap-1 mt-1">
                          {m.tags.slice(0, 3).map((t: string, idx: number) => (
                            <View key={idx} className="bg-primary/10 px-1.5 py-0.5 rounded">
                              <Text className="font-jakarta-bold text-[8px] text-primary">{t}</Text>
                            </View>
                          ))}
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* CBT Journal Logs List */}
            <View className="gap-2">
              <Text className="font-sora text-[13px] text-onSurface border-b border-[#F0F2F1] pb-1">CBT Journal Reflections ({reportData.journals?.length || 0})</Text>
              {reportData.journals?.length === 0 ? (
                <Text className="font-jakarta text-[11px] italic text-[#71787D]">No CBT journal sheets logged.</Text>
              ) : (
                <View className="gap-2">
                  {reportData.journals.map((j: any) => (
                    <View key={j.id || j._id} className="bg-white rounded-2xl p-3 border border-black/5 gap-2">
                      <View className="flex-row justify-between items-start gap-1">
                        <Text className="font-jakarta-bold text-xs text-onSurface flex-1" numberOfLines={2}>{j.prompt}</Text>
                        <Text className="font-jakarta text-[9px] text-[#71787D]">
                          {new Date(j.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </Text>
                      </View>
                      
                      <View className="flex-row flex-wrap gap-2 mt-1">
                        <View className="gap-0.5" style={{ width: (screenWidth - paddingX - 48) / 2 }}>
                          <Text className="font-jakarta-bold text-[7px] text-[#71787D]">SITUATION</Text>
                          <Text className="font-jakarta text-[10px] text-onSurfaceVariant leading-3.5">{j.situation || 'N/A'}</Text>
                        </View>
                        <View className="gap-0.5" style={{ width: (screenWidth - paddingX - 48) / 2 }}>
                          <Text className="font-jakarta-bold text-[7px] text-[#71787D]">AUTOMATIC THOUGHT</Text>
                          <Text className="font-jakarta text-[10px] text-onSurfaceVariant leading-3.5">{j.thought || 'N/A'}</Text>
                        </View>
                        <View className="gap-0.5" style={{ width: (screenWidth - paddingX - 48) / 2 }}>
                          <Text className="font-jakarta-bold text-[7px] text-[#71787D]">EMOTIONAL FEELING</Text>
                          <Text className="font-jakarta text-[10px] text-onSurfaceVariant leading-3.5">{j.feeling || 'N/A'}</Text>
                        </View>
                        <View className="gap-0.5" style={{ width: (screenWidth - paddingX - 48) / 2 }}>
                          <Text className="font-jakarta-bold text-[7px] text-[#71787D]">REFRAMED TRUTH</Text>
                          <Text className="font-jakarta-bold text-[10px] text-primary leading-3.5">
                            {j.reframe || 'N/A'}
                          </Text>
                        </View>
                      </View>

                      {j.aiResponse ? (
                        <View className="mt-2 p-2 bg-[#F0F2F1] rounded-lg border border-[#E0E2E0]">
                          <Text className="font-jakarta-bold text-[9px] text-secondary mb-0.5">Manas AI Reflection</Text>
                          <Text className="font-jakarta text-[10px] text-onSurfaceVariant italic">"{j.aiResponse}"</Text>
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* AI Chats Sessions List */}
            <View className="gap-2">
              <Text className="font-sora text-[13px] text-onSurface border-b border-[#F0F2F1] pb-1">Manas AI Chat Activity ({reportData.chats?.length || 0})</Text>
              {reportData.chats?.length === 0 ? (
                <Text className="font-jakarta text-[11px] italic text-[#71787D]">No AI chat logs recorded.</Text>
              ) : (
                <View className="gap-2">
                  {reportData.chats.map((c: any, index: number) => (
                    <View key={c.sessionId || index} className="bg-white rounded-2xl p-3 border border-black/5 gap-1.5">
                      <View className="flex-row justify-between items-center">
                        <Text className="font-jakarta-bold text-[10px] text-[#71787D]">Session ID: #{c.sessionId?.slice(-6) || 'N/A'}</Text>
                        <View className={`px-2 py-0.5 rounded-full ${
                          c.riskLevel === 'high' ? 'bg-[#FFEBEE]' : c.riskLevel === 'medium' ? 'bg-[#FFF8E1]' : 'bg-[#E8F5E9]'
                        }`}>
                          <Text className={`font-jakarta-bold text-[8px] ${
                            c.riskLevel === 'high' ? 'text-[#C62828]' : c.riskLevel === 'medium' ? 'text-[#F57F17]' : 'text-[#2E7D32]'
                          }`}>
                            Risk: {c.riskLevel.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Text className="font-jakarta text-[11px] text-onSurface leading-[15px]">{c.summary}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        ) : (
          <Text className="font-jakarta text-xs text-[#71787D] text-center py-5">No data available for this timeframe.</Text>
        )}
      </View>

      {/* Custom Therapist Selector Modal */}
      <Modal
        visible={therapistModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setTherapistModalVisible(false)}
      >
        <TouchableOpacity 
          className="flex-1 bg-black/50 justify-center items-center"
          activeOpacity={1}
          onPress={() => setTherapistModalVisible(false)}
        >
          <View className="bg-white rounded-3xl p-4 w-[80%] max-h-[60%] gap-3 shadow-lg">
            <Text className="font-sora text-base text-onSurface border-b border-[#E0E2E0] pb-1.5">Choose Therapist</Text>
            {uniqueTherapists.map((t: any) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => {
                  setSelectedTherapist(t);
                  setTherapistModalVisible(false);
                }}
                className="py-2.5 border-b border-[#F0F2F1]"
              >
                <Text className="font-jakarta text-sm text-onSurface">{t.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              onPress={() => setTherapistModalVisible(false)}
              className="mt-1 h-10 bg-[#F0F2F1] rounded-2xl justify-center items-center"
            >
              <Text className="font-jakarta-bold text-[13px] text-onSurfaceVariant">Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

export default ReportsScreen;

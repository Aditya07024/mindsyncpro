import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  GraduationCap,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  MapPin,
  Phone,
  User,
  Building2,
  Edit2,
  Trash2,
  Plus,
  Eye,
  Calendar,
  Users,
  Tag,
  Video,
  Sparkles,
  Link as LinkIcon,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  BookOpen,
  Award,
  HelpCircle,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import API from "@/lib/api";

function formatMeetingDateTime(dateStr: string, timeStr: string, durationStr: string) {
  if (!dateStr) return "";
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const suffix = (d: number) => {
      if (d > 3 && d < 21) return "th";
      switch (d % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
      }
    };

    let timeFormatted = timeStr || "11:00 AM";
    if (timeStr && timeStr.includes(":")) {
      const [h, m] = timeStr.split(":").map(Number);
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 || 12;
      timeFormatted = `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
    }

    const dayStr = `${day}${suffix(day)} ${monthNames[month - 1]} ${year}`;
    return `${dayStr} at ${timeFormatted} IST (${durationStr})`;
  } catch {
    return `${dateStr} at ${timeStr}`;
  }
}

export const AdminCareerProgramsManager: React.FC<{ activeSubTab?: "selection" | "training" }> = ({
  activeSubTab = "selection",
}) => {
  const queryClient = useQueryClient();
  const [subTab, setSubTab] = useState<"selection" | "training">(activeSubTab);
  const [trainingViewMode, setTrainingViewMode] = useState<"programs" | "enrollments" | "cards">("programs");
  const [activeCardBox, setActiveCardBox] = useState<"training" | "selection">("training");
  const [search, setSearch] = useState("");

  // Homepage Program Cards Config query & state (Editable Box Content)
  const { data: cardsConfigData, isLoading: cardsConfigLoading } = useQuery({
    queryKey: ["adminProgramCardsConfig"],
    queryFn: () => API.careerPrograms.getProgramCardConfig(),
  });

  const [cardsForm, setCardsForm] = useState({
    trainingBadgeText: "Professional Training",
    trainingTitle: "Counseling Training Program",
    trainingDescription:
      "Comprehensive hands-on clinical training, CBT case supervision, real-world case simulations, and practical experience to enhance counseling competencies.",
    trainingButtonText: "Join Training Program →",
    trainingButtonLink: "/counseling-training",
    trainingIsActive: true,

    selectionBadgeText: "Specialized Pathway",
    selectionTitle: "Career Selection Program",
    selectionDescription:
      "Guidance and specialized tools for mental health aspirants and professionals to choose, build, and excel in their ideal counseling career path.",
    selectionButtonText: "Explore Career Program →",
    selectionButtonLink: "/career-selection",
    selectionIsActive: true,
  });

  useEffect(() => {
    if (cardsConfigData?.config) {
      const c = cardsConfigData.config;
      setCardsForm({
        trainingBadgeText: c.trainingBadgeText || "Professional Training",
        trainingTitle: c.trainingTitle || "Counseling Training Program",
        trainingDescription:
          c.trainingDescription ||
          "Comprehensive hands-on clinical training, CBT case supervision, real-world case simulations, and practical experience to enhance counseling competencies.",
        trainingButtonText: c.trainingButtonText || "Join Training Program →",
        trainingButtonLink: c.trainingButtonLink || "/counseling-training",
        trainingIsActive: c.trainingIsActive !== undefined ? Boolean(c.trainingIsActive) : true,

        selectionBadgeText: c.selectionBadgeText || "Specialized Pathway",
        selectionTitle: c.selectionTitle || "Career Selection Program",
        selectionDescription:
          c.selectionDescription ||
          "Guidance and specialized tools for mental health aspirants and professionals to choose, build, and excel in their ideal counseling career path.",
        selectionButtonText: c.selectionButtonText || "Explore Career Program →",
        selectionButtonLink: c.selectionButtonLink || "/career-selection",
        selectionIsActive: c.selectionIsActive !== undefined ? Boolean(c.selectionIsActive) : true,
      });
    }
  }, [cardsConfigData]);

  const updateCardsMutation = useMutation({
    mutationFn: (data: typeof cardsForm) => API.careerPrograms.updateProgramCardConfig(data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["adminProgramCardsConfig"] });
      queryClient.invalidateQueries({ queryKey: ["programCardsConfig"] });
      toast.success(res?.message || "Homepage box content saved successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update box content");
    },
  });


  // 1. Fetch Career Selection Registrations
  const { data: selectionData, isLoading: selectionLoading } = useQuery({
    queryKey: ["adminCareerSelectionRegistrations"],
    queryFn: () => API.careerPrograms.getCareerSelectionRegistrations(),
  });

  // 2. Fetch Counseling Training Programs (Admin view, includes inactive)
  const { data: adminProgramsData, isLoading: adminProgramsLoading } = useQuery({
    queryKey: ["adminCounselingTrainingPrograms"],
    queryFn: () => API.careerPrograms.getAdminTrainingPrograms(),
  });

  // 3. Fetch Counseling Training Enrollments
  const { data: trainingData, isLoading: trainingLoading } = useQuery({
    queryKey: ["adminCounselingTrainingEnrollments"],
    queryFn: () => API.careerPrograms.getTrainingEnrollments(),
  });

  const selectionRegistrations = selectionData?.registrations || [];
  const adminPrograms = adminProgramsData?.programs || [];
  const trainingEnrollments = trainingData?.enrollments || [];

  // 4. Fetch All Available Therapists / Counselors for Admin Assignment
  const { data: adminTherapistsData } = useQuery({
    queryKey: ["adminTherapistsListAll"],
    queryFn: () => API.admin.pendingTherapists(),
  });

  const { data: publicTherapistsData } = useQuery({
    queryKey: ["therapistsListPublicVerified"],
    queryFn: () => API.therapist.list({ verified: "true" }),
  });

  const rawTherapistList = [
    ...(adminTherapistsData?.therapists || []),
    ...(publicTherapistsData?.therapists || []),
  ];

  // Include platform counselors deduplicated by ID
  const activeTherapists = Array.from(
    new Map(
      rawTherapistList
        .filter((t: any) => Boolean(t.id || t._id))
        .map((t: any) => [String(t.id || t._id), t])
    ).values()
  );

  // Selection meeting schedule state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    therapistId: "",
    assignedCounselor: "Dr. Ananya Sharma (Senior Clinical Psychologist & Counselor)",
    guidanceFee: 499,
    meetingDate: "",
    datePart: "",
    timePart: "11:00",
    duration: "45 mins",
    meetingLink: "",
    adminNotes: "Application approved. Meeting scheduled with senior counselor.",
    status: "approved",
  });

  const updateSelectionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      API.careerPrograms.updateCareerSelectionStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCareerSelectionRegistrations"] });
      toast.success("Application status updated successfully");
      setShowScheduleModal(false);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update status");
    },
  });

  const adminAssignMutation = useMutation({
    mutationFn: (data: any) => API.careerPrograms.adminAssign(data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["adminCareerSelectionRegistrations"] });
      toast.success(res?.message || "Counselor assigned and meeting scheduled successfully!");
      setShowScheduleModal(false);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to schedule counselor meeting");
    },
  });

  const handleOpenScheduleModal = (r: any) => {
    setSelectedRecord(r);

    // Compute tomorrow's date YYYY-MM-DD as default date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    const defaultDatePart = `${yyyy}-${mm}-${dd}`;
    const defaultTimePart = "11:00";
    const defaultDuration = "45 mins";

    const computedDate = formatMeetingDateTime(defaultDatePart, defaultTimePart, defaultDuration);
    const initialDate = r.meetingDate && r.meetingDate.trim() ? r.meetingDate : computedDate;

    const roomSlug = r._id ? String(r._id).slice(-6) : Math.random().toString(36).substring(7);
    const defaultMeetingLink = r.meetingLink && r.meetingLink.trim()
      ? r.meetingLink
      : `https://meet.jit.si/MindSyncPro-Career-${roomSlug}`;

    const initialStatus = r.status === "proposal_sent"
      ? "proposal_sent"
      : "approved";

    setScheduleForm({
      therapistId: r.therapistId || "",
      assignedCounselor: r.assignedCounselor || "Dr. Ananya Sharma (Senior Clinical Psychologist & Counselor)",
      guidanceFee: r.guidanceFee !== undefined ? Number(r.guidanceFee) : 499,
      meetingDate: initialDate,
      datePart: defaultDatePart,
      timePart: defaultTimePart,
      duration: defaultDuration,
      meetingLink: defaultMeetingLink,
      adminNotes: r.adminNotes || "Application approved. Meeting scheduled with senior counselor.",
      status: initialStatus,
    });
    setShowScheduleModal(true);
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    const fee = Number(scheduleForm.guidanceFee || 0);

    adminAssignMutation.mutate({
      registrationId: selectedRecord._id,
      therapistId: scheduleForm.therapistId,
      assignedCounselor: scheduleForm.assignedCounselor,
      guidanceFee: fee,
      meetingDate: scheduleForm.meetingDate,
      meetingLink: scheduleForm.meetingLink,
      adminNotes: scheduleForm.adminNotes,
      status: scheduleForm.status,
    });
  };

  const updateEnrollmentMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      API.careerPrograms.updateTrainingEnrollmentStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCounselingTrainingEnrollments"] });
      toast.success("Enrollment status updated successfully");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update enrollment status");
    },
  });

  // Program mutations (Create, Update, Delete)
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [programEditorTab, setProgramEditorTab] = useState<
    "hero" | "about" | "modules" | "deliverables" | "fees" | "faqs"
  >("hero");

  type ModuleFormItem = {
    title: string;
    topicsText: string;
    learningOutcome: string;
  };
  type CareerItemForm = {
    title: string;
    description: string;
  };
  type FeeBreakdownItemForm = {
    item: string;
    value: string;
  };
  type TestimonialItemForm = {
    name: string;
    role: string;
    comment: string;
    rating: number;
  };
  type FaqItemForm = {
    question: string;
    answer: string;
  };

  const initialFormState = {
    title: "",
    badgeText: "Clinical Skill Certification & Internship",
    tagline:
      "LEARN, PRACTICE & COUNSEL WITH CONFIDENCE (Supervisor-Guided, Skill-Based, and Career-Oriented)",
    modes: "Online Live Interactive | Supervised Case Labs",
    modeNote: "*Participants receive live weekend workshops + recorded session replays.",
    aboutHeadline: "",
    description: "",
    startDate: "15th October 2026",
    duration: "8 Weeks (Extendable Supervision)",
    fee: 4999,
    totalProgramValue: "",
    earlyCohortNote: "",
    instructor: "Dr. Ananya Sharma (Senior Clinical Psychologist)",
    totalSeats: 30,
    availableSeats: 30,
    category: "CBT Certification",
    tags: "CBT, Clinical, Certification",
    isActive: true,
    keyOutcomesText: "",
    objectivesText: "",
    targetAudienceText: "",
    modules: [] as ModuleFormItem[],
    whatYouGetText: "",
    certificationDetails: "",
    careerEnablementSubtitle: "",
    careerEnablementItems: [] as CareerItemForm[],
    feeBreakdown: [] as FeeBreakdownItemForm[],
    supportAssuranceTitle: "Learning & Completion Support Assurance",
    supportAssuranceText: "",
    testimonials: [] as TestimonialItemForm[],
    faqs: [] as FaqItemForm[],
    organizerInitiative: "An Initiative of My Mind Therapy Friend (MindFirst Clinical Wellness)",
    contactEmail: "support@mymindtherapyfriend.com",
    contactPhone: "",
    cautionNote: "",
  };

  const [programForm, setProgramForm] = useState(initialFormState);

  const handlePrefillRichTemplate = () => {
    setProgramForm((prev) => ({
      ...prev,
      title:
        prev.title.trim() ||
        "Clinical CBT, Case Formulation & Applied Counseling Training Program",
      badgeText: "Clinical Training & Supervised Internship",
      tagline:
        "LEARN, FORMULATE & COUNSEL WITH CONFIDENCE (Senior Psychologist-Guided, Skill-Based & Career-Oriented)",
      modes: "Online Live Interactive | Supervised Case Labs",
      modeNote:
        "*Participants can attend live weekend clinical workshops and access recorded session replays.",
      aboutHeadline:
        "Master CBT Formulation, Intake Assessment & Ethical Psychotherapy from Scratch — and graduate with supervised clinical case experience and a verified certificate.",
      description:
        prev.description.trim() ||
        "The Clinical CBT & Applied Counseling Training Program is an intensive, structured learning-cum-supervision cohort designed to help psychology students, aspiring therapists, and mental health practitioners build strong clinical competencies starting from foundational interviewing skills.\n\nThis program blends evidence-based theoretical frameworks with live role-plays, standardized intake documentation, DSM-5-TR / ICD-11 diagnostic orientation, and real-world case formulation under senior clinical psychologists.",
      totalProgramValue: "₹25,000+",
      earlyCohortNote:
        "Subsidized cohort fee under the MindFirst Clinical Skill Initiative to make supervised practical counseling accessible to psychology students & early-career practitioners.",
      keyOutcomesText: [
        "Conduct structured clinical intake interviews & Mental Status Examinations (MSE)",
        "Build individualized CBT case formulations & treatment plans for anxiety and depression",
        "Apply cognitive restructuring, behavioral activation & Socratic questioning in live sessions",
        "Maintain ethical clinical documentation, boundaries, and crisis safety protocols",
        "Present real-world simulated cases during live clinical supervision rounds",
        "Earn a Verified Clinical Training & Internship Certificate",
      ].join("\n"),
      objectivesText: [
        "Bridge the gap between university textbook psychology and real-room client counseling",
        "Develop hands-on proficiency in CBT worksheets, thought records, and behavioral experiments",
        "Build ethical decision-making, trauma-informed empathy, and suicide risk assessment skills",
        "Prepare candidates for clinical placements, school/corporate counseling, or private practice",
      ].join("\n"),
      targetAudienceText: [
        "BA / BSc & MA / MSc Psychology Students",
        "Early-Career Counseling Psychologists & Psychiatric Social Workers",
        "School, College & Corporate Wellness Counselors",
        "Allied Healthcare & HR Professionals seeking structured counseling foundations",
      ].join("\n"),
      modules: [
        {
          title: "Module 1: Clinical Interviewing, Rapport & Mental Status Examination (MSE)",
          topicsText: [
            "Therapeutic alliance, active listening, unconditional positive regard & micro-skills",
            "Conducting the first 50-minute intake session & biopsychosocial history taking",
            "Step-by-step Mental Status Examination (MSE) & red-flag clinical screening",
          ].join("\n"),
          learningOutcome:
            "Confidently lead a structured first intake session and write a professional MSE report.",
        },
        {
          title: "Module 2: Case Conceptualization & DSM-5-TR / ICD-11 Clinical Orientation",
          topicsText: [
            "5-P clinical formulation model (Presenting, Predisposing, Precipitating, Perpetuating, Protective)",
            "Differential understanding of mood, anxiety, trauma & adjustment presentations",
            "Collaborative goal setting (SMART therapeutic goals) with clients",
          ].join("\n"),
          learningOutcome:
            "Translate raw client narratives into clear, actionable clinical case conceptualizations.",
        },
        {
          title: "Module 3: Core Cognitive Behavioral Therapy (CBT) Interventions",
          topicsText: [
            "Identifying Automatic Negative Thoughts (ANTs), intermediate beliefs & core schemas",
            "Socratic questioning, downward arrow technique & Dysfunctional Thought Records (DTR)",
            "Behavioral activation, graded exposure hierarchies & relapse-prevention planning",
          ].join("\n"),
          learningOutcome:
            "Deliver structured, evidence-based CBT interventions tailored to individual client needs.",
        },
        {
          title: "Module 4: Crisis Triage, Ethics, Confidentiality & Documentation",
          topicsText: [
            "Ethical guidelines, informed consent, dual relationships & boundary management",
            "Suicide & self-harm risk assessment, safety planning & psychiatric referral pathways",
            "SOAP & DAP session note writing and confidential record keeping",
          ].join("\n"),
          learningOutcome:
            "Manage sensitive ethical dilemmas and crisis situations safely and professionally.",
        },
        {
          title: "Module 5: Supervised Role-Plays, Mock Sessions & Case Presentations",
          topicsText: [
            "Live dyad/triad counseling simulations with real-time supervisor feedback",
            "End-to-end capstone clinical case presentation & peer supervision circles",
            "Therapist self-care, managing transference/countertransference & burnout prevention",
          ].join("\n"),
          learningOutcome:
            "Graduate with verified practical counseling readiness and supervisor-reviewed case logs.",
        },
      ],
      whatYouGetText: [
        "Live Interactive Clinical Training & Supervision Sessions with Senior Psychologists",
        "Ready-to-Use Clinical Toolkit (Intake Forms, MSE Templates, CBT Worksheets & Safety Plans)",
        "Hands-on Mock Counseling Labs & Real-Time Supervisor Feedback",
        "Recorded Session Replays & Curated Clinical Reading Compendium",
        "Verified Clinical Training & Supervised Practice Certificate",
        "Top Performers Considered for MindFirst Counselor Onboarding & Mentorship",
      ].join("\n"),
      certificationDetails:
        "Upon successful attendance and capstone case presentation, participants receive a Verified Counseling Training & Clinical Supervision Certificate issued by My Mind Therapy Friend (MindFirst Wellness), suitable for CV, LinkedIn, and postgraduate/clinical placement portfolios.",
      careerEnablementSubtitle:
        "Included at no extra cost to help you transition smoothly from learner to practicing counselor:",
      careerEnablementItems: [
        {
          title: "Clinical CV & LinkedIn Profile Optimization",
          description:
            "Highlight your supervised hours, assessment competencies, and CBT training effectively for hospitals, clinics, NGOs, and schools.",
        },
        {
          title: "Psychologist & Counselor Interview Readiness",
          description:
            "Practice real clinical case-vignette interview questions asked by mental health organizations and clinical boards.",
        },
        {
          title: "Private Practice & Platform Onboarding Roadmap",
          description:
            "Step-by-step guidance on ethical tele-counseling setup, client retention, and onboarding onto verified therapy platforms.",
        },
      ],
      feeBreakdown: [
        { item: "Live Clinical CBT & Counseling Training Workshops", value: "₹10,000" },
        { item: "Small-Group Case Formulation & Mock Session Supervision", value: "₹6,000" },
        { item: "Clinical Assessment, MSE & CBT Worksheet Toolkit", value: "₹3,500" },
        { item: "Verified Certificate & Capstone Case Evaluation", value: "₹3,000" },
        { item: "Career Enablement & Counselor Interview Guidance", value: "₹2,500" },
      ],
      supportAssuranceTitle: "Learning & Completion Support Assurance",
      supportAssuranceText:
        "Every participant receives structured supervisor guidance, session recordings for missed classes, doubt-clearing mentorship circles, and step-by-step feedback on their capstone case formulation so no learner is left behind.",
      testimonials: [
        {
          name: "Riya Deshmukh",
          role: "MA Clinical Psychology Student",
          comment:
            "The live mock counseling labs and 5-P CBT case formulation rounds completely transformed my confidence before starting my hospital internship.",
          rating: 5,
        },
        {
          name: "Karthik Nair",
          role: "School & Adolescent Counselor",
          comment:
            "Practical, ethical, and deeply structured. The MSE templates and Socratic questioning demonstrations are tools I now use every single week.",
          rating: 5,
        },
      ],
      faqs: [
        {
          question: "Who is eligible to enroll in this Counseling Training Program?",
          answer:
            "Undergraduate/Postgraduate Psychology students, aspiring counselors, social work students, educators, and early-career mental health practitioners are welcome. Foundational concepts are taught systematically from the ground up.",
        },
        {
          question: "What if I miss a live training or supervision session?",
          answer:
            "All core teaching modules include recorded replay access along with downloadable clinical handouts and worksheets so you can catch up seamlessly.",
        },
        {
          question: "Will I get practical hands-on counseling practice or only theory?",
          answer:
            "This is a practice-first cohort. You will participate in structured intake role-plays, MSE drafting, CBT thought-record exercises, and supervised case presentations.",
        },
        {
          question: "How does enrollment and seat confirmation work?",
          answer:
            "Click 'Enroll Now', complete your registration details and secure Razorpay fee payment, and our Clinical Program Leads will verify and confirm your cohort seat within 24 hours.",
        },
      ],
      organizerInitiative: "An Initiative of My Mind Therapy Friend (MindFirst Clinical Wellness)",
      contactEmail: "support@mymindtherapyfriend.com",
      cautionNote:
        "Official registrations and fee payments for MindFirst Counseling Training Cohorts are processed exclusively through our verified portal (mymindtherapyfriend.com). Please do not transfer fees to unauthorized personal accounts.",
    }));
    toast.success("Rich counseling template loaded! Review & customize across the 6 tabs.");
  };

  const createProgramMutation = useMutation({
    mutationFn: (data: any) => API.careerPrograms.createTrainingProgram(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCounselingTrainingPrograms"] });
      queryClient.invalidateQueries({ queryKey: ["trainingPrograms"] });
      setShowProgramModal(false);
      resetProgramForm();
      toast.success("Training program cohort created successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to create program");
    },
  });

  const updateProgramMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      API.careerPrograms.updateTrainingProgram(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCounselingTrainingPrograms"] });
      queryClient.invalidateQueries({ queryKey: ["trainingPrograms"] });
      setShowProgramModal(false);
      resetProgramForm();
      toast.success("Training program updated successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update program");
    },
  });

  const deleteProgramMutation = useMutation({
    mutationFn: (id: string) => API.careerPrograms.deleteTrainingProgram(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCounselingTrainingPrograms"] });
      queryClient.invalidateQueries({ queryKey: ["trainingPrograms"] });
      toast.success("Training program deleted successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete program");
    },
  });

  const resetProgramForm = () => {
    setEditingProgramId(null);
    setProgramEditorTab("hero");
    setProgramForm(initialFormState);
  };

  const handleOpenCreateProgram = () => {
    resetProgramForm();
    setShowProgramModal(true);
  };

  const handleOpenEditProgram = (prog: any) => {
    setEditingProgramId(prog._id);
    setProgramEditorTab("hero");
    setProgramForm({
      title: prog.title || "",
      badgeText: prog.badgeText || "Clinical Skill Certification & Internship",
      tagline: prog.tagline || "",
      modes: prog.modes || "",
      modeNote: prog.modeNote || "",
      aboutHeadline: prog.aboutHeadline || "",
      description: prog.description || "",
      startDate: prog.startDate || "",
      duration: prog.duration || "",
      fee: prog.fee ?? 0,
      totalProgramValue: prog.totalProgramValue || "",
      earlyCohortNote: prog.earlyCohortNote || "",
      instructor: prog.instructor || "",
      totalSeats: prog.totalSeats || 30,
      availableSeats: prog.availableSeats ?? prog.totalSeats ?? 30,
      category: prog.category || "CBT Certification",
      tags: Array.isArray(prog.tags) ? prog.tags.join(", ") : prog.tags || "",
      isActive: prog.isActive !== false,
      keyOutcomesText: Array.isArray(prog.keyOutcomes) ? prog.keyOutcomes.join("\n") : "",
      objectivesText: Array.isArray(prog.objectives) ? prog.objectives.join("\n") : "",
      targetAudienceText: Array.isArray(prog.targetAudience) ? prog.targetAudience.join("\n") : "",
      modules: Array.isArray(prog.modules)
        ? prog.modules.map((m: any) => ({
            title: m.title || "",
            topicsText: Array.isArray(m.topics) ? m.topics.join("\n") : "",
            learningOutcome: m.learningOutcome || "",
          }))
        : [],
      whatYouGetText: Array.isArray(prog.whatYouGet) ? prog.whatYouGet.join("\n") : "",
      certificationDetails: prog.certificationDetails || "",
      careerEnablementSubtitle: prog.careerEnablementSubtitle || "",
      careerEnablementItems: Array.isArray(prog.careerEnablementItems)
        ? prog.careerEnablementItems.map((c: any) => ({
            title: c.title || "",
            description: c.description || "",
          }))
        : [],
      feeBreakdown: Array.isArray(prog.feeBreakdown)
        ? prog.feeBreakdown.map((f: any) => ({
            item: f.item || "",
            value: f.value || "",
          }))
        : [],
      supportAssuranceTitle:
        prog.supportAssuranceTitle || "Learning & Completion Support Assurance",
      supportAssuranceText: prog.supportAssuranceText || "",
      testimonials: Array.isArray(prog.testimonials)
        ? prog.testimonials.map((t: any) => ({
            name: t.name || "",
            role: t.role || "",
            comment: t.comment || "",
            rating: Number(t.rating || 5),
          }))
        : [],
      faqs: Array.isArray(prog.faqs)
        ? prog.faqs.map((q: any) => ({
            question: q.question || "",
            answer: q.answer || "",
          }))
        : [],
      organizerInitiative: prog.organizerInitiative || "",
      contactEmail: prog.contactEmail || "",
      contactPhone: prog.contactPhone || "",
      cautionNote: prog.cautionNote || "",
    });
    setShowProgramModal(true);
  };

  const handleProgramSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!programForm.title.trim()) {
      setProgramEditorTab("hero");
      toast.error("Please enter a Program Title in Tab 1 (Hero & Core Info).");
      return;
    }
    if (!programForm.description.trim()) {
      setProgramEditorTab("about");
      toast.error("Please enter the Program Overview / Description in Tab 2 (About & Outcomes).");
      return;
    }

    const splitLines = (txt: string) =>
      txt
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);

    const payload = {
      title: programForm.title.trim(),
      description: programForm.description.trim(),
      startDate: programForm.startDate.trim(),
      duration: programForm.duration.trim(),
      fee: Number(programForm.fee || 0),
      instructor: programForm.instructor.trim(),
      totalSeats: Number(programForm.totalSeats || 30),
      availableSeats: Number(programForm.availableSeats || 0),
      category: programForm.category.trim() || "CBT Certification",
      tags: programForm.tags,
      isActive: programForm.isActive,

      badgeText: programForm.badgeText.trim(),
      tagline: programForm.tagline.trim(),
      modes: programForm.modes.trim(),
      modeNote: programForm.modeNote.trim(),
      aboutHeadline: programForm.aboutHeadline.trim(),
      keyOutcomes: splitLines(programForm.keyOutcomesText),
      objectives: splitLines(programForm.objectivesText),
      targetAudience: splitLines(programForm.targetAudienceText),
      modules: programForm.modules
        .filter((m) => m.title.trim())
        .map((m) => ({
          title: m.title.trim(),
          topics: splitLines(m.topicsText),
          learningOutcome: m.learningOutcome.trim(),
        })),
      whatYouGet: splitLines(programForm.whatYouGetText),
      certificationDetails: programForm.certificationDetails.trim(),
      careerEnablementSubtitle: programForm.careerEnablementSubtitle.trim(),
      careerEnablementItems: programForm.careerEnablementItems
        .filter((c) => c.title.trim())
        .map((c) => ({
          title: c.title.trim(),
          description: c.description.trim(),
        })),
      totalProgramValue: programForm.totalProgramValue.trim(),
      earlyCohortNote: programForm.earlyCohortNote.trim(),
      feeBreakdown: programForm.feeBreakdown
        .filter((f) => f.item.trim())
        .map((f) => ({
          item: f.item.trim(),
          value: f.value.trim(),
        })),
      supportAssuranceTitle: programForm.supportAssuranceTitle.trim(),
      supportAssuranceText: programForm.supportAssuranceText.trim(),
      testimonials: programForm.testimonials
        .filter((t) => t.name.trim() && t.comment.trim())
        .map((t) => ({
          name: t.name.trim(),
          role: t.role.trim(),
          comment: t.comment.trim(),
          rating: Math.min(5, Math.max(1, Number(t.rating || 5))),
        })),
      faqs: programForm.faqs
        .filter((q) => q.question.trim() && q.answer.trim())
        .map((q) => ({
          question: q.question.trim(),
          answer: q.answer.trim(),
        })),
      organizerInitiative: programForm.organizerInitiative.trim(),
      contactEmail: programForm.contactEmail.trim(),
      contactPhone: programForm.contactPhone.trim(),
      cautionNote: programForm.cautionNote.trim(),
    };

    if (editingProgramId) {
      updateProgramMutation.mutate({ id: editingProgramId, data: payload });
    } else {
      createProgramMutation.mutate(payload);
    }
  };

  const handleToggleActive = (prog: any) => {
    updateProgramMutation.mutate({
      id: prog._id,
      data: { isActive: !prog.isActive },
    });
  };

  const filteredSelection = selectionRegistrations.filter(
    (r: any) =>
      r.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      r.schoolOrgName?.toLowerCase().includes(search.toLowerCase()) ||
      r.phone?.includes(search)
  );

  const filteredPrograms = adminPrograms.filter(
    (p: any) =>
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase()) ||
      p.instructor?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTraining = trainingEnrollments.filter(
    (e: any) =>
      e.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      e.programTitle?.toLowerCase().includes(search.toLowerCase()) ||
      e.phone?.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Sub Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSubTab("selection")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              subTab === "selection"
                ? "bg-teal-500 text-slate-950 shadow-md"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            <Briefcase className="size-4" /> Career Selection ({selectionRegistrations.length})
          </button>
          <button
            onClick={() => {
              setSubTab("training");
              if (trainingViewMode === "cards") setTrainingViewMode("programs");
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              subTab === "training" && trainingViewMode !== "cards"
                ? "bg-cyan-500 text-slate-950 shadow-md"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            <GraduationCap className="size-4" /> Counseling Training ({adminPrograms.length} Programs)
          </button>
          <button
            onClick={() => {
              setSubTab("training");
              setTrainingViewMode("cards");
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              subTab === "training" && trainingViewMode === "cards"
                ? "bg-amber-400 text-slate-950 shadow-md font-extrabold"
                : "bg-slate-700 text-amber-300 hover:bg-slate-600 border border-amber-400/30"
            }`}
          >
            <Sparkles className="size-4" /> Homepage Box Editor
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {subTab === "training" && (
            <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setTrainingViewMode("programs")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  trainingViewMode === "programs"
                    ? "bg-cyan-500 text-slate-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Programs List ({adminPrograms.length})
              </button>
              <button
                onClick={() => setTrainingViewMode("enrollments")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  trainingViewMode === "enrollments"
                    ? "bg-cyan-500 text-slate-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Student Enrollments ({trainingEnrollments.length})
              </button>
              <button
                onClick={() => setTrainingViewMode("cards")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  trainingViewMode === "cards"
                    ? "bg-amber-400 text-slate-950 font-bold"
                    : "text-amber-300 hover:text-white"
                }`}
              >
                <Sparkles className="size-3.5" /> Box Content
              </button>
            </div>
          )}

          {subTab === "training" && trainingViewMode === "programs" && (
            <button
              onClick={handleOpenCreateProgram}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="size-4" /> Create Program Cohort
            </button>
          )}

          {trainingViewMode !== "cards" && (
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, phone, program..."
                className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
            </div>
          )}
        </div>
      </div>

      {/* SUB TAB 1: CAREER SELECTION REGISTRATIONS */}
      {subTab === "selection" && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          {selectionLoading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading Career Selection Registrations...</div>
          ) : filteredSelection.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No career selection registrations found.</div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-700">
                <tr>
                  <th className="p-4">Applicant Name</th>
                  <th className="p-4">College / Organization</th>
                  <th className="p-4">Counseling Domain</th>
                  <th className="p-4">Location & Contact</th>
                  <th className="p-4">Meeting Status</th>
                  <th className="p-4 text-right">Approval & Counselor Meeting</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {filteredSelection.map((r: any) => (
                  <tr key={r._id} className="hover:bg-slate-700/30 transition">
                    <td className="p-4 font-bold text-white">
                      <div className="flex items-center gap-2">
                        <User className="size-4 text-teal-400" />
                        <div>
                          <span>{r.fullName}</span>
                          <div className="text-[10px] text-slate-500 font-normal">Age: {r.age} yrs</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-200">{r.schoolOrgName}</td>
                    <td className="p-4">
                      <span className="bg-teal-950 text-teal-300 border border-teal-800 px-2 py-0.5 rounded text-[11px] font-semibold block w-fit">
                        {r.counselingType || "Clinical Psychology & Psychotherapy"}
                      </span>
                      {r.preferredGoals && (
                        <span className="text-[10px] text-slate-400 italic line-clamp-1 mt-1 block">
                          "{r.preferredGoals}"
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-slate-300">{r.city}, {r.state}</div>
                      <div className="font-mono text-teal-300 text-[11px]">{r.phone}</div>
                    </td>
                    <td className="p-4">
                      {r.status === "approved" ? (
                        <div>
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold block w-fit">
                            Approved & Scheduled ✓
                          </span>
                          {r.assignedCounselor && (
                            <div className="text-[10px] text-slate-400 mt-1">
                              With: <strong className="text-teal-200">{r.assignedCounselor}</strong>
                            </div>
                          )}
                        </div>
                      ) : r.status === "proposal_sent" ? (
                        <div>
                          <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded text-[10px] font-bold block w-fit">
                            Proposal Sent (₹{r.guidanceFee || 499})
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Awaiting Candidate Payment
                          </div>
                        </div>
                      ) : r.status === "guidance_requested" || r.guidanceRequested ? (
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse block w-fit">
                          ⚡ Guidance Requested
                        </span>
                      ) : r.status === "rejected" ? (
                        <span className="bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                          Rejected
                        </span>
                      ) : (
                        <span className="bg-slate-700 text-slate-300 border border-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                          Pending Review
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenScheduleModal(r)}
                          className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] shadow transition cursor-pointer flex items-center gap-1"
                        >
                          <Calendar className="size-3.5" /> {r.status === "approved" ? "Edit Meeting" : "Approve & Schedule Meeting"}
                        </button>
                        {r.status !== "rejected" && (
                          <button
                            disabled={updateSelectionMutation.isPending}
                            onClick={() => updateSelectionMutation.mutate({ id: r._id, data: { status: "rejected" } })}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-red-300 font-bold text-[11px] transition cursor-pointer"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* SUB TAB 2: COUNSELING TRAINING (PROGRAMS LIST OR ENROLLMENTS) */}
      {subTab === "training" && trainingViewMode === "programs" && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          {adminProgramsLoading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading Counseling Training Programs...</div>
          ) : filteredPrograms.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No counseling training programs created yet. Click "+ Create Program Cohort" above.</div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-700">
                <tr>
                  <th className="p-4">Program Title & Category</th>
                  <th className="p-4">Start Date & Duration</th>
                  <th className="p-4">Seats & Fee</th>
                  <th className="p-4">Instructor</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {filteredPrograms.map((prog: any) => (
                  <tr key={prog._id} className="hover:bg-slate-700/30 transition">
                    <td className="p-4 font-bold text-white max-w-md">
                      <div>
                        <div className="text-sm text-cyan-300 font-semibold">{prog.title}</div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                            {prog.category || "Certification"}
                          </span>
                          {Array.isArray(prog.modules) && prog.modules.length > 0 && (
                            <span className="text-[10px] bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                              {prog.modules.length} Modules
                            </span>
                          )}
                          {Array.isArray(prog.faqs) && prog.faqs.length > 0 && (
                            <span className="text-[10px] bg-teal-500/15 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full">
                              {prog.faqs.length} FAQs
                            </span>
                          )}
                          {Array.isArray(prog.testimonials) && prog.testimonials.length > 0 && (
                            <span className="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                              {prog.testimonials.length} Reviews
                            </span>
                          )}
                          {prog.totalProgramValue && (
                            <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                              Value: {prog.totalProgramValue}
                            </span>
                          )}
                        </div>
                        {prog.description && (
                          <div className="mt-2 text-xs font-normal text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/60 leading-relaxed whitespace-pre-line max-h-24 overflow-y-auto">
                            {prog.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-300 font-medium">{prog.startDate}</div>
                      <div className="text-[11px] text-slate-500">{prog.duration}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-emerald-400">₹{prog.fee}</div>
                      <div className="text-[11px] text-slate-400">
                        {prog.availableSeats} / {prog.totalSeats} Available Seats
                      </div>
                    </td>
                    <td className="p-4 text-slate-300 font-medium">{prog.instructor}</td>
                    <td className="p-4">
                      {prog.isActive ? (
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                          Active (Visible)
                        </span>
                      ) : (
                        <span className="bg-slate-700 text-slate-400 border border-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                          Inactive (Draft)
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(prog)}
                          className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                            prog.isActive
                              ? "bg-slate-700 text-amber-300 hover:bg-slate-600"
                              : "bg-emerald-600/80 text-white hover:bg-emerald-600"
                          }`}
                        >
                          {prog.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleOpenEditProgram(prog)}
                          className="p-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/60 text-cyan-200 transition cursor-pointer"
                          title="Edit Program"
                        >
                          <Edit2 className="size-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${prog.title}"?`)) {
                              deleteProgramMutation.mutate(prog._id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-red-600/30 hover:bg-red-600/60 text-red-200 transition cursor-pointer"
                          title="Delete Program"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* SUB TAB 2: COUNSELING TRAINING ENROLLMENTS */}
      {subTab === "training" && trainingViewMode === "enrollments" && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          {trainingLoading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading Counseling Training Enrollments...</div>
          ) : filteredTraining.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No counseling training enrollments found.</div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-700">
                <tr>
                  <th className="p-4">Participant Name</th>
                  <th className="p-4">Program Cohort</th>
                  <th className="p-4">Org & Profession</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Contact Phone</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {filteredTraining.map((e: any) => (
                  <tr key={e._id} className="hover:bg-slate-700/30 transition">
                    <td className="p-4 font-bold text-white">
                      <div className="flex items-center gap-2">
                        <User className="size-4 text-cyan-400" />
                        <span>{e.fullName}</span>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-cyan-200">{e.programTitle}</td>
                    <td className="p-4">{e.orgName} ({e.profession})</td>
                    <td className="p-4 text-slate-400">{e.city}, {e.state}</td>
                    <td className="p-4 font-mono text-cyan-300">{e.phone}</td>
                    <td className="p-4">
                      {e.status === "confirmed" ? (
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                          Confirmed Seat
                        </span>
                      ) : (
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                          Pending Confirmation
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => updateEnrollmentMutation.mutate({ id: e._id, status: "confirmed" })}
                          className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] shadow transition cursor-pointer"
                        >
                          Confirm Seat
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* SUB TAB 3: HOMEPAGE BOX CONTENT EDITOR */}
      {subTab === "training" && trainingViewMode === "cards" && (
        <div className="space-y-6">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700 pb-5">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Sparkles className="size-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Homepage Box Content Editor
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Customize the text, title, description, and button of the program boxes displayed on the landing page.
                  </p>
                </div>
              </div>

              {/* Box Selector */}
              <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setActiveCardBox("training")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeCardBox === "training"
                      ? "bg-cyan-500 text-slate-950 shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <GraduationCap className="size-3.5" /> Counseling Training Box
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCardBox("selection")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeCardBox === "selection"
                      ? "bg-teal-500 text-slate-950 shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Briefcase className="size-3.5" /> Career Selection Box
                </button>
              </div>
            </div>

            {cardsConfigLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Loading homepage box settings...
              </div>
            ) : (
              <div className="grid gap-8 lg:grid-cols-12 items-start">
                {/* Left 7 Columns: Form */}
                <div className="lg:col-span-7 space-y-5 bg-slate-900/60 p-6 rounded-2xl border border-slate-700/70">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      {activeCardBox === "training" ? (
                        <>
                          <GraduationCap className="size-4 text-cyan-400" /> Counseling Training Box Details
                        </>
                      ) : (
                        <>
                          <Briefcase className="size-4 text-teal-400" /> Career Selection Box Details
                        </>
                      )}
                    </span>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                      <span>Visible on Landing Page</span>
                      <input
                        type="checkbox"
                        checked={
                          activeCardBox === "training"
                            ? cardsForm.trainingIsActive
                            : cardsForm.selectionIsActive
                        }
                        onChange={(e) => {
                          if (activeCardBox === "training") {
                            setCardsForm({ ...cardsForm, trainingIsActive: e.target.checked });
                          } else {
                            setCardsForm({ ...cardsForm, selectionIsActive: e.target.checked });
                          }
                        }}
                        className="size-4 rounded accent-cyan-500 cursor-pointer"
                      />
                    </label>
                  </div>

                  {activeCardBox === "training" ? (
                    <>
                      {/* Badge Text */}
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1 text-xs">
                          Badge Text (Pill above title)
                        </label>
                        <input
                          type="text"
                          value={cardsForm.trainingBadgeText}
                          onChange={(e) => setCardsForm({ ...cardsForm, trainingBadgeText: e.target.value })}
                          placeholder="e.g. PROFESSIONAL TRAINING"
                          className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                        />
                      </div>

                      {/* Box Title */}
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1 text-xs">
                          Box Title
                        </label>
                        <input
                          type="text"
                          value={cardsForm.trainingTitle}
                          onChange={(e) => setCardsForm({ ...cardsForm, trainingTitle: e.target.value })}
                          placeholder="e.g. Counseling Training Program"
                          className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-400 font-bold"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-slate-400 font-semibold text-xs">
                            Box Content / Description
                          </label>
                          <span className="text-[10px] text-slate-500">
                            {cardsForm.trainingDescription.length} characters
                          </span>
                        </div>
                        <textarea
                          rows={5}
                          value={cardsForm.trainingDescription}
                          onChange={(e) => setCardsForm({ ...cardsForm, trainingDescription: e.target.value })}
                          placeholder="Comprehensive hands-on clinical training, CBT case supervision, real-world case simulations..."
                          className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-400 leading-relaxed font-sans"
                        />
                      </div>

                      {/* Button Text & Button Link */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-400 font-semibold mb-1 text-xs">
                            Button Text
                          </label>
                          <input
                            type="text"
                            value={cardsForm.trainingButtonText}
                            onChange={(e) => setCardsForm({ ...cardsForm, trainingButtonText: e.target.value })}
                            placeholder="e.g. Join Training Program →"
                            className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-semibold mb-1 text-xs">
                            Button Target Link
                          </label>
                          <input
                            type="text"
                            value={cardsForm.trainingButtonLink}
                            onChange={(e) => setCardsForm({ ...cardsForm, trainingButtonLink: e.target.value })}
                            placeholder="e.g. /counseling-training"
                            className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Career Selection Form Fields */}
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1 text-xs">
                          Badge Text (Pill above title)
                        </label>
                        <input
                          type="text"
                          value={cardsForm.selectionBadgeText}
                          onChange={(e) => setCardsForm({ ...cardsForm, selectionBadgeText: e.target.value })}
                          placeholder="e.g. SPECIALIZED PATHWAY"
                          className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-semibold mb-1 text-xs">
                          Box Title
                        </label>
                        <input
                          type="text"
                          value={cardsForm.selectionTitle}
                          onChange={(e) => setCardsForm({ ...cardsForm, selectionTitle: e.target.value })}
                          placeholder="e.g. Career Selection Program"
                          className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-400 font-bold"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-slate-400 font-semibold text-xs">
                            Box Content / Description
                          </label>
                          <span className="text-[10px] text-slate-500">
                            {cardsForm.selectionDescription.length} characters
                          </span>
                        </div>
                        <textarea
                          rows={5}
                          value={cardsForm.selectionDescription}
                          onChange={(e) => setCardsForm({ ...cardsForm, selectionDescription: e.target.value })}
                          placeholder="Guidance and specialized tools for mental health aspirants and professionals..."
                          className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-400 leading-relaxed font-sans"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-400 font-semibold mb-1 text-xs">
                            Button Text
                          </label>
                          <input
                            type="text"
                            value={cardsForm.selectionButtonText}
                            onChange={(e) => setCardsForm({ ...cardsForm, selectionButtonText: e.target.value })}
                            placeholder="e.g. Explore Career Program →"
                            className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-semibold mb-1 text-xs">
                            Button Target Link
                          </label>
                          <input
                            type="text"
                            value={cardsForm.selectionButtonLink}
                            onChange={(e) => setCardsForm({ ...cardsForm, selectionButtonLink: e.target.value })}
                            placeholder="e.g. /career-selection"
                            className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Reset box content to original defaults?")) {
                          setCardsForm({
                            trainingBadgeText: "Professional Training",
                            trainingTitle: "Counseling Training Program",
                            trainingDescription:
                              "Comprehensive hands-on clinical training, CBT case supervision, real-world case simulations, and practical experience to enhance counseling competencies.",
                            trainingButtonText: "Join Training Program →",
                            trainingButtonLink: "/counseling-training",
                            trainingIsActive: true,
                            selectionBadgeText: "Specialized Pathway",
                            selectionTitle: "Career Selection Program",
                            selectionDescription:
                              "Guidance and specialized tools for mental health aspirants and professionals to choose, build, and excel in their ideal counseling career path.",
                            selectionButtonText: "Explore Career Program →",
                            selectionButtonLink: "/career-selection",
                            selectionIsActive: true,
                          });
                        }
                      }}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                    >
                      Reset Defaults
                    </button>

                    <button
                      type="button"
                      disabled={updateCardsMutation.isPending}
                      onClick={() => updateCardsMutation.mutate(cardsForm)}
                      className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                    >
                      {updateCardsMutation.isPending ? "Saving..." : "Save Box Content"}
                    </button>
                  </div>
                </div>

                {/* Right 5 Columns: Live Preview matching user screenshot */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
                    <span className="flex items-center gap-1.5 text-cyan-400">
                      <Eye className="size-4" /> Live Public Preview
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Matches homepage view
                    </span>
                  </div>

                  {activeCardBox === "training" ? (
                    <div className="group relative overflow-hidden rounded-[32px] border border-cyan-200 bg-gradient-to-br from-cyan-50/90 via-white to-blue-50/80 p-8 shadow-xl backdrop-blur-xl transition-all">
                      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-cyan-400/10 blur-2xl" />
                      
                      <div className="relative z-10 flex flex-col justify-between min-h-[300px]">
                        <div>
                          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-100/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-cyan-800">
                            <GraduationCap className="size-3.5 text-cyan-600" />
                            {cardsForm.trainingBadgeText || "PROFESSIONAL TRAINING"}
                          </div>

                          <h3 className="mt-4 font-display text-2xl font-bold text-[#012620]">
                            {cardsForm.trainingTitle || "Counseling Training Program"}
                          </h3>

                          <p className="mt-3 text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                            {cardsForm.trainingDescription || "Comprehensive hands-on clinical training, CBT case supervision, real-world case simulations, and practical experience to enhance counseling competencies."}
                          </p>
                        </div>

                        <div className="mt-8 pt-4 border-t border-cyan-100/60 flex items-center justify-between">
                          <span className="inline-flex items-center gap-2 rounded-2xl bg-[#004038] px-6 py-3 text-sm font-semibold text-white shadow-md">
                            {cardsForm.trainingButtonText || "Join Training Program →"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="group relative overflow-hidden rounded-[32px] border border-teal-200 bg-gradient-to-br from-teal-50/90 via-white to-emerald-50/80 p-8 shadow-xl backdrop-blur-xl transition-all">
                      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-teal-400/10 blur-2xl" />
                      
                      <div className="relative z-10 flex flex-col justify-between min-h-[300px]">
                        <div>
                          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-100/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-teal-800">
                            <Briefcase className="size-3.5 text-teal-600" />
                            {cardsForm.selectionBadgeText || "SPECIALIZED PATHWAY"}
                          </div>

                          <h3 className="mt-4 font-display text-2xl font-bold text-[#012620]">
                            {cardsForm.selectionTitle || "Career Selection Program"}
                          </h3>

                          <p className="mt-3 text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                            {cardsForm.selectionDescription || "Guidance and specialized tools for mental health aspirants and professionals to choose, build, and excel in their ideal counseling career path."}
                          </p>
                        </div>

                        <div className="mt-8 pt-4 border-t border-teal-100/60 flex items-center justify-between">
                          <span className="inline-flex items-center gap-2 rounded-2xl bg-[#004038] px-6 py-3 text-sm font-semibold text-white shadow-md">
                            {cardsForm.selectionButtonText || "Explore Career Program →"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE / EDIT PROGRAM COHORT MODAL (6-TAB RICH PROGRAM BUILDER) */}
      {showProgramModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-7 max-w-5xl w-full text-white flex flex-col max-h-[92vh] shadow-2xl">
            {/* Modal Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 shrink-0">
              <div>
                <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-cyan-300">
                  <GraduationCap className="size-5" />
                  {editingProgramId
                    ? "Edit Rich Counseling Training Program"
                    : "Create Rich Counseling Training Program"}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Author comprehensive program landing sections (Hero, Outcomes, Expandable Modules, Career Support, Value Breakdown, Reviews & FAQs).
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handlePrefillRichTemplate}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-teal-500/20 hover:from-cyan-500/30 hover:to-teal-500/30 border border-cyan-500/40 px-3 py-2 text-[11px] font-bold text-cyan-200 transition cursor-pointer"
                >
                  <Sparkles className="size-3.5 text-cyan-300" />
                  Pre-fill Rich Counseling Template
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProgramModal(false);
                    resetProgramForm();
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  title="Close"
                >
                  <XCircle className="size-5" />
                </button>
              </div>
            </div>

            {/* 6-Tab Navigation */}
            <div className="flex flex-wrap gap-1.5 py-3 border-b border-slate-800 shrink-0">
              {[
                { id: "hero", label: "1. Hero & Core Info" },
                { id: "about", label: "2. About, Outcomes & Objectives" },
                { id: "modules", label: `3. Syllabus Modules (${programForm.modules.length})` },
                { id: "deliverables", label: "4. What You Get & Career" },
                { id: "fees", label: "5. Fee Value & Assurance" },
                { id: "faqs", label: `6. Reviews (${programForm.testimonials.length}) & FAQs (${programForm.faqs.length})` },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setProgramEditorTab(t.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer border ${
                    programEditorTab === t.id
                      ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow"
                      : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleProgramSubmit} className="flex-1 flex flex-col min-h-0 pt-4 text-xs">
              {/* Scrollable Tab Body */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-5">
                {/* TAB 1: HERO & CORE INFO */}
                {programEditorTab === "hero" && (
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Top Hero Badge Text
                        </label>
                        <input
                          type="text"
                          value={programForm.badgeText}
                          onChange={(e) => setProgramForm({ ...programForm, badgeText: e.target.value })}
                          placeholder="e.g. Clinical Training & Supervised Internship"
                          className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-slate-300 font-semibold">Category *</label>
                          <span className="text-[10px] text-cyan-400">Select or type custom</span>
                        </div>
                        <input
                          type="text"
                          list="category-suggestions"
                          value={programForm.category}
                          onChange={(e) => setProgramForm({ ...programForm, category: e.target.value })}
                          placeholder="e.g. CBT Certification"
                          className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                        />
                        <datalist id="category-suggestions">
                          <option value="CBT Certification" />
                          <option value="Child Psychology" />
                          <option value="Trauma Care" />
                          <option value="Clinical Supervision" />
                          <option value="General Counseling" />
                          <option value="Neurodevelopmental & ADHD" />
                          <option value="Couple & Marriage Counseling" />
                        </datalist>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Program Title *
                      </label>
                      <input
                        type="text"
                        value={programForm.title}
                        onChange={(e) => setProgramForm({ ...programForm, title: e.target.value })}
                        placeholder="e.g. Clinical CBT, Case Formulation & Applied Counseling Training Program"
                        className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400 text-sm font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Hero Banner Tagline (Uppercase / Highlight Strip)
                      </label>
                      <input
                        type="text"
                        value={programForm.tagline}
                        onChange={(e) => setProgramForm({ ...programForm, tagline: e.target.value })}
                        placeholder="e.g. LEARN, FORMULATE & COUNSEL WITH CONFIDENCE (Senior Psychologist-Guided & Career-Oriented)"
                        className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Training Modes
                        </label>
                        <input
                          type="text"
                          value={programForm.modes}
                          onChange={(e) => setProgramForm({ ...programForm, modes: e.target.value })}
                          placeholder="e.g. Online Live Interactive | Supervised Case Labs"
                          className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Mode Sub-Note (Optional)
                        </label>
                        <input
                          type="text"
                          value={programForm.modeNote}
                          onChange={(e) => setProgramForm({ ...programForm, modeNote: e.target.value })}
                          placeholder="e.g. *Participants receive live weekend workshops + recorded replays."
                          className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Start Date *</label>
                        <input
                          type="text"
                          value={programForm.startDate}
                          onChange={(e) => setProgramForm({ ...programForm, startDate: e.target.value })}
                          placeholder="e.g. 15th October 2026"
                          className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Duration *</label>
                        <input
                          type="text"
                          value={programForm.duration}
                          onChange={(e) => setProgramForm({ ...programForm, duration: e.target.value })}
                          placeholder="e.g. 4 - 6 Weeks (Extendable to 2 Months)"
                          className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Instructor / Clinical Lead *
                        </label>
                        <input
                          type="text"
                          value={programForm.instructor}
                          onChange={(e) => setProgramForm({ ...programForm, instructor: e.target.value })}
                          placeholder="e.g. Dr. Ananya Sharma"
                          className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Enrollment Fee (₹) *
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={programForm.fee}
                          onChange={(e) => setProgramForm({ ...programForm, fee: Number(e.target.value) })}
                          className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-emerald-300 font-bold focus:outline-none focus:ring-1 focus:ring-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Total Seats *</label>
                        <input
                          type="number"
                          min={1}
                          value={programForm.totalSeats}
                          onChange={(e) => setProgramForm({ ...programForm, totalSeats: Number(e.target.value) })}
                          className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Available Seats *</label>
                        <input
                          type="number"
                          min={0}
                          value={programForm.availableSeats}
                          onChange={(e) => setProgramForm({ ...programForm, availableSeats: Number(e.target.value) })}
                          className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Topic Tags (Comma-separated)
                      </label>
                      <input
                        type="text"
                        value={programForm.tags}
                        onChange={(e) => setProgramForm({ ...programForm, tags: e.target.value })}
                        placeholder="e.g. CBT, Clinical Formulation, MSE, DSM-5-TR, Ethics"
                        className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 2: ABOUT, OUTCOMES & OBJECTIVES */}
                {programEditorTab === "about" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        About the Program — Bold Lead Headline
                      </label>
                      <input
                        type="text"
                        value={programForm.aboutHeadline}
                        onChange={(e) => setProgramForm({ ...programForm, aboutHeadline: e.target.value })}
                        placeholder="e.g. Master CBT Formulation & Ethical Psychotherapy from Scratch — and graduate with a verified certificate."
                        className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-slate-300 font-semibold">
                          Detailed Program Overview ("About the Program") *
                        </label>
                        <span className="text-[10px] text-slate-400">
                          {programForm.description?.length || 0} chars (multi-paragraph supported)
                        </span>
                      </div>
                      <textarea
                        rows={6}
                        value={programForm.description}
                        onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })}
                        placeholder="Write comprehensive overview paragraphs about what makes this program unique, clinical methodology, tools practiced, and hands-on supervision..."
                        className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400 leading-relaxed"
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          "By the end of this program, you won't just know theory — you will:" (1 outcome per line)
                        </label>
                        <textarea
                          rows={6}
                          value={programForm.keyOutcomesText}
                          onChange={(e) => setProgramForm({ ...programForm, keyOutcomesText: e.target.value })}
                          placeholder={"Conduct structured clinical intake interviews & MSE\nBuild individualized 5-P CBT case formulations\nApply cognitive restructuring & behavioral activation\nEarn a Verified Clinical Training Certificate"}
                          className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400 leading-relaxed"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Program Objectives (1 objective per line)
                        </label>
                        <textarea
                          rows={6}
                          value={programForm.objectivesText}
                          onChange={(e) => setProgramForm({ ...programForm, objectivesText: e.target.value })}
                          placeholder={"Bridge the gap between textbook psychology and real client counseling\nDevelop hands-on proficiency in CBT worksheets & thought records\nBuild ethical crisis assessment & boundary skills"}
                          className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400 leading-relaxed"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Who Should Attend / Eligibility (1 audience group per line)
                      </label>
                      <textarea
                        rows={4}
                        value={programForm.targetAudienceText}
                        onChange={(e) => setProgramForm({ ...programForm, targetAudienceText: e.target.value })}
                        placeholder={"BA / BSc & MA / MSc Psychology Students\nEarly-Career Counseling Psychologists & Social Workers\nSchool, College & Corporate Wellness Counselors"}
                        className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400 leading-relaxed"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 3: PROGRAM OUTLINE / CURRICULUM MODULES */}
                {programEditorTab === "modules" && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-800/70 p-4 rounded-2xl border border-slate-700">
                      <div>
                        <h4 className="font-bold text-cyan-300 text-sm flex items-center gap-1.5">
                          <BookOpen className="size-4" /> Structured Curriculum Modules (Expandable on Public Page)
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Add Module 1, Module 2, Capstone Project, etc. Each module displays expandable bullet topics and a highlighted Learning Outcome.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setProgramForm({
                            ...programForm,
                            modules: [
                              ...programForm.modules,
                              {
                                title: `Module ${programForm.modules.length + 1}: `,
                                topicsText: "",
                                learningOutcome: "",
                              },
                            ],
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3.5 py-2 text-xs transition cursor-pointer shrink-0"
                      >
                        <Plus className="size-4" /> Add Module
                      </button>
                    </div>

                    {programForm.modules.length === 0 ? (
                      <div className="text-center py-10 bg-slate-800/40 rounded-2xl border border-dashed border-slate-700 space-y-2">
                        <p className="text-slate-400 text-xs">
                          No curriculum modules added yet. Click <strong>"+ Add Module"</strong> or use <strong>"Pre-fill Rich Counseling Template"</strong> above.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {programForm.modules.map((mod, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                                Module #{idx + 1}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => {
                                    const copy = [...programForm.modules];
                                    [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
                                    setProgramForm({ ...programForm, modules: copy });
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-700 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                                  title="Move Up"
                                >
                                  <ChevronUp className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === programForm.modules.length - 1}
                                  onClick={() => {
                                    const copy = [...programForm.modules];
                                    [copy[idx + 1], copy[idx]] = [copy[idx], copy[idx + 1]];
                                    setProgramForm({ ...programForm, modules: copy });
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-700 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                                  title="Move Down"
                                >
                                  <ChevronDown className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const copy = programForm.modules.filter((_, i) => i !== idx);
                                    setProgramForm({ ...programForm, modules: copy });
                                  }}
                                  className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/40 cursor-pointer"
                                  title="Remove Module"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="block text-slate-400 font-semibold mb-1">
                                Module Title
                              </label>
                              <input
                                type="text"
                                value={mod.title}
                                onChange={(e) => {
                                  const copy = [...programForm.modules];
                                  copy[idx] = { ...copy[idx], title: e.target.value };
                                  setProgramForm({ ...programForm, modules: copy });
                                }}
                                placeholder="e.g. Module 1: Clinical Interviewing, Rapport & MSE"
                                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400 font-semibold"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-400 font-semibold mb-1">
                                Key Topics Covered (1 bullet point per line)
                              </label>
                              <textarea
                                rows={3}
                                value={mod.topicsText}
                                onChange={(e) => {
                                  const copy = [...programForm.modules];
                                  copy[idx] = { ...copy[idx], topicsText: e.target.value };
                                  setProgramForm({ ...programForm, modules: copy });
                                }}
                                placeholder={"Therapeutic alliance & active listening micro-skills\nConducting the first 50-minute intake interview\nMental Status Examination (MSE) walkthrough"}
                                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400 leading-relaxed"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-400 font-semibold mb-1">
                                Module Learning Outcome
                              </label>
                              <input
                                type="text"
                                value={mod.learningOutcome}
                                onChange={(e) => {
                                  const copy = [...programForm.modules];
                                  copy[idx] = { ...copy[idx], learningOutcome: e.target.value };
                                  setProgramForm({ ...programForm, modules: copy });
                                }}
                                placeholder="e.g. Confidently lead a structured intake session and write a professional MSE report."
                                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-emerald-300 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: WHAT YOU GET & CAREER ENABLEMENT */}
                {programEditorTab === "deliverables" && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        "What You Get" — Core Program Deliverables (1 item per line)
                      </label>
                      <textarea
                        rows={5}
                        value={programForm.whatYouGetText}
                        onChange={(e) => setProgramForm({ ...programForm, whatYouGetText: e.target.value })}
                        placeholder={"Live Interactive Clinical Training & Supervision Sessions\nReady-to-Use Clinical Toolkit (Intake Forms, MSE Templates, CBT Worksheets)\nHands-on Mock Counseling Labs\nVerified Clinical Training Certificate"}
                        className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400 leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Certification Highlight Details
                      </label>
                      <textarea
                        rows={3}
                        value={programForm.certificationDetails}
                        onChange={(e) =>
                          setProgramForm({ ...programForm, certificationDetails: e.target.value })
                        }
                        placeholder="Describe the verified certificate issued upon completion, eligibility criteria, and portfolio value..."
                        className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400 leading-relaxed"
                      />
                    </div>

                    <div className="border-t border-slate-800 pt-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-cyan-300 text-sm flex items-center gap-1.5">
                            <Award className="size-4" /> Career Enablement & Supervision Bonuses
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            Showcase career-readiness guidance included at no extra cost (CV review, mock interviews, private practice setup).
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setProgramForm({
                              ...programForm,
                              careerEnablementItems: [
                                ...programForm.careerEnablementItems,
                                { title: "", description: "" },
                              ],
                            })
                          }
                          className="inline-flex items-center gap-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 font-bold px-3 py-1.5 text-xs transition cursor-pointer shrink-0"
                        >
                          <Plus className="size-3.5" /> Add Career Bonus Card
                        </button>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">
                          Career Enablement Section Subtitle
                        </label>
                        <input
                          type="text"
                          value={programForm.careerEnablementSubtitle}
                          onChange={(e) =>
                            setProgramForm({
                              ...programForm,
                              careerEnablementSubtitle: e.target.value,
                            })
                          }
                          placeholder="e.g. Included at no extra cost to help you transition smoothly from learner to practicing counselor:"
                          className="w-full rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                        />
                      </div>

                      {programForm.careerEnablementItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="grid sm:grid-cols-12 gap-3 bg-slate-800/80 border border-slate-700 rounded-2xl p-3 items-start"
                        >
                          <div className="sm:col-span-4">
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => {
                                const copy = [...programForm.careerEnablementItems];
                                copy[idx] = { ...copy[idx], title: e.target.value };
                                setProgramForm({ ...programForm, careerEnablementItems: copy });
                              }}
                              placeholder="Bonus Title (e.g. Clinical CV Optimization)"
                              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-white font-semibold"
                            />
                          </div>
                          <div className="sm:col-span-7">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => {
                                const copy = [...programForm.careerEnablementItems];
                                copy[idx] = { ...copy[idx], description: e.target.value };
                                setProgramForm({ ...programForm, careerEnablementItems: copy });
                              }}
                              placeholder="Short explanation of how this helps participants..."
                              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-slate-200"
                            />
                          </div>
                          <div className="sm:col-span-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                const copy = programForm.careerEnablementItems.filter(
                                  (_, i) => i !== idx
                                );
                                setProgramForm({ ...programForm, careerEnablementItems: copy });
                              }}
                              className="p-2 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/40 cursor-pointer"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 5: FEE STRUCTURE BREAKDOWN & COMPLETION ASSURANCE */}
                {programEditorTab === "fees" && (
                  <div className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Total Program Value (Anchor Comparison, e.g. ₹25,000+)
                        </label>
                        <input
                          type="text"
                          value={programForm.totalProgramValue}
                          onChange={(e) =>
                            setProgramForm({ ...programForm, totalProgramValue: e.target.value })
                          }
                          placeholder="e.g. ₹25,000+"
                          className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Actual Payable Fee (₹) — Synced with Tab 1
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={programForm.fee}
                          onChange={(e) =>
                            setProgramForm({ ...programForm, fee: Number(e.target.value) })
                          }
                          className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-emerald-300 font-bold focus:outline-none focus:ring-1 focus:ring-cyan-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Subsidized / Early Cohort Note
                      </label>
                      <input
                        type="text"
                        value={programForm.earlyCohortNote}
                        onChange={(e) =>
                          setProgramForm({ ...programForm, earlyCohortNote: e.target.value })
                        }
                        placeholder="e.g. Subsidized fee under MindFirst Clinical Skill Initiative to make practical training accessible."
                        className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      />
                    </div>

                    <div className="space-y-3 border-t border-slate-800 pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-cyan-300 text-sm">
                            Value Breakdown Line Items (IIT-Style Fee Transparency Table)
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            Show individual component values (e.g. "Live Clinical CBT Workshops — ₹10,000").
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setProgramForm({
                              ...programForm,
                              feeBreakdown: [
                                ...programForm.feeBreakdown,
                                { item: "", value: "" },
                              ],
                            })
                          }
                          className="inline-flex items-center gap-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 font-bold px-3 py-1.5 text-xs transition cursor-pointer"
                        >
                          <Plus className="size-3.5" /> Add Value Row
                        </button>
                      </div>

                      {programForm.feeBreakdown.map((row, idx) => (
                        <div
                          key={idx}
                          className="grid sm:grid-cols-12 gap-3 bg-slate-800/80 border border-slate-700 rounded-2xl p-3 items-center"
                        >
                          <div className="sm:col-span-8">
                            <input
                              type="text"
                              value={row.item}
                              onChange={(e) => {
                                const copy = [...programForm.feeBreakdown];
                                copy[idx] = { ...copy[idx], item: e.target.value };
                                setProgramForm({ ...programForm, feeBreakdown: copy });
                              }}
                              placeholder="Component (e.g. Live Clinical Training & Case Labs)"
                              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-white"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <input
                              type="text"
                              value={row.value}
                              onChange={(e) => {
                                const copy = [...programForm.feeBreakdown];
                                copy[idx] = { ...copy[idx], value: e.target.value };
                                setProgramForm({ ...programForm, feeBreakdown: copy });
                              }}
                              placeholder="Value (e.g. ₹10,000)"
                              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-emerald-300 font-semibold"
                            />
                          </div>
                          <div className="sm:col-span-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                const copy = programForm.feeBreakdown.filter((_, i) => i !== idx);
                                setProgramForm({ ...programForm, feeBreakdown: copy });
                              }}
                              className="p-2 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/40 cursor-pointer"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3 border-t border-slate-800 pt-4">
                      <h4 className="font-bold text-cyan-300 text-sm flex items-center gap-1.5">
                        <ShieldCheck className="size-4" /> Learning & Completion Support Assurance Banner
                      </h4>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">
                          Assurance Heading
                        </label>
                        <input
                          type="text"
                          value={programForm.supportAssuranceTitle}
                          onChange={(e) =>
                            setProgramForm({
                              ...programForm,
                              supportAssuranceTitle: e.target.value,
                            })
                          }
                          placeholder="e.g. Learning & Completion Support Assurance"
                          className="w-full rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">
                          Assurance Statement
                        </label>
                        <textarea
                          rows={3}
                          value={programForm.supportAssuranceText}
                          onChange={(e) =>
                            setProgramForm({
                              ...programForm,
                              supportAssuranceText: e.target.value,
                            })
                          }
                          placeholder="Explain recorded session backup, mentor doubt-clearing support, and guided capstone completion..."
                          className="w-full rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-white leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 6: TESTIMONIALS, FAQS & OFFICIAL INITIATIVE / CONTACT */}
                {programEditorTab === "faqs" && (
                  <div className="space-y-6">
                    {/* Student Testimonials */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-cyan-300 text-sm flex items-center gap-1.5">
                            <MessageSquare className="size-4" /> Participant Feedbacks / Testimonials
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            Add past trainee reviews to build credibility.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setProgramForm({
                              ...programForm,
                              testimonials: [
                                ...programForm.testimonials,
                                { name: "", role: "", comment: "", rating: 5 },
                              ],
                            })
                          }
                          className="inline-flex items-center gap-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 font-bold px-3 py-1.5 text-xs transition cursor-pointer"
                        >
                          <Plus className="size-3.5" /> Add Feedback
                        </button>
                      </div>

                      {programForm.testimonials.map((t, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3.5 space-y-2.5"
                        >
                          <div className="grid sm:grid-cols-12 gap-2.5 items-center">
                            <div className="sm:col-span-5">
                              <input
                                type="text"
                                value={t.name}
                                onChange={(e) => {
                                  const copy = [...programForm.testimonials];
                                  copy[idx] = { ...copy[idx], name: e.target.value };
                                  setProgramForm({ ...programForm, testimonials: copy });
                                }}
                                placeholder="Participant Name (e.g. Riya Deshmukh)"
                                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2 text-white font-semibold"
                              />
                            </div>
                            <div className="sm:col-span-5">
                              <input
                                type="text"
                                value={t.role}
                                onChange={(e) => {
                                  const copy = [...programForm.testimonials];
                                  copy[idx] = { ...copy[idx], role: e.target.value };
                                  setProgramForm({ ...programForm, testimonials: copy });
                                }}
                                placeholder="Role / College (e.g. MA Clinical Psychology)"
                                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2 text-slate-300"
                              />
                            </div>
                            <div className="sm:col-span-1">
                              <select
                                value={t.rating}
                                onChange={(e) => {
                                  const copy = [...programForm.testimonials];
                                  copy[idx] = { ...copy[idx], rating: Number(e.target.value) };
                                  setProgramForm({ ...programForm, testimonials: copy });
                                }}
                                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2 text-amber-300 font-bold"
                              >
                                {[5, 4, 3].map((r) => (
                                  <option key={r} value={r}>
                                    {r}★
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="sm:col-span-1 flex justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  const copy = programForm.testimonials.filter((_, i) => i !== idx);
                                  setProgramForm({ ...programForm, testimonials: copy });
                                }}
                                className="p-2 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/40 cursor-pointer"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          </div>
                          <textarea
                            rows={2}
                            value={t.comment}
                            onChange={(e) => {
                              const copy = [...programForm.testimonials];
                              copy[idx] = { ...copy[idx], comment: e.target.value };
                              setProgramForm({ ...programForm, testimonials: copy });
                            }}
                            placeholder="Participant quote / feedback..."
                            className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-white"
                          />
                        </div>
                      ))}
                    </div>

                    {/* FAQs */}
                    <div className="space-y-3 border-t border-slate-800 pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-cyan-300 text-sm flex items-center gap-1.5">
                            <HelpCircle className="size-4" /> Frequently Asked Questions (FAQs)
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            Interactive accordion Q&As displayed near the bottom of the program page.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setProgramForm({
                              ...programForm,
                              faqs: [...programForm.faqs, { question: "", answer: "" }],
                            })
                          }
                          className="inline-flex items-center gap-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 font-bold px-3 py-1.5 text-xs transition cursor-pointer"
                        >
                          <Plus className="size-3.5" /> Add FAQ
                        </button>
                      </div>

                      {programForm.faqs.map((faq, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3.5 space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={faq.question}
                              onChange={(e) => {
                                const copy = [...programForm.faqs];
                                copy[idx] = { ...copy[idx], question: e.target.value };
                                setProgramForm({ ...programForm,faqs: copy });
                              }}
                              placeholder={`Question #${idx + 1} (e.g. What if I miss a live session?)`}
                              className="flex-1 rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-white font-semibold"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const copy = programForm.faqs.filter((_, i) => i !== idx);
                                setProgramForm({ ...programForm, faqs: copy });
                              }}
                              className="p-2 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/40 cursor-pointer"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            value={faq.answer}
                            onChange={(e) => {
                              const copy = [...programForm.faqs];
                              copy[idx] = { ...copy[idx], answer: e.target.value };
                              setProgramForm({ ...programForm, faqs: copy });
                            }}
                            placeholder="Clear, reassuring answer..."
                            className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-slate-200"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Organizer Initiative, Contact & Caution Note */}
                    <div className="space-y-3 border-t border-slate-800 pt-4">
                      <h4 className="font-bold text-cyan-300 text-sm">
                        Initiative Attribution, Query Contact & Official Caution Notice
                      </h4>
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">
                            Initiative Line
                          </label>
                          <input
                            type="text"
                            value={programForm.organizerInitiative}
                            onChange={(e) =>
                              setProgramForm({
                                ...programForm,
                                organizerInitiative: e.target.value,
                              })
                            }
                            placeholder="An Initiative of My Mind Therapy Friend"
                            className="w-full rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">
                            Support Email
                          </label>
                          <input
                            type="text"
                            value={programForm.contactEmail}
                            onChange={(e) =>
                              setProgramForm({ ...programForm, contactEmail: e.target.value })
                            }
                            placeholder="support@mymindtherapyfriend.com"
                            className="w-full rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">
                            Helpline / WhatsApp (Optional)
                          </label>
                          <input
                            type="text"
                            value={programForm.contactPhone}
                            onChange={(e) =>
                              setProgramForm({ ...programForm, contactPhone: e.target.value })
                            }
                            placeholder="+91 ..."
                            className="w-full rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">
                          Official Caution / Legitimacy Note (Footer Warning Box)
                        </label>
                        <textarea
                          rows={2}
                          value={programForm.cautionNote}
                          onChange={(e) =>
                            setProgramForm({ ...programForm, cautionNote: e.target.value })
                          }
                          placeholder="e.g. Official registrations and fee payments are processed exclusively on mymindtherapyfriend.com..."
                          className="w-full rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-amber-200"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky Modal Footer */}
              <div className="pt-4 mt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActiveToggle"
                    checked={programForm.isActive}
                    onChange={(e) => setProgramForm({ ...programForm, isActive: e.target.checked })}
                    className="size-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-400"
                  />
                  <label
                    htmlFor="isActiveToggle"
                    className="text-xs text-slate-300 font-medium cursor-pointer"
                  >
                    Active & Publicly Visible on Counseling Training Page
                  </label>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProgramModal(false);
                      resetProgramForm();
                    }}
                    className="rounded-xl bg-slate-800 border border-slate-700 px-5 py-2.5 font-semibold text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createProgramMutation.isPending || updateProgramMutation.isPending}
                    className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 py-2.5 transition shadow-lg cursor-pointer disabled:opacity-50"
                  >
                    {createProgramMutation.isPending || updateProgramMutation.isPending
                      ? "Saving..."
                      : editingProgramId
                      ? "Save & Update Program"
                      : "Create Program Cohort"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPROVE & SCHEDULE COUNSELOR MEETING MODAL */}
      {showScheduleModal && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-xl w-full text-white space-y-5 max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2 text-teal-400">
                  <Calendar className="size-5" /> Assign Counselor & Schedule Meeting
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Applicant: <strong className="text-white">{selectedRecord.fullName}</strong> ({selectedRecord.schoolOrgName})
                  <br />
                  Counseling Domain: <strong className="text-teal-300">{selectedRecord.counselingType || "Clinical Counseling"}</strong>
                  {selectedRecord.phone && <span> · Phone: <span className="font-mono text-slate-300">{selectedRecord.phone}</span></span>}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <XCircle className="size-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
              {/* 1. Therapist / Counselor Selection Dropdown */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5 flex items-center justify-between">
                  <span>1. Select Platform Counselor / Therapist</span>
                  <span className="text-[10px] text-teal-400 font-normal">Choose from registered platform therapists</span>
                </label>
                <select
                  value={scheduleForm.therapistId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    const selectedTherapist = activeTherapists.find((t: any) => (t.id || t._id) === selId);
                    const tName = selectedTherapist?.name || selectedTherapist?.fullName || selectedTherapist?.therapistProfile?.name;
                    setScheduleForm({
                      ...scheduleForm,
                      therapistId: selId,
                      assignedCounselor: tName ? `${tName} (Clinical Counselor)` : (selId === "" ? "Dr. Ananya Sharma (Senior Clinical Psychologist & Counselor)" : scheduleForm.assignedCounselor),
                    });
                  }}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-teal-400 font-medium"
                >
                  <option value="">-- Dr. Ananya Sharma (Senior Clinical Psychologist & Counselor) --</option>
                  {activeTherapists.map((t: any, idx: number) => {
                    const tId = t.id || t._id || `therapist-${idx}`;
                    const tName = t.name || t.fullName || t.therapistProfile?.name || "Therapist";
                    const tSpecs = Array.isArray(t.specializations)
                      ? t.specializations.join(", ")
                      : t.specializations || t.qualification || "Clinical Counselor";
                    const isVerified = t.verified === true || t.verificationStatus === "verified" || t.verificationStatus === "approved";

                    return (
                      <option key={tId} value={tId}>
                        {tName} — {tSpecs} {isVerified ? "✓ [Verified]" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* 2. Counselor Display Name */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Assigned Counselor Display Name</label>
                <input
                  type="text"
                  required
                  value={scheduleForm.assignedCounselor}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, assignedCounselor: e.target.value })}
                  placeholder="e.g. Dr. Ananya Sharma (Senior Clinical Psychologist)"
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                />
              </div>

              {/* 3. Meeting Date & Time Interactive Picker */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-teal-300 font-bold flex items-center gap-1.5 text-xs">
                    <Clock className="size-4" /> 2. Schedule Session Date, Time & Duration
                  </label>
                  <span className="text-[10px] text-slate-400">Interactive Slot Setup</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Date Input */}
                  <div>
                    <label className="block text-slate-400 text-[11px] font-semibold mb-1">Session Date</label>
                    <input
                      type="date"
                      value={scheduleForm.datePart}
                      onChange={(e) => {
                        const newDate = e.target.value;
                        const formatted = formatMeetingDateTime(newDate, scheduleForm.timePart, scheduleForm.duration);
                        setScheduleForm({
                          ...scheduleForm,
                          datePart: newDate,
                          meetingDate: formatted,
                        });
                      }}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-teal-400 text-xs"
                    />
                  </div>

                  {/* Time Input */}
                  <div>
                    <label className="block text-slate-400 text-[11px] font-semibold mb-1">Start Time</label>
                    <input
                      type="time"
                      value={scheduleForm.timePart}
                      onChange={(e) => {
                        const newTime = e.target.value;
                        const formatted = formatMeetingDateTime(scheduleForm.datePart, newTime, scheduleForm.duration);
                        setScheduleForm({
                          ...scheduleForm,
                          timePart: newTime,
                          meetingDate: formatted,
                        });
                      }}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-teal-400 text-xs"
                    />
                  </div>

                  {/* Duration Selector */}
                  <div>
                    <label className="block text-slate-400 text-[11px] font-semibold mb-1">Duration</label>
                    <select
                      value={scheduleForm.duration}
                      onChange={(e) => {
                        const newDur = e.target.value;
                        const formatted = formatMeetingDateTime(scheduleForm.datePart, scheduleForm.timePart, newDur);
                        setScheduleForm({
                          ...scheduleForm,
                          duration: newDur,
                          meetingDate: formatted,
                        });
                      }}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-teal-400 text-xs font-medium"
                    >
                      <option value="30 mins">30 Minutes</option>
                      <option value="45 mins">45 Minutes</option>
                      <option value="60 mins">60 Minutes</option>
                      <option value="90 mins">90 Minutes</option>
                    </select>
                  </div>
                </div>

                {/* Quick Time Slot Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 mr-1">Quick Slots:</span>
                  {[
                    { label: "10:00 AM", val: "10:00" },
                    { label: "11:30 AM", val: "11:30" },
                    { label: "02:00 PM", val: "14:00" },
                    { label: "04:00 PM", val: "16:00" },
                    { label: "06:00 PM", val: "18:00" },
                  ].map((s) => (
                    <button
                      key={s.val}
                      type="button"
                      onClick={() => {
                        const formatted = formatMeetingDateTime(scheduleForm.datePart, s.val, scheduleForm.duration);
                        setScheduleForm({
                          ...scheduleForm,
                          timePart: s.val,
                          meetingDate: formatted,
                        });
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        scheduleForm.timePart === s.val
                          ? "bg-teal-500 text-slate-950"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Compiled / Editable String Display */}
                <div>
                  <label className="block text-slate-400 text-[11px] font-semibold mb-1">
                    Scheduled Meeting Date & Time Display String (Visible to Candidate)
                  </label>
                  <input
                    type="text"
                    required
                    value={scheduleForm.meetingDate}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, meetingDate: e.target.value })}
                    placeholder="e.g. 15th October 2026 at 11:00 AM IST (45 mins)"
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-teal-200 focus:outline-none focus:ring-1 focus:ring-teal-400 font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* 4. Video Meeting Link with Generator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-bold flex items-center gap-1">
                    <Video className="size-3.5 text-teal-400" /> Video Meeting Room Link
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const slug = selectedRecord._id ? String(selectedRecord._id).slice(-6) : Math.random().toString(36).substring(7);
                      setScheduleForm({
                        ...scheduleForm,
                        meetingLink: `https://meet.jit.si/MindSyncPro-Career-${slug}-${Date.now().toString().slice(-4)}`,
                      });
                      toast.success("Generated new meeting room link!");
                    }}
                    className="text-[10px] text-teal-400 hover:text-teal-300 font-bold underline cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles className="size-3" /> Generate MindSync Live Room
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={scheduleForm.meetingLink}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, meetingLink: e.target.value })}
                  placeholder="e.g. https://meet.jit.si/MindSyncPro-CareerSession or Google Meet / Zoom link"
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-teal-400 font-mono text-[11px]"
                />
              </div>

              {/* 5. Guidance Fee and Quick Fee Chips */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Guidance Booking Amount / Fee (₹)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    required
                    min={0}
                    value={scheduleForm.guidanceFee}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, guidanceFee: Number(e.target.value) })}
                    placeholder="0 for Free, or amount e.g. 499"
                    className="w-40 rounded-xl bg-slate-800 border border-slate-700 p-3 text-emerald-400 focus:outline-none focus:ring-1 focus:ring-teal-400 font-mono font-bold text-sm"
                  />
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[0, 299, 499, 999, 1499].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setScheduleForm({ ...scheduleForm, guidanceFee: f })}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          scheduleForm.guidanceFee === f
                            ? "bg-emerald-500 text-slate-950"
                            : "bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {f === 0 ? "Free (₹0)" : `₹${f}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 6. Meeting Status Workflow Radio Selector */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-2.5">
                <label className="block text-slate-300 font-bold text-xs">
                  Meeting Approval & Status Workflow
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                      scheduleForm.status === "approved"
                        ? "bg-teal-950/60 border-teal-400 text-teal-200"
                        : "bg-slate-900 border-slate-700/80 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="meetingStatus"
                      value="approved"
                      checked={scheduleForm.status === "approved"}
                      onChange={() => setScheduleForm({ ...scheduleForm, status: "approved" })}
                      className="mt-0.5 text-teal-500 focus:ring-teal-400"
                    />
                    <div>
                      <div className="font-bold text-xs text-white flex items-center gap-1">
                        <CheckCircle2 className="size-3.5 text-emerald-400" /> Approve & Confirm Now
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                        Candidate gets instant access to join room and scheduled time right away.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                      scheduleForm.status === "proposal_sent"
                        ? "bg-teal-950/60 border-teal-400 text-teal-200"
                        : "bg-slate-900 border-slate-700/80 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="meetingStatus"
                      value="proposal_sent"
                      checked={scheduleForm.status === "proposal_sent"}
                      onChange={() => setScheduleForm({ ...scheduleForm, status: "proposal_sent" })}
                      className="mt-0.5 text-teal-500 focus:ring-teal-400"
                    />
                    <div>
                      <div className="font-bold text-xs text-white flex items-center gap-1">
                        <Calendar className="size-3.5 text-purple-400" /> Send Fee Proposal First
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                        Candidate must pay fee (₹{scheduleForm.guidanceFee}) before video room unlocks.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* 7. Admin Notes / Guidance Instructions */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Admin Notes / Session Focus</label>
                <textarea
                  rows={2}
                  value={scheduleForm.adminNotes}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, adminNotes: e.target.value })}
                  placeholder="Additional instructions or meeting topic for the candidate..."
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-teal-400 text-xs"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="pt-3 flex gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 rounded-xl bg-slate-800 border border-slate-700 py-3 font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adminAssignMutation.isPending || updateSelectionMutation.isPending}
                  className="flex-1 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-3 transition shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {adminAssignMutation.isPending || updateSelectionMutation.isPending ? (
                    "Saving Changes..."
                  ) : scheduleForm.status === "approved" ? (
                    <>
                      <CheckCircle2 className="size-4" /> Approve & Confirm Session
                    </>
                  ) : (
                    <>
                      <Calendar className="size-4" /> Send ₹{scheduleForm.guidanceFee} Proposal to Candidate
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


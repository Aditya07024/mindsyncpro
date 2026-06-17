import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Star, MapPin, Clock, MessageCircle, X, GraduationCap, HeartHandshake, Sparkles } from "lucide-react";
import API from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const getYouTubeId = (url: string) => {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
  return match ? match[1] : null;
};

export const Route = createFileRoute("/therapists")({
  component: TherapistMarketplace,
});

interface TherapistCard {
  id: string;
  name: string;
  specializations: string[];
  languages: string[];
  rating: number;
  sessionCount: number;
  sessionFee: number;
  verified: boolean;
  bio: string;
  introVideoUrl?: string;
  location?: string;
  email?: string;
  website?: string;
  availability: Array<{ day: number; slots: string[] }>;
}

function TherapistMarketplace() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [specialization, setSpecialization] = useState("all");
  const [language, setLanguage] = useState("all");
  const [gender, setGender] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([500, 3500]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTherapist, setSelectedTherapist] = useState<TherapistCard | null>(null);
  const [recommendedMatches, setRecommendedMatches] = useState<any[] | null>(null);

  const recommendMutation = useMutation({
    mutationFn: () => API.therapist.recommend(),
    onSuccess: (data) => {
      setRecommendedMatches(data.recommendations);
      toast.success("We found matching therapists for you!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to get recommendations");
    }
  });

  // Fetch all therapists' languages dynamically
  const { data: allTherapistsData } = useQuery({
    queryKey: ["allTherapistsLanguages"],
    queryFn: () => API.therapist.list({ limit: 100 }),
    retry: false,
  });

  const baseLanguages = ["English", "Hindi"];
  const dynamicLanguages = Array.from(
    new Set(
      (allTherapistsData?.therapists || []).flatMap((t: any) => t.languages || [])
    )
  ).filter((lang: string) => lang && !baseLanguages.includes(lang));

  const availableLanguages = [...baseLanguages, ...dynamicLanguages];

  // Fetch therapists with filters
  const {
    data: therapistsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "therapists",
      { 
        specialization: specialization === "all" ? "" : specialization, 
        language: language === "all" ? "" : language, 
        gender: gender === "all" ? "" : gender, 
        availability: availabilityFilter === "all" ? "" : availabilityFilter, 
        city: cityFilter, 
        state: stateFilter, 
        minFee: priceRange[0], 
        maxFee: priceRange[1] 
      },
    ],
    queryFn: () =>
      API.therapist.list({
        specialization: specialization !== "all" ? specialization : undefined,
        language: language !== "all" ? language : undefined,
        gender: gender !== "all" ? gender : undefined,
        availability: availabilityFilter !== "all" ? availabilityFilter : undefined,
        city: cityFilter || undefined,
        state: stateFilter || undefined,
        minFee: priceRange[0],
        maxFee: priceRange[1],
      }),
  });

  const therapists = therapistsData?.therapists || [];

  // Instant client-side search filtering
  const filteredTherapists = therapists.filter((t: TherapistCard) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      t.name.toLowerCase().includes(term) ||
      t.bio.toLowerCase().includes(term) ||
      t.specializations.some((s) => s.toLowerCase().includes(term)) ||
      t.languages.some((l) => l.toLowerCase().includes(term)) ||
      (t.location && t.location.toLowerCase().includes(term))
    );
  });

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm"
        >
          <div className="max-w-6xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-slate-900 mb-6">Find a Therapist</h1>

            {/* Search Bar */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Search by name or specialty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 rounded-lg"
                />
              </div>
              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className="rounded-lg gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>

            {/* Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 pt-4 border-t border-slate-200"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Specialization */}
                    <Select value={specialization} onValueChange={setSpecialization}>
                      <SelectTrigger className="rounded-lg">
                        <SelectValue placeholder="Specialization" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Specializations</SelectItem>
                        <SelectItem value="Depression">Depression</SelectItem>
                        <SelectItem value="Anxiety">Anxiety</SelectItem>
                        <SelectItem value="Trauma">Trauma</SelectItem>
                        <SelectItem value="Relationship">Relationship</SelectItem>
                        <SelectItem value="OCD">OCD</SelectItem>
                        <SelectItem value="ADHD">ADHD</SelectItem>
                        <SelectItem value="Others">Others</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Language */}
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="rounded-lg">
                        <SelectValue placeholder="Language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Languages</SelectItem>
                        {availableLanguages.map((lang) => (
                          <SelectItem key={lang} value={lang}>
                            {lang}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Gender */}
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger className="rounded-lg">
                        <SelectValue placeholder="Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Gender</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Non-binary">Non-binary</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Availability */}
                    <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                      <SelectTrigger className="rounded-lg">
                        <SelectValue placeholder="Availability" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="this_week">This Week</SelectItem>
                        <SelectItem value="weekends">Weekends</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {/* City */}
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                      <Input
                        placeholder="Filter by city (e.g. Mumbai)..."
                        value={cityFilter}
                        onChange={(e) => setCityFilter(e.target.value)}
                        className="pl-9 h-11 rounded-lg"
                      />
                    </div>

                    {/* State */}
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                      <Input
                        placeholder="Filter by state (e.g. Maharashtra)..."
                        value={stateFilter}
                        onChange={(e) => setStateFilter(e.target.value)}
                        className="pl-9 h-11 rounded-lg"
                      />
                    </div>

                    {/* Price Range */}
                    <div className="flex gap-2 items-center">
                      <span className="text-sm font-medium text-slate-600">₹500</span>
                      <input
                        type="range"
                        min="500"
                        max="3500"
                        step="100"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([500, Number(e.target.value)])}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium text-slate-600">₹{priceRange[1]}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Therapist Grid */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl h-96 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">Failed to load therapists</p>
            </div>
          ) : filteredTherapists.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 text-lg">No therapists found matching your criteria</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredTherapists.map((therapist: TherapistCard, index: number) => (
                <motion.div
                  key={therapist.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedTherapist(therapist)}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden cursor-pointer flex flex-col"
                >
                  {/* Video Thumbnail or Avatar */}
                  <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                    {therapist.introVideoUrl ? (
                      getYouTubeId(therapist.introVideoUrl) ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${getYouTubeId(therapist.introVideoUrl)}?autoplay=1&mute=1&loop=1&playlist=${getYouTubeId(therapist.introVideoUrl)}&controls=0`}
                          className="w-full h-full object-cover pointer-events-none"
                          allow="autoplay; encrypted-media"
                          frameBorder="0"
                        />
                      ) : (
                        <video
                          src={therapist.introVideoUrl}
                          autoPlay
                          muted
                          loop
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <div className="text-white text-4xl font-bold">
                        {therapist.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">{therapist.name}</h3>
                        {therapist.verified && (
                          <span className="inline-block mt-1 text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            ✓ Therapist Verified
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-bold text-slate-900">
                          {therapist.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="text-sm text-slate-600 line-clamp-2">{therapist.bio}</p>

                    {/* Specializations */}
                    <div className="flex flex-wrap gap-2">
                      {therapist.specializations.slice(0, 2).map((spec) => (
                        <span
                          key={spec}
                          className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center justify-between text-sm text-slate-500 pt-2 border-t border-slate-200">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{therapist.sessionCount} sessions</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>{therapist.languages[0] || "English"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{therapist.location || "Online"}</span>
                      </div>
                    </div>

                    {/* Fee & CTA */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <div className="text-lg font-bold text-slate-900">
                        ₹{therapist.sessionFee}
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate({ to: `/booking/${therapist.id}` });
                        }}
                        className="rounded-lg h-9"
                        size="sm"
                      >
                        Book Session
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Therapist Profile Modal */}
      <AnimatePresence>
        {selectedTherapist && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedTherapist(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col relative"
            >
              {/* Close Button absolute on the modal */}
              <button
                onClick={() => setSelectedTherapist(null)}
                className="absolute top-4 right-4 p-2 bg-black/5 hover:bg-black/10 rounded-full text-slate-600 transition z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Video Header (Centered & Medium Sized) */}
              <div className="w-full bg-slate-50 p-6 flex justify-center shrink-0 border-b border-slate-100">
                <div className="relative w-full max-w-md aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-md border border-slate-200/80">
                  {selectedTherapist.introVideoUrl ? (
                    getYouTubeId(selectedTherapist.introVideoUrl) ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${getYouTubeId(selectedTherapist.introVideoUrl)}?autoplay=1&mute=0&rel=0`}
                        className="w-full h-full object-cover"
                        allow="autoplay; encrypted-media; fullscreen"
                        allowFullScreen
                        frameBorder="0"
                      />
                    ) : (
                      <video
                        src={selectedTherapist.introVideoUrl}
                        autoPlay
                        controls
                        className="w-full h-full object-cover"
                      />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                      No intro video available
                    </div>
                  )}
                </div>
              </div>
              
              {/* Details Content (Clearly organized, avoiding scroll where possible) */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{selectedTherapist.name}</h2>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                      {selectedTherapist.verified && (
                        <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                          ✓ Therapist Verified
                        </span>
                      )}
                      <div className="flex items-center gap-1 font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        {selectedTherapist.rating.toFixed(1)} ({selectedTherapist.sessionCount} sessions)
                      </div>
                      {selectedTherapist.location && (
                        <div className="flex items-center gap-1 font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-full">
                          <MapPin className="size-3.5" />
                          {selectedTherapist.location}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">₹{selectedTherapist.sessionFee}</p>
                    <p className="text-xs text-slate-500">per session</p>
                  </div>
                </div>

                {(selectedTherapist.email || selectedTherapist.website) && (
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold bg-teal-50/40 p-3.5 rounded-2xl border border-teal-100/50">
                    {selectedTherapist.email && (
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <span className="text-slate-400 font-normal">Email:</span>
                        <a href={`mailto:${selectedTherapist.email}`} className="text-teal-700 hover:underline">{selectedTherapist.email}</a>
                      </div>
                    )}
                    {selectedTherapist.website && (
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <span className="text-slate-400 font-normal">Website:</span>
                        <a href={selectedTherapist.website} target="_blank" rel="noopener noreferrer" className="text-teal-700 hover:underline">{selectedTherapist.website}</a>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
                    <HeartHandshake className="w-4 h-4 text-indigo-500" /> About & Approach
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line line-clamp-3">
                    {selectedTherapist.bio || "No biography provided."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-2 text-sm">
                      <GraduationCap className="w-4 h-4 text-indigo-500" /> Specialties
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTherapist.specializations.map((spec) => (
                        <span key={spec} className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-medium">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-2 text-sm">
                      <MessageCircle className="w-4 h-4 text-indigo-500" /> Languages
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTherapist.languages.map((lang) => (
                        <span key={lang} className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-medium">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                <Button variant="outline" onClick={() => setSelectedTherapist(null)} className="rounded-xl h-11 px-5 text-sm">
                  Close
                </Button>
                <Button 
                  onClick={() => navigate({ to: `/booking/${selectedTherapist.id}` })} 
                  className="rounded-xl h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
                >
                  Book Session
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, X } from 'lucide-react-native';
import API from '../../lib/api';
import { TherapistCard, TherapistData } from '../../components/TherapistCard';
import { IntroVideoPlayer } from '../../components/IntroVideoPlayer';

import Animated from 'react-native-reanimated';
import { useTabBarVisibility } from '../../context/TabBarVisibilityContext';

interface TherapistListScreenProps {
  navigation: any;
}

export const TherapistListScreen: React.FC<TherapistListScreenProps> = ({ navigation }) => {
  const { scrollHandler } = useTabBarVisibility();
  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [selectedGender, setSelectedGender] = useState('All');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTherapistForModal, setSelectedTherapistForModal] = useState<TherapistData | null>(null);

  const specialtyFilters = [
    'All',
    'CBT',
    'Anxiety',
    'Depression',
    'Relationships',
    'ADHD',
    'Career',
    'Others',
  ];
  const languageFilters = ['All', 'English', 'Hindi', 'Spanish', 'French'];

  // Query backend therapists
  const { data: remoteTherapists, isLoading } = useQuery({
    queryKey: ['therapistsList'],
    queryFn: () => API.therapist.list(),
    retry: false,
  });

  const [therapists, setTherapists] = useState<TherapistData[]>([]);

  useEffect(() => {
    if (Array.isArray(remoteTherapists)) {
      setTherapists(remoteTherapists);
    } else if (Array.isArray(remoteTherapists?.data)) {
      setTherapists(remoteTherapists.data);
    } else if (Array.isArray(remoteTherapists?.therapists)) {
      setTherapists(remoteTherapists.therapists);
    } else {
      setTherapists([]);
    }
  }, [remoteTherapists]);

  // Filter local state based on search query
  const filteredTherapists = therapists.filter((t) => {
    const searchMatch =
      t?.name?.toLowerCase()?.includes(search.toLowerCase()) ||
      t?.specialty?.toLowerCase()?.includes(search.toLowerCase()) ||
      t?.specialties?.some((s: string) => s.toLowerCase().includes(search.toLowerCase()));

    const specialtyMatch =
      selectedSpecialty === 'All' ||
      t?.specialty === selectedSpecialty ||
      t?.specialties?.includes(selectedSpecialty);

    const languageMatch =
      selectedLanguage === 'All' || t?.languages?.includes(selectedLanguage);

    const genderMatch = selectedGender === 'All' || t?.gender === selectedGender;

    const cityMatch = !city || t?.city?.toLowerCase().includes(city.toLowerCase());
    const stateMatch = !state || t?.state?.toLowerCase().includes(state.toLowerCase());

    return searchMatch && specialtyMatch && languageMatch && genderMatch && cityMatch && stateMatch;
  });

  return (
    <View className="flex-1 bg-surface">
      {/* Marketplace Search Header */}
      <View className="bg-white px-4 pt-12 pb-2 border-b border-slate-100">
        <Text className="font-sora-bold text-2xl text-primary">Find Your Counsellor</Text>
        <Text className="font-jakarta text-[13px] text-[#4E615D] mt-0.5">Book private sessions with vetted human professionals</Text>

        {/* Input Bar */}
        <View className="flex-row items-center border border-[#DFEBE7] rounded-full px-3 h-12 bg-white mt-2 gap-2">
          <Search size={18} color="#717875" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search specialties, names, languages…"
            placeholderTextColor="#A1A1AA"
            className="flex-1 text-sm font-jakarta text-[#191C1B]"
          />
          <TouchableOpacity
            className="w-8 h-8 justify-center items-center"
            onPress={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={18} color="#0D564D" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Specialty Filter Chips Row */}
      {showFilters && (
        <View className="bg-white pb-2.5 border-b border-slate-200">
          <View className="px-4 py-2 gap-2">
            <TextInput
              placeholder="Filter by city (e.g. Mumbai)"
              placeholderTextColor="#94A3B8"
              value={city}
              onChangeText={setCity}
              className="h-[42px] border border-[#DFEBE7] rounded-xl px-3 bg-slate-50 text-[#191C1B] text-[13px]"
            />
            <TextInput
              placeholder="Filter by state (e.g. Maharashtra)"
              placeholderTextColor="#94A3B8"
              value={state}
              onChangeText={setState}
              className="h-[42px] border border-[#DFEBE7] rounded-xl px-3 bg-slate-50 text-[#191C1B] text-[13px]"
            />
          </View>

          <View className="my-1">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}>
              {languageFilters.map((language) => (
                <TouchableOpacity
                  key={language}
                  onPress={() => setSelectedLanguage(language)}
                  className={`px-3.5 py-1.5 rounded-full border ${selectedLanguage === language ? 'bg-primary border-primary' : 'bg-slate-100 border-slate-200'}`}
                >
                  <Text className={`font-jakarta-medium text-xs ${selectedLanguage === language ? 'text-white' : 'text-slate-600'}`}>
                    {language}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View className="my-1">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}>
              {specialtyFilters.map((filter) => (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setSelectedSpecialty(filter)}
                  className={`px-3.5 py-1.5 rounded-full border ${selectedSpecialty === filter ? 'bg-primary border-primary' : 'bg-slate-100 border-slate-200'}`}
                >
                  <Text className={`font-jakarta-medium text-xs ${selectedSpecialty === filter ? 'text-white' : 'text-slate-600'}`}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Therapist List */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#0D564D" className="mt-8" />
      ) : (
        <Animated.FlatList
          data={filteredTherapists}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          keyExtractor={(item: any, index) =>
            item?._id?.toString() || item?.id?.toString() || index.toString()
          }
          contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
          renderItem={({ item }) => (
            <TherapistCard
              therapist={item}
              onPress={() => navigation.navigate('TherapistDetail', { therapist: item })}
              onVideoPress={() => setSelectedTherapistForModal(item)}
              onBookPress={() => navigation.navigate('Booking', { therapist: item })}
            />
          )}
          ListEmptyComponent={
            <View className="items-center pt-8">
              <Text className="font-jakarta text-sm text-[#717875]">No practitioners matching your search query.</Text>
            </View>
          }
        />
      )}

      {/* In-App Video & Details Popup Modal */}
      {selectedTherapistForModal && (
        <Modal
          visible={!!selectedTherapistForModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedTherapistForModal(null)}
        >
          <TouchableOpacity
            className="flex-1 bg-slate-900/75 justify-center items-center p-4"
            activeOpacity={1}
            onPress={() => setSelectedTherapistForModal(null)}
          >
            <TouchableOpacity
              className="w-[92%] h-[88%] max-w-[640px] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl"
              activeOpacity={1}
            >
              {/* Modal Top Header */}
              <View className="flex-row items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
                <View className="flex-1">
                  <Text className="font-sora-bold text-base text-white">{selectedTherapistForModal.name}</Text>
                  <Text className="font-jakarta text-xs text-slate-400 mt-0.5">
                    {selectedTherapistForModal.specialty || selectedTherapistForModal.specialties?.join(', ') || 'Counselor'}
                  </Text>
                </View>
                <TouchableOpacity
                  className="w-8 h-8 rounded-full bg-slate-700 justify-center items-center"
                  onPress={() => setSelectedTherapistForModal(null)}
                >
                  <X size={18} color="#FFF" />
                </TouchableOpacity>
              </View>

              {/* Video Player Box inside Modal */}
              <View className="flex-1 w-full bg-slate-900">
                <IntroVideoPlayer
                  url={selectedTherapistForModal.introVideoUrl}
                  mode="modal"
                  fallbackName={selectedTherapistForModal.name}
                  avatarUrl={selectedTherapistForModal.avatarUrl}
                />
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};

export default TherapistListScreen;

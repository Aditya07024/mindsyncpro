import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, Star, X, ShieldCheck } from 'lucide-react-native';
import API from '../../lib/api';
import { Theme } from '../../theme';
import { TherapistCard, TherapistData } from '../../components/TherapistCard';
import { IntroVideoPlayer } from '../../components/IntroVideoPlayer';

interface TherapistListScreenProps {
  navigation: any;
}

export const TherapistListScreen: React.FC<TherapistListScreenProps> = ({ navigation }) => {
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
  const genderFilters = ['All', 'Male', 'Female', 'Other'];

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
    <View style={styles.container}>
      {/* Marketplace Search Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Find Your Counsellor</Text>
        <Text style={styles.subtitle}>Book private sessions with vetted human professionals</Text>

        {/* Input Bar */}
        <View style={styles.searchBar}>
          <Search size={18} color={Theme.colors.outline} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search specialties, names, languages…"
            placeholderTextColor={Theme.colors.outline}
            style={styles.searchInput}
          />
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={18} color={Theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Specialty Filter Chips Row */}
      {showFilters && (
        <View style={styles.filtersWrapper}>
          <View style={styles.advancedFilters}>
            <TextInput
              placeholder="Filter by city (e.g. Mumbai)"
              placeholderTextColor="#94A3B8"
              value={city}
              onChangeText={setCity}
              style={styles.filterInput}
            />
            <TextInput
              placeholder="Filter by state (e.g. Maharashtra)"
              placeholderTextColor="#94A3B8"
              value={state}
              onChangeText={setState}
              style={styles.filterInput}
            />
          </View>

          <View style={{ marginVertical: 4 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}>
              {languageFilters.map((language) => (
                <TouchableOpacity
                  key={language}
                  onPress={() => setSelectedLanguage(language)}
                  style={[styles.chip, selectedLanguage === language && styles.chipActive]}
                >
                  <Text style={[styles.chipText, selectedLanguage === language && styles.chipTextActive]}>
                    {language}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={{ marginVertical: 4 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}>
              {specialtyFilters.map((filter) => (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setSelectedSpecialty(filter)}
                  style={[styles.chip, selectedSpecialty === filter && styles.chipActive]}
                >
                  <Text style={[styles.chipText, selectedSpecialty === filter && styles.chipTextActive]}>
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
        <ActivityIndicator size="large" color={Theme.colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={filteredTherapists}
          keyExtractor={(item: any, index) =>
            item?._id?.toString() || item?.id?.toString() || index.toString()
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TherapistCard
              therapist={item}
              onPress={() => navigation.navigate('TherapistDetail', { therapist: item })}
              onVideoPress={() => setSelectedTherapistForModal(item)}
              onBookPress={() => navigation.navigate('Booking', { therapist: item })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyView}>
              <Text style={styles.emptyText}>No practitioners matching your search query.</Text>
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
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setSelectedTherapistForModal(null)}
          >
            <TouchableOpacity
              style={styles.modalCard}
              activeOpacity={1}
            >
              {/* Modal Top Header */}
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalName}>{selectedTherapistForModal.name}</Text>
                  <Text style={styles.modalSubText}>
                    {selectedTherapistForModal.specialty || selectedTherapistForModal.specialties?.join(', ') || 'Counselor'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.closeBtnCircle}
                  onPress={() => setSelectedTherapistForModal(null)}
                >
                  <X size={18} color="#0F172A" />
                </TouchableOpacity>
              </View>

              {/* Video Player Box inside Modal (Dedicated exclusively to video stream) */}
              <View style={styles.modalVideoContainer}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    backgroundColor: '#FFF',
    paddingHorizontal: Theme.spacing.margin,
    paddingTop: 50,
    paddingBottom: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.surfaceHigh,
  },
  title: {
    fontFamily: Theme.fonts.display,
    fontSize: 24,
    color: Theme.colors.primary,
  },
  subtitle: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.surfaceHigh,
    borderRadius: Theme.radius.full,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: Theme.colors.surfaceLow,
    marginTop: Theme.spacing.sm,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.onSurface,
  },
  filterBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersWrapper: {
    backgroundColor: '#FFF',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  advancedFilters: {
    paddingHorizontal: Theme.spacing.margin,
    paddingVertical: 8,
    gap: 8,
  },
  filterInput: {
    height: 42,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceHigh,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    color: Theme.colors.onSurface,
    fontSize: 13,
  },
  chip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Theme.radius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  chipText: {
    fontFamily: Theme.fonts.bodyMedium,
    fontSize: 12,
    color: '#475569',
  },
  chipTextActive: {
    color: '#FFF',
  },
  listContent: {
    padding: Theme.spacing.margin,
    paddingBottom: 110,
  },
  loader: {
    marginTop: Theme.spacing.xl,
  },
  emptyView: {
    alignItems: 'center',
    paddingTop: Theme.spacing.xl,
  },
  emptyText: {
    fontFamily: Theme.fonts.body,
    fontSize: 14,
    color: Theme.colors.textMuted,
  },
  // Modal Popup Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '92%',
    height: '88%',
    maxWidth: 640,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalName: {
    fontFamily: Theme.fonts.display,
    fontSize: 16,
    color: '#FFF',
  },
  modalSubText: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeBtnCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalVideoContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#0F172A',
  },
  modalContentBody: {
    padding: 16,
  },
  modalBio: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalSecondaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  modalSecondaryBtnText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 13,
    color: '#334155',
  },
  modalPrimaryBtn: {
    flex: 1.2,
    height: 44,
    borderRadius: 12,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 13,
    color: '#FFF',
  },
});

export default TherapistListScreen;

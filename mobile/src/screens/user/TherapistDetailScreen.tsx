import React, { useState, useRef } from 'react';
import { View, StyleSheet, Text, ScrollView, Image, TouchableOpacity, Modal, Dimensions, Linking, ActivityIndicator } from 'react-native';
import { Star, ShieldCheck, Heart, Award, ArrowLeft, PlayCircle, X, Video as VideoIcon, ExternalLink } from 'lucide-react-native';
import { Video, ResizeMode } from 'expo-av';
import { Theme } from '../../theme';
import { TherapistData } from '../../components/TherapistCard';

// Utility: extract YouTube video ID from various YouTube URL formats
const getYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
  return match ? match[1] : null;
};

// Utility: convert Google Drive share/download URLs to a direct streamable URL
const getStreamableUrl = (url: string): string => {
  if (!url) return url;

  // Google Drive download link: extract file ID
  const driveDownloadMatch = url.match(/drive\.usercontent\.google\.com\/download\?id=([^&]+)/);
  if (driveDownloadMatch) {
    return `https://drive.google.com/uc?export=download&id=${driveDownloadMatch[1]}`;
  }

  // Google Drive share link: /file/d/{ID}
  const driveShareMatch = url.match(/drive\.google\.com\/file\/d\/([^/&?]+)/);
  if (driveShareMatch) {
    return `https://drive.google.com/uc?export=download&id=${driveShareMatch[1]}`;
  }

  // Google Drive uc or open link: ?id={ID}
  const idParamMatch = url.match(/drive\.google\.com\/(?:uc|open)\?.*id=([^&]+)/);
  if (idParamMatch) {
    return `https://drive.google.com/uc?export=download&id=${idParamMatch[1]}`;
  }

  return url;
};

interface TherapistDetailScreenProps {
  navigation: any;
  route: any;
}

export const TherapistDetailScreen: React.FC<TherapistDetailScreenProps> = ({ navigation, route }) => {
  const therapist: TherapistData = route.params?.therapist;
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<Video>(null);

  if (!therapist) {
    return (
      <View style={styles.errorView}>
        <Text style={styles.errorText}>No practitioner selected.</Text>
      </View>
    );
  }

  const specs = therapist.specialties && therapist.specialties.length > 0
    ? therapist.specialties.join(', ')
    : therapist.specializations && therapist.specializations.length > 0
      ? therapist.specializations.join(', ')
      : 'Clinical Psychology';

  const hourlyRate = therapist.hourlyRate || therapist.sessionFee || 999;
  const experience = therapist.experience || therapist.experienceYears || 3;

  const hasVideo = !!therapist.introVideoUrl;
  const isYouTube = hasVideo ? !!getYouTubeId(therapist.introVideoUrl!) : false;

  const handlePlayVideo = () => {
    if (!hasVideo) return;

    if (isYouTube) {
      // Open YouTube videos externally (expo-av can't embed YouTube)
      const ytId = getYouTubeId(therapist.introVideoUrl!);
      if (ytId) {
        Linking.openURL(`https://www.youtube.com/watch?v=${ytId}`);
      }
    } else {
      // Show video in modal player for direct video URLs
      setVideoLoading(true);
      setVideoError(false);
      setVideoModalVisible(true);
    }
  };

  const handleCloseVideo = async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.stopAsync();
      } catch (_) {}
    }
    setVideoModalVisible(false);
  };

  const streamableUrl = hasVideo && !isYouTube
    ? getStreamableUrl(therapist.introVideoUrl!)
    : '';

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header back button */}
        <View style={styles.backRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={Theme.colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile Overview</Text>
        </View>

        {/* Hero Video / Avatar Section */}
        <View style={styles.videoPlaceholder}>
          {therapist.avatarUrl ? (
            <Image source={{ uri: therapist.avatarUrl }} style={styles.videoBg} />
          ) : (
            <View style={styles.avatarFallback} />
          )}
          <View style={styles.videoOverlay}>
            {hasVideo ? (
              <TouchableOpacity
                onPress={handlePlayVideo}
                style={styles.playBtn}
              >
                <PlayCircle size={48} color="#FFF" />
                <Text style={styles.playText}>
                  {isYouTube ? 'Watch on YouTube' : 'Watch Intro Video'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.playBtn}>
                <VideoIcon size={36} color="rgba(255,255,255,0.5)" />
                <Text style={[styles.playText, { opacity: 0.6 }]}>No intro video available</Text>
              </View>
            )}
          </View>
        </View>

        {/* Practitioner details card */}
        <View style={styles.detailCard}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{therapist.name}</Text>
                {therapist.verified && <ShieldCheck size={20} color={Theme.colors.primary} />}
              </View>
              <Text style={styles.specialties}>{specs}</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Star size={14} color={Theme.colors.gold} fill={Theme.colors.gold} />
              <Text style={styles.ratingText}>{therapist.rating?.toFixed(1) || '5.0'}</Text>
            </View>
          </View>

          {/* Experience & stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Award size={18} color={Theme.colors.primary} />
              <Text style={styles.statLabel}>EXPERIENCE</Text>
              <Text style={styles.statVal}>{experience}+ Years</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.statBox}>
              <Heart size={18} color={Theme.colors.secondary} />
              <Text style={styles.statLabel}>HOURLY RATE</Text>
              <Text style={styles.statVal}>₹{hourlyRate}</Text>
            </View>
          </View>

          {/* Bio */}
          <View style={styles.bioSection}>
            <Text style={styles.sectionTitle}>About Me</Text>
            <Text style={styles.bioText}>
              {therapist.bio || 'No bio provided'}
            </Text>
          </View>
        </View>

        {/* Booking button */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Booking', { therapist })}
          style={styles.bookBtn}
        >
          <Text style={styles.bookBtnText}>Book Secure Session (₹{hourlyRate})</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Video Player Modal */}
      <Modal
        visible={videoModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCloseVideo}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Close button */}
            <TouchableOpacity onPress={handleCloseVideo} style={styles.modalCloseBtn}>
              <X size={24} color="#FFF" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Introduction Video</Text>

            <View style={styles.videoContainer}>
              {videoLoading && (
                <View style={styles.videoLoadingOverlay}>
                  <ActivityIndicator size="large" color={Theme.colors.primary} />
                  <Text style={styles.videoLoadingText}>Loading video…</Text>
                </View>
              )}

              {videoError ? (
                <View style={styles.videoErrorContainer}>
                  <VideoIcon size={48} color={Theme.colors.textMuted} />
                  <Text style={styles.videoErrorText}>
                    Unable to play this video format in-app.
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (therapist.introVideoUrl) {
                        Linking.openURL(therapist.introVideoUrl);
                      }
                      handleCloseVideo();
                    }}
                    style={styles.openExternalBtn}
                  >
                    <ExternalLink size={16} color="#FFF" />
                    <Text style={styles.openExternalText}>Open in Browser</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Video
                  ref={videoRef}
                  source={{ uri: streamableUrl }}
                  style={styles.videoPlayer}
                  resizeMode={ResizeMode.CONTAIN}
                  useNativeControls
                  shouldPlay
                  onLoad={() => setVideoLoading(false)}
                  onError={(error) => {
                    console.error('[VideoPlayer] Playback error:', error);
                    setVideoLoading(false);
                    setVideoError(true);
                  }}
                />
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    padding: Theme.spacing.margin,
    paddingBottom: Theme.spacing.xl,
    gap: Theme.spacing.md,
  },
  errorView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
  errorText: {
    fontFamily: Theme.fonts.body,
    fontSize: 14,
    color: Theme.colors.textMuted,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
    gap: Theme.spacing.sm,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.surfaceHigh,
  },
  headerTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 18,
    color: Theme.colors.onSurface,
  },
  videoPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: Theme.radius.xl,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Theme.colors.primaryContainer,
  },
  videoBg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: Theme.colors.primaryContainer + '80',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtn: {
    alignItems: 'center',
    gap: 8,
  },
  playText: {
    color: '#FFF',
    fontFamily: Theme.fonts.headline,
    fontSize: 14,
  },
  detailCard: {
    backgroundColor: '#FFF',
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceHigh,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Theme.spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontFamily: Theme.fonts.display,
    fontSize: 22,
    color: Theme.colors.onSurface,
  },
  specialties: {
    fontFamily: Theme.fonts.bodyMedium,
    fontSize: 14,
    color: Theme.colors.primaryContainer,
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Theme.colors.surfaceLow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.radius.default,
  },
  ratingText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 12,
    color: Theme.colors.onSurface,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: Theme.spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Theme.colors.surfaceLow,
    paddingVertical: Theme.spacing.sm,
  },
  statBox: {
    alignItems: 'center',
    gap: 2,
  },
  statLabel: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 9,
    color: Theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  statVal: {
    fontFamily: Theme.fonts.display,
    fontSize: 16,
    color: Theme.colors.onSurface,
    marginTop: 2,
  },
  verticalDivider: {
    width: 1,
    height: 36,
    backgroundColor: Theme.colors.surfaceHigh,
  },
  bioSection: {
    marginTop: Theme.spacing.xs,
  },
  sectionTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 16,
    color: Theme.colors.onSurface,
    marginBottom: 6,
  },
  bioText: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: Theme.colors.onSurfaceVariant,
    lineHeight: 18,
  },
  bookBtn: {
    backgroundColor: Theme.colors.primary,
    height: 52,
    borderRadius: Theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.xs,
  },
  bookBtnText: {
    color: '#FFF',
    fontFamily: Theme.fonts.headline,
    fontSize: 14,
  },

  // Video Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: -50,
    right: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 18,
    color: '#FFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  videoLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  videoLoadingText: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 12,
  },
  videoErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  videoErrorText: {
    fontFamily: Theme.fonts.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  openExternalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Theme.radius.full,
    marginTop: 8,
  },
  openExternalText: {
    fontFamily: Theme.fonts.headline,
    fontSize: 13,
    color: '#FFF',
  },
});
export default TherapistDetailScreen;

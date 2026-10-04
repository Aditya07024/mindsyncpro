import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import { Star, ShieldCheck, Clock, MessageCircle, MapPin } from 'lucide-react-native';
import { Theme } from '../theme';
import { IntroVideoPlayer } from './IntroVideoPlayer';

export interface TherapistData {
  _id: string;
  id?: string;
  userId?: string;
  name: string;
  specialties?: string[];
  specializations?: string[];
  experience?: number;
  experienceYears?: number;
  hourlyRate?: number;
  sessionFee?: number;
  rating?: number;
  verified?: boolean;
  avatarUrl?: string;
  bio?: string;
  introVideoUrl?: string;
  languages?: string[];
  specialty?: string;
  gender?: string;
  city?: string;
  state?: string;
  location?: string;
  sessionCount?: number;
}

interface TherapistCardProps {
  therapist: TherapistData;
  onPress: () => void;
  onVideoPress?: () => void;
  onBookPress?: () => void;
  isOrgCovered?: boolean;
  orgName?: string;
}

export const TherapistCard: React.FC<TherapistCardProps> = ({
  therapist,
  onPress,
  onVideoPress,
  onBookPress,
  isOrgCovered = false,
  orgName,
}) => {
  const specsList = therapist.specializations || therapist.specialties || (therapist.specialty ? [therapist.specialty] : ['Counseling', 'Mental Wellness']);
  const languagesList = therapist.languages && therapist.languages.length > 0 ? therapist.languages : ['English', 'Hindi'];
  const ratingVal = therapist.rating ? therapist.rating.toFixed(1) : '4.9';
  const feeVal = therapist.sessionFee || therapist.hourlyRate || 1500;
  const locationText = therapist.location || (therapist.city ? `${therapist.city}${therapist.state ? `, ${therapist.state}` : ''}` : 'Online');

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.92} style={styles.card}>
      {/* Top Video Header */}
      <View style={styles.videoHeader}>
        <IntroVideoPlayer
          url={therapist.introVideoUrl}
          mode="card"
          fallbackName={therapist.name}
          avatarUrl={therapist.avatarUrl}
          onVideoPress={onVideoPress}
        />
        {/* Rating Floating Badge */}
        <View style={styles.floatingRating} pointerEvents="none">
          <Star size={13} color="#F59E0B" fill="#F59E0B" />
          <Text style={styles.floatingRatingText}>{ratingVal}</Text>
        </View>
      </View>

      {/* Card Content Body */}
      <View style={styles.body}>
        {/* Name & Verification */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.nameText} numberOfLines={1}>
              {therapist.name}
            </Text>
            {therapist.verified && (
              <View style={styles.verifiedBadge}>
                <ShieldCheck size={11} color="#0284C7" />
                <Text style={styles.verifiedText}>Counsellor Verified</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bio Snippet */}
        {therapist.bio ? (
          <Text style={styles.bioText} numberOfLines={2}>
            {therapist.bio}
          </Text>
        ) : (
          <Text style={styles.bioText} numberOfLines={2}>
            Experienced compassionate counselor offering evidence-based therapy and guidance.
          </Text>
        )}

        {/* Specialization Chips */}
        <View style={styles.specsRow}>
          {specsList.slice(0, 3).map((spec, idx) => (
            <View key={idx} style={styles.specChip}>
              <Text style={styles.specChipText}>{spec}</Text>
            </View>
          ))}
        </View>

        {/* Meta Info Row: Experience/Sessions, Language, Location */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Clock size={13} color="#64748B" />
            <Text style={styles.metaText}>
              {therapist.sessionCount ? `${therapist.sessionCount} sessions` : `${therapist.experience || 3}+ yrs exp`}
            </Text>
          </View>

          <View style={styles.metaItem}>
            <MessageCircle size={13} color="#64748B" />
            <Text style={styles.metaText}>{languagesList[0]}</Text>
          </View>

          <View style={styles.metaItem}>
            <MapPin size={13} color="#64748B" />
            <Text style={styles.metaText} numberOfLines={1}>{locationText}</Text>
          </View>
        </View>

        {/* Footer: Fee / Coverage & CTA Button */}
        <View style={styles.footerRow}>
          <View style={styles.priceContainer}>
            {isOrgCovered ? (
              <View>
                <Text style={styles.freeOrgBadge}>FREE (Org Covered)</Text>
                {orgName && <Text style={styles.orgSubText}>{orgName}</Text>}
              </View>
            ) : (
              <View>
                <Text style={styles.priceAmount}>₹{feeVal}</Text>
                <Text style={styles.pricePeriod}>per 45 min session</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={onBookPress || onPress}
            style={styles.bookButton}
            activeOpacity={0.8}
          >
            <Text style={styles.bookButtonText}>Book Session</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  videoHeader: {
    width: '100%',
    height: 180,
    backgroundColor: '#0F172A',
    position: 'relative',
  },
  floatingRating: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  floatingRatingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  body: {
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  nameText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    backgroundColor: '#E0F2FE',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0369A1',
  },
  bioText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginVertical: 6,
  },
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 6,
  },
  specChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  specChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#334155',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginVertical: 4,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  priceContainer: {
    justifyContent: 'center',
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  pricePeriod: {
    fontSize: 10,
    color: '#64748B',
    marginTop: -2,
  },
  freeOrgBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  orgSubText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  bookButton: {
    backgroundColor: '#0D564D',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import API from '../lib/api';
import { Theme } from '../theme';

interface AdBannerCarouselProps {
  target: 'user' | 'therapist';
  navigation?: any;
}

export const AdBannerCarousel: React.FC<AdBannerCarouselProps> = ({ target, navigation }) => {
  const { data } = useQuery({
    queryKey: ['adBanner', target],
    queryFn: () => API.adBanner.get(target),
    retry: false,
  });

  const rawBanners = data?.banners || (data?.adBanner ? [data.adBanner] : (data?.banner ? [data.banner] : []));
  const activeBanners = rawBanners.filter(
    (b: any) => b && b.isActive !== false && (b.title || b.description || b.imageUrl || b.posterUrl)
  );

  if (activeBanners.length === 0) return null;

  const handlePressAd = (url: string) => {
    if (!url) return;
    const cleanUrl = url.trim();
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      Linking.openURL(cleanUrl).catch(() => {});
    } else if (navigation) {
      const lower = cleanUrl.toLowerCase();
      if (lower.includes('therapist')) navigation.navigate('Therapists');
      else if (lower.includes('booking') || lower.includes('session')) navigation.navigate('Bookings');
      else if (lower.includes('journal')) navigation.navigate('Journal');
      else if (lower.includes('breathe')) navigation.navigate('Breathe');
      else if (lower.includes('audio') || lower.includes('group')) navigation.navigate('GroupSessions');
      else {
        Linking.openURL(cleanUrl).catch(() => {});
      }
    } else {
      Linking.openURL(cleanUrl).catch(() => {});
    }
  };

  return (
    <View style={styles.container}>
      {activeBanners.map((b: any, index: number) => {
        const poster = b.posterUrl || b.imageUrl;
        const link = b.targetUrl || b.buttonLink || b.linkUrl || '';
        const badgeLabel = b.badgeText || 'FEATURED';
        const buttonLabel = b.buttonText || (link ? 'Learn More →' : '');

        return (
          <View key={b._id || index} style={styles.card}>
            <View style={styles.textColumn}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badgeLabel.toUpperCase()}</Text>
              </View>
              {b.title ? <Text style={styles.title}>{b.title}</Text> : null}
              {b.description ? <Text style={styles.description} numberOfLines={3}>{b.description}</Text> : null}

              {buttonLabel ? (
                <TouchableOpacity
                  onPress={() => handlePressAd(link)}
                  style={styles.linkBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.linkBtnText}>{buttonLabel} →</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {poster ? (
              <Image source={{ uri: poster }} style={styles.poster} resizeMode="cover" />
            ) : null}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    gap: 12,
  },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  textColumn: {
    flex: 1,
    marginRight: 12,
  },
  badge: {
    backgroundColor: '#0D564D',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  badgeText: {
    fontFamily: Theme.fonts.display,
    fontSize: 9,
    color: '#ADEEE2',
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: Theme.fonts.display,
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  description: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
    marginBottom: 10,
  },
  linkBtn: {
    backgroundColor: '#0D564D',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 4,
  },
  linkBtnText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  poster: {
    width: 80,
    height: 80,
    borderRadius: 14,
  },
});

export default AdBannerCarousel;

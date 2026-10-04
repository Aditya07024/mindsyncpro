import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Linking,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Sparkles } from 'lucide-react-native';
import API from '../lib/api';
import { Theme } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - Theme.spacing.margin * 2;

interface AdBannerCarouselProps {
  target: 'user' | 'therapist';
  navigation?: any;
}

export const AdBannerCarousel: React.FC<AdBannerCarouselProps> = ({ target, navigation }) => {
  const [activeIndex, setActiveIndex] = useState(0);

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

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

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

  const renderBannerContent = (b: any) => {
    const link = b.targetUrl || b.buttonLink || b.linkUrl || '';
    const badgeLabel = b.badgeText || 'FEATURED';
    const buttonLabel = b.buttonText || (link ? 'Learn More' : '');

    return (
      <LinearGradient
        colors={[
          'rgba(15, 23, 42, 0.40)',
          'rgba(15, 23, 42, 0.85)',
          'rgba(15, 23, 42, 0.98)',
        ]}
        locations={[0, 0.5, 1]}
        style={styles.cardGradient}
      >
        {/* Badge Row */}
        <View style={styles.badgeRow}>
          <View style={styles.badgePill}>
            <Sparkles size={11} color="#2DD4BF" />
            <Text style={styles.badgeText}>{badgeLabel.toUpperCase()}</Text>
          </View>
        </View>

        {/* Title */}
        {b.title ? <Text style={styles.titleText}>{b.title}</Text> : null}

        {/* Description */}
        {b.description ? (
          <Text style={styles.descText} numberOfLines={3}>
            {b.description}
          </Text>
        ) : null}

        {/* CTA Button */}
        {buttonLabel ? (
          <TouchableOpacity
            onPress={() => handlePressAd(link)}
            style={styles.ctaButton}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaButtonText}>{buttonLabel}</Text>
            <ChevronRight size={16} color="#0F172A" />
          </TouchableOpacity>
        ) : null}
      </LinearGradient>
    );
  };

  return (
    <View style={styles.outerContainer}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {activeBanners.map((b: any, index: number) => {
          const poster = b.posterUrl || b.imageUrl;
          const link = b.targetUrl || b.buttonLink || b.linkUrl || '';

          return (
            <TouchableOpacity
              key={b._id || index}
              activeOpacity={0.92}
              onPress={() => link && handlePressAd(link)}
              style={styles.cardWrapper}
            >
              {poster ? (
                <ImageBackground
                  source={{ uri: poster }}
                  resizeMode="cover"
                  style={styles.backgroundContainer}
                >
                  {renderBannerContent(b)}
                </ImageBackground>
              ) : (
                <View style={styles.backgroundContainer}>
                  {renderBannerContent(b)}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Pagination Dot Indicator */}
      {activeBanners.length > 1 && (
        <View style={styles.paginationContainer}>
          {activeBanners.map((_: any, idx: number) => (
            <View
              key={idx}
              style={[
                styles.paginationDot,
                idx === activeIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    marginVertical: 14,
  },
  scrollContent: {
    paddingHorizontal: 0,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    minHeight: 195,
  },
  backgroundContainer: {
    width: '100%',
    minHeight: 195,
    backgroundColor: '#0F172A',
  },
  cardGradient: {
    padding: 20,
    minHeight: 195,
    justifyContent: 'flex-end',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.4)',
  },
  badgeText: {
    fontFamily: Theme.fonts.display,
    fontSize: 10,
    color: '#2DD4BF',
    letterSpacing: 0.8,
  },
  titleText: {
    fontFamily: Theme.fonts.display,
    fontSize: 18,
    color: '#FFFFFF',
    lineHeight: 24,
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  descText: {
    fontFamily: Theme.fonts.body,
    fontSize: 12.5,
    color: '#F1F5F9',
    lineHeight: 18,
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#2DD4BF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: '#2DD4BF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  ctaButtonText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 13,
    color: '#0F172A',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#475569',
  },
  paginationDotActive: {
    width: 18,
    backgroundColor: '#2DD4BF',
  },
});

export default AdBannerCarousel;

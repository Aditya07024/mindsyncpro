import React, { useState } from 'react';
import {
  View,
  Text,
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

  const { data: profileData } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => API.user.profile().catch(() => null),
    retry: false,
  });

  const { data: subData } = useQuery({
    queryKey: ['userSubscription'],
    queryFn: () => API.subscription.get().catch(() => null),
    retry: false,
  });

  const tier = profileData?.user?.tier || subData?.subscription?.tier || subData?.tier || subData?.planId || '';
  const price = subData?.subscription?.price || subData?.price || 0;
  const is499Plan = tier === 'apna_therapist' || tier === '499' || price === 499;

  if (is499Plan) return null;

  const rawBanners = data?.banners || (data?.adBanner ? [data.adBanner] : (data?.banner ? [data.banner] : []));
  const activeBanners = rawBanners.filter(
    (b: any) => b && b.isActive !== false && (b.title || b.description || b.imageUrl || b.posterUrl)
  );

  if (activeBanners.length === 0) return null;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = CARD_WIDTH + 12;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    if (index !== activeIndex && index >= 0 && index < activeBanners.length) {
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

  const renderCardContent = (b: any) => {
    const link = b.targetUrl || b.buttonLink || b.linkUrl || '';
    const badgeLabel = b.badgeText || 'FEATURED';
    const buttonLabel = b.buttonText || (link ? 'Learn More' : '');

    return (
      <LinearGradient
        colors={[
          'rgba(15, 23, 42, 0.35)',
          'rgba(15, 23, 42, 0.82)',
          'rgba(15, 23, 42, 0.98)',
        ]}
        locations={[0, 0.45, 1]}
        className="p-4.5 min-h-[180px] justify-end"
      >
        {/* Badge Row */}
        <View className="mb-2 flex-row">
          <View className="flex-row items-center gap-1 bg-[#2DD4BF]/20 border border-[#2DD4BF]/40 px-2 py-0.5 rounded-full">
            <Sparkles size={11} color="#2DD4BF" />
            <Text className="text-[10px] font-sora-bold text-[#2DD4BF] tracking-wider">{badgeLabel.toUpperCase()}</Text>
          </View>
        </View>

        {/* Title */}
        {b.title ? <Text className="font-sora-bold text-lg text-white mb-1.5 leading-6">{b.title}</Text> : null}

        {/* Description */}
        {b.description ? (
          <Text className="font-jakarta text-xs text-slate-300 leading-4.5 mb-3" numberOfLines={3}>
            {b.description}
          </Text>
        ) : null}

        {/* CTA Button */}
        {buttonLabel ? (
          <TouchableOpacity
            onPress={() => handlePressAd(link)}
            className="flex-row items-center self-start gap-1 bg-[#2DD4BF] px-4 py-2 rounded-full mt-1 shadow-sm shadow-[#2DD4BF]/30"
            activeOpacity={0.8}
          >
            <Text className="font-sora-bold text-xs text-slate-900">{buttonLabel}</Text>
            <ChevronRight size={16} color="#0F172A" />
          </TouchableOpacity>
        ) : null}
      </LinearGradient>
    );
  };

  const renderSingleCard = (b: any, isCarousel: boolean = false) => {
    const poster = b.posterUrl || b.imageUrl;
    const link = b.targetUrl || b.buttonLink || b.linkUrl || '';

    return (
      <TouchableOpacity
        key={b._id || b.title}
        activeOpacity={0.92}
        onPress={() => link && handlePressAd(link)}
        className="rounded-3xl overflow-hidden border border-[#2DD4BF]/30 shadow-md min-h-[180px]"
        style={isCarousel ? { width: CARD_WIDTH } : { width: '100%' }}
      >
        {poster ? (
          <ImageBackground
            source={{ uri: poster }}
            resizeMode="cover"
            className="w-full min-h-[180px] bg-slate-900"
          >
            {renderCardContent(b)}
          </ImageBackground>
        ) : (
          <View className="w-full min-h-[180px] bg-slate-900">
            {renderCardContent(b)}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (activeBanners.length === 1) {
    return (
      <View className="my-3.5 w-full">
        {renderSingleCard(activeBanners[0], false)}
      </View>
    );
  }

  return (
    <View className="my-3.5 w-full">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
        contentContainerStyle={{ paddingRight: 20, gap: 12 }}
      >
        {activeBanners.map((b: any) => renderSingleCard(b, true))}
      </ScrollView>

      {/* Pagination Dot Indicator */}
      <View className="flex-row justify-center items-center gap-1.5 mt-2.5">
        {activeBanners.map((_: any, idx: number) => (
          <View
            key={idx}
            className={`h-1.5 rounded-full transition-all ${
              idx === activeIndex ? 'w-4 bg-[#2DD4BF]' : 'w-1.5 bg-slate-400/40'
            }`}
          />
        ))}
      </View>
    </View>
  );
};

export default AdBannerCarousel;

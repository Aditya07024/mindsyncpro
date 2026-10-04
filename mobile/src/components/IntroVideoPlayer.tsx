import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { Play } from 'lucide-react-native';
import { parseVideoUrl } from '../lib/video';
import { Theme } from '../theme';

// Lazily require react-native-webview on native platforms only to avoid web crash
let WebView: any = null;
if (Platform.OS !== 'web') {
  try {
    WebView = require('react-native-webview').WebView;
  } catch (e) {
    console.warn('WebView not available on this environment');
  }
}

interface IntroVideoPlayerProps {
  url?: string | null;
  mode?: 'card' | 'modal';
  fallbackName?: string;
  avatarUrl?: string;
  style?: any;
}

export const IntroVideoPlayer: React.FC<IntroVideoPlayerProps> = ({
  url,
  mode = 'card',
  fallbackName = '',
  avatarUrl,
  style,
}) => {
  const [hasError, setHasError] = useState(false);

  const parsed = parseVideoUrl(url);

  // Fallback avatar/placeholder if no valid video URL or error
  if (!url || !parsed.embedUrl || parsed.type === 'unknown' || hasError) {
    return (
      <View style={[styles.fallbackContainer, style]}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.initialCircle}>
            <Text style={styles.initialText}>
              {fallbackName ? fallbackName.charAt(0).toUpperCase() : 'C'}
            </Text>
          </View>
        )}
      </View>
    );
  }

  const isCard = mode === 'card';

  // In card mode (therapist list cards):
  // Show high-res static thumbnail preview with play icon overlay (NO AUTOPLAY)
  if (isCard) {
    let thumbnailUrl = avatarUrl;
    if (parsed.type === 'youtube' && parsed.id) {
      thumbnailUrl = `https://img.youtube.com/vi/${parsed.id}/hqdefault.jpg`;
    }

    return (
      <View style={[styles.videoContainer, style]}>
        {thumbnailUrl ? (
          <Image source={{ uri: thumbnailUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.fallbackContainer}>
            <View style={styles.initialCircle}>
              <Text style={styles.initialText}>
                {fallbackName ? fallbackName.charAt(0).toUpperCase() : 'C'}
              </Text>
            </View>
          </View>
        )}

        {/* See Intro Video Pill Button Overlay */}
        <View style={styles.playOverlay}>
          <View style={styles.seeIntroPill}>
            <Play size={13} color="#FFF" fill="#FFF" style={{ marginRight: 2 }} />
            <Text style={styles.seeIntroText}>See Intro Video</Text>
          </View>
        </View>
      </View>
    );
  }

  // Modal mode: Render active video player
  let webUri = parsed.embedUrl;
  if (parsed.type === 'youtube') {
    webUri = `${parsed.embedUrl}?autoplay=1&rel=0&controls=1&playsinline=1`;
  } else if (parsed.type === 'vimeo') {
    webUri = `${parsed.embedUrl}?autoplay=1`;
  }

  // React Native Web Embed
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.videoContainer, style]}>
        <iframe
          src={webUri}
          style={{ width: '100%', height: '100%', border: 0 } as any}
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          onError={() => setHasError(true)}
        />
      </View>
    );
  }

  // Native iOS & Android Fallback (react-native-webview played inline in app)
  if (WebView) {
    return (
      <View style={[styles.videoContainer, style]}>
        <WebView
          source={{ uri: webUri }}
          style={styles.fullMedia}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          scrollEnabled={false}
          onError={() => setHasError(true)}
        />
      </View>
    );
  }

  // Fallback if WebView missing
  return (
    <View style={[styles.fallbackContainer, style]}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
      ) : (
        <View style={styles.initialCircle}>
          <Text style={styles.initialText}>
            {fallbackName ? fallbackName.charAt(0).toUpperCase() : 'C'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  videoContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0F172A',
    position: 'relative',
    overflow: 'hidden',
  },
  fullMedia: {
    width: '100%',
    height: '100%',
  },
  fallbackContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0D564D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  initialCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  initialText: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: 'bold',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seeIntroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0D564D',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  seeIntroText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: Theme.fonts.bodyBold,
    letterSpacing: 0.3,
  },
});

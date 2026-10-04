import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { Play } from 'lucide-react-native';
import { parseVideoUrl } from '../lib/video';

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
  const [isPlaying, setIsPlaying] = useState(false);

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

  // Direct MP4 / Video File
  if (parsed.type === 'direct') {
    if (Platform.OS === 'web') {
      return (
        <View style={[styles.videoContainer, style]}>
          <video
            src={parsed.embedUrl}
            autoPlay={isCard}
            muted={isCard && !isPlaying}
            controls={true}
            loop={isCard}
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' } as any}
            onError={() => setHasError(true)}
          />
        </View>
      );
    }

    return (
      <View style={[styles.videoContainer, style]}>
        <Video
          source={{ uri: parsed.embedUrl }}
          style={styles.fullMedia}
          useNativeControls={true}
          resizeMode={ResizeMode.COVER}
          isLooping={isCard}
          shouldPlay={isCard || isPlaying}
          isMuted={isCard && !isPlaying}
          onError={() => setHasError(true)}
        />
        {isCard && !isPlaying && (
          <TouchableOpacity
            style={styles.playOverlay}
            onPress={() => setIsPlaying(true)}
            activeOpacity={0.8}
          >
            <View style={styles.playBtnCircle}>
              <Play size={20} color="#FFF" fill="#FFF" style={{ marginLeft: 3 }} />
            </View>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Web Embeds (YouTube, Drive, Loom, Vimeo)
  let webUri = parsed.embedUrl;
  if (parsed.type === 'youtube') {
    const embedParams = isCard
      ? 'autoplay=1&mute=1&loop=1&playlist=' + parsed.id + '&controls=1&playsinline=1'
      : 'autoplay=1&rel=0&controls=1&playsinline=1';
    webUri = `${parsed.embedUrl}?${embedParams}`;
  } else if (parsed.type === 'vimeo') {
    const embedParams = isCard ? 'autoplay=1&muted=1&loop=1' : 'autoplay=1';
    webUri = `${parsed.embedUrl}?${embedParams}`;
  }

  // React Native Web Fallback (HTML iframe played inline in app)
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
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtnCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});

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
  onVideoPress?: () => void;
}

export const IntroVideoPlayer: React.FC<IntroVideoPlayerProps> = ({
  url,
  mode = 'card',
  fallbackName = '',
  avatarUrl,
  style,
  onVideoPress,
}) => {
  const [hasError, setHasError] = useState(false);

  const parsed = parseVideoUrl(url);
  const hasVideo = !!url && parsed.type !== 'unknown' && !!parsed.embedUrl && !hasError;
  const isCard = mode === 'card';

  // In card mode (therapist list cards):
  // Show high-res static thumbnail/avatar preview.
  // Clicking the "🎥 Click here to see introduction of counselor" button pill opens the video modal!
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

        {/* Video CTA Overlay Button: ONLY clicking this button triggers the video popup modal */}
        {hasVideo && (
          <View style={styles.playOverlay} pointerEvents="box-none">
            <TouchableOpacity
              onPress={onVideoPress}
              activeOpacity={0.8}
              style={styles.seeIntroPill}
            >
              <Play size={14} color="#FFF" fill="#FFF" style={{ marginRight: 4 }} />
              <Text style={styles.seeIntroText}>
                🎥 Click here to see introduction of counselor
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // Fallback avatar/placeholder if no valid video URL or player error in modal mode
  if (!hasVideo) {
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

  // Active Video Player Mode (Modal & Therapist Detail Screen)
  let webUri = parsed.embedUrl;
  let htmlContent: string | null = null;

  if (parsed.type === 'youtube') {
    webUri = `${parsed.embedUrl}?autoplay=1&rel=0&controls=1&playsinline=1`;
  } else if (parsed.type === 'vimeo') {
    webUri = `${parsed.embedUrl}?autoplay=1`;
  } else if (parsed.type === 'direct') {
    htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
          <style>
            html, body { margin: 0; padding: 0; background: #000; width: 100%; height: 100%; overflow: hidden; display: flex; justify-content: center; align-items: center; }
            video { width: 100%; height: 100%; max-width: 100%; max-height: 100%; object-fit: contain; }
          </style>
        </head>
        <body>
          <video src="${webUri}" controls autoplay playsinline webkit-playsinline></video>
        </body>
      </html>
    `;
  }

  // React Native Web Embed
  if (Platform.OS === 'web') {
    if (htmlContent) {
      return (
        <View style={[styles.videoContainer, style]}>
          <iframe
            srcDoc={htmlContent}
            style={{ width: '100%', height: '100%', border: 0 } as any}
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            onError={() => setHasError(true)}
          />
        </View>
      );
    }
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

  // Native iOS & Android WebView Player
  if (WebView) {
    const webViewSource = htmlContent ? { html: htmlContent } : { uri: webUri };
    return (
      <View style={[styles.videoContainer, style]}>
        <WebView
          source={webViewSource}
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

  // Fallback if WebView is not available
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
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  seeIntroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0D564D',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    maxWidth: '92%',
  },
  seeIntroText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: Theme.fonts.bodyBold,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
});

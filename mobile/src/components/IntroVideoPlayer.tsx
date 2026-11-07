import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Platform } from 'react-native';
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

  if (isCard) {
    let thumbnailUrl = avatarUrl;
    if (parsed.type === 'youtube' && parsed.id) {
      thumbnailUrl = `https://img.youtube.com/vi/${parsed.id}/hqdefault.jpg`;
    }

    return (
      <View className="w-full h-full bg-slate-900 relative overflow-hidden" style={style}>
        {thumbnailUrl ? (
          <Image source={{ uri: thumbnailUrl }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="w-full h-full bg-primary justify-center items-center">
            <View className="w-15 h-15 rounded-full bg-white/20 justify-center items-center border-2 border-white">
              <Text className="text-white text-2xl font-sora-bold">
                {fallbackName ? fallbackName.charAt(0).toUpperCase() : 'C'}
              </Text>
            </View>
          </View>
        )}

        {hasVideo && (
          <View className="absolute inset-0 bg-slate-900/35 justify-center items-center px-3" pointerEvents="box-none">
            <TouchableOpacity
              onPress={onVideoPress}
              activeOpacity={0.8}
              className="flex-row items-center gap-1.5 bg-primary px-4 py-7 rounded-3xl border border-white/40 shadow-lg elevation-6 max-w-[92%]"
            >
              <Play size={14} color="#FFF" fill="#FFF" />
              <Text className="text-white text-xs font-jakarta-bold tracking-wide text-center">
                Click here to see introduction of counselor
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  if (!hasVideo) {
    return (
      <View className="w-full h-full bg-primary justify-center items-center" style={style}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="w-15 h-15 rounded-full bg-white/20 justify-center items-center border-2 border-white">
            <Text className="text-white text-2xl font-sora-bold">
              {fallbackName ? fallbackName.charAt(0).toUpperCase() : 'C'}
            </Text>
          </View>
        )}
      </View>
    );
  }

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

  if (Platform.OS === 'web') {
    if (htmlContent) {
      return (
        <View className="w-full h-full bg-slate-900 relative overflow-hidden" style={style}>
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
      <View className="w-full h-full bg-slate-900 relative overflow-hidden" style={style}>
        <iframe
          src={webUri}
          style={{ width: '100%', height: '100%', border: 0 } as any}
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          onError={() => setHasError(true)}
        />
      </View>
    );
  }

  if (WebView) {
    const webViewSource = htmlContent ? { html: htmlContent } : { uri: webUri };
    return (
      <View className="w-full h-full bg-slate-900 relative overflow-hidden" style={style}>
        <WebView
          source={webViewSource}
          className="w-full h-full"
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

  return (
    <View className="w-full h-full bg-primary justify-center items-center" style={style}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} className="w-full h-full" resizeMode="cover" />
      ) : (
        <View className="w-15 h-15 rounded-full bg-white/20 justify-center items-center border-2 border-white">
          <Text className="text-white text-2xl font-sora-bold">
            {fallbackName ? fallbackName.charAt(0).toUpperCase() : 'C'}
          </Text>
        </View>
      )}
    </View>
  );
};

export default IntroVideoPlayer;

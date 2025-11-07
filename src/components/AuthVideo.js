import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Modal, View, StyleSheet, Dimensions, Text, ActivityIndicator } from 'react-native';
import { Video, AVPlaybackStatus } from 'expo-av';

const AuthVideo = ({ uri, accessToken, style, onPress, ...props }) => {
  const [videoUri, setVideoUri] = useState(uri);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const videoRef = React.useRef(null);
  const [isLoading, setIsLoading] = useState(false);



  if (error) {
    console.log('AuthVideo错误:', error);
    console.log('URI:', uri);
    console.log('Token状态:', accessToken ? '有Token' : '无Token');
  }

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      handlePreviewPress();
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    // 停止视频播放并重置到开始
    if (videoRef.current) {
      videoRef.current.pauseAsync();
      videoRef.current.setPositionAsync(0);
    }
  };

  const handlePreviewPress = () => {
    setShowPreview(true);
    // 延迟一点确保Video组件已经挂载
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.playAsync();
      }
    }, 100);
  };

  const handlePlaybackStatusUpdate = (status) => {
    if (status.isLoaded && !status.isPlaying && status.didJustFinish) {
      // 视频播放完成，重置到开始
      if (videoRef.current) {
        videoRef.current.setPositionAsync(0);
      }
    }
  };

  return (
    <>
      <TouchableOpacity style={[styles.container, style]} onPress={handlePress}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#0000ff" />
        ) : error ? (
          <Text style={styles.errorText}>加载失败</Text>
        ) : videoUri ? (
          <Video
            source={{ 
              uri: videoUri,
              headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}
            }}
            style={styles.video}
            resizeMode="cover"
            shouldPlay={false}
            isLooping={false}
            useNativeControls={false}
            isMuted={true}
            {...props}
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>视频</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={showPreview}
        transparent={true}
        animationType="fade"
        onRequestClose={handleClosePreview}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleClosePreview}
        >
          <View style={styles.previewContainer}>
            <Video
                  ref={videoRef}
                  source={{ 
                    uri: videoUri || uri,
                    headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}
                  }}
                  style={styles.previewVideo}
                  resizeMode="contain"
                  shouldPlay={false} // 改为false，我们手动控制播放
                  isLooping={false}
                  useNativeControls={true}
                  onError={(error) => {
                    console.error('视频播放错误:', error);
                    setError('视频播放失败');
                  }}
                  onLoad={() => {
                    console.log('Video组件加载成功:', uri);
                    // 组件加载完成后自动播放
                    if (videoRef.current) {
                      videoRef.current.playAsync();
                    }
                  }}
                  onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                  {...props}
                />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  videoThumbnail: {
    width: 80,
    height: 80,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  videoIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  videoText: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  previewVideo: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});

export default AuthVideo;
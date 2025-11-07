import React, { useState, useEffect, useRef } from 'react';
import { Image, TouchableOpacity, Modal, View, StyleSheet, Dimensions, PanResponder, Animated, Text, ActivityIndicator } from 'react-native';

const AuthImage = ({ uri, accessToken, style, onPress, ...props }) => {
  const [imageUri, setImageUri] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadImageWithAuth = async () => {
      // 如果是本地文件或不需要认证的URL，直接使用
      if (!uri || uri.startsWith('file://') || uri.startsWith('data:') || !accessToken) {
        setImageUri(uri);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log('开始加载认证图片:', uri);
        
        const response = await fetch(uri, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'image/*',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // 在 React Native 中，我们可以直接将响应转换为 base64
        const blob = await response.blob();
        
        // 使用 FileReader 将 blob 转换为 base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result;
          console.log('图片加载成功，转换为base64');
          setImageUri(base64data);
        };
        reader.onerror = () => {
          throw new Error('FileReader failed to read blob');
        };
        reader.readAsDataURL(blob);
        
      } catch (err) {
        console.error('加载认证图片失败:', err);
        setError(err.message);
        
        // 如果认证失败，尝试不使用认证头加载（用于调试）
        try {
          console.log('尝试不使用认证加载图片...');
          const fallbackResponse = await fetch(uri);
          if (fallbackResponse.ok) {
            // 直接使用原始 URI（React Native 的 Image 组件可能支持某些认证场景）
            setImageUri(uri);
            console.log('不使用认证，直接使用原始URI');
          } else {
            throw new Error(`Fallback failed: ${fallbackResponse.status}`);
          }
        } catch (fallbackErr) {
          console.error('不使用认证加载也失败:', fallbackErr);
          // 最终回退到原始 URI
          setImageUri(uri);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadImageWithAuth();
  }, [uri, accessToken]);

  if (error) {
    console.log('AuthImage错误:', error);
    console.log('URI:', uri);
    console.log('Token状态:', accessToken ? '有Token' : '无Token');
  }

  const [showPreview, setShowPreview] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastScale = useRef(1);
  const lastTranslate = useRef({ x: 0, y: 0 });
  const lastTap = useRef(0);
  const lastDistance = useRef(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => lastScale.current > 1,
      onMoveShouldSetPanResponder: () => lastScale.current > 1,
      onPanResponderMove: (evt, gestureState) => {
        if (lastScale.current > 1) {
          translateX.setValue(gestureState.dx);
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: () => {
        if (lastScale.current > 1) {
          lastTranslate.current = {
            x: translateX.__getValue(),
            y: translateY.__getValue()
          };
        }
      }
    })
  ).current;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      setShowPreview(true);
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    // 重置缩放和位置
    scale.setValue(1);
    translateX.setValue(0);
    translateY.setValue(0);
    lastScale.current = 1;
    lastTranslate.current = { x: 0, y: 0 };
  };

  // 处理预览容器上的触摸事件
  const handlePreviewTouch = (e) => {
    const { touches } = e.nativeEvent;
    
    if (touches.length === 2) {
      setIsZooming(true);
      // 双指缩放
      const touch1 = touches[0];
      const touch2 = touches[1];
      
      const dx = touch1.pageX - touch2.pageX;
      const dy = touch1.pageY - touch2.pageY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (lastDistance.current === null) {
        lastDistance.current = distance;
      } else {
        const scaleChange = distance / lastDistance.current;
        const newScale = lastScale.current * scaleChange;
        const boundedScale = Math.max(1, Math.min(newScale, 3));
        
        scale.setValue(boundedScale);
        lastScale.current = boundedScale;
        lastDistance.current = distance;
      }
    } else if (touches.length === 1 && e.type === 'touchend') {
      lastDistance.current = null;
      setIsZooming(false);
      
      // 双击检测 - 只在触摸结束时检测
      const now = Date.now();
      if (now - lastTap.current < 300) {
        handleDoubleTap();
      }
      lastTap.current = now;
    } else {
      lastDistance.current = null;
      setIsZooming(false);
    }
  };

  const handleDoubleTap = () => {
    const newScale = lastScale.current === 1 ? 2 : 1;
    Animated.spring(scale, {
      toValue: newScale,
      useNativeDriver: false,
    }).start();
    lastScale.current = newScale;
  };



  return (
    <>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        {isLoading ? (
          <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }]}>
            <ActivityIndicator size="small" color="#0000ff" />
          </View>
        ) : (
          <Image
            source={{ uri: imageUri || uri }}
            style={style}
            onError={(e) => {
              console.log('Image组件加载失败:', e.nativeEvent.error);
              console.log('最终URI:', imageUri || uri);
            }}
            onLoad={() => console.log('Image组件加载成功:', uri)}
            {...props}
          />
        )}
      </TouchableOpacity>

      <Modal
        visible={showPreview}
        transparent={true}
        animationType="fade"
        onRequestClose={handleClosePreview}
      >
        <View style={styles.modalOverlay}>
          {/* 关闭按钮 */}
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={handleClosePreview}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
          
          <View 
            style={styles.previewContainer} 
            {...panResponder.panHandlers}
            onTouchStart={handlePreviewTouch}
            onTouchEnd={(e) => { 
              lastDistance.current = null; 
              setIsZooming(false);
              handlePreviewTouch(e);
            }}
          >
            <Animated.Image
              source={{ uri: imageUri || uri }}
              style={[
                styles.previewImage,
                {
                  transform: [
                    { scale: scale },
                    { translateX: translateX },
                    { translateY: translateY }
                  ]
                }
              ]}
              resizeMode="contain"
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
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
  },
  previewImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default AuthImage;
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
  const closeTimer = useRef(null);
  const touchStartTime = useRef(0);
  const touchStartPosition = useRef({ x: 0, y: 0 });
  const shouldBlockPress = useRef(false);

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
    // 清除关闭定时器
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
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
    const { touches, changedTouches } = e.nativeEvent;
    const activeTouches = touches.length > 0 ? touches : changedTouches;
    
    if (activeTouches.length === 2) {
      // 阻止 onPress 触发
      shouldBlockPress.current = true;
      // 清除关闭定时器
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
      setIsZooming(true);
      // 双指缩放
      const touch1 = activeTouches[0];
      const touch2 = activeTouches[1];
      
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
    } else if (activeTouches.length === 1) {
      if (e.type === 'touchstart') {
        // 记录触摸开始时间和位置
        touchStartTime.current = Date.now();
        touchStartPosition.current = {
          x: activeTouches[0].pageX,
          y: activeTouches[0].pageY
        };
        shouldBlockPress.current = false;
      } else if (e.type === 'touchend') {
        lastDistance.current = null;
        setIsZooming(false);
        
        // 检查是否是移动（移动超过10px不算点击）
        const touch = activeTouches[0];
        const moveDistance = Math.sqrt(
          Math.pow(touch.pageX - touchStartPosition.current.x, 2) +
          Math.pow(touch.pageY - touchStartPosition.current.y, 2)
        );
        
        // 如果移动距离很小，认为是点击
        if (moveDistance < 10) {
          // 双击检测
          const now = Date.now();
          if (now - lastTap.current < 300) {
            // 阻止 onPress 触发
            shouldBlockPress.current = true;
            // 清除关闭定时器
            if (closeTimer.current) {
              clearTimeout(closeTimer.current);
              closeTimer.current = null;
            }
            handleDoubleTap();
            lastTap.current = 0; // 重置，避免触发关闭
            // 延迟重置标志，确保 onPress 不会触发
            setTimeout(() => {
              shouldBlockPress.current = false;
            }, 100);
          } else {
            // 单点轻触：如果不是缩放状态，则延迟关闭预览（等待可能的双击）
            if (lastScale.current === 1) {
              // 清除之前的定时器
              if (closeTimer.current) {
                clearTimeout(closeTimer.current);
              }
              // 延迟200ms执行关闭，如果在这期间有双击，定时器会被清除
              closeTimer.current = setTimeout(() => {
                handleClosePreview();
                closeTimer.current = null;
              }, 200);
            }
            lastTap.current = now;
          }
        } else {
          // 如果移动了，阻止 onPress
          shouldBlockPress.current = true;
        }
      }
    } else {
      lastDistance.current = null;
      setIsZooming(false);
      shouldBlockPress.current = false;
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
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {
                // 如果未缩放且没有被阻止，则关闭预览
                if (!shouldBlockPress.current && lastScale.current === 1 && !isZooming) {
                  handleClosePreview();
                }
                // 重置标志
                shouldBlockPress.current = false;
              }}
              style={styles.imageTouchable}
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
            </TouchableOpacity>
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
  imageTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AuthImage;
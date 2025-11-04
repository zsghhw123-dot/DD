import React, { useState, useEffect } from 'react';
import { Image } from 'react-native';

const AuthImage = ({ uri, accessToken, style, ...props }) => {
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

  return (
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
  );
};

export default AuthImage;
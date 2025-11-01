import { useState } from 'react';
import { Animated, Alert } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

export const useAudioRecording = () => {
  // 录音相关状态
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [recordingAnimation] = useState(new Animated.Value(1));
  const [pulseAnimation] = useState(new Animated.Value(1));

  // 录音配置
  const recordingOptions = {
    android: {
      extension: '.m4a',
      outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
      audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
      sampleRate: 44100,
      numberOfChannels: 2,
      bitRate: 128000,
    },
    ios: {
      extension: '.wav',
      audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
      sampleRate: 44100,
      numberOfChannels: 1,
      bitRate: 128000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
  };

  // 处理音频文件（可以在这里添加语音识别逻辑）
  const processAudioFile = async (uri) => {
    try {
      console.log('🔄 处理音频文件:', uri);
      
      // 使用legacy API获取文件信息
      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log('📁 音频文件信息:', fileInfo);
      
      // 这里可以添加将音频文件发送到语音识别服务的逻辑
      // 例如：发送到百度语音识别、讯飞语音识别等服务
      
      Alert.alert('录音完成', `音频文件已保存\n大小: ${(fileInfo.size / 1024).toFixed(2)} KB`);
      
    } catch (error) {
      console.error('❌ 处理音频文件失败:', error);
    }
  };

  // 开始录音
  const startRecording = async () => {
    try {
      console.log('🎙️ 请求录音权限...');
      const permission = await Audio.requestPermissionsAsync();
      
      if (permission.status !== 'granted') {
        console.error('❌ 录音权限被拒绝');
        Alert.alert('权限不足', '需要麦克风权限才能录音');
        return;
      }

      console.log('✅ 录音权限已获得，开始录音...');
      
      // 设置音频模式
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(recording);
      setIsRecording(true);
      
      console.log('🎤 录音已开始');
      
      // 按钮缩放动画
      Animated.spring(recordingAnimation, {
        toValue: 0.9,
        useNativeDriver: true,
      }).start();
      
      // 脉冲动画
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
      
    } catch (error) {
      console.error('❌ 开始录音失败:', error);
      Alert.alert('录音失败', '无法开始录音，请重试');
    }
  };

  // 停止录音
  const stopRecording = async () => {
    if (!recording) {
      console.log('⚠️ 没有正在进行的录音');
      return;
    }

    try {
      console.log('🔇 停止录音...');
      setIsRecording(false);
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      
      console.log('✅ 录音已停止，文件保存在:', uri);
      
      // 恢复按钮大小
      Animated.spring(recordingAnimation, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
      
      // 停止脉冲动画
      pulseAnimation.stopAnimation();
      Animated.timing(pulseAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
      // 这里可以添加音频文件上传到语音识别服务的逻辑
      if (uri) {
        await processAudioFile(uri);
      }
      
    } catch (error) {
      console.error('❌ 停止录音失败:', error);
      Alert.alert('录音失败', '停止录音时出错');
    }
  };

  return {
    // 状态
    recording,
    isRecording,
    recognizedText,
    recordingAnimation,
    pulseAnimation,
    
    // 方法
    startRecording,
    stopRecording,
    processAudioFile,
    
    // 设置器
    setRecognizedText
  };
};
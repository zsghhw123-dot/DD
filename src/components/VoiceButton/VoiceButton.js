import React, { useState } from 'react';
import { View, Text, StyleSheet, Animated, Pressable, Image } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

// 导入图标
import AddIcon from '../../../assets/icons/add.svg';
import KeyBoardIcon from '../../../assets/icons/keyboard.svg';

// 导入主题
import { theme, colors, typographyUtils } from '../../theme';

// 导入录音hook
import { useAudioRecording } from '../../hooks/useAudioRecording';

const VoiceButton = ({ onAddRecord, onKeyboardPress }) => {
  // 使用录音功能hook
  const {
    isRecording,
    recordingAnimation,
    pulseAnimation,
    startRecording,
    stopRecording
  } = useAudioRecording();

  // 语音按钮交互状态
  const [isPressed, setIsPressed] = useState(false);
  const [isCancelMode, setIsCancelMode] = useState(false);
  const [waveAnimation] = useState(new Animated.Value(0));
  const [buttonScale] = useState(new Animated.Value(1));
  const [containerOpacity] = useState(new Animated.Value(1));

  // 语音按钮手势处理
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: containerOpacity } }],
    { useNativeDriver: false }
  );

  const onHandlerStateChange = (event) => {
    const { state, translationY } = event.nativeEvent;

    if (state === State.BEGAN) {
      handleVoiceButtonPressIn();
    } else if (state === State.ACTIVE) {
      // 检测上滑手势
      if (translationY < -50) {
        if (!isCancelMode) {
          setIsCancelMode(true);
          // 按钮变红动画
          Animated.timing(buttonScale, {
            toValue: 1.1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      } else {
        if (isCancelMode) {
          setIsCancelMode(false);
          // 恢复按钮颜色
          Animated.timing(buttonScale, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      }
    } else if (state === State.END || state === State.CANCELLED) {
      if (isCancelMode) {
        // 取消录音
        handleCancelRecording();
      } else {
        // 正常结束录音
        handleVoiceButtonPressOut();
      }

      // 重置状态
      setIsCancelMode(false);
      setIsPressed(false);
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  // 取消录音
  const handleCancelRecording = () => {
    stopRecording();
    // 停止波动动画
    waveAnimation.stopAnimation();
    Animated.timing(waveAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  // 语音按钮处理函数
  const handleVoiceButtonPressIn = () => {
    setIsPressed(true);
    startRecording();

    // 触发震动反馈
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // 开始波动动画
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(waveAnimation, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleVoiceButtonPressOut = () => {
    setIsPressed(false);
    stopRecording();

    // 停止波动动画
    waveAnimation.stopAnimation();
    Animated.timing(waveAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.voiceButtonWrapper}>
      {/* 上段虚化效果 */}
      <View style={styles.gradientOverlay} />

      {/* 提示文字 */}
      {isPressed && (
        <Animated.View style={[styles.hintContainer, { opacity: containerOpacity }]}>
          <Text style={styles.hintText}>
            {isCancelMode ? '松手取消' : '松手发送，上移取消'}
          </Text>
        </Animated.View>
      )}

      {/* 语音按钮 */}
      <Animated.View style={[styles.voiceButtonContainer]}>
        <Animated.View
          style={[
            styles.voiceButton,
            {
              backgroundColor: isCancelMode ? colors.app.error : (isPressed ? "#8DB9A1" : colors.app.buttonPrimary),
              transform: [{ scale: buttonScale }],
            }
          ]}
        >
          <Pressable
            onPressIn={handleVoiceButtonPressIn}
            onPressOut={handleVoiceButtonPressOut}
            style={{ 
              flex: 1, 
              flexDirection: 'row', 
              justifyContent: isPressed ? 'center' : 'space-between', 
              alignItems: 'center', 
              paddingVertical: theme.spacing.sm, 
              paddingHorizontal: theme.spacing.sm 
            }}
          >
            {!isPressed && (
              <Pressable 
                style={[styles.circleButton, { backgroundColor: colors.app.buttonSecondary}]}
                onPress={onAddRecord}
              >
                <AddIcon width={20} height={20} fill={colors.text.inverse} />
              </Pressable>
            )}

            {/* 条件渲染：按下时显示波动动画，否则显示文字 */}
            {isPressed ? (
              <Image source={require('../../../assets/animation/voice.gif')} resizeMode='contain' style={{ height: 40 }} />
            ) : (
              <Text style={typographyUtils.getTextStyle('label', colors.text.inverse)}>
                长按说话，快速记录
              </Text>
            )}
            
            {!isPressed && (
              <Pressable 
                style={[styles.circleButton, { backgroundColor: colors.app.buttonTertiary}]}
                onPress={onKeyboardPress}
              >
                <KeyBoardIcon width={20} height={20} fill={colors.text.inverse} />
              </Pressable>
            )}
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  voiceButtonWrapper: {
    position: 'absolute',
    bottom: -10,
    left: 0,
    right: 0,
    height: 100,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: theme.spacing.xl,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: colors.opacity.background,
    ...theme.shadows.lg,
    shadowColor: colors.app.background,
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  hintContainer: {
    position: 'absolute',
    bottom: 110,
    backgroundColor: colors.shadow.overlay,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.xl,
  },
  hintText: {
    ...typographyUtils.getTextStyle('label', colors.text.inverse),
  },
  voiceButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  voiceButton: {
    borderRadius: 35,
    justifyContent: 'space-between',
    alignItems: 'center',
    ...theme.shadows.lg,
    shadowColor: colors.shadow.dark,
    flex: 1,
    flexDirection: 'row',
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default VoiceButton;
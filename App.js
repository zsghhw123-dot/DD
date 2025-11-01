import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity, Animated } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';

// 导入自定义hooks
import { useFeishuApi } from './src/hooks/useFeishuApi';
import { useAudioRecording } from './src/hooks/useAudioRecording';

// 导入组件
import Calendar from './src/components/Calendar/Calendar';
import RecordItem from './src/components/RecordItem/RecordItem';

export default function App({ navigation }) {
  // 当前显示的年月状态
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  
  // 选中日期的活动数据
  const [selectedDateData, setSelectedDateData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // 使用飞书API hook
  const {
    activityData,
    isLoading,
    handleDateChange: handleFeishuDateChange
  } = useFeishuApi(currentYear, currentMonth);

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

  // 处理日历年月变化的回调函数
  const handleDateChange = (year, month) => {
    setCurrentYear(year);
    setCurrentMonth(month);
    handleFeishuDateChange(year, month);
  };

  // 处理日期选择
  const handleDateSelect = (date, dayActivities) => {
    console.log('选中日期:', date, '活动数据:', dayActivities);
    setSelectedDateData(dayActivities);
    setSelectedDate(date);
  };

  // 处理记录点击
  const handleRecordPress = (record) => {
    if (!record) return;
    console.log('点击记录:', record);
    navigation?.navigate('RecordDetail', {
      recordId: record.id,
      record: record,
    });
  };

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="auto" />
        <View style={styles.container}>
          <Calendar 
            onDateChange={handleDateChange} 
            onDateSelect={handleDateSelect}
            activityData={activityData} 
          />

          <View style={styles.recordsContainer}>
            <Text style={styles.recordsTitle}>
              {selectedDate.getDate()}日活动
            </Text>
            <ScrollView 
              style={styles.recordsList}
              showsVerticalScrollIndicator={false}
            >
              {selectedDateData.map(record => (
                <RecordItem
                  key={record.id}
                  icon={record.icon}
                  title={record.title}
                  description={record.description}
                  amount={record.amount}
                  onPress={() => handleRecordPress(record)}
                />
              ))}
            </ScrollView>
          </View>

          {/* 新的语音按钮容器 */}
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
            
            {/* 语音波动效果 */}
            {isPressed && (
              <View style={styles.waveContainer}>
                {[...Array(5)].map((_, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.waveBar,
                      {
                        transform: [{
                          scaleY: waveAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.2, 1 + index * 0.5],
                          })
                        }],
                        opacity: waveAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.3, 0.8],
                        }),
                      }
                    ]}
                  />
                ))}
              </View>
            )}
            
            {/* 语音按钮 */}
            <PanGestureHandler
              onGestureEvent={onGestureEvent}
              onHandlerStateChange={onHandlerStateChange}
            >
              <Animated.View style={[styles.voiceButtonContainer]}>
                <Animated.View
                  style={[
                    styles.voiceButton,
                    {
                      backgroundColor: isCancelMode ? '#ff4444' : (isPressed ? '#2E7D32' : '#4CAF50'),
                      transform: [{ scale: buttonScale }],
                    }
                  ]}
                >
                  <Text style={styles.voiceIcon}>
                    {isCancelMode ? '❌' : '🎤'}
                  </Text>
                </Animated.View>
              </Animated.View>
            </PanGestureHandler>
          </View>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5fcf9',
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5fcf9'
  },
  recordsContainer: {
    marginTop: 10,
    flex: 1,
    paddingBottom: 120, // 为语音按钮容器留出空间
  },
  recordsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    fontWeight: "bold",
    marginTop: 10,
    marginLeft: 10,
    marginBottom: 15,
  },
  
  // 新的语音按钮容器样式
  voiceButtonWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 30,
  },
  
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(245, 252, 249, 0.8)',
    // iOS 渐变效果
    shadowColor: '#f5fcf9',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  
  hintContainer: {
    position: 'absolute',
    bottom: 110,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  
  hintText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  
  waveContainer: {
    position: 'absolute',
    bottom: 100,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 40,
  },
  
  waveBar: {
    width: 3,
    height: 20, // 设置固定高度，通过scaleY来变化
    backgroundColor: '#4CAF50',
    marginHorizontal: 1,
    borderRadius: 1.5,
  },
  
  voiceButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  voiceButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  
  voiceIcon: {
    fontSize: 28,
  },
});

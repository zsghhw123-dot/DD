import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity, Animated } from 'react-native';

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

  // 语音按钮处理函数
  const handleVoiceButtonPressIn = () => {
    startRecording();
  };

  const handleVoiceButtonPressOut = () => {
    stopRecording();
  };

  return (
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

        {/* 语音按钮 */}
        <View style={styles.voiceButtonContainer}>
          <Animated.View 
            style={[
              styles.voicePulseCircle,
              {
                transform: [{ scale: pulseAnimation }],
                opacity: isRecording ? 0.3 : 0,
              }
            ]}
          />
          <TouchableOpacity
            style={[
              styles.voiceButton,
              { backgroundColor: isRecording ? '#ff4444' : '#4CAF50' }
            ]}
            onPressIn={handleVoiceButtonPressIn}
            onPressOut={handleVoiceButtonPressOut}
            activeOpacity={0.8}
          >
            <Animated.View
              style={[
                styles.voiceButtonInner,
                { transform: [{ scale: recordingAnimation }] }
              ]}
            >
              <Text style={styles.voiceIcon}>
                {isRecording ? '⏹️' : '🎤'}
              </Text>
            </Animated.View>
          </TouchableOpacity>
          {isRecording && (
            <Text style={styles.recordingText}>正在录音...</Text>
          )}
        </View>
      </View>
    </SafeAreaView>
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
  // 语音按钮样式
  voiceButtonContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voicePulseCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4CAF50',
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
  voiceButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceIcon: {
    fontSize: 28,
  },
  recordingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#ff4444',
    fontWeight: '600',
  },
});

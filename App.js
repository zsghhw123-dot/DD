import React, { useState , useEffect} from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

// 导入自定义hooks
import { useFeishuApi } from './src/hooks/useFeishuApi';

// 导入组件
import Calendar from './src/components/Calendar/Calendar';
import RecordItem from './src/components/RecordItem/RecordItem';
import VoiceButton from './src/components/VoiceButton';

// 导入主题系统
import { theme, colors, typography, typographyUtils } from './src/theme';
import { getSmartDateTime } from './src/utils/dateUtils';

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
    handleDateChange: handleFeishuDateChange,
    refreshCurrentMonthData,
    dataCache,
    getMonthKey
  } = useFeishuApi(currentYear, currentMonth);



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
    // 触发震动反馈
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // 监听activityData变化，自动更新selectedDateData
  useEffect(() => {
    if (activityData) {
      const day = selectedDate.getDate();
      const month = selectedDate.getMonth() + 1;
      const year = selectedDate.getFullYear();
      const monthKey = getMonthKey(year, month);
      const dayActivities = dataCache[monthKey]?.[day]?.activities || [];
      
    //   const dayActivities = activityData[day]?.activities || [];
      setSelectedDateData(dayActivities);
    }
  }, [activityData, selectedDate]);

  // 处理记录点击
  const handleRecordPress = (record) => {
    if (!record) return;
    console.log('点击记录:', record);
    // 触发震动反馈
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation?.navigate('RecordDetail', {
      recordId: record.id,
      record: record,
      refreshCurrentMonthData: () => refreshCurrentMonthData(selectedDate),
    });
  };

  // 处理添加记录按钮点击
  const handleAddRecord = () => {
    navigation?.navigate('RecordDetail', {
      selectedDate: selectedDate,
      smartDateTime: getSmartDateTime(selectedDate),
      refreshCurrentMonthData: () => refreshCurrentMonthData(selectedDate),
    });
  };

  // 处理键盘按钮点击
  const handleKeyboardPress = () => {
    // 可以在这里添加键盘相关的逻辑
    console.log('键盘按钮被点击');
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
            
            <View style={styles.recordsHeader}>
              <Text style={styles.recordsTitle}>
                {selectedDate.getDate()}日活动
              </Text>

              <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleAddRecord}
              activeOpacity={0.8}
            >
              <View style={styles.actionButtonContent}>
                 <Text style={styles.actionButtonText}>添加新记录</Text>
               </View>
            </TouchableOpacity>
            </View>

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

          {/* 语音按钮组件 */}
          <VoiceButton 
            onAddRecord={handleAddRecord}
            onKeyboardPress={handleKeyboardPress}
          />
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.app.background,
  },
  container: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: colors.app.background,
  },
  recordsContainer: {
    marginTop: theme.spacing.sm,
    flex: 1,
    paddingBottom: 70, // 为语音按钮容器留出空间
  },
  recordsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
        marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  recordsTitle: {
    ...typographyUtils.getTextStyle('h3', colors.app.textPrimary),
  },
  actionButton: {
    backgroundColor: colors.app.surface,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  actionButtonText: {
    ...typographyUtils.getTextStyle('button', colors.app.textPrimary),
    fontWeight: '500',
    fontSize: 15,
  },


});

import React, { useState, useEffect } from 'react';
import '../../../global.css';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';

// 导入自定义hooks
import { useFeishuApi } from '../../hooks/useFeishuApi';

// 导入组件
import Calendar from '../../components/Calendar/Calendar';
import RecordItem from '../../components/RecordItem/RecordItem';
import VoiceButton from '../../components/VoiceButton';

// 导入主题系统
import { theme, colors, typography, typographyUtils } from '../../theme';
import { getSmartDateTime } from '../../utils/dateUtils';
import { useSettings } from '../../context/SettingsContext';

export default function HomeScreen({ navigation }) {
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
    refreshMonthDataForDate,
    dataCache,
    getMonthKey,
    categories
  } = useFeishuApi(currentYear, currentMonth);



  const { showVoiceButton } = useSettings();
  const [refreshing, setRefreshing] = useState(false);
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

  // 处理来自快捷指令的深度链接
  useEffect(() => {
    const handleDeepLink = ({ url }) => {
      console.log('收到深度链接:', url);

      // 解析URL参数
      const parsedUrl = Linking.parse(url);
      const { queryParams } = parsedUrl;

      if (queryParams) {
        // 处理快捷指令发送的数据
        const { title, description, amount, category } = queryParams;

        if (title) {
          // 显示确认对话框
          Alert.alert(
            '快捷指令数据',
            `标题: ${title}\n描述: ${description || '无'}\n金额: ${amount || '0'}\n分类: ${category || '未指定'}`,
            [
              { text: '取消', style: 'cancel' },
              {
                text: '创建记录',
                onPress: () => {
                  // 导航到创建记录页面，传递数据
                  navigation?.navigate('RecordDetail', {
                    selectedDate: selectedDate,
                    smartDateTime: getSmartDateTime(selectedDate),
                    refreshMonthDataForDate: (date) => refreshMonthDataForDate(date || selectedDate),
                    quickActionData: {
                      title: title,
                      description: description,
                      amount: amount,
                      category: category
                    }
                  });
                }
              }
            ]
          );
        }
      }
    };

    // 添加链接监听器
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // 检查应用是否通过链接启动
    Linking.getInitialURL().then(url => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // 清理监听器
    return () => {
      subscription.remove();
    };
  }, [navigation, selectedDate]);

  // 处理记录点击
  const handleRecordPress = (record) => {
    if (!record) return;
    console.log('点击记录:', record);
    // 触发震动反馈
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation?.navigate('RecordDetail', {
      recordId: record.id,
      record: record,
      refreshMonthDataForDate: (date) => refreshMonthDataForDate(date || selectedDate),
    });
  };

  // 处理添加记录按钮点击
  const handleAddRecord = () => {
    navigation?.navigate('RecordDetail', {
      selectedDate: selectedDate,
      smartDateTime: getSmartDateTime(selectedDate),
      refreshMonthDataForDate: (date) => refreshMonthDataForDate(date || selectedDate),
    });
  };

  // 处理键盘按钮点击
  const handleKeyboardPress = () => {
    // 可以在这里添加键盘相关的逻辑
    console.log('键盘按钮被点击');
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style="auto" />
          <Calendar
            onDateChange={handleDateChange}
            onDateSelect={handleDateSelect}
            activityData={activityData}
            categories={categories}
          />

          <View style={[styles.recordsContainer, showVoiceButton ? { paddingBottom: 80 } : null]}>

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
              style={{ paddingHorizontal: theme.spacing.md }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing || isLoading}
                  onRefresh={async () => {
                    setRefreshing(true);
                    try {
                      await refreshMonthDataForDate(selectedDate);
                    } finally {
                      setRefreshing(false);
                    }
                  }}
                  tintColor={colors.primary[500]}
                  colors={[colors.primary[500]]}
                />
              }
            >
              {selectedDateData.map(record => (
                <RecordItem
                  key={record.id}
                  icon={record.icon}
                  title={record.title}
                  description={record.description}
                  amount={record.amount}
                  fields={record.fields || {}}
                  onPress={() => handleRecordPress(record)}
                />
              ))}
              <View className="h-12 transparent"></View>
            </ScrollView>

          </View>

          {showVoiceButton && (
            <VoiceButton
              onAddRecord={handleAddRecord}
              onKeyboardPress={handleKeyboardPress}
            />
          )}

        </SafeAreaView>
      </SafeAreaProvider>
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

  },
  recordsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    marginLeft: theme.spacing.lg,
    marginRight: theme.spacing.md,
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

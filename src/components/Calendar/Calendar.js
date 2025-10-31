import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, PanResponder } from 'react-native';

const Calendar = ({ onDateChange, onDateSelect, activityData = {} }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // 初始化时通知父组件当前年月
  useEffect(() => {
    if (onDateChange) {
      onDateChange(currentDate.getFullYear(), currentDate.getMonth() + 1);
    }
  }, []);
  
  // 获取当前月份的天数
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  // 获取当前月份的第一天是星期几
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };
  
  // 生成日历数据
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    //获取1号是星期几，如果返回的是3那么1号则为星期三
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // 添加上个月的剩余天数以填充第一行
    const prevMonthDays = getDaysInMonth(year, month - 1);
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({
        day: prevMonthDays - firstDayOfMonth + i + 1,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthDays - firstDayOfMonth + i + 1)
      });
    }
    
    // 添加当前月的天数
    for (let i = 1; i <= daysInMonth; i++) {
      // const hasActivity = activityData[i] && activityData[i].length > 0;
      console.log(i)
      console.log(activityData[i]?.activities && activityData[i].activities.length > 0)
      const hasActivity = activityData[i]?.activities && activityData[i].activities.length > 0
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i),
        hasActivity: hasActivity,
        activities: activityData[i] || []
      });
    }
    
    // 计算需要添加的下个月天数，确保总数是7的倍数
    const totalDaysShown = days.length;
    const remainingDays = 7 - (totalDaysShown % 7);
    
    // 只有当需要填充最后一行时才添加下个月的日期
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        days.push({
          day: i,
          isCurrentMonth: false,
          date: new Date(year, month + 1, i)
        });
      }
    }
    
    return days;
  };
  
  // 切换到上个月
  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(newDate);
    
    // 通知父组件年月变化
    if (onDateChange) {
      onDateChange(newDate.getFullYear(), newDate.getMonth() + 1);
    }
  };

  // 切换到下个月
  const goToNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(newDate);
    
    // 通知父组件年月变化
    if (onDateChange) {
      onDateChange(newDate.getFullYear(), newDate.getMonth() + 1);
    }
  };

  // 创建手势响应器
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // 当水平滑动距离大于垂直滑动距离且超过阈值时激活手势
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 20;
    },
    onPanResponderGrant: () => {
      // 手势开始时的处理
    },
    onPanResponderMove: (evt, gestureState) => {
      // 手势移动时的处理（可以在这里添加视觉反馈）
    },
    onPanResponderRelease: (evt, gestureState) => {
      // 手势结束时的处理
      const { dx } = gestureState;
      const threshold = 50; // 滑动阈值
      
      if (Math.abs(dx) > threshold) {
        if (dx > 0) {
          // 向右滑动 - 切换到上个月
          goToPreviousMonth();
        } else {
          // 向左滑动 - 切换到下个月
          goToNextMonth();
        }
      }
    },
  });
  
  // 选择日期
  const selectDate = (date) => {
    setSelectedDate(date);
    
    // 通知父组件日期选择，并传递该日期的活动数据
    if (onDateSelect) {
      const day = date.getDate();
      const dayActivities = activityData[day]?.activities || [];
      onDateSelect(date, dayActivities);
    }
  };
  
  // 判断日期是否是今天
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };
  
  // 判断日期是否被选中
  const isSelected = (date) => {
    return date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear();
  };
  
  // 渲染日历头部
  const renderHeader = () => {
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    
    return (
      <View style={styles.header}>
        <TouchableOpacity onPress={goToPreviousMonth}>
          <Text style={styles.headerButton}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{currentDate.getFullYear()}年 {monthNames[currentDate.getMonth()]}</Text>
        <TouchableOpacity onPress={goToNextMonth}>
          <Text style={styles.headerButton}>{'>'}</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  // 渲染星期标题
  const renderWeekDays = () => {
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    
    return (
      <View style={styles.weekDaysContainer}>
        {weekDays.map((day, index) => (
          <Text key={index} style={styles.weekDay}>{day}</Text>
        ))}
      </View>
    );
  };
  
  // 渲染日历天数
  const renderDays = () => {
    const days = generateCalendarDays();
    // 按7个为一行分组，保证每行7个日期
    const rows = [];
    for (let i = 0; i < days.length; i += 7) {
      rows.push(days.slice(i, i + 7));
    }

    return (
      <View style={styles.daysContainer} {...panResponder.panHandlers}>
        {rows.map((row, rowIndex) => (
          <View style={styles.weekRow} key={rowIndex}>
            {row.map((item, index) => {
              // 确定背景样式
              let dayContainerStyle = [styles.dayContainer];
              
              if (!item.isCurrentMonth) {
                // 上个月的日期 - 保持原样（灰色背景）
                dayContainerStyle.push(styles.otherMonth);
              } else if (item.hasActivity) {
                // 当月有活动的日期 - 绿色背景
                dayContainerStyle.push(styles.currentMonthWithActivity);
              } else {
                // 当月无活动的日期 - 无背景
                dayContainerStyle.push(styles.currentMonth);
              }
              
              // 添加选中和今天的样式
              if (isSelected(item.date)) dayContainerStyle.push(styles.selectedDay);
              if (isToday(item.date)) dayContainerStyle.push(styles.today);

              return (
                <TouchableOpacity
                  key={`${rowIndex}-${index}`}
                  style={styles.daySlot}
                  onPress={() => item.isCurrentMonth && selectDate(item.date)}
                  activeOpacity={item.isCurrentMonth ? 0.7 : 1}
                >
                  <View style={dayContainerStyle}>
                    <Text
                      style={[
                        styles.dayText,
                        !item.isCurrentMonth && styles.otherMonthText,
                        isSelected(item.date) && styles.selectedDayText
                      ]}
                    >
                      {item.day}
                    </Text>

                    {/* 显示活动图标 */}
                  {item.isCurrentMonth && item.hasActivity  && (
                    <View style={styles.activityContainer}>
                      {item.activities.icon.slice(0, 3).map((icon, iconIndex) => (
                        <Text key={iconIndex} style={styles.activityIcon}>
                          {icon}
                        </Text>
                      ))}
                    </View>
                  )}
                  </View>
                  
                  
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderWeekDays()}
      {renderDays()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5fcf9',
    borderRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerButton: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    padding: 5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    backgroundColor: '#e8f5f0',
    borderRadius: 10,
    marginBottom: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  weekDay: {
    width: 40,
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
  },
  daysContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingTop: 10,
    paddingBottom: 10,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,

  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  daySlot: {
    width: 40,
    alignItems: 'center',
  },
  dayContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 20,
    position: 'relative'
  },
  dayText: {
    fontSize: 14,
    color: '#333',
  },
  currentMonth: {
    backgroundColor: 'transparent', // 当月无活动时无背景
  },
  currentMonthWithActivity: {
    backgroundColor: '#EEF7F2', // 当月有活动时的背景色
  },
  otherMonth: {
  },
  otherMonthText: {
    color: '#cccccc',
  },
  selectedDay: {
    backgroundColor: '#a8e6cf',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  today: {
    borderWidth: 1,
    borderColor: '#a8e6cf',
  },
  recordIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffcc5c',
    position: 'absolute',
    bottom: 4,
  },
  activityContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: -5,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius:20,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityIcon: {
    fontSize: 8,
    marginHorizontal: 1,
  },
});

export default Calendar;
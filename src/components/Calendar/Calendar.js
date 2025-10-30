import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
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
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i),
        hasRecord: [1, 9, 13, 18, 21, 23].includes(i) // 模拟有记录的日期
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
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  // 切换到下个月
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  // 选择日期
  const selectDate = (date) => {
    setSelectedDate(date);
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
    
    return (
      <View style={styles.daysContainer}>
        {days.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayContainer,
              item.isCurrentMonth ? styles.currentMonth : styles.otherMonth,
              isSelected(item.date) && styles.selectedDay,
              isToday(item.date) && styles.today
            ]}
            onPress={() => item.isCurrentMonth && selectDate(item.date)}
          >
            <Text style={[
              styles.dayText,
              !item.isCurrentMonth && styles.otherMonthText,
              isSelected(item.date) && styles.selectedDayText
            ]}>
              {item.day}
            </Text>
            {item.hasRecord && (
              <View style={styles.recordIndicator} />
            )}
          </TouchableOpacity>
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
    padding: 10,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 10,
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
    paddingVertical: 10,
    backgroundColor: '#e8f5f0',
    borderRadius: 10,
    marginBottom: 5,
  },
  weekDay: {
    width: 30,
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingTop: 5,
  },
  dayContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 20,
  },
  dayText: {
    fontSize: 14,
    color: '#333',
  },
  currentMonth: {
    backgroundColor: '#f0f0f0',
  },
  otherMonth: {
    backgroundColor: 'transparent',
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
});

export default Calendar;
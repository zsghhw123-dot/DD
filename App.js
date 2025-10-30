import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, SafeAreaView } from 'react-native';
import Calendar from './src/components/Calendar/Calendar';
import RecordItem from './src/components/RecordItem/RecordItem';

export default function App() {
  // 模拟记录数据
  const recordData = [
    { id: 1, icon: '🏃', title: '运动', description: '健身房一次性卡', amount: '18.5' },
    { id: 2, icon: '🌙', title: '餐饮', description: '美的饺子', amount: '9.0' },
    { id: 3, icon: '📚', title: '学习', description: '学习ppt制作', amount: '0.0' },
    { id: 4, icon: '🍷', title: '饮料', description: '美的蜜汁茶', amount: '2.5' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="auto" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.calendarContainer}>
          <Calendar />
        </View>
        
        <View style={styles.recordsContainer}>
          {recordData.map(record => (
            <RecordItem
              key={record.id}
              icon={record.icon}
              title={record.title}
              description={record.description}
              amount={record.amount}
            />
          ))}
        </View>
      </ScrollView>
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
    backgroundColor: '#f5fcf9',
  },
  calendarContainer: {
    marginBottom: 20,
  },
  recordsContainer: {
    marginTop: 10,
  },
});

import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, SafeAreaView } from 'react-native';
import Calendar from './src/components/Calendar/Calendar';
import RecordItem from './src/components/RecordItem/RecordItem';

export default function App() {
  // 获取飞书tenant_access_token
  const getTenantAccessToken = async () => {
    try {
      // 直接请求飞书API
      const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
        method: 'POST',
        mode: 'cors', // 明确指定CORS模式
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          app_id: 'cli_a8b0209604e1901c',
          app_secret: 'qbM4y0eHt24lVlplSb8PmcRZfBUCcKrN'
        })
      });

      const data = await response.json();
      console.log('飞书API响应:', data);
      
      if (data.tenant_access_token) {
        console.log('tenant_access_token:', data.tenant_access_token);
      } else {
        console.log('获取tenant_access_token失败:', data);
      }
    } catch (error) {
      console.error('请求飞书API失败:', error);
      console.log('提示：如果是CORS错误，请在移动端或使用代理服务器');
    }
  };

  // 页面加载时获取token
  useEffect(() => {
    getTenantAccessToken();
  }, []);

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
        <Calendar />
        
        <View style={styles.recordsContainer}>
          <Text style={styles.recordsTitle}>30日活动</Text>
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
});

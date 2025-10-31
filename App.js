import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, SafeAreaView } from 'react-native';
import Calendar from './src/components/Calendar/Calendar';
import RecordItem from './src/components/RecordItem/RecordItem';

export default function App() {
  // 当前显示的年月状态
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1); // 月份从1开始
  const [accessToken, setAccessToken] = useState(null);
  const [activityData, setActivityData] = useState({});
  
  // 数据缓存：存储多个月份的数据，格式：{ "2025-10": {...}, "2025-11": {...} }
  const [dataCache, setDataCache] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  // 选中日期的活动数据
  const [selectedDateData, setSelectedDateData] = useState([]);

  // 提取表情符号的函数
  const extractEmojis = (text) => {
    const emojiRegex = /[\u203C-\u2049\u20E3\u2191-\u21FF\u2302-\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2-\u25EC\u2600-\u27BF\u2C60-\u2C7F\u2D30-\u2D7F\uA960-\uAEBFL\uD83C-\uDBFF\uDC00-\uDFFF]+/g;
    return text.match(emojiRegex) || [];
  };

  // 生成月份键的函数
  const getMonthKey = (year, month) => {
    return `${year}-${month.toString().padStart(2, '0')}`;
  };

  // 计算前后n个月的年月列表
  const getMonthRange = (centerYear, centerMonth, n = 3) => {
    const months = [];
    
    for (let i = -n; i <= n; i++) {
      const date = new Date(centerYear, centerMonth - 1 + i, 1);
      months.push({
        year: date.getFullYear(),
        month: date.getMonth() + 1
      });
    }
    
    return months;
  };

  // 将飞书API数据转换为activityData格式
  const convertToActivityData = (records) => {
    const newActivityData = {};
    
    if (!records || !Array.isArray(records)) {
      return newActivityData;
    }

    records.forEach(record => {
      // 获取日期（几号）
      const day = record.fields.日?.value?.[0];
      // 获取类别
      const category = record.fields.类别;
      
      if (day && category) {
        // 提取类别中的表情符号
        const emojis = extractEmojis(category);
        
        if (emojis.length > 0) {
          // 如果该日期还没有记录，初始化为空数组
          if (!newActivityData[day]) {
            newActivityData[day] = {icon: [],activities:[]};
          }
          
          // 将表情符号添加到对应日期，避免重复
          emojis.forEach(emoji => {
            if (!newActivityData[day].icon.includes(emoji)) {
              newActivityData[day].icon.push(emoji);
            }
          });
          
          // 将活动名称添加到对应日期，避免重复
          const activityEmoji = emojis[0];
          const activityType = record.fields.类别.replace(activityEmoji,"");
          const activityNote = record.fields.备注?.[0].text;
          const activityAmount = record.fields.金额;
          const id = record.record_id
          if (activityEmoji || activityType || activityNote || activityAmount) {
            newActivityData[day].activities.push({
              id: id,
              icon: activityEmoji,
              title: activityType,
              description: activityNote,
              amount: activityAmount
            });
          }
        }
      }
    });

    return newActivityData;
  };

  // 获取单个月份的Bitable记录数据
  const getBitableRecords = async (token, year, month) => {
    try {
      const response = await fetch('https://open.feishu.cn/open-apis/bitable/v1/apps/MhlTb2tO1a5IoOsE9r3cGIuqnmg/tables/tblzIfSGDegyUzTc/records/search', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter: {
            conjunction: "and",
            conditions: [
              {
                field_name: "年",
                operator: "is",
                value: [year.toString()]
              },
              {
                field_name: "月",
                operator: "is", 
                value: [month.toString()]
              }
            ]
          }
        })
      });

      if (response.ok) {
        const recordsData = await response.json();
        console.log(`${year}年${month}月 Bitable数据:`, recordsData);
        
        if (recordsData.data && recordsData.data.items) {
          const convertedData = convertToActivityData(recordsData.data.items);
          console.log(`${year}年${month}月 转换后数据:`,convertedData)
          return convertedData;
        }
      } else {
        console.error(`获取${year}年${month}月数据失败:`, response.status);
      }
    } catch (error) {
      console.error(`获取${year}年${month}月数据时出错:`, error);
    }
    return {};
  };

  // 批量获取多个月份的数据
  const fetchMultipleMonths = async (token, months) => {
    setIsLoading(true);
    const newCache = { ...dataCache };
    
    try {
      // 并行请求所有月份的数据
      const promises = months.map(async ({ year, month }) => {
        const monthKey = getMonthKey(year, month);
        
        // 如果缓存中已有数据，跳过请求
        if (newCache[monthKey]) {
          return { monthKey, data: newCache[monthKey] };
        }
        
        const data = await getBitableRecords(token, year, month);
        return { monthKey, data };
      });
      
      const results = await Promise.all(promises);
      
      // 更新缓存
      results.forEach(({ monthKey, data }) => {
        newCache[monthKey] = data;
      });
      
      setDataCache(newCache);
      
      // 更新当前显示的activityData（只有当activityData没有值时才更新）
      const currentMonthKey = getMonthKey(currentYear, currentMonth);
      if (newCache[currentMonthKey] && Object.keys(activityData).length === 0) {
        setActivityData(newCache[currentMonthKey]);
      }
      
    } catch (error) {
      console.error('批量获取数据时出错:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
        setAccessToken(data.tenant_access_token);

        // 获取当前月及前后3个月的数据（共7个月）
        const months = getMonthRange(currentYear, currentMonth, 3);
        console.log('准备获取的月份:', months);
        await fetchMultipleMonths(data.tenant_access_token, months);
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

  // 处理日历年月变化的回调函数
  const handleDateChange = (year, month) => {
    setCurrentYear(year);
    setCurrentMonth(month);
    
    // 立即更新当前显示的数据
    const currentMonthKey = getMonthKey(year, month);
    if (dataCache[currentMonthKey]) {
      setActivityData(dataCache[currentMonthKey]);
    } else {
      setActivityData({});
    }
    
    // 检查是否需要预加载新的月份数据
    if (accessToken) {
      checkAndPreloadData(year, month);
    }
  };

  // 检查缓存并预加载数据
  const checkAndPreloadData = async (year, month) => {
    const requiredMonths = getMonthRange(year, month, 3);
    const missingMonths = requiredMonths.filter(({ year: y, month: m }) => {
      const monthKey = getMonthKey(y, m);
      return !dataCache[monthKey];
    });
    
    if (missingMonths.length > 0) {
      console.log('需要预加载的月份:', missingMonths);
      await fetchMultipleMonths(accessToken, missingMonths);
    }
  };

  // 处理日期选择
  const handleDateSelect = (date, dayActivities) => {
    console.log('选中日期:', date, '活动数据:', dayActivities);
    setSelectedDateData(dayActivities);
  };

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
      <View style={styles.container}>
        <Calendar 
          onDateChange={handleDateChange} 
          onDateSelect={handleDateSelect}
          activityData={activityData} 
        />

        <View style={styles.recordsContainer}>
          <Text style={styles.recordsTitle}>
            {selectedDateData.length > 0 ? '选中日期活动' : '30日活动'}
          </Text>
          {(selectedDateData.length > 0 ? selectedDateData : recordData).map(record => (
            <RecordItem
              key={record.id}
              icon={record.icon}
              title={record.title}
              description={record.description}
              amount={record.amount}
            />
          ))}
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
});

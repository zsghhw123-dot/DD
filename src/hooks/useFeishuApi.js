import { useState, useEffect } from 'react';

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

        const hiddenEmojis = ["🍚", "🥛"];
        // 将表情符号添加到对应日期，避免重复
        emojis.forEach(emoji => {
          if (!newActivityData[day].icon.includes(emoji)) {
            if (!hiddenEmojis.includes(emoji)) {
              newActivityData[day].icon.push(emoji);
            }
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
            amount: activityAmount,
            fields: record.fields
          });
        }
      }
    }
  });

  return newActivityData;
};

export const useFeishuApi = (currentYear, currentMonth) => {
  const [accessToken, setAccessToken] = useState(null);
  const [activityData, setActivityData] = useState({});
  const [dataCache, setDataCache] = useState({});
  const [isLoading, setIsLoading] = useState(false);

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
          },
          sort:[{
            field_name: "日期",
            desc: true
          }]
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

  // 处理日历年月变化
  const handleDateChange = (year, month) => {
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

  // 页面加载时获取token
  useEffect(() => {
    getTenantAccessToken();
  }, []);

  // 创建新记录的函数
  const createRecord = async (formData) => {
    if (!accessToken) {
      console.error('没有访问令牌，无法创建记录');
      return { success: false, error: '没有访问令牌' };
    }

    try {
      // 将时间字符串转换为时间戳
      const timeString = formData.time; // 格式: "2025/11/02 20:58"
      
      // 将格式 "2025/11/02 20:58" 转换为标准格式 "2025-11-02T20:58:00"
      const standardTimeString = timeString.replace(/\//g, '-').replace(' ', 'T') + ':00';
      const timestamp = new Date(standardTimeString).getTime();
      
      // 检查时间戳是否有效
      if (isNaN(timestamp)) {
        throw new Error(`无效的时间格式: ${timeString}`);
      }
      
      console.log('时间转换:', { 
        original: timeString, 
        standard: standardTimeString, 
        timestamp 
      });
      const requestBody = {
        fields: {
          "位置": formData.location,
          "备注": formData.description,
          "日期": timestamp,
          "类别": formData.icon + formData.category,
          "金额": Number(formData.amount)
        }
      };

      console.log('创建记录请求体:', requestBody);

      const response = await fetch('https://open.feishu.cn/open-apis/bitable/v1/apps/MhlTb2tO1a5IoOsE9r3cGIuqnmg/tables/tblzIfSGDegyUzTc/records', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();
      console.log('创建记录响应:', result);

      if (response.ok) {
        console.log('记录创建成功:', result);
        return { success: true, data: result };
      } else {
        console.error('创建记录失败:', result);
        return { success: false, error: result.msg || '创建记录失败' };
      }
    } catch (error) {
      console.error('创建记录时出错:', error);
      return { success: false, error: error.message };
    }
  };

  // 删除记录函数
  const deleteRecord = async (recordId) => {
    if (!accessToken) {
      console.error('删除记录失败: 缺少访问令牌');
      return { success: false, error: '缺少访问令牌' };
    }

    if (!recordId) {
      console.error('删除记录失败: 缺少记录ID');
      return { success: false, error: '缺少记录ID' };
    }

    try {
      console.log('正在删除记录，ID:', recordId);
      
      const response = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/MhlTb2tO1a5IoOsE9r3cGIuqnmg/tables/tblzIfSGDegyUzTc/records/${recordId}`, {
        method: 'DELETE',
        mode: 'cors',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=utf-8',
        },
      });

      console.log('删除请求响应状态:', response.status);

      if (response.ok) {
        console.log('记录删除成功');
        return { success: true };
      } else {
        // 尝试解析错误响应
        let errorMessage = '删除记录失败';
        try {
          const errorData = await response.json();
          errorMessage = errorData.msg || errorMessage;
        } catch (e) {
          // 如果无法解析JSON，使用默认错误消息
        }
        
        console.error('删除记录失败:', response.status, errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('删除记录时出错:', error);
      return { success: false, error: error.message || '删除记录时出现网络错误' };
    }
  };

  // 刷新当前月份数据的函数
  const refreshCurrentMonthData = async (selectedDate) => {
    if (!accessToken) {
      console.error('刷新数据失败: 缺少访问令牌');
      return;
    }

    // 如果没有传入selectedDate，使用当前的currentYear和currentMonth
    let targetYear, targetMonth;
    if (selectedDate) {
      targetYear = selectedDate.getFullYear();
      targetMonth = selectedDate.getMonth() + 1; // getMonth()返回0-11，需要+1
    } else {
      targetYear = currentYear;
      targetMonth = currentMonth;
    }

    try {
      console.log(`刷新${targetYear}年${targetMonth}月数据`);
      setIsLoading(true);
      
      // 重新获取目标月份的数据
      const data = await getBitableRecords(accessToken, targetYear, targetMonth);
      
      // 更新缓存
      const monthKey = getMonthKey(targetYear, targetMonth);
      const newCache = { ...dataCache };
      newCache[monthKey] = data;
      setDataCache(newCache);
      
      // 如果刷新的是当前显示的月份，更新activityData
      if (targetYear === currentYear && targetMonth === currentMonth) {
        setActivityData(data);
      }
      
      console.log(`${targetYear}年${targetMonth}月数据刷新完成`);
    } catch (error) {
      console.error('刷新当前月份数据时出错:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 更新记录函数
  const updateRecord = async (recordId, formData) => {
    if (!accessToken) {
      console.error('更新记录失败: 缺少访问令牌');
      return { success: false, error: '缺少访问令牌' };
    }   

    if (!recordId) {
      console.error('更新记录失败: 缺少记录ID');
      return { success: false, error: '缺少记录ID' };
    }
    if (!formData) {
      console.error('更新记录失败: 缺少表单数据');
      return { success: false, error: '缺少表单数据' };
    }
    try {
      console.log('正在更新记录，ID:', recordId);

      // 将时间字符串转换为时间戳
      const timeString = formData.time; // 格式: "2025/11/02 20:58"
      
      // 将格式 "2025/11/02 20:58" 转换为标准格式 "2025-11-02T20:58:00"
      const standardTimeString = timeString.replace(/\//g, '-').replace(' ', 'T') + ':00';
      const timestamp = new Date(standardTimeString).getTime();

      const requestBody = {
        fields: {
          "位置": formData.location,
          "备注": formData.description,
          "日期": timestamp,
          "类别": formData.icon + formData.category,
          "金额": Number(formData.amount)
        }
      };
      console.log('更新请求体:', requestBody);
      
      const response = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/MhlTb2tO1a5IoOsE9r3cGIuqnmg/tables/tblzIfSGDegyUzTc/records/${recordId}`, {
        method: 'PUT',
        mode: 'cors',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('更新请求响应状态:', response.status);
      if (response.ok) {
        console.log('记录更新成功');
        return { success: true };
      } else {
        // 尝试解析错误响应
        let errorMessage = '更新记录失败';
        try {
          const errorData = await response.json();
          errorMessage = errorData.msg || errorMessage;
        } catch (e) {
          // 如果无法解析JSON，使用默认错误消息
        }
        
        console.error('更新记录失败:', response.status, errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('更新记录时出错:', error);
      return { success: false, error: error.message || '更新记录时出现网络错误' };
    }
  }
  return {
    accessToken,
    activityData,
    dataCache,
    isLoading,
    handleDateChange,
    checkAndPreloadData,
    createRecord,
    deleteRecord,
    refreshCurrentMonthData,
    getMonthKey,
    updateRecord
  };
};
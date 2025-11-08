import { useState, useEffect, useRef } from 'react';

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
const convertToActivityData = (records, categories = []) => {
  const newActivityData = {};

  if (!records || !Array.isArray(records)) {
    return newActivityData;
  }

  const hiddenEmojis = categories.filter(category => category.isShow === '否').map(category => category.icon);
  console.log("hiddenEmojis:", hiddenEmojis, "categories:", categories);

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
          newActivityData[day] = { icon: [], activities: [] };
        }

        

        
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
        const activityType = record.fields.类别.replace(activityEmoji, "");
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

export const useFeishuApi = (currentYear, currentMonth, options = {}) => {
  const { autoInitialize = true } = options;
  const [accessToken, setAccessToken] = useState(null);
  const [activityData, setActivityData] = useState({});
  const [dataCache, setDataCache] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const isInitialized = useRef(false);

  // 获取单个月份的Bitable记录数据
  const getBitableRecords = async (token, year, month, categoriesList = []) => {
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
          sort: [{
            field_name: "日期",
            desc: true
          }]
        })
      });

      if (response.ok) {
        const recordsData = await response.json();
        console.log(`${year}年${month}月 Bitable数据:`, recordsData);

        if (recordsData.data && recordsData.data.items) {
          const convertedData = convertToActivityData(recordsData.data.items, categoriesList);
          console.log(`${year}年${month}月 转换后数据:`, convertedData)
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
  const fetchMultipleMonths = async (token, months, categoriesList = []) => {
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
        const data = await getBitableRecords(token, year, month, categoriesList);
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

  // 获取分类数据
  const fetchCategories = async (token) => {
    if (!token) {
      console.error('没有访问令牌，无法获取分类数据');
      return;
    }
    try {
      console.log('开始获取分类数据...');

      const response = await fetch('https://open.feishu.cn/open-apis/bitable/v1/apps/MhlTb2tO1a5IoOsE9r3cGIuqnmg/tables/tbl34ZPqCSgBFAAg/records/search', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({

        })
      });

      const data = await response.json();
      console.log('分类数据请求响应:', data);

      if (response.ok && data.data && data.data.items) {
        console.log('分类数据获取成功:', data);

        // 转换API数据格式为应用所需格式
        const formattedCategories = data.data.items.map(item => ({
          id: item.fields.id?.[0]?.text || '',
          icon: item.fields.icon?.[0]?.text || '',
          name: item.fields.活动类别?.[0]?.text || '',
          record_id: item.record_id,
          isShow: item.fields.是否展示 || '是'
        }));

        console.log('转换后的分类数据:', formattedCategories);
        setCategories(formattedCategories);

        return { success: true, data: formattedCategories };
      } else {
        console.error('获取分类数据失败:', data);
        return { success: false, error: data.msg || '获取分类数据失败' };
      }
    } catch (error) {
      console.error('获取分类数据时出错:', error);
      return { success: false, error: error.message };
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
        return data.tenant_access_token;
      } else {
        console.log('获取tenant_access_token失败:', data);
        return null;
      }
    } catch (error) {
      console.error('请求飞书API失败:', error);
      console.log('提示：如果是CORS错误，请在移动端或使用代理服务器');
      return null;
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
      await fetchMultipleMonths(accessToken, missingMonths, categories);
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
    // 如果禁用了自动初始化，只获取基本的 token 和 categories
    if (!autoInitialize) {
      // 但仍然需要获取 token 和 categories（如果还没有的话）
      const initializeBasicData = async () => {
        if (!accessToken) {
          const token = await getTenantAccessToken();
          if (token && categories.length === 0) {
            await fetchCategories(token);
          }
        }
      };
      initializeBasicData();
      return;
    }

    // 确保只初始化一次
    if (isInitialized.current) {
      return;
    }

    // 确保 currentYear 和 currentMonth 有有效值
    if (!currentYear || !currentMonth) {
      console.warn('useFeishuApi: currentYear 或 currentMonth 无效，等待有效值...');
      return;
    }

    const initializeData = async () => {
      try {
        console.log('useFeishuApi: 开始初始化，年月:', currentYear, currentMonth);
        isInitialized.current = true;
        
        const token = await getTenantAccessToken();
        if (token) {
          // 获取分类数据
          const categoriesResult = await fetchCategories(token);
          const categoriesList = categoriesResult?.data || [];
          // 获取当前月及前后3个月的数据（共7个月）
          const months = getMonthRange(currentYear, currentMonth, 3);
          console.log('准备获取的月份:', months);
          await fetchMultipleMonths(token, months, categoriesList);
        }
      } catch (error) {
        console.error('useFeishuApi: 初始化失败:', error);
        // 如果初始化失败，重置标志以便重试
        isInitialized.current = false;
      }
    };
    
    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoInitialize]);

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
          "金额": Number(formData.amount),
          "照片": formData.照片 || [], // 添加照片信息
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
      const data = await getBitableRecords(accessToken, targetYear, targetMonth, categories);

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
          "金额": Number(formData.amount),
          "照片": formData.照片.map((item) => ({
            file_token: item.file_token
          })) || []
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

  // 上传文件到飞书
  const uploadFile = async (fileUri, fileName) => {
    
    console.log('uploadFile:', fileUri, fileName);
    if (!accessToken) {
      console.error('上传文件失败: 缺少访问令牌');
      return { success: false, error: '缺少访问令牌' };
    }

    if (!fileUri) {
      console.error('上传文件失败: 缺少文件URI');
      return { success: false, error: '缺少文件URI' };
    }

    try {
      console.log('开始上传文件:', fileName, 'URI:', fileUri);

      // 使用 fetch 将文件URI转换为二进制Blob
      const fileResponse = await fetch(fileUri);
      const blob = await fileResponse.blob();

      // 从Blob中获取文件大小和类型
      const fileSize = blob.size;
      const fileType = blob.type;

      console.log('从Blob获取到文件信息 - 大小:', fileSize, 'bytes, 类型:', fileType);

      // 处理文件名 - 如果没有提供，从URI中提取或使用默认值
      const finalFileName = fileName || (() => {
        // 尝试从文件URI中提取文件名
        const uriParts = fileUri.split('/');
        const lastPart = uriParts[uriParts.length - 1];
        if (lastPart && lastPart.includes('.')) {
          return lastPart;
        }
        return `uploaded_${Date.now()}.jpg`;
      })();

      // 创建 FormData
      const formData = new FormData();

      // 添加文件字段 - 以二进制形式添加文件
      formData.append('file', {
        uri: fileUri, // 本地文件路径
        name: fileName, // 文件名（可根据需要调整）
        type: fileType // 文件类型（可根据需要调整）
      });

      
      // 添加其他必要字段
      formData.append('file_name', finalFileName);
      formData.append('parent_type', 'bitable_image'); 
      formData.append('parent_node', 'MhlTb2tO1a5IoOsE9r3cGIuqnmg');
      formData.append('size', fileSize.toString());

      // 发送上传请求
      const response = await fetch('https://open.feishu.cn/open-apis/drive/v1/medias/upload_all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data; boundary=---7MA4YWxkTrZu0gW'
        },
        body: formData,
      });
      console.log('imageuploadformdata:', formData);
      console.log('file:', formData.get('file').toString());

      const result = await response.json();
      console.log('文件上传响应:', result);

      if (response.ok && result.data && result.data.file_token) {
        console.log('文件上传成功，file_token:', result.data.file_token);
        return {
          success: true,
          data: result.data,
          file_token: result.data.file_token
        };
      } else {
        console.error('文件上传失败:', result);
        return {
          success: false,
          error: result.msg || '文件上传失败',
          code: result.code
        };
      }
    } catch (error) {
      console.error('上传文件时出错:', error);
      return {
        success: false,
        error: error.message || '上传文件时出现网络错误'
      };
    }
  };


  // 根据ID获取分类
  const getCategoryById = (id) => {
    return categories.find(category => category.id === id);
  };

  // 根据名称获取分类
  const getCategoryByName = (name) => {
    return categories.find(category => category.name === name);
  };

  // 获取默认分类
  const getDefaultCategory = () => {
    return categories.length > 0 ? categories[0] : null;
  };

  return {
    accessToken,
    activityData,
    dataCache,
    isLoading,
    categories,
    handleDateChange,
    checkAndPreloadData,
    createRecord,
    deleteRecord,
    refreshCurrentMonthData,
    getMonthKey,
    updateRecord,
    uploadFile,
    fetchCategories,
    getCategoryById,
    getCategoryByName,
    getDefaultCategory
  };
};
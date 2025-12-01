import { useState, useEffect } from 'react';
import { useGlobalData, extractEmojis } from '../context/GlobalDataContext';

export const useFeishuApi = (currentYear, currentMonth, options = {}) => {
  const { autoInitialize = true } = options;

  // 从全局上下文获取数据和方法
  const {
    dataCache,
    accessToken,
    categories,
    isLoading: globalIsLoading,
    initializeData,
    getMonthData,
    refreshMonthData,
    updateCacheAfterCreate,
    updateCacheAfterDelete,
    updateCacheAfterUpdate,
    preloadYearData,
    preloadRange,
    ensureMonthData,
    getMonthKey,
    findSimilarCategory,
  } = useGlobalData();

  // 本地状态：当前显示的活动数据
  const [activityData, setActivityData] = useState({});

  // 首次初始化数据（只在首次启动时执行一次）
  useEffect(() => {
    if (autoInitialize && currentYear && currentMonth) {
      initializeData(currentYear, currentMonth);
    }
  }, []); // 空依赖数组，只执行一次

  // 当 currentYear/currentMonth 变化时，从缓存中获取对应月份的数据
  useEffect(() => {
    if (currentYear && currentMonth) {
      const monthData = getMonthData(currentYear, currentMonth);
      setActivityData(monthData);

      // 确保该月数据已加载（如果缓存中没有或过期，则加载）
      ensureMonthData(currentYear, currentMonth);
    }
  }, [currentYear, currentMonth, dataCache]);

  // 处理日历年月变化
  const handleDateChange = async (year, month) => {
    // 立即从缓存更新数据
    const monthData = getMonthData(year, month);
    setActivityData(monthData);

    // 确保该月数据已加载
    await ensureMonthData(year, month);
  };

  // 创建新记录的函数
  const createRecord = async (formData) => {
    if (!accessToken) {
      console.error('没有访问令牌，无法创建记录');
      return { success: false, error: '没有访问令牌' };
    }

    try {
      // 将时间字符串转换为时间戳
      const timeString = formData.time;
      const standardTimeString = timeString.replace(/\//g, '-').replace(' ', 'T') + ':00';
      const timestamp = new Date(standardTimeString).getTime();

      if (isNaN(timestamp)) {
        throw new Error(`无效的时间格式: ${timeString}`);
      }

      const requestBody = {
        fields: {
          "位置": formData.location,
          "备注": formData.description,
          "日期": timestamp,
          "类别": formData.icon + formData.category,
          "金额": Number(formData.amount),
          "照片": formData.照片 || [],
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
        // 解析日期以获取年月日
        const dateObj = new Date(standardTimeString);
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth() + 1;
        const day = dateObj.getDate();

        // 创建新活动对象
        const newActivity = {
          id: result.data.record.record_id,
          icon: formData.icon,
          title: formData.category,
          description: formData.description,
          amount: Number(formData.amount),
          fields: result.data.record.fields
        };

        // 更新全局缓存
        updateCacheAfterCreate(year, month, day, newActivity);

        console.log('记录创建成功，缓存已更新');
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

        // 需要刷新当前月份数据来更新缓存
        // 因为我们不知道具体是哪一天的记录，所以刷新整个月份
        await refreshMonthData(currentYear, currentMonth);

        return { success: true };
      } else {
        let errorMessage = '删除记录失败';
        try {
          const errorData = await response.json();
          errorMessage = errorData.msg || errorMessage;
        } catch (e) {
          // 无法解析JSON，使用默认错误消息
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
    let targetYear, targetMonth;
    if (selectedDate) {
      targetYear = selectedDate.getFullYear();
      targetMonth = selectedDate.getMonth() + 1;
    } else {
      targetYear = currentYear;
      targetMonth = currentMonth;
    }

    await refreshMonthData(targetYear, targetMonth);
  };

  const refreshMonthDataForDate = async (selectedDate) => {
    return refreshCurrentMonthData(selectedDate);
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
      const timeString = formData.time;
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
        // 解析日期以获取年月日
        const dateObj = new Date(standardTimeString);
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth() + 1;
        const day = dateObj.getDate();

        // 创建更新后的活动对象
        const updatedActivity = {
          icon: formData.icon,
          title: formData.category,
          description: formData.description,
          amount: Number(formData.amount),
        };

        // 更新全局缓存
        updateCacheAfterUpdate(year, month, day, recordId, updatedActivity);

        console.log('记录更新成功，缓存已更新');
        return { success: true };
      } else {
        let errorMessage = '更新记录失败';
        try {
          const errorData = await response.json();
          errorMessage = errorData.msg || errorMessage;
        } catch (e) {
          // 无法解析JSON，使用默认错误消息
        }

        console.error('更新记录失败:', response.status, errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('更新记录时出错:', error);
      return { success: false, error: error.message || '更新记录时出现网络错误' };
    }
  };

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

      const fileSize = blob.size;
      const fileType = blob.type;

      console.log('从Blob获取到文件信息 - 大小:', fileSize, 'bytes, 类型:', fileType);

      const finalFileName = fileName || (() => {
        const uriParts = fileUri.split('/');
        const lastPart = uriParts[uriParts.length - 1];
        if (lastPart && lastPart.includes('.')) {
          return lastPart;
        }
        return `uploaded_${Date.now()}.jpg`;
      })();

      // 创建 FormData
      const formData = new FormData();

      formData.append('file', {
        uri: fileUri,
        name: fileName,
        type: fileType
      });

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

  // 重新获取分类数据（用于设置页面）
  const fetchCategories = async () => {
    // 这个方法现在委托给全局上下文
    // 但为了保持接口兼容性，我们在这里重新暴露它
    if (!accessToken) {
      console.error('没有访问令牌，无法获取分类数据');
      return { success: false, error: '没有访问令牌' };
    }

    try {
      const response = await fetch('https://open.feishu.cn/open-apis/bitable/v1/apps/MhlTb2tO1a5IoOsE9r3cGIuqnmg/tables/tbl34ZPqCSgBFAAg/records/search', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      const data = await response.json();

      if (response.ok && data.data && data.data.items) {
        const formattedCategories = data.data.items.map(item => ({
          id: item.fields.id?.[0]?.text || '',
          icon: item.fields.icon?.[0]?.text || '',
          name: item.fields.活动类别?.[0]?.text || '',
          record_id: item.record_id,
          isShow: item.fields.是否展示 || '是'
        }));

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

  return {
    accessToken,
    activityData,
    dataCache,
    isLoading: globalIsLoading,
    categories,
    handleDateChange,
    createRecord,
    deleteRecord,
    refreshCurrentMonthData,
    refreshMonthDataForDate,
    getMonthKey,
    updateRecord,
    uploadFile,
    findSimilarCategory,
    fetchCategories,
    getCategoryById,
    getCategoryByName,
    getDefaultCategory,
    preloadYearData,
    preloadRange
  };
};
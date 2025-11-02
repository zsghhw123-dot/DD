// 生成月份键的函数
export const getMonthKey = (year, month) => {
  return `${year}-${month.toString().padStart(2, '0')}`;
};

// 计算前后n个月的年月列表
export const getMonthRange = (centerYear, centerMonth, n = 3) => {
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

// 格式化日期显示
export const formatDate = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 获取当前日期
export const getCurrentDate = () => {
  return new Date();
};

// 检查是否为今天
export const isToday = (date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

// 检查日期是否在今天之前
export const isBeforeToday = (date) => {
  const today = new Date();
  const compareDate = new Date(date);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const compareDateStart = new Date(compareDate.getFullYear(), compareDate.getMonth(), compareDate.getDate());
  
  return compareDateStart < todayStart;
};

// 检查日期是否在今天之后
export const isAfterToday = (date) => {
  const today = new Date();
  const compareDate = new Date(date);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const compareDateStart = new Date(compareDate.getFullYear(), compareDate.getMonth(), compareDate.getDate());
  
  return compareDateStart > todayStart;
};

// 智能时间设置函数
// 根据选择的日期返回合适的时间：
// - 今天：返回当前时间
// - 过去的日期：返回该日期的最晚时间（23:59）
// - 未来的日期：返回该日期的最早时间（00:00）
export const getSmartDateTime = (selectedDate) => {
  const date = new Date(selectedDate);
  
  if (isToday(date)) {
    // 今天：返回当前时间
    return new Date();
  } else if (isBeforeToday(date)) {
    // 过去的日期：返回该日期的最晚时间（23:59）
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 0, 0);
  } else {
    // 未来的日期：返回该日期的最早时间（00:00）
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  }
};
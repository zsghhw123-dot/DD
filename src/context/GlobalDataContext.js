import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

// 创建全局数据上下文
const GlobalDataContext = createContext(null);

// 工具函数：提取表情符号
const extractEmojis = (text) => {
    const emojiRegex = /[\u203C-\u2049\u20E3\u2191-\u21FF\u2302-\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2-\u25EC\u2600-\u27BF\u2C60-\u2C7F\u2D30-\u2D7F\uA960-\uAEBFL\uD83C-\uDBFF\uDC00-\uDFFF]+/g;
    return text.match(emojiRegex) || [];
};

// 工具函数：生成月份键
const getMonthKey = (year, month) => {
    return `${year}-${month.toString().padStart(2, '0')}`;
};

// 工具函数：计算前后n个月的年月列表
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

// 工具函数：将飞书API数据转换为activityData格式
const convertToActivityData = (records, categories = []) => {
    const newActivityData = {};

    if (!records || !Array.isArray(records)) {
        return newActivityData;
    }

    const hiddenEmojis = categories.filter(category => category.isShow === '否').map(category => category.icon);

    records.forEach(record => {
        const day = record.fields.日?.value?.[0];
        const category = record.fields.类别;

        if (day && category) {
            const emojis = extractEmojis(category);

            if (emojis.length > 0) {
                if (!newActivityData[day]) {
                    newActivityData[day] = { icon: [], activities: [] };
                }

                emojis.forEach(emoji => {
                    if (!newActivityData[day].icon.includes(emoji)) {
                        if (!hiddenEmojis.includes(emoji)) {
                            newActivityData[day].icon.push(emoji);
                        }
                    }
                });

                const activityEmoji = emojis[0];
                const activityType = record.fields.类别.replace(activityEmoji, "");
                const activityNote = record.fields.备注?.[0].text;
                const activityAmount = record.fields.金额;
                const id = record.record_id;

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

// GlobalDataProvider 组件
export const GlobalDataProvider = ({ children }) => {
    // 全局状态
    const [dataCache, setDataCache] = useState({});
    const [accessToken, setAccessToken] = useState(null);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const isInitialized = useRef(false);

    // 获取飞书 tenant_access_token
    const getTenantAccessToken = async () => {
        try {
            const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
                method: 'POST',
                mode: 'cors',
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
            return null;
        }
    };

    // 获取分类数据
    const fetchCategories = async (token) => {
        if (!token) {
            console.error('没有访问令牌，无法获取分类数据');
            return [];
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
                body: JSON.stringify({})
            });

            const data = await response.json();
            console.log('分类数据请求响应:', data);

            if (response.ok && data.data && data.data.items) {
                const formattedCategories = data.data.items.map(item => ({
                    id: item.fields.id?.[0]?.text || '',
                    icon: item.fields.icon?.[0]?.text || '',
                    name: item.fields.活动类别?.[0]?.text || '',
                    record_id: item.record_id,
                    isShow: item.fields.是否展示 || '是'
                }));

                console.log('转换后的分类数据:', formattedCategories);
                setCategories(formattedCategories);
                return formattedCategories;
            } else {
                console.error('获取分类数据失败:', data);
                return [];
            }
        } catch (error) {
            console.error('获取分类数据时出错:', error);
            return [];
        }
    };

    // 获取单个月份的数据
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
                    console.log(`${year}年${month}月 转换后数据:`, convertedData);
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
            const promises = months.map(async ({ year, month }) => {
                const monthKey = getMonthKey(year, month);

                // 如果缓存中已有数据，跳过请求
                if (newCache[monthKey]) {
                    console.log(`缓存命中: ${monthKey}`);
                    return { monthKey, data: newCache[monthKey] };
                }

                console.log(`正在获取: ${monthKey}`);
                const data = await getBitableRecords(token, year, month, categoriesList);
                return { monthKey, data };
            });

            const results = await Promise.all(promises);

            // 更新缓存
            results.forEach(({ monthKey, data }) => {
                newCache[monthKey] = data;
            });

            setDataCache(newCache);
            console.log('全局数据缓存已更新:', Object.keys(newCache));

        } catch (error) {
            console.error('批量获取数据时出错:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // 初始化数据（只在应用首次启动时调用）
    const initializeData = async (year, month) => {
        if (isInitialized.current) {
            console.log('数据已初始化，跳过重复初始化');
            return;
        }

        console.log('🚀 全局数据初始化开始...', { year, month });
        isInitialized.current = true;

        try {
            // 获取访问令牌
            const token = await getTenantAccessToken();
            if (!token) {
                console.error('初始化失败：无法获取访问令牌');
                isInitialized.current = false;
                return;
            }

            // 获取分类数据
            const categoriesList = await fetchCategories(token);

            // 获取当前月及前后3个月的数据（共7个月）
            const months = getMonthRange(year, month, 3);
            console.log('准备获取的月份:', months);
            await fetchMultipleMonths(token, months, categoriesList);

            console.log('✅ 全局数据初始化完成');
        } catch (error) {
            console.error('全局数据初始化失败:', error);
            isInitialized.current = false;
        }
    };

    // 从缓存获取月份数据
    const getMonthData = (year, month) => {
        const monthKey = getMonthKey(year, month);
        return dataCache[monthKey] || {};
    };

    // 强制刷新指定月份数据
    const refreshMonthData = async (year, month) => {
        if (!accessToken) {
            console.error('刷新数据失败: 缺少访问令牌');
            return;
        }

        try {
            console.log(`刷新${year}年${month}月数据`);
            setIsLoading(true);

            const data = await getBitableRecords(accessToken, year, month, categories);

            // 更新缓存
            const monthKey = getMonthKey(year, month);
            const newCache = { ...dataCache };
            newCache[monthKey] = data;
            setDataCache(newCache);

            console.log(`${year}年${month}月数据刷新完成`);
        } catch (error) {
            console.error('刷新月份数据时出错:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // 创建记录后更新缓存
    const updateCacheAfterCreate = (year, month, day, newActivity) => {
        const monthKey = getMonthKey(year, month);
        const newCache = { ...dataCache };

        if (!newCache[monthKey]) {
            newCache[monthKey] = {};
        }

        if (!newCache[monthKey][day]) {
            newCache[monthKey][day] = { icon: [], activities: [] };
        }

        // 添加新活动
        newCache[monthKey][day].activities.push(newActivity);

        // 更新图标
        if (newActivity.icon && !newCache[monthKey][day].icon.includes(newActivity.icon)) {
            newCache[monthKey][day].icon.push(newActivity.icon);
        }

        setDataCache(newCache);
        console.log('缓存已更新 - 创建记录:', { year, month, day });
    };

    // 删除记录后更新缓存
    const updateCacheAfterDelete = (year, month, day, recordId) => {
        const monthKey = getMonthKey(year, month);
        const newCache = { ...dataCache };

        if (newCache[monthKey]?.[day]) {
            // 删除活动
            newCache[monthKey][day].activities = newCache[monthKey][day].activities.filter(
                activity => activity.id !== recordId
            );

            // 重新计算图标
            const remainingIcons = [...new Set(
                newCache[monthKey][day].activities.map(activity => activity.icon).filter(Boolean)
            )];
            newCache[monthKey][day].icon = remainingIcons;

            // 如果该日期没有活动了，删除该日期
            if (newCache[monthKey][day].activities.length === 0) {
                delete newCache[monthKey][day];
            }

            setDataCache(newCache);
            console.log('缓存已更新 - 删除记录:', { year, month, day, recordId });
        }
    };

    // 更新记录后更新缓存
    const updateCacheAfterUpdate = (year, month, day, recordId, updatedActivity) => {
        const monthKey = getMonthKey(year, month);
        const newCache = { ...dataCache };

        if (newCache[monthKey]?.[day]) {
            // 更新活动
            const activityIndex = newCache[monthKey][day].activities.findIndex(
                activity => activity.id === recordId
            );

            if (activityIndex !== -1) {
                newCache[monthKey][day].activities[activityIndex] = {
                    ...newCache[monthKey][day].activities[activityIndex],
                    ...updatedActivity
                };

                // 重新计算图标
                const icons = [...new Set(
                    newCache[monthKey][day].activities.map(activity => activity.icon).filter(Boolean)
                )];
                newCache[monthKey][day].icon = icons;

                setDataCache(newCache);
                console.log('缓存已更新 - 更新记录:', { year, month, day, recordId });
            }
        }
    };

    // 预加载指定年份的所有数据
    const preloadYearData = async (targetYear) => {
        if (!accessToken) {
            console.error('预加载失败: 缺少访问令牌');
            return { success: false };
        }

        const months = Array.from({ length: 12 }, (_, i) => ({ year: targetYear, month: i + 1 }));
        await fetchMultipleMonths(accessToken, months, categories);
        return { success: true };
    };

    // 预加载指定范围的数据
    const preloadRange = async (startYear, startMonth, endYear, endMonth) => {
        if (!accessToken) {
            console.error('预加载失败: 缺少访问令牌');
            return { success: false };
        }

        const result = [];
        let y = startYear;
        let m = startMonth;
        while (y < endYear || (y === endYear && m <= endMonth)) {
            result.push({ year: y, month: m });
            m += 1;
            if (m > 12) {
                m = 1;
                y += 1;
            }
        }

        await fetchMultipleMonths(accessToken, result, categories);
        return { success: true };
    };

    // 确保缓存有指定月份的数据
    const ensureMonthData = async (year, month) => {
        const monthKey = getMonthKey(year, month);

        if (!dataCache[monthKey] && accessToken) {
            console.log(`缓存未命中，加载 ${monthKey}`);
            await fetchMultipleMonths(accessToken, [{ year, month }], categories);
        }
    };

    // Context value
    const value = {
        // 状态
        dataCache,
        accessToken,
        categories,
        isLoading,
        isInitialized: isInitialized.current,

        // 方法
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

        // API 方法
        getTenantAccessToken,
        fetchCategories,
    };

    return (
        <GlobalDataContext.Provider value={value}>
            {children}
        </GlobalDataContext.Provider>
    );
};

// Hook to use Global Data Context
export const useGlobalData = () => {
    const context = useContext(GlobalDataContext);
    if (!context) {
        throw new Error('useGlobalData must be used within a GlobalDataProvider');
    }
    return context;
};

// 导出工具函数供外部使用
export { getMonthKey, getMonthRange, extractEmojis, convertToActivityData };

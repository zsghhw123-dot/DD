import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

// 创建全局数据上下文
const GlobalDataContext = createContext(null);

// 配置常量
// 配置常量
const CACHE_EXPIRY_MS = 20 * 60 * 1000; // 20分钟过期
const STORAGE_KEY = '@record_app_cache';
const CATEGORIES_STORAGE_KEY = '@record_app_categories';
const ACCESS_TOKEN_KEY = '@record_app_token_v2'; // 更新key以区分旧版本
const DEBOUNCE_DELAY = 500; // 防抖延迟(ms)

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

// 防抖函数
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
};

// GlobalDataProvider 组件
export const GlobalDataProvider = ({ children }) => {
    // 全局状态
    const [dataCache, setDataCache] = useState({});
    const [accessToken, setAccessToken] = useState(null);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const isInitialized = useRef(false);
    const saveTimeoutRef = useRef(null);

    // ========== 持久化存储方法 ==========

    // 保存缓存到 AsyncStorage（带防抖）
    const saveCacheToStorage = useCallback(
        debounce(async (cache) => {
            try {
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
                console.log('💾 缓存已保存到存储');
            } catch (error) {
                console.error('保存缓存失败:', error);
            }
        }, DEBOUNCE_DELAY),
        []
    );

    // 从 AsyncStorage 加载缓存
    const loadCacheFromStorage = async () => {
        try {
            const cached = await AsyncStorage.getItem(STORAGE_KEY);
            if (cached) {
                const parsedCache = JSON.parse(cached);
                console.log('📦 从存储中恢复缓存:', Object.keys(parsedCache));
                return parsedCache;
            }
            return {};
        } catch (error) {
            console.error('加载缓存失败:', error);
            return {};
        }
    };

    // 保存分类到 AsyncStorage
    const saveCategoriesToStorage = async (cats) => {
        try {
            await AsyncStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(cats));
        } catch (error) {
            console.error('保存分类失败:', error);
        }
    };

    // 从 AsyncStorage 加载分类
    const loadCategoriesFromStorage = async () => {
        try {
            const cached = await AsyncStorage.getItem(CATEGORIES_STORAGE_KEY);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.error('加载分类失败:', error);
            return null;
        }
    };

    // 保存 token 到 AsyncStorage (带时间戳)
    const saveTokenToStorage = async (token) => {
        try {
            const tokenData = {
                token,
                timestamp: Date.now()
            };
            await AsyncStorage.setItem(ACCESS_TOKEN_KEY, JSON.stringify(tokenData));
        } catch (error) {
            console.error('保存token失败:', error);
        }
    };

    // 从 AsyncStorage 加载 token (检查过期)
    const loadTokenFromStorage = async () => {
        try {
            const cached = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
            if (cached) {
                const { token, timestamp } = JSON.parse(cached);
                // 检查 token 是否过期 (同样使用 20 分钟有效期)
                if (Date.now() - timestamp < CACHE_EXPIRY_MS) {
                    return token;
                }
                console.log('⏰ Token 已过期');
            }
            return null;
        } catch (error) {
            console.error('加载token失败:', error);
            return null;
        }
    };

    // ========== 缓存过期检查 ==========

    // 检查缓存项是否过期
    const isCacheExpired = (timestamp) => {
        if (!timestamp) return true;
        return Date.now() - timestamp > CACHE_EXPIRY_MS;
    };

    // 获取所有过期的缓存键
    const getExpiredKeys = (cache) => {
        return Object.keys(cache).filter(key => {
            const cacheEntry = cache[key];
            return cacheEntry.timestamp && isCacheExpired(cacheEntry.timestamp);
        });
    };

    // ========== 飞书API方法 ==========

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

            if (data.tenant_access_token) {
                console.log('✅ 获取到 tenant_access_token');
                setAccessToken(data.tenant_access_token);
                await saveTokenToStorage(data.tenant_access_token);
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

            if (response.ok && data.data && data.data.items) {
                const formattedCategories = data.data.items.map(item => ({
                    id: item.fields.id?.[0]?.text || '',
                    icon: item.fields.icon?.[0]?.text || '',
                    name: item.fields.活动类别?.[0]?.text || '',
                    record_id: item.record_id,
                    isShow: item.fields.是否展示 || '是'
                }));

                console.log('✅ 分类数据获取成功');
                setCategories(formattedCategories);
                await saveCategoriesToStorage(formattedCategories);
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
        debugger
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

                if (recordsData.data && recordsData.data.items) {
                    const convertedData = convertToActivityData(recordsData.data.items, categoriesList);
                    return convertedData;
                }
            } else {
                console.error(`获取${year}年${month}月数据失败:`, response.status);
            }
        } catch (error) {
            console.error(`获取${year}年${month}月数据时出错:`, error);
        }
        return null; // 失败时返回 null，而不是空对象，避免覆盖缓存
    };

    // 批量获取多个月份的数据（带时间戳）
    const fetchMultipleMonths = async (token, months, categoriesList = []) => {
        setIsLoading(true);
        const newCache = { ...dataCache };

        try {
            const promises = months.map(async ({ year, month }) => {
                const monthKey = getMonthKey(year, month);

                // 检查缓存
                const cachedEntry = newCache[monthKey];
                if (cachedEntry && cachedEntry.data && !isCacheExpired(cachedEntry.timestamp)) {
                    console.log(`✅ 缓存命中且未过期: ${monthKey}`);
                    return { monthKey, data: cachedEntry.data, timestamp: cachedEntry.timestamp };
                }

                if (cachedEntry && cachedEntry.data && isCacheExpired(cachedEntry.timestamp)) {
                    console.log(`⏰ 缓存过期，刷新: ${monthKey}`);
                } else {
                    console.log(`📡 正在获取: ${monthKey}`);
                }

                const data = await getBitableRecords(token, year, month, categoriesList);
                return { monthKey, data, timestamp: Date.now() };
            });

            const results = await Promise.all(promises);

            // 更新缓存（带时间戳）
            results.forEach(({ monthKey, data, timestamp }) => {
                if (data) {
                    newCache[monthKey] = {
                        data,
                        timestamp
                    };
                } else {
                    console.warn(`⚠️ ${monthKey} 数据获取失败，跳过缓存更新`);
                }
            });

            setDataCache(newCache);
            console.log('✅ 全局数据缓存已更新');

        } catch (error) {
            console.error('批量获取数据时出错:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // 初始化数据（带持久化和过期检查）
    const initializeData = async (year, month) => {
        if (isInitialized.current) {
            console.log('数据已初始化，跳过重复初始化');
            return;
        }

        console.log('🚀 全局数据初始化开始...');
        isInitialized.current = true;

        try {
            // 1. 先加载持久化缓存
            const cachedData = await loadCacheFromStorage();
            const cachedCategories = await loadCategoriesFromStorage();
            const cachedToken = await loadTokenFromStorage();

            if (Object.keys(cachedData).length > 0) {
                setDataCache(cachedData);
            }

            if (cachedCategories) {
                setCategories(cachedCategories);
            }

            if (cachedToken) {
                setAccessToken(cachedToken);
            }

            // 2. 获取新的 token 和分类（如果需要）
            const token = cachedToken || await getTenantAccessToken();
            if (!token) {
                console.error('初始化失败：无法获取访问令牌');
                isInitialized.current = false;
                return;
            }

            const categoriesList = cachedCategories || await fetchCategories(token);

            // 3. 检查过期数据
            const expiredKeys = getExpiredKeys(cachedData);
            if (expiredKeys.length > 0) {
                console.log('⏰ 发现过期数据:', expiredKeys);
            }

            // 4. 获取当前需要的月份
            const months = getMonthRange(year, month, 3);
            const missingMonths = months.filter(({ year: y, month: m }) => {
                const key = getMonthKey(y, m);
                return !cachedData[key] || !cachedData[key].data;
            });

            // 5. 合并缺失和过期的数据
            const expiredMonths = expiredKeys.map(key => {
                const [y, m] = key.split('-').map(Number);
                return { year: y, month: m };
            });

            const monthsToLoad = [
                ...missingMonths,
                ...expiredMonths.filter(({ year: y, month: m }) => {
                    return !missingMonths.some(missing => missing.year === y && missing.month === m);
                })
            ];

            // 6. 加载缺失和过期的数据
            if (monthsToLoad.length > 0) {
                console.log('📥 需要加载的月份:', monthsToLoad.map(({ year: y, month: m }) => `${y}-${m}`));
                await fetchMultipleMonths(token, monthsToLoad, categoriesList);
            }

            console.log('✅ 全局数据初始化完成');
        } catch (error) {
            console.error('全局数据初始化失败:', error);
            isInitialized.current = false;
        }
    };

    // 从缓存获取月份数据
    const getMonthData = (year, month) => {
        const monthKey = getMonthKey(year, month);
        const cacheEntry = dataCache[monthKey];
        return cacheEntry?.data || {};
    };

    // 强制刷新指定月份数据
    const refreshMonthData = async (year, month) => {
        if (!accessToken) {
            console.error('刷新数据失败: 缺少访问令牌');
            return;
        }

        try {
            console.log(`🔄 刷新${year}年${month}月数据`);
            // setIsLoading(true); // 移除全局loading，避免影响其他页面

            const data = await getBitableRecords(accessToken, year, month, categories);

            if (data) {
                // 更新缓存（带时间戳）
                const monthKey = getMonthKey(year, month);
                const newCache = { ...dataCache };
                newCache[monthKey] = {
                    data,
                    timestamp: Date.now()
                };
                setDataCache(newCache);
                console.log(`✅ ${year}年${month}月数据刷新完成`);
            } else {
                console.error(`❌ ${year}年${month}月数据刷新失败，保留原有缓存`);
            }
        } catch (error) {
            console.error('刷新月份数据时出错:', error);
        } finally {
            // setIsLoading(false);
        }
    };

    // 创建记录后更新缓存
    const updateCacheAfterCreate = (year, month, day, newActivity) => {
        const monthKey = getMonthKey(year, month);
        const newCache = { ...dataCache };

        if (!newCache[monthKey]) {
            newCache[monthKey] = {
                data: {},
                timestamp: Date.now()
            };
        }

        if (!newCache[monthKey].data[day]) {
            newCache[monthKey].data[day] = { icon: [], activities: [] };
        }

        // 添加新活动
        newCache[monthKey].data[day].activities.push(newActivity);

        // 更新图标
        if (newActivity.icon && !newCache[monthKey].data[day].icon.includes(newActivity.icon)) {
            newCache[monthKey].data[day].icon.push(newActivity.icon);
        }

        // 更新时间戳
        newCache[monthKey].timestamp = Date.now();

        setDataCache(newCache);
        console.log('✅ 缓存已更新 - 创建记录');
    };

    // 删除记录后更新缓存
    const updateCacheAfterDelete = (year, month, day, recordId) => {
        const monthKey = getMonthKey(year, month);
        const newCache = { ...dataCache };

        if (newCache[monthKey]?.data?.[day]) {
            // 删除活动
            newCache[monthKey].data[day].activities = newCache[monthKey].data[day].activities.filter(
                activity => activity.id !== recordId
            );

            // 重新计算图标
            const remainingIcons = [...new Set(
                newCache[monthKey].data[day].activities.map(activity => activity.icon).filter(Boolean)
            )];
            newCache[monthKey].data[day].icon = remainingIcons;

            // 如果该日期没有活动了，删除该日期
            if (newCache[monthKey].data[day].activities.length === 0) {
                delete newCache[monthKey].data[day];
            }

            // 更新时间戳
            newCache[monthKey].timestamp = Date.now();

            setDataCache(newCache);
            console.log('✅ 缓存已更新 - 删除记录');
        }
    };

    // 更新记录后更新缓存
    const updateCacheAfterUpdate = (year, month, day, recordId, updatedActivity) => {
        const monthKey = getMonthKey(year, month);
        const newCache = { ...dataCache };

        if (newCache[monthKey]?.data?.[day]) {
            // 更新活动
            const activityIndex = newCache[monthKey].data[day].activities.findIndex(
                activity => activity.id === recordId
            );

            if (activityIndex !== -1) {
                newCache[monthKey].data[day].activities[activityIndex] = {
                    ...newCache[monthKey].data[day].activities[activityIndex],
                    ...updatedActivity
                };

                // 重新计算图标
                const icons = [...new Set(
                    newCache[monthKey].data[day].activities.map(activity => activity.icon).filter(Boolean)
                )];
                newCache[monthKey].data[day].icon = icons;

                // 更新时间戳
                newCache[monthKey].timestamp = Date.now();

                setDataCache(newCache);
                console.log('✅ 缓存已更新 - 更新记录');
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
        const cacheEntry = dataCache[monthKey];

        if (!cacheEntry || !cacheEntry.data || isCacheExpired(cacheEntry.timestamp)) {
            if (accessToken) {
                console.log(`📥 加载/刷新: ${monthKey}`);
                await fetchMultipleMonths(accessToken, [{ year, month }], categories);
            }
        }
    };

    // 根据备注查找相似分类（增强版）
    const findSimilarCategory = (description) => {
        if (!description || description.length < 2) return null;

        const searchDesc = description.trim().toLowerCase();
        const categoryStats = {};

        // 辅助函数：计算字符串相似度（Jaro-Winkler 简化版）
        const calculateSimilarity = (str1, str2) => {
            const s1 = str1.toLowerCase();
            const s2 = str2.toLowerCase();

            // 完全匹配
            if (s1 === s2) return 1.0;

            // 包含匹配
            if (s1.includes(s2) || s2.includes(s1)) {
                const shorter = s1.length < s2.length ? s1 : s2;
                const longer = s1.length >= s2.length ? s1 : s2;
                return 0.7 + (0.3 * shorter.length / longer.length);
            }

            // 计算公共子串长度
            let maxCommonLength = 0;
            for (let i = 0; i < s1.length; i++) {
                for (let j = 0; j < s2.length; j++) {
                    let k = 0;
                    while (i + k < s1.length && j + k < s2.length && s1[i + k] === s2[j + k]) {
                        k++;
                    }
                    maxCommonLength = Math.max(maxCommonLength, k);
                }
            }

            const avgLength = (s1.length + s2.length) / 2;
            return maxCommonLength / avgLength;
        };

        // 辅助函数：提取关键词（简单分词）
        const extractKeywords = (text) => {
            // 移除标点符号，按空格和常见分隔符分割
            const cleanText = text.toLowerCase().replace(/[，。！？、；：""''（）【】《》]/g, ' ');
            const words = cleanText.split(/\s+/).filter(w => w.length >= 2);
            return words;
        };

        // 提取搜索词的关键词
        const searchKeywords = extractKeywords(searchDesc);

        // 遍历所有缓存数据
        Object.values(dataCache).forEach(monthCache => {
            const monthData = monthCache.data || {};
            Object.values(monthData).forEach(dayData => {
                const activities = dayData.activities || [];
                activities.forEach(activity => {
                    // 跳过没有备注或分类为"其它"/"其他"的记录
                    if (!activity.description || !activity.title) return;
                    if (activity.title === '其它' || activity.title === '其他') return;

                    const actDesc = activity.description.trim();

                    // 计算相似度
                    let similarity = calculateSimilarity(searchDesc, actDesc);

                    // 关键词匹配加分
                    const actKeywords = extractKeywords(actDesc);
                    let keywordMatchCount = 0;
                    searchKeywords.forEach(searchWord => {
                        if (actKeywords.some(actWord =>
                            actWord.includes(searchWord) || searchWord.includes(actWord)
                        )) {
                            keywordMatchCount++;
                        }
                    });

                    // 如果有关键词匹配，提升相似度
                    if (keywordMatchCount > 0 && searchKeywords.length > 0) {
                        const keywordBonus = (keywordMatchCount / searchKeywords.length) * 0.3;
                        similarity = Math.min(1.0, similarity + keywordBonus);
                    }

                    // 只保留相似度超过阈值的记录
                    if (similarity < 0.3) return;

                    // 时间衰减：最近的记录权重更高
                    let timeWeight = 1.0;
                    if (activity.fields?.日期) {
                        const daysSinceActivity = (Date.now() - activity.fields.日期) / (1000 * 60 * 60 * 24);
                        // 30天内的记录保持满权重，之后逐渐衰减
                        if (daysSinceActivity > 30) {
                            timeWeight = Math.max(0.5, 1.0 - (daysSinceActivity - 30) / 365);
                        }
                    }

                    // 计算最终得分
                    const score = similarity * timeWeight;

                    const key = `${activity.icon}|${activity.title}`;
                    if (!categoryStats[key]) {
                        categoryStats[key] = {
                            icon: activity.icon,
                            name: activity.title,
                            totalScore: 0,
                            count: 0,
                            maxSimilarity: 0
                        };
                    }

                    categoryStats[key].totalScore += score;
                    categoryStats[key].count += 1;
                    categoryStats[key].maxSimilarity = Math.max(categoryStats[key].maxSimilarity, similarity);
                });
            });
        });

        // 找出得分最高的分类
        let bestMatch = null;
        let maxScore = 0;

        Object.values(categoryStats).forEach(stat => {
            // 综合得分 = 平均分 * 出现次数的对数 + 最大相似度
            const finalScore = (stat.totalScore / stat.count) * Math.log(stat.count + 1) + stat.maxSimilarity * 0.3;

            if (finalScore > maxScore) {
                maxScore = finalScore;
                bestMatch = {
                    icon: stat.icon,
                    name: stat.name,
                    confidence: Math.min(1.0, finalScore) // 置信度
                };
            }
        });

        // 只返回置信度足够高的结果
        if (bestMatch && bestMatch.confidence >= 0.4) {
            console.log(`🎯 智能推荐: ${bestMatch.name} (置信度: ${(bestMatch.confidence * 100).toFixed(1)}%)`);
            return bestMatch;
        }

        return null;
    };

    // 清除所有缓存（用于设置页面）
    const clearAllCache = async () => {
        try {
            await AsyncStorage.multiRemove([STORAGE_KEY, CATEGORIES_STORAGE_KEY, ACCESS_TOKEN_KEY]);
            setDataCache({});
            setCategories([]);
            setAccessToken(null);
            isInitialized.current = false;
            console.log('🗑️ 所有缓存已清除');
            return { success: true };
        } catch (error) {
            console.error('清除缓存失败:', error);
            return { success: false, error: error.message };
        }
    };

    // 导出数据为 CSV 格式
    const exportDataToCSV = async () => {
        try {
            console.log('🔄 开始导出数据...');

            // CSV 转义函数
            const escapeCSV = (value) => {
                if (value === null || value === undefined) return '';
                const str = String(value);
                // 如果包含逗号、引号或换行符，需要用引号包裹并转义内部引号
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            };

            // CSV 表头
            const headers = ['日期', '类别', '图标', '金额', '备注', '位置'];
            let csvContent = headers.join(',') + '\n';

            // 遍历所有缓存数据
            const allRecords = [];
            Object.entries(dataCache).forEach(([monthKey, monthCache]) => {
                const monthData = monthCache.data || {};
                Object.entries(monthData).forEach(([day, dayData]) => {
                    const activities = dayData.activities || [];
                    activities.forEach(activity => {
                        // 提取日期时间
                        let dateStr = '';
                        if (activity.fields?.日期) {
                            const timestamp = activity.fields.日期;
                            const date = new Date(timestamp);
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            const hour = String(date.getHours()).padStart(2, '0');
                            const minute = String(date.getMinutes()).padStart(2, '0');
                            dateStr = `${year}-${month}-${day} ${hour}:${minute}`;
                        }

                        // 提取位置
                        let location = '';
                        if (activity.fields?.位置 && activity.fields.位置.length > 0) {
                            location = activity.fields.位置[0].text || '';
                        }

                        allRecords.push({
                            date: dateStr,
                            category: activity.title || '',
                            icon: activity.icon || '',
                            amount: activity.amount || 0,
                            description: activity.description || '',
                            location: location
                        });
                    });
                });
            });

            // 按日期排序（最新的在前）
            allRecords.sort((a, b) => {
                if (!a.date) return 1;
                if (!b.date) return -1;
                return new Date(b.date) - new Date(a.date);
            });

            // 生成 CSV 行
            allRecords.forEach(record => {
                const row = [
                    escapeCSV(record.date),
                    escapeCSV(record.category),
                    escapeCSV(record.icon),
                    escapeCSV(record.amount),
                    escapeCSV(record.description),
                    escapeCSV(record.location)
                ];
                csvContent += row.join(',') + '\n';
            });

            // 生成文件名
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const fileName = `活动记录_${timestamp}.csv`;
            const fileUri = FileSystem.documentDirectory + fileName;

            // 写入文件（使用 UTF-8 BOM 确保 Excel 正确识别编码）
            const BOM = '\uFEFF';
            const fullContent = BOM + csvContent;

            // 将字符串转换为 UTF-8 字节数组，然后转为 Base64
            const utf8Bytes = unescape(encodeURIComponent(fullContent));
            let base64 = '';
            for (let i = 0; i < utf8Bytes.length; i++) {
                base64 += String.fromCharCode(utf8Bytes.charCodeAt(i));
            }
            const base64Content = btoa(base64);

            await FileSystem.writeAsStringAsync(fileUri, base64Content, {
                encoding: FileSystem.EncodingType.Base64
            });

            console.log(`✅ CSV 文件已生成: ${fileName}`);
            console.log(`📊 共导出 ${allRecords.length} 条记录`);

            // 分享文件
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri, {
                    mimeType: 'text/csv',
                    dialogTitle: '导出活动记录'
                });
                return { success: true, recordCount: allRecords.length };
            } else {
                return {
                    success: false,
                    error: '当前平台不支持文件分享功能'
                };
            }
        } catch (error) {
            console.error('导出数据失败:', error);
            return { success: false, error: error.message };
        }
    };

    // ========== 副作用：监听变化并保存 ==========

    // 监听缓存变化并保存
    useEffect(() => {
        if (Object.keys(dataCache).length > 0) {
            saveCacheToStorage(dataCache);
        }
    }, [dataCache, saveCacheToStorage]);

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
        clearAllCache,
        findSimilarCategory,
        exportDataToCSV,

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

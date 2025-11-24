import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, ActivityIndicator, RefreshControl, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Svg, Rect, Text as SvgText, Line, Circle } from 'react-native-svg';
import { useFeishuApi } from '../hooks/useFeishuApi';
import { colors, theme, typographyUtils, colorUtils } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const StatsScreen = () => {
  const [year] = useState(new Date().getFullYear());
  const [month] = useState(new Date().getMonth() + 1);
  const { dataCache, getMonthKey, isLoading, refreshMonthDataForDate, preloadYearData, categories } = useFeishuApi(year, month, { autoInitialize: false });
  const [refreshing, setRefreshing] = useState(false);
  const currentMonthKey = getMonthKey(year, month);
  const currentMonthData = dataCache[currentMonthKey] || {};
  const hasData = Object.keys(currentMonthData).length > 0;
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [selectorOpen, setSelectorOpen] = useState(false);

  React.useEffect(() => {
    preloadYearData(year);
  }, [year]);

  React.useEffect(() => {
    if (!isLoading && !initialLoadDone) {
      setInitialLoadDone(true);
    }
  }, [isLoading, initialLoadDone]);

  const parseAmount = (val) => {
    if (val == null) return 0;
    if (typeof val === 'number' && isFinite(val)) return val;
    if (typeof val === 'string') {
      const cleaned = val.replace(/[^\d.-]/g, '');
      const n = Number(cleaned);
      return isNaN(n) ? 0 : n;
    }
    if (Array.isArray(val)) {
      for (let i = 0; i < val.length; i++) {
        const n = parseAmount(val[i]);
        if (n) return n;
      }
      return 0;
    }
    if (typeof val === 'object') {
      if ('value' in val) return parseAmount(val.value);
      return 0;
    }
    return 0;
  };

  const chartData = useMemo(() => {
    const monthKey = getMonthKey(year, month);
    const monthData = dataCache[monthKey] || {};
    const totals = {};
    Object.keys(monthData).forEach((day) => {
      const dayActs = monthData[day]?.activities || [];
      dayActs.forEach((act) => {
        const key = act.title || '未分类';
        const amt = parseAmount(act.amount ?? act.fields?.金额);
        totals[key] = (totals[key] || 0) + amt;
      });
    });
    const items = Object.entries(totals)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
    const max = items.length ? Math.max(...items.map((i) => i.value)) : 0;
    return { items, max };
  }, [dataCache, year, month, getMonthKey]);

  const monthlyMetrics = useMemo(() => {
    const monthKey = getMonthKey(year, month);
    const monthData = dataCache[monthKey] || {};
    let total = 0;
    let daysWithSpend = 0;
    Object.keys(monthData).forEach((day) => {
      const dayActs = monthData[day]?.activities || [];
      let daySum = 0;
      dayActs.forEach((act) => {
        const amt = parseAmount(act.amount ?? act.fields?.金额);
        daySum += amt;
      });
      if (daySum > 0) daysWithSpend += 1;
      total += daySum;
    });
    const daysInMonth = new Date(year, month, 0).getDate();
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === year && (now.getMonth() + 1) === month;
    const daysElapsed = isCurrentMonth ? Math.min(now.getDate(), daysInMonth) : daysInMonth;
    const avg = daysElapsed > 0 ? total / daysElapsed : 0;
    let todaySpend = 0;
    if (isCurrentMonth) {
      const todayActs = monthData[now.getDate()]?.activities || [];
      todaySpend = todayActs.reduce((acc, act) => acc + parseAmount(act.amount ?? act.fields?.金额), 0);
    }
    return { total, avg, daysWithSpend, daysElapsed, todaySpend };
  }, [dataCache, year, month, getMonthKey]);

  const chartWidth = SCREEN_WIDTH - theme.spacing.lg * 2;
  const chartHeight = 220;
  const barWidth = 32;
  const gap = 20;

  const dailyData = useMemo(() => {
    const monthKey = getMonthKey(year, month);
    const monthData = dataCache[monthKey] || {};
    const daysInMonth = new Date(year, month, 0).getDate();
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === year && (now.getMonth() + 1) === month;
    const daysLimit = isCurrentMonth ? Math.min(now.getDate(), daysInMonth) : daysInMonth;
    const points = [];
    for (let d = 1; d <= daysLimit; d++) {
      const acts = monthData[d]?.activities || [];
      let sum = 0;
      acts.forEach((act) => {
        if (selectedCategory === '全部' || act.title.includes(selectedCategory) || selectedCategory.includes(act.title)) {
          sum += parseAmount(act.amount ?? act.fields?.金额);
        }
      });
      points.push({ day: d, value: sum });
    }
    const max = points.length ? Math.max(...points.map((p) => p.value)) : 0;
    return { points, max };
  }, [dataCache, year, month, getMonthKey, selectedCategory]);
  const yearlyData = useMemo(() => {
    const prefix = `${year}-`;
    const monthTotals = Array.from({ length: 12 }, () => 0);
    Object.keys(dataCache).forEach((key) => {
      if (key.startsWith(prefix)) {
        const m = Number(key.split('-')[1]);
        const monthData = dataCache[key] || {};
        let sum = 0;
        Object.keys(monthData).forEach((day) => {
          const acts = monthData[day]?.activities || [];
          acts.forEach((act) => {
            if (selectedCategory === '全部' || act.title.includes(selectedCategory) || selectedCategory.includes(act.title)) {
              sum += parseAmount(act.amount ?? act.fields?.金额);
            }
          });
        });
        monthTotals[m - 1] = sum;
      }
    });
    const points = monthTotals
      .map((v, idx) => ({ month: idx + 1, value: v }))
      .filter((p) => p.value > 0);
    const max = points.length ? Math.max(...points.map((p) => p.value)) : 0;
    return { points, max };
  }, [dataCache, year, selectedCategory]);

  const monthlyCountData = useMemo(() => {
    const prefix = `${year}-`;
    const monthCounts = Array.from({ length: 12 }, () => 0);
    Object.keys(dataCache).forEach((key) => {
      if (key.startsWith(prefix)) {
        const m = Number(key.split('-')[1]);
        const monthData = dataCache[key] || {};
        Object.keys(monthData).forEach((day) => {
          const acts = monthData[day]?.activities || [];
          acts.forEach((act) => {
            if (selectedCategory === '全部' || act.title.includes(selectedCategory) || selectedCategory.includes(act.title)) {
              monthCounts[m - 1] += 1;
            }
          });
        });
      }
    });
    const points = monthCounts
      .map((v, idx) => ({ month: idx + 1, value: v }))
      .filter((p) => p.value > 0);
    const max = points.length ? Math.max(...points.map((p) => p.value)) : 0;
    return { points, max };
  }, [dataCache, year, selectedCategory]);

  const categoryOptions = useMemo(() => {
    const monthKey = getMonthKey(year, month);
    const monthData = dataCache[monthKey] || {};
    const totals = {};
    Object.keys(monthData).forEach((day) => {
      const acts = monthData[day]?.activities || [];
      acts.forEach((act) => {
        const name = act.title || '未分类';
        const amt = parseAmount(act.amount ?? act.fields?.金额);
        totals[name] = (totals[name] || 0) + amt;
      });
    });
    const names = (categories || []).map((c) => c.name);
    const sorted = names.sort((a, b) => (totals[b] || 0) - (totals[a] || 0));
    return ['全部', ...sorted];
  }, [categories, dataCache, year, month, getMonthKey]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {isLoading && !initialLoadDone ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>正在加载数据…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          stickyHeaderIndices={[0]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || (isLoading && initialLoadDone)}
              onRefresh={async () => {
                setRefreshing(true);
                try {
                  await refreshMonthDataForDate(new Date(year, month - 1, 1));
                } finally {
                  setRefreshing(false);
                }
              }}
              tintColor={colors.primary[500]}
              colors={[colors.primary[500]]}
            />
          }
        >
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.title}>统计</Text>
              <View style={styles.selectorRow}>
                <TouchableOpacity style={styles.selectorButton} onPress={() => setSelectorOpen(!selectorOpen)} activeOpacity={0.8}>
                  <Text style={styles.selectorButtonText}>{selectedCategory}</Text>
                  <Text style={styles.selectorButtonCaret}>▾</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          {selectorOpen && (
            <Modal transparent animationType="fade" visible={selectorOpen} onRequestClose={() => setSelectorOpen(false)}>
              <TouchableWithoutFeedback onPress={() => setSelectorOpen(false)}>
                <View style={styles.modalOverlay}>
                  <View style={styles.modalMenu}>
                    {categoryOptions.map((name) => (
                      <TouchableOpacity key={name} style={styles.selectorMenuItem} onPress={() => { setSelectedCategory(name); setSelectorOpen(false); }} activeOpacity={0.8}>
                        <Text style={[styles.selectorMenuText, selectedCategory === name ? styles.selectorMenuTextActive : null]}>{name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          )}
          <View style={styles.metricsCard}>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>当月总花费</Text>
              <Text style={styles.metricValue}>¥{monthlyMetrics.total.toFixed(2)}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>当日花费</Text>
              <Text style={styles.metricValue}>¥{monthlyMetrics.todaySpend.toFixed(2)}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>平均每日花费</Text>
              <Text style={styles.metricValue}>¥{monthlyMetrics.avg.toFixed(2)}</Text>
            </View>
          </View>
          {chartData.items.length === 0 ? (
            <Text style={styles.hint}>暂无数据</Text>
          ) : (
            <View style={styles.chartWrapper}>
              <Svg width={chartWidth} height={chartHeight}>
                {chartData.items.map((item, idx) => {
                  const x = 20 + idx * (barWidth + gap);
                  const h = chartData.max ? Math.max(4, (item.value / chartData.max) * (chartHeight - 40)) : 4;
                  const y = chartHeight - 20 - h;
                  return (
                    <React.Fragment key={item.name}>
                      <Rect x={x} y={y} width={barWidth} height={h} fill={colors.primary[500] || '#5B8FF9'} rx={6} />
                      <SvgText x={x + barWidth / 2} y={chartHeight - 5} fill={colors.app.textPrimary} fontSize={10} textAnchor="middle">
                        {item.name.length > 4 ? item.name.slice(0, 4) + '…' : item.name}
                      </SvgText>
                      <SvgText x={x + barWidth / 2} y={y - 6} fill={colors.app.textPrimary} fontSize={11} textAnchor="middle">
                        {item.value}
                      </SvgText>
                    </React.Fragment>
                  );
                })}
              </Svg>
            </View>
          )}

          <Text style={styles.subTitle}>当月每日走势</Text>
          {dailyData.points.some(p => p.value > 0) ? (
            <View style={styles.chartWrapper}>
              <Svg width={chartWidth} height={chartHeight}>
                {dailyData.points.map((p, idx) => {
                  const usableWidth = chartWidth - 40;
                  const step = usableWidth / Math.max(dailyData.points.length - 1, 1);
                  const x = 20 + idx * step;
                  const y = dailyData.max ? Math.max(4, chartHeight - 20 - (p.value / dailyData.max) * (chartHeight - 40)) : chartHeight - 20;
                  if (idx > 0) {
                    const prev = dailyData.points[idx - 1];
                    const prevX = 20 + (idx - 1) * step;
                    const prevY = dailyData.max ? Math.max(4, chartHeight - 20 - (prev.value / dailyData.max) * (chartHeight - 40)) : chartHeight - 20;
                    return (
                      <React.Fragment key={`dseg-${p.day}`}>
                        <Line x1={prevX} y1={prevY} x2={x} y2={y} stroke={colors.primary[500] || '#5B8FF9'} strokeWidth={2} />
                        <Circle cx={x} cy={y} r={3} fill={colors.primary[500] || '#5B8FF9'} />
                        <SvgText x={x} y={chartHeight - 5} fill={colors.app.textPrimary} fontSize={10} textAnchor="middle">
                          {`${p.day}`}
                        </SvgText>
                        <SvgText x={x} y={y - 6} fill={colors.app.textPrimary} fontSize={10} textAnchor="middle">
                          {Math.round(p.value)}
                        </SvgText>
                      </React.Fragment>
                    );
                  }
                  return (
                    <React.Fragment key={`dpt-${p.day}`}>
                      <Circle cx={x} cy={y} r={3} fill={colors.primary[500] || '#5B8FF9'} />
                      <SvgText x={x} y={chartHeight - 5} fill={colors.app.textPrimary} fontSize={10} textAnchor="middle">
                        {`${p.day}`}
                      </SvgText>
                      <SvgText x={x} y={y - 6} fill={colors.app.textPrimary} fontSize={10} textAnchor="middle">
                        {Math.round(p.value)}
                      </SvgText>
                    </React.Fragment>
                  );
                })}
              </Svg>
            </View>
          ) : (
            <Text style={styles.hint}>当月暂无数据</Text>
          )}

          <Text style={styles.subTitle}>今年月度走势</Text>
          {yearlyData.points.length === 0 ? (
            <Text style={styles.hint}>暂无月份数据</Text>
          ) : (
            <View style={styles.chartWrapper}>
              <Svg width={chartWidth} height={chartHeight}>
                {yearlyData.points.map((p, idx) => {
                  const usableWidth = chartWidth - 40;
                  const step = usableWidth / Math.max(yearlyData.points.length - 1, 1);
                  const x = 20 + idx * step;
                  const y = yearlyData.max ? Math.max(4, chartHeight - 20 - (p.value / yearlyData.max) * (chartHeight - 40)) : chartHeight - 20;
                  if (idx > 0) {
                    const prev = yearlyData.points[idx - 1];
                    const prevX = 20 + (idx - 1) * step;
                    const prevY = yearlyData.max ? Math.max(4, chartHeight - 20 - (prev.value / yearlyData.max) * (chartHeight - 40)) : chartHeight - 20;
                    return (
                      <React.Fragment key={`seg-${p.month}`}>
                        <Line x1={prevX} y1={prevY} x2={x} y2={y} stroke={colors.primary[500] || '#5B8FF9'} strokeWidth={2} />
                        <Circle cx={x} cy={y} r={4} fill={colors.primary[500] || '#5B8FF9'} />
                        <SvgText x={x} y={chartHeight - 5} fill={colors.app.textPrimary} fontSize={10} textAnchor="middle">
                          {`${p.month}月`}
                        </SvgText>
                        <SvgText x={x} y={y - 6} fill={colors.app.textPrimary} fontSize={11} textAnchor="middle">
                          {Math.round(p.value)}
                        </SvgText>
                      </React.Fragment>
                    );
                  }
                  return (
                    <React.Fragment key={`pt-${p.month}`}>
                      <Circle cx={x} cy={y} r={4} fill={colors.primary[500] || '#5B8FF9'} />
                      <SvgText x={x} y={chartHeight - 5} fill={colors.app.textPrimary} fontSize={10} textAnchor="middle">
                        {`${p.month}月`}
                      </SvgText>
                      <SvgText x={x} y={y - 6} fill={colors.app.textPrimary} fontSize={11} textAnchor="middle">
                        {Math.round(p.value)}
                      </SvgText>
                    </React.Fragment>
                  );
                })}
              </Svg>
            </View>
          )}

          <Text style={styles.subTitle}>今年活动次数（月度）</Text>
          {monthlyCountData.points.length === 0 ? (
            <Text style={styles.hint}>暂无月份数据</Text>
          ) : (
            <View style={styles.chartWrapper}>
              <Svg width={chartWidth} height={chartHeight}>
                {monthlyCountData.points.map((p, idx) => {
                  const usableWidth = chartWidth - 40;
                  const step = usableWidth / Math.max(monthlyCountData.points.length, 1);
                  const barW = Math.max(18, step * 0.5);
                  const x = 20 + idx * step + (step - barW) / 2;
                  const h = monthlyCountData.max ? Math.max(4, (p.value / monthlyCountData.max) * (chartHeight - 40)) : 4;
                  const y = chartHeight - 20 - h;
                  return (
                    <React.Fragment key={`cnt-${p.month}`}>
                      <Rect x={x} y={y} width={barW} height={h} fill={colors.primary[400] || '#4ade80'} rx={6} />
                      <SvgText x={x + barW / 2} y={chartHeight - 5} fill={colors.app.textPrimary} fontSize={10} textAnchor="middle">
                        {`${p.month}月`}
                      </SvgText>
                      <SvgText x={x + barW / 2} y={y - 6} fill={colors.app.textPrimary} fontSize={11} textAnchor="middle">
                        {p.value}
                      </SvgText>
                    </React.Fragment>
                  );
                })}
              </Svg>
            </View>
          )}
          <View style={{ height: theme.spacing.xl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.app.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg
  },
  title: {
    ...typographyUtils.getTextStyle('h3', colors.app.textPrimary),
  },
  metricsCard: {
    backgroundColor: colors.app.surface,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  metricLabel: {
    ...typographyUtils.getTextStyle('body', colors.neutral[600]),
  },
  metricValue: {
    ...typographyUtils.getTextStyle('h4', colors.app.textPrimary),
    fontWeight: '600',
  },
  hint: {
    ...typographyUtils.getTextStyle('body', colors.neutral[600]),
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.app.background,
  },
  loadingText: {
    ...typographyUtils.getTextStyle('body', colors.neutral[600]),
    marginTop: theme.spacing.sm,
  },
  chartWrapper: {
    backgroundColor: colors.app.surface,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  subTitle: {
    ...typographyUtils.getTextStyle('h4', colors.app.textPrimary),
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.app.background,
    paddingVertical: theme.spacing.xs,
    zIndex: 10,
    paddingVertical: theme.spacing.md,
  },
  selectorRow: {
    position: 'relative',
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.app.surface,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  selectorButtonText: {
    ...typographyUtils.getTextStyle('caption', colors.app.textPrimary),
  },
  selectorButtonCaret: {
    ...typographyUtils.getTextStyle('caption', colors.neutral[600]),
    marginLeft: theme.spacing.xs,
  },
  selectorMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: colors.app.surface,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    minWidth: 120,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colorUtils.withOpacity(colors.shadow.overlay, 0.2),
  },
  modalMenu: {
    position: 'absolute',
    top: theme.spacing.lg * 2,
    right: theme.spacing.lg,
    backgroundColor: colors.app.surface,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.xs,
    minWidth: 140,
    elevation: 6,
  },
  selectorMenuItem: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  selectorMenuText: {
    ...typographyUtils.getTextStyle('caption', colors.app.textPrimary),
  },
  selectorMenuTextActive: {
    ...typographyUtils.getTextStyle('caption', colors.primary[700]),
    fontWeight: '600',
  },
  filterRow: {
    marginBottom: theme.spacing.sm,
  },
  filterContent: {
    paddingHorizontal: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  filterChip: {
    backgroundColor: colors.app.surface,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    marginRight: theme.spacing.xs,
  },
  filterChipActive: {
    backgroundColor: colors.primary[100],
    borderColor: colors.primary[300],
  },
  filterText: {
    ...typographyUtils.getTextStyle('caption', colors.app.textPrimary),
  },
  filterTextActive: {
    ...typographyUtils.getTextStyle('caption', colors.primary[700]),
    fontWeight: '600',
  },
});

export default StatsScreen;

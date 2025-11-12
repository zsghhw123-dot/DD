import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Svg, Rect, Text as SvgText } from 'react-native-svg';
import { useFeishuApi } from '../hooks/useFeishuApi';
import { colors, theme, typographyUtils } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const StatsScreen = () => {
  const [year] = useState(new Date().getFullYear());
  const [month] = useState(new Date().getMonth() + 1);
  const { dataCache, getMonthKey, isLoading, refreshCurrentMonthData } = useFeishuApi(year, month);
  const [refreshing, setRefreshing] = useState(false);
  const currentMonthKey = getMonthKey(year, month);
  const currentMonthData = dataCache[currentMonthKey] || {};
  const hasData = Object.keys(currentMonthData).length > 0;

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

  return (
    <SafeAreaView style={styles.safeArea}>
      {isLoading && !hasData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>正在加载数据…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || (isLoading && hasData)}
              onRefresh={async () => {
                setRefreshing(true);
                try {
                  await refreshCurrentMonthData();
                } finally {
                  setRefreshing(false);
                }
              }}
              tintColor={colors.primary[500]}
              colors={[colors.primary[500]]}
            />
          }
        >
        <Text style={styles.title}>本月统计</Text>
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
    padding: theme.spacing.lg,
  },
  title: {
    ...typographyUtils.getTextStyle('h3', colors.app.textPrimary),
    marginBottom: theme.spacing.md,
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
});

export default StatsScreen;

import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '../context/SettingsContext';
import { useGlobalData } from '../context/GlobalDataContext';
import { colors, theme, typographyUtils } from '../theme';

const SettingsRow = ({ label, value, onChange }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Switch value={value} onValueChange={onChange} />
  </View>
);

const SettingsScreen = () => {
  const [voiceHint, setVoiceHint] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { showVoiceButton, setShowVoiceButton } = useSettings();
  const { exportDataToCSV } = useGlobalData();

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const result = await exportDataToCSV();

      if (result.success) {
        Alert.alert(
          '导出成功',
          `已导出 ${result.recordCount} 条记录`,
          [{ text: '确定' }]
        );
      } else {
        Alert.alert(
          '导出失败',
          result.error || '导出数据时出现错误',
          [{ text: '确定' }]
        );
      }
    } catch (error) {
      Alert.alert(
        '导出失败',
        '导出数据时出现错误，请重试',
        [{ text: '确定' }]
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>系统配置</Text>
        <View style={styles.card}>
          <SettingsRow label="显示语音按钮" value={showVoiceButton} onChange={setShowVoiceButton} />
          <SettingsRow label="启用语音提示" value={voiceHint} onChange={setVoiceHint} />
          <SettingsRow label="使用深色主题" value={darkMode} onChange={setDarkMode} />
        </View>

        <Text style={styles.sectionTitle}>数据管理</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleExportData}
            disabled={isExporting}
            activeOpacity={0.7}
          >
            {isExporting ? (
              <>
                <ActivityIndicator size="small" color={colors.primary[600]} />
                <Text style={styles.exportButtonText}>导出中...</Text>
              </>
            ) : (
              <>
                <Text style={styles.exportButtonIcon}>📊</Text>
                <View style={styles.exportButtonTextContainer}>
                  <Text style={styles.exportButtonText}>导出为 CSV</Text>
                  <Text style={styles.exportButtonSubtext}>导出所有活动记录</Text>
                </View>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.note}>
          数据将导出为 CSV 格式，可在 Excel 等工具中打开查看。
        </Text>
      </View>
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
  title: {
    ...typographyUtils.getTextStyle('h3', colors.app.textPrimary),
    marginTop: theme.spacing.lg,
    marginLeft: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...typographyUtils.getTextStyle('h3', colors.app.textPrimary),
    marginTop: theme.spacing.xl,
    marginLeft: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  card: {
    backgroundColor: colors.app.surface,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.lg,
    padding: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
  },
  rowLabel: {
    ...typographyUtils.getTextStyle('body', colors.app.textPrimary),
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  exportButtonIcon: {
    fontSize: 24,
  },
  exportButtonTextContainer: {
    flex: 1,
  },
  exportButtonText: {
    ...typographyUtils.getTextStyle('body', colors.app.textPrimary),
    fontWeight: '600',
  },
  exportButtonSubtext: {
    ...typographyUtils.getTextStyle('caption', colors.neutral[600]),
    marginTop: 2,
  },
  note: {
    ...typographyUtils.getTextStyle('caption', colors.neutral[600]),
    marginTop: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
  },
});

export default SettingsScreen;

import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '../context/SettingsContext';
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
  const { showVoiceButton, setShowVoiceButton } = useSettings();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>系统配置</Text>
        <View style={styles.card}>
          <SettingsRow label="显示语音按钮" value={showVoiceButton} onChange={setShowVoiceButton} />
          <SettingsRow label="启用语音提示" value={voiceHint} onChange={setVoiceHint} />
          <SettingsRow label="使用深色主题" value={darkMode} onChange={setDarkMode} />
        </View>
        <Text style={styles.note}>以上开关暂为本地设置占位，后续可接入持久化与主题系统。</Text>
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
  note: {
    ...typographyUtils.getTextStyle('caption', colors.neutral[600]),
    marginTop: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
  },
});

export default SettingsScreen;

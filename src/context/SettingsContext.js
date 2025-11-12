import React, { createContext, useContext, useState } from 'react';

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const [showVoiceButton, setShowVoiceButton] = useState(false);
  const value = { showVoiceButton, setShowVoiceButton };
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => useContext(SettingsContext);


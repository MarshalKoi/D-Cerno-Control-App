import React, { useState, useEffect, useRef } from 'react';
import { ApiService } from '../../services/api';

interface DiscussionSettings {
  maximumNumberOfSpeakers: number;
  microphoneMode: 'directSpeak' | 'request';
  // Direct Speak options
  microphoneActivationType?: 'toggle' | 'push';
  speakerOverrideAllowed?: boolean;
  switchOffAllowed?: boolean;
  // Request mode options
  cancelRequestAllowed?: boolean;
  nextInLineIndication?: boolean;
  // Common options
  ledColorOn?: string;
  ledColorOff?: string;
  ledColorRequest?: string;
}

interface DiscussionModeProps {}

const DiscussionMode: React.FC<DiscussionModeProps> = () => {
  const [lastAppliedSettings, setLastAppliedSettings] = useState<string>('');
  const debounceTimeoutRef = useRef<number | null>(null);
  
  // Settings state
  const [settings, setSettings] = useState<DiscussionSettings>({
    maximumNumberOfSpeakers: 3,
    microphoneMode: 'directSpeak',
    // Direct Speak defaults
    microphoneActivationType: 'toggle',
    speakerOverrideAllowed: false,
    switchOffAllowed: true,
    // Request mode defaults
    cancelRequestAllowed: true,
    nextInLineIndication: true,
    // Common defaults
    ledColorOn: 'green',
    ledColorOff: 'off',
    ledColorRequest: 'green'
  });

  // Auto-apply settings with debounce
  useEffect(() => {
    const currentSettingsString = JSON.stringify(settings);
    
    // Only apply if settings have actually changed
    if (currentSettingsString !== lastAppliedSettings) {
      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      // Set new timeout to apply settings after 300ms
      debounceTimeoutRef.current = setTimeout(() => {
        applySettings();
      }, 300);
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [settings, lastAppliedSettings]);

  const updateSetting = <K extends keyof DiscussionSettings>(
    key: K,
    value: DiscussionSettings[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleModeSelect = (mode: 'directSpeak' | 'request') => {
    updateSetting('microphoneMode', mode);
  };

  const applySettings = async () => {
    try {
      const payload = buildSettingsPayload();
      const success = await ApiService.updateDiscussionSettings(settings.microphoneMode, payload);
      
      if (success) {
        console.log(`Successfully applied ${settings.microphoneMode} mode settings`);
        setLastAppliedSettings(JSON.stringify(settings));
      } else {
        console.error(`Failed to apply ${settings.microphoneMode} mode settings`);
      }
    } catch (error) {
      console.error('Error applying discussion settings:', error);
    }
  };

  const buildSettingsPayload = () => {
    const basePayload = {
      maximumNumberOfSpeakers: settings.maximumNumberOfSpeakers,
      microphoneMode: settings.microphoneMode
    };

    if (settings.microphoneMode === 'directSpeak') {
      return {
        ...basePayload,
        options: {
          microphoneActivationType: settings.microphoneActivationType,
          speakerOverrideAllowed: settings.speakerOverrideAllowed,
          switchOffAllowed: settings.switchOffAllowed,
          ledColorOn: settings.ledColorOn,
          ledColorOff: settings.ledColorOff
        }
      };
    } else {
      return {
        ...basePayload,
        options: {
          switchOffAllowed: settings.switchOffAllowed,
          cancelRequestAllowed: settings.cancelRequestAllowed,
          ledColorOn: settings.ledColorOn,
          ledColorRequest: settings.ledColorRequest,
          ledColorOff: settings.ledColorOff,
          nextInLineIndication: settings.nextInLineIndication
        }
      };
    }
  };

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="discussion-mode-selector">
          <h2>Discussion Mode Settings</h2>
          <p>Configure how participants interact with their microphones</p>
          
          {/* Mode Selection */}
          <div className="mode-buttons-container">
            <button
              className={`mode-button direct-speak ${settings.microphoneMode === 'directSpeak' ? 'active' : ''}`}
              onClick={() => handleModeSelect('directSpeak')}
            >
              <div className="mode-icon">🎤</div>
              <div className="mode-content">
                <h3>Direct Speak</h3>
                <p>Participants can speak directly by controlling their microphone</p>
              </div>
            </button>

            <button
              className={`mode-button request-mode ${settings.microphoneMode === 'request' ? 'active' : ''}`}
              onClick={() => handleModeSelect('request')}
            >
              <div className="mode-icon">✋</div>
              <div className="mode-content">
                <h3>Request Mode</h3>
                <p>Participants must request to speak and wait for approval</p>
              </div>
            </button>
          </div>

          {/* Settings Panel */}
          <div className="settings-panel">
            
            {/* Common Settings */}
            <div className="setting-group">
              <label className="setting-label">
                Maximum Number of Speakers:
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.maximumNumberOfSpeakers}
                  onChange={(e) => updateSetting('maximumNumberOfSpeakers', parseInt(e.target.value))}
                  className="setting-input"
                />
              </label>
            </div>

            {/* Common Delegate Controls */}
            <div className="setting-group">
              <label className="setting-checkbox">
                <input
                  type="checkbox"
                  checked={settings.switchOffAllowed}
                  onChange={(e) => updateSetting('switchOffAllowed', e.target.checked)}
                />
                Allow delegates to switch off their microphone
              </label>
            </div>

            {/* Direct Speak Settings */}
            {settings.microphoneMode === 'directSpeak' && (
              <div className="mode-specific-settings">
                <h4>Direct Speak Options</h4>
                
                <div className="setting-group">
                  <label className="setting-checkbox">
                    <input
                      type="checkbox"
                      checked={settings.speakerOverrideAllowed}
                      onChange={(e) => updateSetting('speakerOverrideAllowed', e.target.checked)}
                    />
                    Override - Allow speaker override
                  </label>
                </div>

                <div className="setting-group">
                  <div className="setting-label">Microphone Activation:</div>
                  <div className="radio-group">
                    <label className="setting-radio">
                      <input
                        type="radio"
                        name="activationType"
                        value="toggle"
                        checked={settings.microphoneActivationType === 'toggle'}
                        onChange={(e) => updateSetting('microphoneActivationType', e.target.value as 'toggle')}
                      />
                      Button toggle activation
                    </label>
                    <label className="setting-radio">
                      <input
                        type="radio"
                        name="activationType"
                        value="push"
                        checked={settings.microphoneActivationType === 'push'}
                        onChange={(e) => updateSetting('microphoneActivationType', e.target.value as 'push')}
                      />
                      Button push activation
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Request Mode Settings */}
            {settings.microphoneMode === 'request' && (
              <div className="mode-specific-settings">
                <h4>Request Mode Options</h4>
                
                <div className="setting-group">
                  <label className="setting-checkbox">
                    <input
                      type="checkbox"
                      checked={settings.cancelRequestAllowed}
                      onChange={(e) => updateSetting('cancelRequestAllowed', e.target.checked)}
                    />
                    Allow delegates to cancel their request
                  </label>
                </div>

                <div className="setting-group">
                  <label className="setting-checkbox">
                    <input
                      type="checkbox"
                      checked={settings.nextInLineIndication}
                      onChange={(e) => updateSetting('nextInLineIndication', e.target.checked)}
                    />
                    Next person to speak indication
                  </label>
                </div>
              </div>
            )}

            {/* LED Color Settings */}
            <div className="setting-group">
              <h4>LED Colors</h4>
              <div className="color-settings">
                <label className="setting-label">
                  LED Color (On):
                  <select
                    value={settings.ledColorOn}
                    onChange={(e) => updateSetting('ledColorOn', e.target.value)}
                    className="setting-select"
                  >
                    <option value="red">Red</option>
                    <option value="green">Green</option>
                    <option value="off">Off</option>
                  </select>
                </label>
                
                {settings.microphoneMode === 'request' && (
                  <label className="setting-label">
                    LED Color (Request):
                    <select
                      value={settings.ledColorRequest}
                      onChange={(e) => updateSetting('ledColorRequest', e.target.value)}
                      className="setting-select"
                    >
                      <option value="red">Red</option>
                      <option value="green">Green</option>
                    </select>
                  </label>
                )}
                
                <label className="setting-label">
                  LED Color (Off):
                  <select
                    value={settings.ledColorOff}
                    onChange={(e) => updateSetting('ledColorOff', e.target.value)}
                    className="setting-select"
                  >
                    <option value="red">Red</option>
                    <option value="green">Green</option>
                    <option value="off">Off</option>
                  </select>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscussionMode;
import { Settings } from "@/types";
import { useState } from "react";
import { Calendar, Check } from "lucide-react";
import { getRememberAuth, setRememberAuth } from "@/utils/localStorage";

interface SettingsDrawerProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
  onClose: () => void;
  isOpen: boolean;
  onConnectGoogleCalendar: () => void;
}

const SettingsDrawer = ({ settings, onSave, onClose, isOpen, onConnectGoogleCalendar }: SettingsDrawerProps) => {
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [rememberAuth, setRememberAuthState] = useState<boolean>(getRememberAuth());

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setLocalSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };
  
  const handleRememberAuthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setRememberAuthState(checked);
    setRememberAuth(checked);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localSettings);
  };

  return (
    <div
      className={`fixed inset-0 z-50 ${isOpen ? 'flex' : 'hidden'} items-center justify-end`}
    >
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="settings-drawer h-full w-full max-w-md overflow-auto relative z-10 dark:bg-sidebar dark:text-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-lumen-lightGray dark:hover:bg-sidebar-accent"
            aria-label="Close settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSave}>
          <div className="space-y-6">
            {/* API Keys */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">API Keys</h3>
              
              <div className="space-y-2">
                <label htmlFor="openaiApiKey" className="block text-sm font-medium">
                  OpenAI API Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="openaiApiKey"
                  name="openaiApiKey"
                  value={localSettings.openaiApiKey}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 dark:bg-sidebar-accent rounded-md"
                  placeholder="sk-..."
                  required
                />
                <p className="text-xs text-lumen-gray">
                  Required for AI responses. Get your API key from{" "}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-lumen-purple underline"
                  >
                    OpenAI
                  </a>
                </p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="elevenlabsApiKey" className="block text-sm font-medium">
                  ElevenLabs API Key (Optional)
                </label>
                <input
                  type="password"
                  id="elevenlabsApiKey"
                  name="elevenlabsApiKey"
                  value={localSettings.elevenlabsApiKey}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 dark:bg-sidebar-accent rounded-md"
                  placeholder="Your ElevenLabs API key"
                />
                <p className="text-xs text-lumen-gray">
                  For higher quality text-to-speech. Get your API key from{" "}
                  <a
                    href="https://elevenlabs.io/app/api-key"
                    target="_blank"
                    rel="noreferrer"
                    className="text-lumen-purple underline"
                  >
                    ElevenLabs
                  </a>
                </p>
              </div>
            </div>
            
            {/* Voice Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Voice Settings</h3>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="voiceActivation"
                  name="voiceActivation"
                  checked={localSettings.voiceActivation}
                  onChange={handleChange}
                  className="h-4 w-4"
                />
                <label htmlFor="voiceActivation" className="text-sm">
                  Enable voice activation ("Lumen" wake word)
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="useElevenlabs"
                  name="useElevenlabs"
                  checked={localSettings.useElevenlabs}
                  onChange={handleChange}
                  className="h-4 w-4"
                  disabled={!localSettings.elevenlabsApiKey}
                />
                <label htmlFor="useElevenlabs" className="text-sm">
                  Use ElevenLabs for text-to-speech
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="useWhisper"
                  name="useWhisper"
                  checked={localSettings.useWhisper}
                  onChange={handleChange}
                  className="h-4 w-4"
                />
                <label htmlFor="useWhisper" className="text-sm">
                  Use Whisper for speech-to-text (Coming soon)
                </label>
              </div>
            </div>
            
            {/* Google Calendar Integration */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Integrations</h3>
              
              <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-lumen-purple" />
                    <span>Google Calendar</span>
                  </div>
                  
                  {localSettings.googleCalendarConnected ? (
                    <div className="flex items-center gap-1 text-green-500 text-sm">
                      <Check size={16} />
                      <span>Connected</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={onConnectGoogleCalendar}
                      className="text-sm bg-lumen-purple hover:bg-lumen-purple/90 text-white px-3 py-1 rounded-md"
                    >
                      Connect
                    </button>
                  )}
                </div>
                
                <p className="text-xs text-lumen-gray mt-2">
                  Connect your Google Calendar to schedule events via voice or text commands.
                </p>
                
                <div className="flex items-center space-x-2 mt-3">
                  <input
                    type="checkbox"
                    id="rememberAuth"
                    checked={rememberAuth}
                    onChange={handleRememberAuthChange}
                    className="h-4 w-4"
                  />
                  <label htmlFor="rememberAuth" className="text-sm">
                    Remember me on this device
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex space-x-4">
            <button
              type="submit"
              className="bg-lumen-purple hover:bg-lumen-purple/90 text-white py-2 px-4 rounded-md"
            >
              Save Settings
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-lumen-lightGray hover:bg-lumen-gray/20 text-lumen-dark dark:bg-sidebar-accent dark:text-white py-2 px-4 rounded-md"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsDrawer;

import { useEffect, useState } from 'react';

// Shows an "Install app" button when the browser offers to install PulseCity
// to the home screen (Chrome on Android and desktop). Hidden once installed.
export default function InstallButton() {
  const [promptEvent, setPromptEvent] = useState(null);

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setPromptEvent(e);
    };
    const onInstalled = () => setPromptEvent(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!promptEvent) return null;

  const install = async () => {
    promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  };

  return (
    <button type="button" className="install-btn" onClick={install}>
      📲 Install PulseCity on this device
    </button>
  );
}

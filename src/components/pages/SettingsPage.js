import React, { useState } from 'react';

const SettingsPage = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [notifications, setNotifications] = useState(false);

    const handleSave = () => {
        // Save settings logic here
        console.log('Settings saved:', { username, email, notifications });
    };

    return (
        <div className="settings-page">
            <h2>Settings</h2>
            <div className="settings-item">
                <label>Username:</label>
                <input 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                />
            </div>
            <div className="settings-item">
                <label>Email:</label>
                <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                />
            </div>
            <div className="settings-item">
                <label>
                    <input 
                        type="checkbox" 
                        checked={notifications} 
                        onChange={(e) => setNotifications(e.target.checked)} 
                    />
                    Enable Notifications
                </label>
            </div>
            <button onClick={handleSave}>Save Settings</button>
        </div>
    );
};

export default SettingsPage;

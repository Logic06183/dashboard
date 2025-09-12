/**
 * NotificationSettings.js
 * Component for configuring daily stock notifications
 */

import React, { useState, useEffect } from 'react';
import DailyNotificationService from '../services/DailyNotificationService';

const NotificationSettings = () => {
  const [config, setConfig] = useState({
    managerEmail: 'craigparker6@gmail.com',
    enabled: true,
    notificationTime: { hour: 22, minute: 0 }
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saved, setSaved] = useState(false);

  // Load current configuration
  useEffect(() => {
    const savedConfig = localStorage.getItem('dailyNotificationConfig');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig({
          managerEmail: parsed.managerEmail || 'craigparker6@gmail.com',
          enabled: parsed.enabled !== undefined ? parsed.enabled : true,
          notificationTime: parsed.notificationTime || { hour: 22, minute: 0 }
        });
      } catch (error) {
        console.warn('Error loading notification config:', error);
      }
    }
  }, []);

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
    setSaved(false);
  };

  const handleTimeChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      notificationTime: {
        ...prev.notificationTime,
        [field]: parseInt(value)
      }
    }));
    setSaved(false);
  };

  const handleSave = () => {
    DailyNotificationService.configure(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const result = await DailyNotificationService.testNotification();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message
      });
    } finally {
      setTesting(false);
    }
  };

  const formatTime = (hour, minute) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const getNotificationHistory = () => {
    return DailyNotificationService.getNotificationHistory().slice(-5); // Last 5 notifications
  };

  const history = getNotificationHistory();

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Daily Stock Notifications</h3>
        <p className="text-gray-600 text-sm">
          Configure automatic daily notifications for stock levels and usage reports.
        </p>
      </div>

      <div className="space-y-6">
        {/* Enable/Disable Notifications */}
        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => handleConfigChange('enabled', e.target.checked)}
              className="mr-3 rounded"
            />
            <span className="font-medium">Enable Daily Notifications</span>
          </label>
        </div>

        {/* Manager Email */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Manager Email Address
          </label>
          <input
            type="email"
            value={config.managerEmail}
            onChange={(e) => handleConfigChange('managerEmail', e.target.value)}
            placeholder="craigparker6@gmail.com"
            disabled={!config.enabled}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:opacity-60"
          />
          <p className="text-xs text-gray-500 mt-1">
            This email will receive daily stock reports and low stock alerts.
          </p>
        </div>

        {/* Notification Time */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Notification Time (SAST)
          </label>
          <div className="flex items-center space-x-2">
            <select
              value={config.notificationTime.hour}
              onChange={(e) => handleTimeChange('hour', e.target.value)}
              disabled={!config.enabled}
              className="px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:opacity-60"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {i.toString().padStart(2, '0')}
                </option>
              ))}
            </select>
            <span className="text-gray-500">:</span>
            <select
              value={config.notificationTime.minute}
              onChange={(e) => handleTimeChange('minute', e.target.value)}
              disabled={!config.enabled}
              className="px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:opacity-60"
            >
              {['00', '15', '30', '45'].map(minute => (
                <option key={minute} value={parseInt(minute)}>
                  {minute}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Daily notifications will be sent at {formatTime(config.notificationTime.hour, config.notificationTime.minute)} SAST
          </p>
        </div>

        {/* What Gets Sent */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">What's included in daily reports:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Current stock levels and usage summary</li>
            <li>• Low stock alerts with specific amounts needed</li>
            <li>• Critical out-of-stock items requiring immediate attention</li>
            <li>• Daily order statistics (pizzas made, drinks served)</li>
            <li>• Top used ingredients and cost estimates</li>
            <li>• Efficiency score and stock value changes</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              {saved ? '✓ Saved!' : 'Save Settings'}
            </button>
            <button
              onClick={handleTest}
              disabled={testing || !config.enabled}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {testing ? 'Sending Test...' : 'Send Test Email'}
            </button>
          </div>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`p-3 rounded ${testResult.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'} border`}>
            {testResult.success ? (
              <div>
                <p className="font-medium">✓ Test notification sent successfully!</p>
                <p className="text-sm mt-1">Check {config.managerEmail} for the test email.</p>
                {testResult.testData && (
                  <p className="text-sm mt-1">
                    Test included {testResult.testData.itemsCount} low stock alerts.
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="font-medium">✗ Test notification failed</p>
                <p className="text-sm mt-1">{testResult.error}</p>
                <p className="text-sm mt-1">Check your email configuration in environment variables.</p>
              </div>
            )}
          </div>
        )}

        {/* Recent Notifications History */}
        {history.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Recent Notifications</h4>
            <div className="space-y-2">
              {history.map((log, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded text-sm">
                  <div>
                    <span className="font-medium">
                      {new Date(log.timestamp).toLocaleDateString('en-ZA')} at {new Date(log.timestamp).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-gray-600 ml-2">
                      to {log.recipient}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {log.hasAlerts && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        {log.criticalCount + log.lowStockCount} alerts
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded ${log.emailSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {log.emailSuccess ? 'Sent' : 'Failed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Setup Instructions:</h4>
          <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
            <li>Configure your EmailJS account with service and template IDs</li>
            <li>Set environment variables: REACT_APP_EMAILJS_PUBLIC_KEY, REACT_APP_EMAILJS_SERVICE_ID</li>
            <li>Enable notifications and set the manager email above</li>
            <li>Notifications are automatically sent during end-of-day processing</li>
            <li>Use "Send Test Email" to verify everything works</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
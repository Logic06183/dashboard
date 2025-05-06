import React, { useState } from 'react';

const SettingsPage = () => {
    const [settings, setSettings] = useState({
        restaurantName: "John Dough's",
        address: '',
        phone: '',
        email: '',
        notifications: {
            newOrders: true,
            urgentOrders: true,
            completedOrders: false
        },
        orderSettings: {
            maxPrepTime: 30,
            defaultUrgency: 20,
            autoAcceptOrders: false
        },
        theme: {
            darkMode: true,
            colorScheme: 'yellow'
        }
    });

    const handleSettingChange = (category, setting, value) => {
        setSettings(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [setting]: value
            }
        }));
    };

    const handleBasicInfoChange = (field, value) => {
        setSettings(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = () => {
        localStorage.setItem('pizzaShopSettings', JSON.stringify(settings));
        // Show success message
    };

    return (
        <div className="p-8">
            <h2 className="text-2xl font-bold text-primary mb-6">Settings</h2>
            
            {/* Basic Information */}
            <div className="bg-secondary rounded-xl shadow-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-primary mb-4">Restaurant Information</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-primary mb-1">Restaurant Name</label>
                        <input 
                            type="text"
                            className="w-full rounded-md bg-secondary-light border-secondary-light text-gray-200 focus:border-primary focus:ring-primary"
                            value={settings.restaurantName}
                            onChange={(e) => handleBasicInfoChange('restaurantName', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-primary mb-1">Address</label>
                        <input 
                            type="text"
                            className="w-full rounded-md bg-secondary-light border-secondary-light text-gray-200 focus:border-primary focus:ring-primary"
                            value={settings.address}
                            onChange={(e) => handleBasicInfoChange('address', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-primary mb-1">Phone</label>
                        <input 
                            type="tel"
                            className="w-full rounded-md bg-secondary-light border-secondary-light text-gray-200 focus:border-primary focus:ring-primary"
                            value={settings.phone}
                            onChange={(e) => handleBasicInfoChange('phone', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-primary mb-1">Email</label>
                        <input 
                            type="email"
                            className="w-full rounded-md bg-secondary-light border-secondary-light text-gray-200 focus:border-primary focus:ring-primary"
                            value={settings.email}
                            onChange={(e) => handleBasicInfoChange('email', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Notifications */}
            <div className="bg-secondary rounded-xl shadow-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-primary mb-4">Notifications</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-primary">New Orders</label>
                        <div className="relative inline-block w-12 mr-2 align-middle select-none">
                            <input 
                                type="checkbox"
                                checked={settings.notifications.newOrders}
                                onChange={(e) => handleSettingChange('notifications', 'newOrders', e.target.checked)}
                                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                            />
                            <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-primary">Urgent Orders</label>
                        <div className="relative inline-block w-12 mr-2 align-middle select-none">
                            <input 
                                type="checkbox"
                                checked={settings.notifications.urgentOrders}
                                onChange={(e) => handleSettingChange('notifications', 'urgentOrders', e.target.checked)}
                                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                            />
                            <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-primary">Completed Orders</label>
                        <div className="relative inline-block w-12 mr-2 align-middle select-none">
                            <input 
                                type="checkbox"
                                checked={settings.notifications.completedOrders}
                                onChange={(e) => handleSettingChange('notifications', 'completedOrders', e.target.checked)}
                                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                            />
                            <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Settings */}
            <div className="bg-secondary rounded-xl shadow-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-primary mb-4">Order Settings</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-primary mb-1">Maximum Preparation Time (minutes)</label>
                        <input 
                            type="number"
                            min="10"
                            max="60"
                            className="w-full rounded-md bg-secondary-light border-secondary-light text-gray-200 focus:border-primary focus:ring-primary"
                            value={settings.orderSettings.maxPrepTime}
                            onChange={(e) => handleSettingChange('orderSettings', 'maxPrepTime', parseInt(e.target.value))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-primary mb-1">Default Order Urgency (minutes)</label>
                        <select
                            className="w-full rounded-md bg-secondary-light border-secondary-light text-gray-200 focus:border-primary focus:ring-primary"
                            value={settings.orderSettings.defaultUrgency}
                            onChange={(e) => handleSettingChange('orderSettings', 'defaultUrgency', parseInt(e.target.value))}
                        >
                            <option value={10}>10 minutes</option>
                            <option value={15}>15 minutes</option>
                            <option value={20}>20 minutes</option>
                            <option value={30}>30 minutes</option>
                        </select>
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-primary">Auto-accept New Orders</label>
                        <div className="relative inline-block w-12 mr-2 align-middle select-none">
                            <input 
                                type="checkbox"
                                checked={settings.orderSettings.autoAcceptOrders}
                                onChange={(e) => handleSettingChange('orderSettings', 'autoAcceptOrders', e.target.checked)}
                                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                            />
                            <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-primary text-secondary-dark font-medium rounded-lg hover:bg-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                    Save Settings
                </button>
            </div>
        </div>
    );
};

export default SettingsPage;

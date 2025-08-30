import React, { useState, useEffect } from 'react';
import useQueueCalculator from '../../hooks/useQueueCalculator';
import kitchenSettingsService from '../../services/kitchenSettingsService';

const SettingsPage = () => {
    const { 
        queueData, 
        updateSettings, 
        getPresets, 
        applyPreset, 
        formatTimeEstimate,
        isRushMode 
    } = useQueueCalculator();
    
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

    const [kitchenSettings, setKitchenSettings] = useState({
        basePrepTimePerPizza: 10,
        pizzaCapacity: 3,
        fridayRushMode: false,
        rushMultiplier: 1.5
    });

    // Load kitchen settings on component mount
    useEffect(() => {
        const loadedSettings = kitchenSettingsService.getSettings();
        setKitchenSettings(loadedSettings);
    }, []);

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

    const handleKitchenSettingChange = (setting, value) => {
        setKitchenSettings(prev => ({
            ...prev,
            [setting]: value
        }));
    };

    const handleSave = () => {
        localStorage.setItem('pizzaShopSettings', JSON.stringify(settings));
        // Show success message
    };

    const handleKitchenSave = async () => {
        try {
            await updateSettings(kitchenSettings);
            alert('Kitchen settings saved successfully!');
        } catch (error) {
            console.error('Error saving kitchen settings:', error);
            alert('Error saving kitchen settings');
        }
    };

    const handlePresetApply = async (presetName) => {
        try {
            await applyPreset(presetName);
            const updatedSettings = kitchenSettingsService.getSettings();
            setKitchenSettings(updatedSettings);
            alert(`Applied ${presetName} preset successfully!`);
        } catch (error) {
            console.error('Error applying preset:', error);
            alert('Error applying preset');
        }
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

            {/* Kitchen Queue Settings */}
            <div className="bg-secondary rounded-xl shadow-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-primary mb-4">Kitchen Queue Settings</h3>
                
                {/* Live Preview */}
                {queueData && (
                    <div className="bg-secondary-light rounded-lg p-4 mb-6">
                        <h4 className="text-md font-medium text-primary mb-3">Live Queue Status</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary">{queueData.totalPizzasInQueue}</div>
                                <div className="text-gray-400">Pizzas in Queue</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary">{queueData.activeOrdersCount}</div>
                                <div className="text-gray-400">Active Orders</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary">{formatTimeEstimate(queueData.estimatedWaitTime)}</div>
                                <div className="text-gray-400">Est. Wait Time</div>
                            </div>
                        </div>
                        {isRushMode && (
                            <div className="mt-3 p-2 bg-orange-100 text-orange-800 rounded text-center text-sm font-medium">
                                🔥 Friday Rush Mode Active (1.5x multiplier)
                            </div>
                        )}
                    </div>
                )}

                {/* Kitchen Configuration */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-primary mb-1">
                            Base Prep Time per Pizza (minutes)
                        </label>
                        <input 
                            type="number"
                            min="5"
                            max="30"
                            className="w-full rounded-md bg-secondary-light border-secondary-light text-gray-200 focus:border-primary focus:ring-primary"
                            value={kitchenSettings.basePrepTimePerPizza}
                            onChange={(e) => handleKitchenSettingChange('basePrepTimePerPizza', parseInt(e.target.value))}
                        />
                        <p className="text-xs text-gray-400 mt-1">Time to prepare one pizza (5-30 minutes)</p>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-primary mb-1">
                            Pizza Capacity (simultaneous pizzas)
                        </label>
                        <input 
                            type="number"
                            min="1"
                            max="10"
                            className="w-full rounded-md bg-secondary-light border-secondary-light text-gray-200 focus:border-primary focus:ring-primary"
                            value={kitchenSettings.pizzaCapacity}
                            onChange={(e) => handleKitchenSettingChange('pizzaCapacity', parseInt(e.target.value))}
                        />
                        <p className="text-xs text-gray-400 mt-1">How many pizzas can be made simultaneously (1-10)</p>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-primary">Friday Rush Mode</label>
                            <p className="text-xs text-gray-400">Applies 1.5x multiplier for busy periods</p>
                        </div>
                        <div className="relative inline-block w-12 mr-2 align-middle select-none">
                            <input 
                                type="checkbox"
                                checked={kitchenSettings.fridayRushMode}
                                onChange={(e) => handleKitchenSettingChange('fridayRushMode', e.target.checked)}
                                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                            />
                            <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                        </div>
                    </div>
                </div>

                {/* Quick Presets */}
                <div className="mt-6">
                    <h4 className="text-md font-medium text-primary mb-3">Quick Presets</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(getPresets()).map(([key, preset]) => (
                            <button
                                key={key}
                                onClick={() => handlePresetApply(key)}
                                className="p-3 text-left bg-secondary-light rounded-lg hover:bg-gray-600 transition-colors border border-gray-600"
                            >
                                <div className="font-medium text-primary text-sm">{preset.name}</div>
                                <div className="text-xs text-gray-400 mt-1">{preset.description}</div>
                                <div className="text-xs text-gray-300 mt-2">
                                    {preset.basePrepTimePerPizza}min/pizza • {preset.pizzaCapacity} capacity
                                    {preset.fridayRushMode && ' • Rush Mode'}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Kitchen Settings Save Button */}
                <div className="flex justify-end mt-6">
                    <button
                        onClick={handleKitchenSave}
                        className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                        Save Kitchen Settings
                    </button>
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

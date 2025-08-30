/**
 * Kitchen Settings Service
 * Handles persistence and management of kitchen configuration settings
 */

const KITCHEN_SETTINGS_KEY = 'kitchenQueueSettings';

class KitchenSettingsService {
  constructor() {
    this.defaultSettings = {
      basePrepTimePerPizza: 10, // minutes
      pizzaCapacity: 3, // simultaneous pizzas
      fridayRushMode: false, // 1.5x multiplier
      rushMultiplier: 1.5,
      // Additional settings for future use
      autoUpdateEstimates: true,
      showQueueInKitchen: true,
      alertThreshold: 60 // minutes - alert when queue exceeds this time
    };
  }

  /**
   * Get current kitchen settings
   * @returns {Object} Current settings merged with defaults
   */
  getSettings() {
    try {
      const savedSettings = localStorage.getItem(KITCHEN_SETTINGS_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        return { ...this.defaultSettings, ...parsed };
      }
    } catch (error) {
      console.error('[KITCHEN SETTINGS] Error loading settings:', error);
    }
    
    return { ...this.defaultSettings };
  }

  /**
   * Save kitchen settings
   * @param {Object} newSettings - Settings to save
   * @returns {Object} Updated settings
   */
  saveSettings(newSettings) {
    try {
      const currentSettings = this.getSettings();
      const updatedSettings = { ...currentSettings, ...newSettings };
      
      localStorage.setItem(KITCHEN_SETTINGS_KEY, JSON.stringify(updatedSettings));
      console.log('[KITCHEN SETTINGS] Settings saved:', updatedSettings);
      
      return updatedSettings;
    } catch (error) {
      console.error('[KITCHEN SETTINGS] Error saving settings:', error);
      throw error;
    }
  }

  /**
   * Reset settings to defaults
   * @returns {Object} Default settings
   */
  resetToDefaults() {
    try {
      localStorage.setItem(KITCHEN_SETTINGS_KEY, JSON.stringify(this.defaultSettings));
      console.log('[KITCHEN SETTINGS] Settings reset to defaults');
      return { ...this.defaultSettings };
    } catch (error) {
      console.error('[KITCHEN SETTINGS] Error resetting settings:', error);
      throw error;
    }
  }

  /**
   * Get predefined presets for different staffing scenarios
   * @returns {Object} Available presets
   */
  getPresets() {
    return {
      minimal: {
        name: 'Minimal Staff (1 cook)',
        description: 'Single cook handling all orders',
        basePrepTimePerPizza: 15,
        pizzaCapacity: 2,
        fridayRushMode: false
      },
      normal: {
        name: 'Normal Staff (2 cooks)',
        description: 'Standard staffing level',
        basePrepTimePerPizza: 10,
        pizzaCapacity: 3,
        fridayRushMode: false
      },
      busy: {
        name: 'Busy Period (3+ cooks)',
        description: 'Full staff during peak hours',
        basePrepTimePerPizza: 8,
        pizzaCapacity: 5,
        fridayRushMode: false
      },
      rush: {
        name: 'Friday Rush (3+ cooks)',
        description: 'Full staff with rush multiplier',
        basePrepTimePerPizza: 10,
        pizzaCapacity: 3,
        fridayRushMode: true
      }
    };
  }

  /**
   * Apply a preset configuration
   * @param {string} presetName - Name of the preset to apply
   * @returns {Object} Updated settings
   */
  applyPreset(presetName) {
    const presets = this.getPresets();
    const preset = presets[presetName];
    
    if (!preset) {
      throw new Error(`Preset '${presetName}' not found`);
    }

    const presetSettings = {
      basePrepTimePerPizza: preset.basePrepTimePerPizza,
      pizzaCapacity: preset.pizzaCapacity,
      fridayRushMode: preset.fridayRushMode
    };

    return this.saveSettings(presetSettings);
  }

  /**
   * Calculate if current time is Friday (for automatic rush mode detection)
   * @returns {boolean} Whether it's currently Friday in SAST
   */
  isFridayInSAST() {
    const now = new Date();
    // Convert to SAST (UTC+2)
    const sastTime = new Date(now.getTime() + (2 * 60 * 60 * 1000));
    return sastTime.getDay() === 5; // Friday = 5
  }

  /**
   * Get effective settings (considering auto rush mode for Fridays)
   * @returns {Object} Settings with automatic Friday rush applied if needed
   */
  getEffectiveSettings() {
    const settings = this.getSettings();
    
    // Auto-enable Friday rush mode if it's Friday and not manually disabled
    if (this.isFridayInSAST() && settings.autoFridayRush !== false) {
      return {
        ...settings,
        fridayRushMode: true
      };
    }
    
    return settings;
  }

  /**
   * Validate settings values
   * @param {Object} settings - Settings to validate
   * @returns {Object} Validated and sanitized settings
   */
  validateSettings(settings) {
    const validated = {};
    
    // Validate base prep time (5-30 minutes)
    if (typeof settings.basePrepTimePerPizza === 'number') {
      validated.basePrepTimePerPizza = Math.max(5, Math.min(30, settings.basePrepTimePerPizza));
    }
    
    // Validate pizza capacity (1-10 pizzas)
    if (typeof settings.pizzaCapacity === 'number') {
      validated.pizzaCapacity = Math.max(1, Math.min(10, settings.pizzaCapacity));
    }
    
    // Validate boolean settings
    if (typeof settings.fridayRushMode === 'boolean') {
      validated.fridayRushMode = settings.fridayRushMode;
    }
    
    if (typeof settings.autoUpdateEstimates === 'boolean') {
      validated.autoUpdateEstimates = settings.autoUpdateEstimates;
    }
    
    if (typeof settings.showQueueInKitchen === 'boolean') {
      validated.showQueueInKitchen = settings.showQueueInKitchen;
    }
    
    // Validate rush multiplier (1.0-3.0)
    if (typeof settings.rushMultiplier === 'number') {
      validated.rushMultiplier = Math.max(1.0, Math.min(3.0, settings.rushMultiplier));
    }
    
    // Validate alert threshold (15-180 minutes)
    if (typeof settings.alertThreshold === 'number') {
      validated.alertThreshold = Math.max(15, Math.min(180, settings.alertThreshold));
    }
    
    return validated;
  }

  /**
   * Update settings with validation
   * @param {Object} newSettings - New settings to apply
   * @returns {Object} Updated and validated settings
   */
  updateSettings(newSettings) {
    const validatedSettings = this.validateSettings(newSettings);
    return this.saveSettings(validatedSettings);
  }
}

// Create singleton instance
const kitchenSettingsService = new KitchenSettingsService();

export default kitchenSettingsService;
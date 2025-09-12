/**
 * EmailTestComponent.js
 * Component to test EmailJS configuration with Craig's actual keys
 */

import React, { useState } from 'react';
import emailjs from '@emailjs/browser';

const EmailTestComponent = () => {
  const [testStatus, setTestStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Craig's EmailJS credentials from the screenshot
  const emailConfig = {
    publicKey: process.env.REACT_APP_EMAILJS_PUBLIC_KEY || 'IzxQHabdq_CzfAHbn',
    serviceId: process.env.REACT_APP_EMAILJS_SERVICE_ID || 'service_default_service', // Need actual Service ID from EmailJS dashboard
    templateId: process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'template_daily_stock_report' // ✅ Created in EmailJS
  };

  // Try common Service ID patterns if the default doesn't work
  const tryCommonServiceIds = async (templateParams) => {
    const commonServiceIds = [
      'service_default_service',
      'gmail', 
      'service_gmail',
      'default_service',
      emailConfig.serviceId // Current configured one
    ];

    for (const serviceId of commonServiceIds) {
      try {
        console.log(`Trying Service ID: ${serviceId}`);
        const response = await emailjs.send(serviceId, emailConfig.templateId, templateParams);
        return { success: true, response, serviceId };
      } catch (error) {
        console.log(`Failed with ${serviceId}:`, error.message);
        continue;
      }
    }
    throw new Error('All common Service IDs failed. Please check your EmailJS dashboard for the correct Service ID.');
  };

  const sendTestEmail = async () => {
    setIsLoading(true);
    setTestStatus('Sending test email...');
    
    try {
      // Initialize EmailJS with Craig's public key
      emailjs.init(emailConfig.publicKey);
      
      const templateParams = {
        to_name: 'Craig Parker',
        to_email: 'craigparker6@gmail.com',
        from_name: "John Dough's Pizza Dashboard",
        subject: `🍕 Email Test - ${new Date().toLocaleDateString('en-ZA')}`,
        restaurant_name: "John Dough's Sourdough Pizzeria",
        location: "Linden, Johannesburg, South Africa",
        report_date: new Date().toLocaleDateString('en-ZA'),
        starting_stock_value: 'R1,245.50',
        ending_stock_value: 'R1,087.25',
        total_usage_cost: 'R158.25',
        efficiency_score: '87%',
        low_stock_count: 3,
        report_text: `EMAIL TEST SUCCESSFUL! 🎉

This is a test email from your Pizza Dashboard to verify EmailJS is working correctly.

📊 SAMPLE DATA:
• Starting Stock Value: R1,245.50
• Ending Stock Value: R1,087.25
• Daily Usage Cost: R158.25
• Efficiency Score: 87%

🚨 CRITICAL ITEMS:
• Mushrooms: 0g (reorder immediately)
• Bell Peppers: 0g (reorder immediately)
• Sprite Syrup: 0ml (reorder immediately)

⚠️ LOW STOCK:
• Dough Balls: 8 balls (need 15 for weekend)
• Pizza Sauce: 350ml (running low)

If you received this email, your EmailJS configuration is working perfectly!

The system will now automatically send daily reports at 22:00 SAST.

🔗 Dashboard: https://pizza-dashboard-92057.web.app
📦 Update Stock: https://pizza-dashboard-92057.web.app/stock

Have a great day!
The Dashboard Team 🤖`
      };

      console.log('Sending email with config:', emailConfig);
      console.log('Template params:', templateParams);
      
      // Try to send with current config first, then try common Service IDs
      let result;
      try {
        const response = await emailjs.send(
          emailConfig.serviceId,
          emailConfig.templateId,
          templateParams
        );
        result = { success: true, response, serviceId: emailConfig.serviceId };
      } catch (error) {
        console.log('Primary Service ID failed, trying alternatives...');
        result = await tryCommonServiceIds(templateParams);
      }

      console.log('Email sent successfully:', result.response);
      setTestStatus(`✅ Test email sent successfully! 
      
Service ID that worked: ${result.serviceId}
Response: ${result.response.status} - ${result.response.text}
      
Check craigparker6@gmail.com for the email.

If you don't see it, check:
1. Spam/Junk folder
2. EmailJS dashboard for errors  
3. Gmail service is connected properly`);
      
    } catch (error) {
      console.error('Email send error:', error);
      setTestStatus(`❌ Failed to send test email: ${error.message}

Common issues:
1. Service ID not set up correctly
2. Template ID doesn't exist  
3. Gmail service not connected
4. Template variables don't match

Please check your EmailJS dashboard and ensure:
- Gmail service is connected
- Template 'template_daily_stock_report' exists
- Service ID is correct (currently: ${emailConfig.serviceId})`);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestToParker = async () => {
    setIsLoading(true);
    setTestStatus('Sending test to Parker Jane Court...');
    
    try {
      emailjs.init(emailConfig.publicKey);
      
      const templateParams = {
        to_name: 'Parker Jane Court',
        to_email: 'parkerjaneandcourt@gmail.com',
        from_name: "John Dough's Pizza Dashboard",
        subject: `🍕 Email Test - ${new Date().toLocaleDateString('en-ZA')}`,
        restaurant_name: "John Dough's Sourdough Pizzeria",
        location: "Linden, Johannesburg, South Africa",
        report_date: new Date().toLocaleDateString('en-ZA'),
        starting_stock_value: 'R1,245.50',
        ending_stock_value: 'R1,087.25',
        total_usage_cost: 'R158.25',
        efficiency_score: '87%',
        low_stock_count: 3,
        report_text: `EMAIL TEST FOR PARKER! 🎉

This is a test email to Parker Jane Court from the Pizza Dashboard.

The system is configured to send daily stock reports to both:
• Craig Parker (craigparker6@gmail.com)
• Parker Jane Court (parkerjaneandcourt@gmail.com)

📊 SAMPLE DAILY REPORT:
• Orders: 18 (THE CHAMP: 8, MARGIE: 6, MUSHROOM CLOUD: 5)
• Revenue: R3,487.50
• Efficiency: 87%

🚨 CRITICAL ALERTS:
• Out of mushrooms & bell peppers
• Sprite syrup finished

If you see this email, the system is working perfectly!

Daily reports will arrive automatically at 22:00 SAST.

Best regards,
John Dough's Pizza Dashboard Team 🍕`
      };
      
      const response = await emailjs.send(
        emailConfig.serviceId,
        emailConfig.templateId,
        templateParams
      );

      setTestStatus(`✅ Test email sent to Parker Jane Court! 
      
Both Craig and Parker will now receive daily reports.
      
Response: ${response.status} - ${response.text}`);
      
    } catch (error) {
      console.error('Email send error:', error);
      setTestStatus(`❌ Failed to send to Parker: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">📧 EmailJS Test Center</h2>
        
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-semibold text-blue-800 mb-2">Configuration Status:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>✅ Public Key: {emailConfig.publicKey.substring(0, 8)}...configured</li>
            <li>📧 Primary Email: craigparker6@gmail.com</li>
            <li>📧 Secondary Email: parkerjaneandcourt@gmail.com</li>
            <li>🔧 Service ID: {emailConfig.serviceId}</li>
            <li>📝 Template ID: {emailConfig.templateId}</li>
          </ul>
        </div>
        
        <div className="space-y-4 mb-6">
          <button
            onClick={sendTestEmail}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 mr-4"
          >
            {isLoading ? '⏳ Sending...' : '📧 Send Test to Craig'}
          </button>
          
          <button
            onClick={sendTestToParker}
            disabled={isLoading}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            {isLoading ? '⏳ Sending...' : '📧 Send Test to Parker'}
          </button>
        </div>
        
        {testStatus && (
          <div className={`p-4 rounded-lg border ${
            testStatus.includes('✅') 
              ? 'bg-green-50 border-green-200 text-green-800'
              : testStatus.includes('❌')
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-yellow-50 border-yellow-200 text-yellow-800'
          }`}>
            <h3 className="font-semibold mb-2">Test Result:</h3>
            <pre className="whitespace-pre-wrap text-sm">{testStatus}</pre>
          </div>
        )}
        
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded">
          <h3 className="font-semibold mb-2">📋 Setup Instructions:</h3>
          <ol className="text-sm space-y-2">
            <li>1. Go to your EmailJS dashboard → Email Services</li>
            <li>2. Create a Gmail service and connect craigparker6@gmail.com</li>
            <li>3. Copy the Service ID and update REACT_APP_EMAILJS_SERVICE_ID</li>
            <li>4. Go to Email Templates → Create template_daily_stock_report</li>
            <li>5. Test both email addresses to ensure delivery works</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default EmailTestComponent;
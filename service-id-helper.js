/**
 * Service ID Helper
 * Run this in your browser console on the EmailJS dashboard to find your Service ID
 */

console.log('🔍 EmailJS Service ID Finder');
console.log('=====================================');
console.log('');
console.log('1. Go to EmailJS dashboard → Email Services');
console.log('2. Look for a service with Gmail connected');
console.log('3. The Service ID will look like: service_abc123xyz');
console.log('');
console.log('Common Service IDs:');
console.log('- service_default_service (default)');
console.log('- service_gmail (if you chose gmail)');
console.log('- service_[random_string] (auto-generated)');
console.log('');
console.log('📧 Your Template ID: template_daily_stock_report ✅');
console.log('📧 Your Public Key: IzxQHabdq_CzfAHbn ✅');
console.log('📧 Missing: Service ID ❌');
console.log('');
console.log('Once you find it, update the dashboard and test!');

// If running in EmailJS dashboard, try to find services automatically
if (window.location.hostname.includes('emailjs.com')) {
  console.log('');
  console.log('🔍 Detected EmailJS dashboard!');
  console.log('Look for your service in the Email Services section.');
  console.log('The Service ID should be visible next to your Gmail service.');
}
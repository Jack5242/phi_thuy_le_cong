import './env.js';
import { getSocialSettings, updateSocialSettings } from './src/db.js';

async function testSettings() {
  try {
    const existing = await getSocialSettings();
    console.log('Existing settings:', existing);
    
    await updateSocialSettings({
      facebook: 'https://facebook.com/test',
      tiktok: 'https://tiktok.com/@test'
    });
    
    const updated = await getSocialSettings();
    console.log('Updated settings:', updated);
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    process.exit(0);
  }
}

testSettings();

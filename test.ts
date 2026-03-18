import { createUser, markUserVerified, createEmailVerification, verifyEmailCode } from './src/db';

const testRegistration = async () => {
  try {
    const email = 'test' + Date.now() + '@example.com';
    const code = '123456';
    
    console.log('1. Creating email verification...');
    createEmailVerification(email, code, new Date(Date.now() + 15 * 60000));
    
    console.log('2. Verifying email code...');
    const isValid = verifyEmailCode(email, code);
    console.log('   isValid:', isValid);
    
    console.log('3. Creating user...');
    createUser({
      id: 'USR-' + Date.now(),
      email,
      password: 'hashedpwd',
      name: 'Test User'
    });
    
    console.log('4. Marking user verified...');
    markUserVerified(email);
    
    console.log('Registration successful!');
  } catch (error) {
    console.error('Registration failed with error:', error);
  }
};

testRegistration();

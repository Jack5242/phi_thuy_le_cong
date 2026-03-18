export const validatePassword = (password: string): { isValid: boolean; message: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'Mật khẩu phải có ít nhất 8 ký tự.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Mật khẩu phải chứa ít nhất một chữ cái viết hoa.' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Mật khẩu phải chứa ít nhất một chữ số.' };
  }
  return { isValid: true, message: '' };
};

export const validatePhone = (phone: string): { isValid: boolean; message: string } => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) {
    return { isValid: false, message: 'Số điện thoại phải có ít nhất 10 chữ số.' };
  }
  return { isValid: true, message: '' };
};

export const validateAddress = (address: string): { isValid: boolean; message: string } => {
  if (address.trim().length < 5) {
    return { isValid: false, message: 'Địa chỉ phải có ít nhất 5 ký tự.' };
  }
  return { isValid: true, message: '' };
};

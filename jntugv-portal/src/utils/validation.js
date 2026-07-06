const textPattern = /^[A-Z0-9 .,'()&/-]+$/i
const namePattern = /^[A-Z .'-]+$/i
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const isBlank = (value) => !String(value || '').trim()

export const required = (value, message) => (isBlank(value) ? message : '')

export const nameFormat = (value, label) => {
  if (isBlank(value)) return `${label} is required.`
  return namePattern.test(String(value).trim()) ? '' : `${label} must contain only letters, spaces, dot, apostrophe or hyphen.`
}

export const textFormat = (value, label) => {
  if (isBlank(value)) return `${label} is required.`
  return textPattern.test(String(value).trim()) ? '' : `${label} has unsupported characters.`
}

export const optionalTextFormat = (value, label) => {
  if (isBlank(value)) return ''
  return textPattern.test(String(value).trim()) ? '' : `${label} has unsupported characters.`
}

export const digits = (value, label, length) => {
  if (isBlank(value)) return `${label} is required.`
  const pattern = new RegExp(`^\\d{${length}}$`)
  return pattern.test(String(value).trim()) ? '' : `${label} must be exactly ${length} digits.`
}

export const optionalDigitsRange = (value, label, min, max) => {
  if (isBlank(value)) return ''
  const pattern = new RegExp(`^\\d{${min},${max}}$`)
  return pattern.test(String(value).trim()) ? '' : `${label} must contain ${min} to ${max} digits.`
}

export const mobileNumber = (value, label) => {
  if (isBlank(value)) return `${label} is required.`
  return /^[6-9]\d{9}$/.test(String(value).trim()) ? '' : `${label} must be a valid 10 digit number starting with 6, 7, 8 or 9.`
}

export const emailFormat = (value) => {
  if (isBlank(value)) return 'Email address is required.'
  return emailPattern.test(String(value).trim()) ? '' : 'Email address must be in a valid format.'
}

export const yearFormat = (value, label = 'Year') => {
  if (isBlank(value)) return `${label} is required.`
  const year = Number(value)
  return /^\d{4}$/.test(String(value).trim()) && year >= 1950 && year <= 2026
    ? ''
    : `${label} must be a 4 digit year between 1950 and 2026.`
}

export const positiveInteger = (value, label) => {
  if (isBlank(value)) return `${label} is required.`
  return /^[1-9]\d*$/.test(String(value).trim()) ? '' : `${label} must be a positive number.`
}

export const positiveAmount = (value, label) => {
  if (isBlank(value)) return `${label} is required.`
  return /^\d+(\.\d{1,2})?$/.test(String(value).trim()) && Number(value) > 0
    ? ''
    : `${label} must be a valid amount greater than 0.`
}

export const passportFormat = (value) => {
  if (isBlank(value)) return ''
  return /^[A-Z0-9]{6,12}$/i.test(String(value).trim())
    ? ''
    : 'Passport number must be 6 to 12 letters or digits.'
}

export const collectMessages = (messages) => messages.filter(Boolean)

// src/utils/crypto.ts
export const encrypt = async (text: string, key: string) => {
  if (!text || !key) {
    console.error(
      'Error encrypting because open ai key or secret key is not available',
      text,
      key,
    )
    return
  }
  const pwUtf8 = new TextEncoder().encode(key)
  const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const alg = { name: 'AES-GCM', iv: iv }
  const encryptKey = await crypto.subtle.importKey('raw', pwHash, alg, false, [
    'encrypt',
  ])
  const encrypted = await crypto.subtle.encrypt(
    alg,
    encryptKey,
    new TextEncoder().encode(text),
  )
  const encryptedBase64 = Buffer.from(new Uint8Array(encrypted)).toString(
    'base64',
  )
  return `${encryptedBase64}.${Buffer.from(iv).toString('base64')}`
}

export const decrypt = async (encryptedText: string, key: string) => {
  if (!encryptedText || !key) {
    console.error(
      'Error decrypting because encryptedText or key is not available',
      encryptedText,
      key,
    )
    return
  }
  const [encryptedBase64, ivBase64] = encryptedText.split('.')
  if (!ivBase64 || !encryptedBase64) {
    throw new Error('Invalid API key format')
  }
  const pwUtf8 = new TextEncoder().encode(key)
  const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8)
  const iv = Buffer.from(ivBase64, 'base64')
  const alg = { name: 'AES-GCM', iv: new Uint8Array(iv) }
  const decryptKey = await crypto.subtle.importKey('raw', pwHash, alg, false, [
    'decrypt',
  ])
  const ptBuffer = await crypto.subtle.decrypt(
    alg,
    decryptKey,
    Buffer.from(encryptedBase64, 'base64'),
  )
  return new TextDecoder().decode(ptBuffer)
}

export function isEncrypted(str: string) {
  const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$/;
  const parts = str.split('.');
  return parts.length === 2 && base64Regex.test(parts[0] as string) && base64Regex.test(parts[1] as string);
}

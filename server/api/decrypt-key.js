
const express = require('express');
const CryptoJS = require('crypto-js');

const router = express.Router();

// Server-side encryption secret from environment variable
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET;

// Middleware to check if the encryption secret is properly configured
const checkEncryptionSecret = (req, res, next) => {
  if (!ENCRYPTION_SECRET) {
    console.error('⚠️ ENCRYPTION_SECRET environment variable is not set. Encryption/decryption will fail.');
    return res.status(500).json({ error: 'Server encryption configuration error' });
  }
  next();
};

// API endpoint to decrypt API keys
router.post('/decrypt-key', checkEncryptionSecret, (req, res) => {
  try {
    const { encryptedKey, iv, googleId } = req.body;
    
    if (!encryptedKey || !iv || !googleId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Decrypt the API key
    const decrypted = CryptoJS.AES.decrypt(encryptedKey, ENCRYPTION_SECRET, {
      iv: CryptoJS.enc.Hex.parse(iv)
    });
    
    const decryptedKey = decrypted.toString(CryptoJS.enc.Utf8);
    
    // Basic validation of the decrypted key
    if (!decryptedKey || !decryptedKey.startsWith('sk-') || decryptedKey.length < 48) {
      return res.status(400).json({ error: 'Invalid API key format after decryption' });
    }
    
    return res.json({ apiKey: decryptedKey });
  } catch (error) {
    console.error('Error decrypting API key:', error);
    return res.status(500).json({ error: 'Failed to decrypt API key' });
  }
});

module.exports = router;

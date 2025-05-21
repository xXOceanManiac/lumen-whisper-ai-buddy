
const express = require('express');
const CryptoJS = require('crypto-js');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

// Helper function for encrypting API keys (server-side only)
const encryptApiKey = (apiKey) => {
  try {
    // Generate a random IV
    const iv = CryptoJS.lib.WordArray.random(16).toString();
    
    // Encrypt the API key using AES
    const encrypted = CryptoJS.AES.encrypt(apiKey, ENCRYPTION_SECRET, {
      iv: CryptoJS.enc.Hex.parse(iv)
    });
    
    return {
      encryptedKey: encrypted.toString(),
      iv: iv
    };
  } catch (error) {
    console.error("Error encrypting API key:", error);
    throw new Error("Failed to encrypt API key");
  }
};

// API endpoint to save API keys
router.post('/save-openai-key', checkEncryptionSecret, async (req, res) => {
  try {
    const { googleId, openaiApiKey } = req.body;
    
    if (!googleId || !openaiApiKey) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Validate the API key format
    const trimmedKey = openaiApiKey.trim();
    if (!trimmedKey.startsWith('sk-') || trimmedKey.length < 48) {
      return res.status(400).json({ error: 'Invalid API key format' });
    }
    
    // Encrypt the API key
    const { encryptedKey, iv } = encryptApiKey(trimmedKey);
    
    // Save encrypted key to Supabase
    const { error } = await supabase
      .from('openai_keys')
      .upsert({ 
        google_id: googleId, 
        key_content: encryptedKey,
        iv: iv
      });
    
    if (error) {
      console.error(`Failed to save encrypted key to Supabase: ${error.message}`);
      return res.status(500).json({ error: 'Failed to save API key to database' });
    }
    
    return res.json({ success: true, message: 'API key saved successfully' });
  } catch (error) {
    console.error('Error saving API key:', error);
    return res.status(500).json({ error: 'Failed to save API key' });
  }
});

module.exports = router;

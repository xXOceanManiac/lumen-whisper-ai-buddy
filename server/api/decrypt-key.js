
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

// Add new route for fetching OpenAI API key
router.get('/get-openai-key', checkEncryptionSecret, async (req, res) => {
  const { googleId } = req.query;

  if (!googleId) {
    return res.status(400).json({ error: 'Missing googleId parameter' });
  }

  try {
    const { createClient } = require('@supabase/supabase-js');
    
    // Supabase configuration
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('⚠️ Supabase configuration is missing');
      return res.status(500).json({ error: 'Server database configuration error' });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the encrypted key from Supabase
    const { data: keyData, error: keyError } = await supabase
      .from('openai_keys')
      .select('key_content, iv')
      .eq('google_id', googleId)
      .maybeSingle();
    
    if (keyError) {
      console.error('Error fetching key from Supabase:', keyError.message);
      return res.status(500).json({ error: 'Database error when fetching key' });
    }
    
    if (!keyData) {
      return res.status(404).json({ error: 'API key not found for this user' });
    }
    
    // Decrypt the key
    try {
      const decrypted = CryptoJS.AES.decrypt(keyData.key_content, ENCRYPTION_SECRET, {
        iv: CryptoJS.enc.Hex.parse(keyData.iv)
      });
      
      const decryptedKey = decrypted.toString(CryptoJS.enc.Utf8);
      
      // Basic validation of the decrypted key
      if (!decryptedKey || !decryptedKey.startsWith('sk-') || decryptedKey.length < 48) {
        return res.status(400).json({ error: 'Invalid API key format after decryption' });
      }
      
      return res.json({ apiKey: decryptedKey });
    } catch (decryptError) {
      console.error('Error decrypting API key:', decryptError);
      return res.status(500).json({ error: 'Failed to decrypt API key' });
    }
  } catch (error) {
    console.error('Error in get-openai-key route:', error);
    return res.status(500).json({ error: 'Server error when processing request' });
  }
});

module.exports = router;

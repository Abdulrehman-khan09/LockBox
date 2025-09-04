// Fixed simpleCrypto.js with improved key handling

import forge from "node-forge";

/**
 * Generate RSA key pair (for user or admin)
 */
export function generateKeyPair() {
  return new Promise((resolve, reject) => {
    forge.pki.rsa.generateKeyPair({ bits: 2048, workers: -1 }, (err, keypair) => {
      if (err) reject(err);
      else resolve({
        publicKey: forge.pki.publicKeyToPem(keypair.publicKey),
        privateKey: forge.pki.privateKeyToPem(keypair.privateKey)
      });
    });
  });
}

export function trimKey(pemKey) {
  if (!pemKey) return "";
  return pemKey
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, ""); // remove newlines + spaces
}

// 🔹 FIX 1: Enhanced decryptWithPrivateKey with better error handling and debugging
export async function decryptWithPrivateKey(encryptedMessage, privateKeyInput) {
  try {
    if (!encryptedMessage || !privateKeyInput) {
      throw new Error("Missing encrypted message or private key");
    }

    const hasPemHeaders = privateKeyInput.includes("-----BEGIN");

    // Strip headers to get base64 body if PEM provided
    let base64Body = privateKeyInput;
    if (hasPemHeaders) {
      base64Body = privateKeyInput
        .replace(/-----BEGIN [^-]+-----/g, "")
        .replace(/-----END [^-]+-----/g, "")
        .replace(/\s+/g, "");
    }

    async function importPkcs8FromBase64(b64) {
      const s = atob(b64);
      const der = new Uint8Array(s.length);
      for (let i = 0; i < s.length; i++) der[i] = s.charCodeAt(i);
      return window.crypto.subtle.importKey(
        "pkcs8",
        der,
        { name: "RSA-OAEP", hash: "SHA-256" },
        false,
        ["decrypt"]
      );
    }

    let cryptoPrivateKey;
    try {
      // Try direct PKCS8 import (works if body is PKCS8 DER)
      cryptoPrivateKey = await importPkcs8FromBase64(base64Body);
    } catch {
      // Fallback: normalize any RSA PRIVATE KEY (PKCS1) to PKCS8 using forge
      const pem = hasPemHeaders
        ? privateKeyInput
        : `-----BEGIN PRIVATE KEY-----\n${base64Body}\n-----END PRIVATE KEY-----`;

      let forgeKey;
      try {
        // Handles PKCS1 (RSA PRIVATE KEY) or PKCS8 (PRIVATE KEY)
        forgeKey = forge.pki.privateKeyFromPem(pem);
      } catch {
        const decoded = forge.pem.decode(pem)[0];
        const asn1 = forge.asn1.fromDer(decoded.body);
        forgeKey = forge.pki.privateKeyFromAsn1(asn1);
      }

      // Convert to PKCS8 DER
      const rsaAsn1 = forge.pki.privateKeyToAsn1(forgeKey);
      const pkcs8Asn1 = forge.pki.wrapRsaPrivateKey(rsaAsn1);
      const pkcs8DerBytes = forge.asn1.toDer(pkcs8Asn1).getBytes();
      const pkcs8Der = new Uint8Array(pkcs8DerBytes.length);
      for (let i = 0; i < pkcs8DerBytes.length; i++) pkcs8Der[i] = pkcs8DerBytes.charCodeAt(i);

      cryptoPrivateKey = await window.crypto.subtle.importKey(
        "pkcs8",
        pkcs8Der,
        { name: "RSA-OAEP", hash: "SHA-256" },
        false,
        ["decrypt"]
      );
    }

    // Decrypt chunked ciphertext
    const chunks = encryptedMessage.split("|").filter(Boolean);
    const out = [];
    for (const chunk of chunks) {
      const bin = atob(chunk);
      const enc = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) enc[i] = bin.charCodeAt(i);
      const dec = await window.crypto.subtle.decrypt({ name: "RSA-OAEP" }, cryptoPrivateKey, enc);
      out.push(new Uint8Array(dec));
    }

    const total = out.reduce((s, a) => s + a.length, 0);
    const combined = new Uint8Array(total);
    let offset = 0;
    for (const a of out) {
      combined.set(a, offset);
      offset += a.length;
    }
    return new TextDecoder().decode(combined);
  } catch (err) {
    console.error("FINAL DECRYPTION ERROR:", err);
    throw new Error("Failed to decrypt message");
  }
}

// 🔹 FIX 3: Enhanced encryptWithPublicKey with better error handling
export async function encryptWithPublicKey(message, publicKeyBase64) {
  try {
    console.log("🔒 Starting encryption process...", {
      messageLength: message?.length,
      publicKeyLength: publicKeyBase64?.length
    });

    if (!message || !publicKeyBase64) {
      throw new Error("Missing message or public key");
    }

    // Handle different public key formats
    let cleanPublicKey = publicKeyBase64;
    
    // If the key has PEM headers, remove them
    if (publicKeyBase64.includes('-----BEGIN PUBLIC KEY-----')) {
      cleanPublicKey = trimKey(publicKeyBase64);
    }

    console.log("🔑 Using clean public key (first 50 chars):", cleanPublicKey.substring(0, 50));

    // Convert base64 to binary
    const binaryDerString = atob(cleanPublicKey);
    const binaryDer = new Uint8Array(binaryDerString.length);
    for (let i = 0; i < binaryDerString.length; i++) {
      binaryDer[i] = binaryDerString.charCodeAt(i);
    }

    // Import the public key
    const publicKey = await window.crypto.subtle.importKey(
      'spki',
      binaryDer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      false,
      ['encrypt']
    );

    console.log("✅ Public key imported successfully");

    // Encrypt the message
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    
    // Split message into chunks if it's too large (RSA has size limits)
    const maxChunkSize = 190; // Conservative size for 2048-bit key
    const chunks = [];
    
    console.log(`📦 Splitting message into chunks, data length: ${data.length}, max chunk size: ${maxChunkSize}`);
    
    for (let i = 0; i < data.length; i += maxChunkSize) {
      const chunk = data.slice(i, i + maxChunkSize);
      console.log(`🔒 Encrypting chunk ${Math.floor(i / maxChunkSize) + 1}, size: ${chunk.length}`);
      
      const encrypted = await window.crypto.subtle.encrypt(
        {
          name: 'RSA-OAEP',
        },
        publicKey,
        chunk
      );
      chunks.push(btoa(String.fromCharCode(...new Uint8Array(encrypted))));
    }

    const result = chunks.join('|');
    console.log(`🎉 Encryption completed successfully, ${chunks.length} chunks, total length: ${result.length}`);
    
    // Return chunks joined with delimiter
    return result;
  } catch (err) {
    console.error('❌ Encryption failed:', {
      error: err.message,
      stack: err.stack,
      messageSample: message?.substring(0, 100),
      publicKeySample: publicKeyBase64?.substring(0, 50)
    });
    throw new Error(`Encryption failed: ${err.message}`);
  }
}

// 🔹 Rest of the functions remain the same
export async function encryptPrivateKeyWithPassword(privateKeyBase64, password) { 
  try {  
    const salt = window.crypto.getRandomValues(new Uint8Array(32));   
    const encoder = new TextEncoder(); 
    const passwordKey = await window.crypto.subtle.importKey( 
      "raw", 
      encoder.encode(password), 
      "PBKDF2", 
      false, 
      ["deriveBits", "deriveKey"] 
    ); 
    const derivedKey = await window.crypto.subtle.deriveKey( 
      { 
        name: "PBKDF2", 
        salt: salt, 
        iterations: 100000, 
        hash: "SHA-256", 
      }, 
      passwordKey, 
      { name: "AES-GCM", length: 256 }, 
      true, 
      ["encrypt", "decrypt"] 
    ); 
    const iv = window.crypto.getRandomValues(new Uint8Array(12));   
    const encoder2 = new TextEncoder(); 
    const encryptedData = await window.crypto.subtle.encrypt( 
      { name: "AES-GCM", iv: iv, }, 
      derivedKey, 
      encoder2.encode(privateKeyBase64) 
    ); 
    return { 
      version: 2, 
      kdf: "pbkdf2", 
      cipherText: btoa(String.fromCharCode(...new Uint8Array(encryptedData))), 
      iv: btoa(String.fromCharCode(...iv)), 
      salt: btoa(String.fromCharCode(...salt)), 
      iterations: 100000, 
    }; 
  } catch (err) { 
    console.error("Private key encryption failed:", err); 
    throw new Error("Failed to encrypt private key"); 
  } 
}

export async function decryptPrivateKeyWithPassword(encryptedPrivateKey, password) {
  try {
    // Decode base64 strings
    const salt = new Uint8Array(atob(encryptedPrivateKey.salt).split('').map(c => c.charCodeAt(0)));
    const iv = new Uint8Array(atob(encryptedPrivateKey.iv).split('').map(c => c.charCodeAt(0)));
    const cipherText = new Uint8Array(atob(encryptedPrivateKey.cipherText).split('').map(c => c.charCodeAt(0)));

    // Derive key from password
    const encoder = new TextEncoder();
    const passwordKey = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    const derivedKey = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: encryptedPrivateKey.iterations,
        hash: 'SHA-256',
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['decrypt']
    );

    // Decrypt the private key
    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      derivedKey,
      cipherText
    );

    // Convert decrypted data to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (err) {
    console.error('Failed to decrypt private key:', err);
    throw new Error('Invalid password or encrypted data');
  }
}

export function generateUserTrackingCode(publicKey, privateKey) {
  const cleanData = {
    publicKey: trimKey(publicKey),
    privateKey: trimKey(privateKey),
  };

  const jsonStr = JSON.stringify(cleanData);

  return btoa(jsonStr)
    .replace(/\+/g, "-") // URL safe
    .replace(/\//g, "_")
    .replace(/=+$/, ""); // strip padding
}

export function decodeUserTrackingCode(trackingCode) {
  try {
    let cleanTrackingCode = trackingCode.trim();
    let base64 = cleanTrackingCode.replace(/-/g, "+").replace(/_/g, "/");
    const padding = base64.length % 4;
    if (padding) base64 += "=".repeat(4 - padding);

    const jsonStr = atob(base64);
    const { publicKey, privateKey } = JSON.parse(jsonStr);

    // IMPORTANT:
    // - publicKey stays PUBLIC KEY (SPKI)
    // - privateKey should be RSA PRIVATE KEY (PKCS1), which is what forge emits
    return {
      publicKey: `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`,
      privateKey: `-----BEGIN RSA PRIVATE KEY-----\n${privateKey}\n-----END RSA PRIVATE KEY-----`,
      cleanPublicKey: publicKey,
      cleanPrivateKey: privateKey
    };
  } catch (err) {
    console.error("❌ Failed to decode tracking code:", err);
    throw new Error(`Invalid tracking code format: ${err.message}`);
  }
}


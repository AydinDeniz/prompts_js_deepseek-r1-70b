// webauthn.js
const express = require('express');
const webauthn = require('webauthn');
const { generateUUID } = require('crypto');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

// Configuration
const rpId = 'your-domain.com';
const rpName = 'Your WebAuthn Server';
const rpIcon = 'https://your-domain.com/icon.png';
const defaultAuthenticatorTypes = ['platform', 'security-key'];
const defaultTransports = ['usb', 'nfc', 'ble'];
const defaultAttestation = 'direct';

// In-memory storage for demonstration purposes
const users = new Map();
const credentials = new Map();

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`WebAuthn server running on port ${port}`);
});

// WebAuthn initialization
async function initWebAuthn() {
  try {
    const webauthn = new WebAuthn({
      rpId,
      rpName,
      rpIcon,
      authenticatorTypes: defaultAuthenticatorTypes,
      transports: defaultTransports,
      attestation: defaultAttestation
    });
    return webauthn;
  } catch (error) {
    console.error('Error initializing WebAuthn:', error);
    throw error;
  }
}

// Registration endpoint
app.post('/register', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    if (users.has(username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const webauthn = await initWebAuthn();
    const options = await webauthn.createRegistrationOptions({
      rp: {
        id: rpId,
        name: rpName,
        icon: rpIcon
      },
      user: {
        id: generateUUID(),
        name: username,
        displayName: username
      },
      authenticatorSelection: {
        authenticatorTypes: defaultAuthenticatorTypes,
        requireResidentKey: false,
        requireUserVerification: true
      },
      attestation: defaultAttestation,
      extensions: {
        txAuthSimple: {}
      }
    });

    users.set(username, {
      id: options.user.id,
      username,
      credentials: []
    });

    res.status(200).json(options);
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Registration result endpoint
app.post('/register/result', async (req, res) => {
  try {
    const { username, registrationResponse } = req.body;
    if (!username || !registrationResponse) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const user = users.get(username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const webauthn = await initWebAuthn();
    const result = await webauthn.verifyRegistrationResponse({
      registrationResponse,
      user: {
        id: user.id,
        username,
        displayName: username,
        credentials: user.credentials
      }
    });

    if (result.error) {
      throw result.error;
    }

    user.credentials.push({
      id: result.credential.id,
      type: result.credential.type,
      publicKey: result.credential.response.publicKey,
      attestations: result.credential.response.attestation
    });

    users.set(username, user);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error during registration result verification:', error);
    res.status(500).json({ error: 'Registration verification failed' });
  }
});

// Authentication endpoint
app.post('/auth', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const user = users.get(username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const webauthn = await initWebAuthn();
    const options = await webauthn.createAuthenticationOptions({
      rpId,
      user: {
        id: user.id,
        username,
        displayName: username,
        credentials: user.credentials
      },
      authenticatorSelection: {
        authenticatorTypes: defaultAuthenticatorTypes,
        requireResidentKey: false,
        requireUserVerification: true
      },
      extensions: {
        txAuthSimple: {}
      }
    });

    res.status(200).json(options);
  } catch (error) {
    console.error('Error during authentication:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Authentication result endpoint
app.post('/auth/result', async (req, res) => {
  try {
    const { username, authenticationResponse } = req.body;
    if (!username || !authenticationResponse) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const user = users.get(username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const webauthn = await initWebAuthn();
    const result = await webauthn.verifyAuthenticationResponse({
      authenticationResponse,
      user: {
        id: user.id,
        username,
        displayName: username,
        credentials: user.credentials
      }
    });

    if (result.error) {
      throw result.error;
    }

    res.status(200).json({ success: true, user: { username } });
  } catch (error) {
    console.error('Error during authentication result verification:', error);
    res.status(500).json({ error: 'Authentication verification failed' });
  }
});
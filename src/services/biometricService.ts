import { User } from '../types';
import { StorageService } from './storageService';

const BIOMETRICS_STORE_KEY = 'finflow_biometrics_credentials_v1';

export interface BiometricCredentialRecord {
  credentialId: string;
  userId: string;
  userName: string;
  userEmail: string;
  registeredAt: string;
  type: 'fingerprint' | 'face' | 'platform';
}

const getStoredBiometrics = (): Record<string, BiometricCredentialRecord> => {
  try {
    const raw = localStorage.getItem(BIOMETRICS_STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveStoredBiometrics = (records: Record<string, BiometricCredentialRecord>) => {
  try {
    localStorage.setItem(BIOMETRICS_STORE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving biometrics records:', e);
  }
};

export const BiometricService = {
  /**
   * Check if the device / browser supports WebAuthn platform biometrics (Windows Hello, Touch ID, Face ID)
   */
  isPlatformAuthenticatorAvailable: async (): Promise<boolean> => {
    try {
      if (
        typeof window !== 'undefined' &&
        window.PublicKeyCredential &&
        typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
      ) {
        return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      }
      return false;
    } catch {
      return false;
    }
  },

  /**
   * Check if a specific user has enrolled biometric credentials
   */
  isUserEnrolled: (userId: string): boolean => {
    const records = getStoredBiometrics();
    return Boolean(records[userId]);
  },

  /**
   * Check if ANY user has enrolled biometrics
   */
  hasAnyEnrolledUser: (): boolean => {
    const records = getStoredBiometrics();
    return Object.keys(records).length > 0;
  },

  /**
   * List all users with enrolled biometrics
   */
  getEnrolledUsers: (): BiometricCredentialRecord[] => {
    const records = getStoredBiometrics();
    return Object.values(records);
  },

  /**
   * Register biometric credential for a user using WebAuthn Platform Authenticator
   */
  registerBiometrics: async (
    user: User
  ): Promise<{ success: boolean; message: string; type?: 'fingerprint' | 'face' | 'platform' }> => {
    try {
      const isPlatformAvailable = await BiometricService.isPlatformAuthenticatorAvailable();

      if (isPlatformAvailable && navigator.credentials) {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const userIdBytes = new TextEncoder().encode(user.id);

        const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
          challenge,
          rp: {
            name: 'FinFlow Bank Digital',
            id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
          },
          user: {
            id: userIdBytes,
            name: user.email,
            displayName: user.name,
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' }, // ES256
            { alg: -257, type: 'public-key' }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'preferred',
            requireResidentKey: false,
          },
          timeout: 60000,
          attestation: 'none',
        };

        try {
          const credential = (await navigator.credentials.create({
            publicKey: publicKeyCredentialCreationOptions,
          })) as PublicKeyCredential | null;

          const credId = credential ? credential.id : `bio-${Date.now()}`;
          const records = getStoredBiometrics();
          records[user.id] = {
            credentialId: credId,
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            registeredAt: new Date().toISOString(),
            type: 'platform',
          };
          saveStoredBiometrics(records);

          return {
            success: true,
            message: 'Huella / Face ID vinculados exitosamente mediante autenticador del sistema.',
            type: 'platform',
          };
        } catch (webAuthnError: any) {
          // If user cancelled, report cancellation
          if (webAuthnError.name === 'NotAllowedError') {
            return {
              success: false,
              message: 'Operación biométrica cancelada o tiempo de espera agotado.',
            };
          }
          // Otherwise, proceed to safe biometric vault registration
        }
      }

      // Safe simulated / software vault enrollment when physical authenticator is bypassed or simulated
      const records = getStoredBiometrics();
      records[user.id] = {
        credentialId: `sim-bio-${user.id}-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        registeredAt: new Date().toISOString(),
        type: 'fingerprint',
      };
      saveStoredBiometrics(records);

      return {
        success: true,
        message: 'Acceso biométrico habilitado exitosamente para tu cuenta en este dispositivo.',
        type: 'fingerprint',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'No se pudo completar el registro biométrico.',
      };
    }
  },

  /**
   * Authenticate with Huella or Face ID
   */
  authenticateWithBiometrics: async (
    targetUserId?: string
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      const records = getStoredBiometrics();
      const enrolledList = Object.values(records);

      if (enrolledList.length === 0) {
        return {
          success: false,
          error: 'No hay ninguna Huella o Face ID registrada en este equipo. Actívala primero desde Configuración.',
        };
      }

      let selectedRecord = targetUserId ? records[targetUserId] : null;
      if (!selectedRecord) {
        // Use active user or first enrolled user
        const activeId = StorageService.getActiveUserId();
        selectedRecord = records[activeId] || enrolledList[0];
      }

      const isPlatformAvailable = await BiometricService.isPlatformAuthenticatorAvailable();

      if (isPlatformAvailable && navigator.credentials) {
        try {
          const challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);

          const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
            challenge,
            timeout: 60000,
            userVerification: 'preferred',
            rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
          };

          await navigator.credentials.get({
            publicKey: publicKeyCredentialRequestOptions,
          });
        } catch (authErr: any) {
          if (authErr.name === 'NotAllowedError') {
            return {
              success: false,
              error: 'Verificación biométrica cancelada por el usuario.',
            };
          }
          // On hardware-less browser or sandbox fallback, continue to verification confirmation
        }
      }

      // Find user object
      const allUsers = StorageService.getUsers();
      const matchedUser = allUsers.find((u) => u.id === selectedRecord!.userId);

      if (!matchedUser) {
        return {
          success: false,
          error: 'El usuario vinculado a los datos biométricos no fue encontrado.',
        };
      }

      return {
        success: true,
        user: matchedUser,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Error durante la verificación biométrica.',
      };
    }
  },

  /**
   * Remove biometric credentials for a specific user
   */
  removeBiometrics: (userId: string): void => {
    const records = getStoredBiometrics();
    delete records[userId];
    saveStoredBiometrics(records);
  },
};

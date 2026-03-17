import crypto from 'crypto';

/**
 * Bank Encryption Service
 * AES-256-GCM encryption for sensitive bank data
 * Keys stored in AWS Secrets Manager or environment variables
 */

interface EncryptedData {
    encrypted: string;
    iv: string;
    authTag: string;
    version: number;
}

class BankEncryptionService {
    private encryptionKey: Buffer;
    private readonly algorithm = 'aes-256-gcm';
    private readonly version = 1;

    constructor(encryptionKey?: string) {
        // Get key from environment variable (preferably AWS Secrets Manager in production)
        const keyString =
            encryptionKey || process.env.BANK_ENCRYPTION_KEY || 'default-key-change-in-production';

        // Key must be 32 bytes for AES-256
        if (keyString.length < 32) {
            throw new Error(
                'Encryption key must be at least 32 characters. Store securely in environment.'
            );
        }

        // Hash the key to ensure it's exactly 32 bytes
        this.encryptionKey = crypto
            .createHash('sha256')
            .update(keyString)
            .digest();
    }

    /**
     * Encrypt sensitive bank data
     * @param plaintext - Data to encrypt (account number, IFSC code)
     * @returns EncryptedData with IV, auth tag, and encrypted data
     */
    encrypt(plaintext: string): EncryptedData {
        // Generate random IV (Initialization Vector)
        const iv = crypto.randomBytes(16);

        // Create cipher
        const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

        // Encrypt data
        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        // Get authentication tag for GCM
        const authTag = cipher.getAuthTag().toString('hex');

        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag,
            version: this.version,
        };
    }

    /**
     * Decrypt sensitive bank data
     * @param encryptedData - EncryptedData object containing encrypted text, IV, and auth tag
     * @returns Decrypted plaintext
     */
    decrypt(encryptedData: EncryptedData | string): string {
        try {
            let data: EncryptedData;

            // Handle legacy format (string) vs new format
            if (typeof encryptedData === 'string') {
                throw new Error('Invalid encrypted data format. Please regenerate.');
            }

            data = encryptedData as EncryptedData;

            // Recreate IV
            const iv = Buffer.from(data.iv, 'hex');

            // Recreate auth tag
            const authTag = Buffer.from(data.authTag, 'hex');

            // Create decipher
            const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
            decipher.setAuthTag(authTag);

            // Decrypt data
            let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            console.error('Decryption failed:', error);
            throw new Error('Failed to decrypt sensitive data. Data may be corrupted.');
        }
    }

    /**
     * Mask bank account number for display
     * Shows only last 4 digits: XXXX-XXXX-XXXX-1234
     */
    maskAccountNumber(accountNumber: string): string {
        if (accountNumber.length <= 4) {
            return 'XXXX';
        }
        const lastFour = accountNumber.slice(-4);
        const mask = 'X'.repeat(accountNumber.length - 4);
        return mask + lastFour;
    }

    /**
     * Hash sensitive data for indexing/searching without decryption
     * Use for IFSC code lookups
     */
    hashData(data: string): string {
        return crypto
            .createHash('sha256')
            .update(data + process.env.HASH_SALT)
            .digest('hex');
    }

    /**
     * Validate IFSC code format
     * Format: ABCD0123456 (4 letters + 7 alphanumeric)
     */
    validateIFSC(ifscCode: string): boolean {
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        return ifscRegex.test(ifscCode.toUpperCase());
    }

    /**
     * Validate bank account number format
     * Only checks basic format: 9-18 digits
     */
    validateAccountNumber(accountNumber: string): boolean {
        const accNoRegex = /^\d{9,18}$/;
        return accNoRegex.test(accountNumber);
    }

    /**
     * Rotate encryption key (for maintenance)
     * Re-encrypt all data with new key
     */
    rotateEncryptionKey(newKeyString: string): { oldKey: string; newKey: string } {
        const oldKey = this.encryptionKey.toString('hex');

        const newKeyBuffer = crypto
            .createHash('sha256')
            .update(newKeyString)
            .digest();

        this.encryptionKey = newKeyBuffer;

        return {
            oldKey,
            newKey: this.encryptionKey.toString('hex'),
        };
    }
}

export default BankEncryptionService;

// Export helper for quick usage
export const encryptionService = new BankEncryptionService();

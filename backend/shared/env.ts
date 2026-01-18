import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Loads env file from backend directory
dotenv.config({ path: path.join(__dirname, '../.env') });

// Defining environment variable schema
const envSchema = z.object({
    REDIS_URL: z.url(),
    POSTGRES_URL: z.url(),
    API_PORT: z.string().regex(/^\d+$/).transform(Number),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Validate env variables
function loadEnv() {
    
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
        console.error("Invalid Environment Variables");
        console.error(z.flattenError(result.error));
        throw new Error("Environments validation failed");
    }

    return result.data;
}

export const env = loadEnv();
import { readFileSync } from 'fs';
import { join } from 'path';

export async function readFirebaseRulesFile(filename: string): Promise<string> {
    try {
        // Adjust path based on where the rules files are located relative to your project root
        const filePath = join(process.cwd(), filename);
        return readFileSync(filePath, 'utf8');
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
        throw new Error(`Could not read Firebase rules file: ${filename}`);
    }
}

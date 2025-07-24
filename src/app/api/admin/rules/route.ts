import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

// This function should only be called from a secure server-side context
// e.g., a Next.js API route or a server component.
function readFirebaseRulesFile(filename: string): string {
    try {
        // Adjust path based on where the rules files are located relative to your project root
        const filePath = join(process.cwd(), filename);
        return readFileSync(filePath, 'utf8');
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
        throw new Error(`Could not read Firebase rules file: ${filename}`);
    }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return NextResponse.json({ error: 'Filename is required.' }, { status: 400 });
  }

  // Basic security check: Only allow reading of known rules files
  if (!['firestore.rules', 'storage.rules', 'firestore.rules.production', 'storage.rules.production'].includes(filename)) {
    return NextResponse.json({ error: 'Access to this file is not allowed.' }, { status: 403 });
  }

  try {
    const rulesContent = readFirebaseRulesFile(filename);
    return NextResponse.json({ content: rulesContent });
  } catch (error: unknown) {
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === "object" && error !== null && "message" in error) {
        errorMessage = (error as { message: string }).message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

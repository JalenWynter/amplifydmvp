'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, X } from "lucide-react";
import { useState } from "react";
import { User } from "@/lib/types";


export default function SearchUsersPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<User[]>([]);
    const [searched, setSearched] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;
        
        console.log(`Searching for: ${searchTerm}`);
        // In a real app, this would be an API call.
        // For now, we'll just simulate a result.
        setSearched(true);
        setResults([]); // Simulate no results found
    };
    
    return (
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Search for a User</CardTitle>
                <CardDescription>Find users by their name, email, or user ID.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                    <div className="relative flex-grow">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="e.g., Jane Doe, jane.doe@example.com, user_123" 
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                         {searchTerm && (
                            <Button 
                                type="button"
                                variant="ghost" 
                                size="icon" 
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                                onClick={() => setSearchTerm('')}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    <Button type="submit">Search</Button>
                </form>

                {searched && (
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Search Results for &quot;{searchTerm}&quot;</h3>
                        {results.length > 0 ? (
                            <p>Display results table here</p>
                        ) : (
                            <div className="text-center py-10 border border-dashed rounded-lg">
                                <p className="text-muted-foreground">No users found matching your query.</p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

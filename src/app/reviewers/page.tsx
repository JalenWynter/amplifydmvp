import Link from "next/link";

export default function ReviewersPage() {
    return (
        <div className="text-center py-20">
            <h1 className="text-2xl font-bold">This page has moved.</h1>
            <p className="text-muted-foreground">
                Please visit our new <Link href="/features" className="text-primary hover:underline">Features</Link> page to see all reviewers.
            </p>
        </div>
    );
}

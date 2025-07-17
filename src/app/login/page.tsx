import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import LoginForm from "@/components/auth/login-form"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold font-headline">Reviewer Login</CardTitle>
          <CardDescription>
            Access your dashboard to review submissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Not a reviewer?{' '}
            <Link href="/apply" className="font-medium text-primary hover:underline">
              Apply here
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

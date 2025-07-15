
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Mail, HelpCircle } from "lucide-react";
import Link from "next/link";

const faqs = [
  {
    question: "How long does a review take?",
    answer: "Our reviewers strive to complete reviews within their stated turnaround time, which is typically 3-5 business days. You can see the specific turnaround time on each reviewer's profile."
  },
  {
    question: "What happens after I pay?",
    answer: "After your payment is successfully processed through Stripe, your submission is securely sent to your chosen reviewer. You will receive an email confirmation, and another email once your review is complete."
  },
  {
    question: "Can I get a refund?",
    answer: "Due to the nature of the service, we generally do not offer refunds once a review has been started or completed. If you believe there has been an error, please contact us immediately."
  },
  {
    question: "I'm a reviewer. How do I get paid?",
    answer: "Reviewer payouts are processed on a monthly basis. You can track your earnings and request payouts from your admin dashboard once implemented."
  }
];

export default function ContactPage() {
  return (
    <div className="space-y-12 max-w-4xl mx-auto">
      <section className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary tracking-tighter mb-4">
          Help & Support
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Have a question or need assistance? We're here to help.
        </p>
      </section>

      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
              <Mail className="w-8 h-8 text-primary" />
            </div>
          <CardTitle className="mt-2">Contact Us Directly</CardTitle>
          <CardDescription>
            For issues not covered in the FAQ, the best way to reach us is by email.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90">
                <a href="mailto:support@amplifyd.com">
                    support@amplifyd.com
                </a>
            </Button>
            <p className="text-xs text-muted-foreground mt-3">We aim to respond to all inquiries within 24 hours.</p>
        </CardContent>
      </Card>
      
      <section>
          <h2 className="text-3xl font-bold font-headline text-center mb-6 flex items-center justify-center gap-3">
            <HelpCircle className="w-8 h-8 text-primary"/>
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                  <AccordionItem value={`item-${index}`} key={index}>
                      <AccordionTrigger className="text-lg text-left">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                          {faq.answer}
                      </AccordionContent>
                  </AccordionItem>
              ))}
          </Accordion>
      </section>
    </div>
  );
}

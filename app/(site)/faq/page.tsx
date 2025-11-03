import { HelpCircle } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "FAQ - Frequently Asked Questions | CookBook",
  description: "Find answers to common questions about using CookBook recipe sharing platform",
};

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "How do I create a recipe?",
    answer: "Once you're logged in, click on your profile icon and navigate to 'My Recipes', then click 'Create New Recipe'. You can use our AI-powered formatter to quickly structure your recipe, or enter the details manually.",
  },
  {
    question: "Can I save recipes from other users?",
    answer: "Yes! Click the heart icon on any recipe to add it to your favorites. You can access all your favorite recipes from your profile page.",
  },
  {
    question: "How does the AI recipe formatter work?",
    answer: "Our AI formatter helps you structure unformatted recipe text. Simply paste your recipe (from any source like a blog, email, or notes) and the AI will automatically extract ingredients, steps, cooking times, and other details into our structured format.",
  },
  {
    question: "Can I edit or delete my recipes?",
    answer: "Absolutely! Go to your profile, select the recipe you want to modify, and click the edit button. You can also delete recipes from the same page.",
  },
  {
    question: "How do I change my profile picture?",
    answer: "Navigate to your profile page, click on your current avatar, and you'll be able to upload a custom image or select from our collection of default avatars.",
  },
  {
    question: "What image formats are supported for recipe photos?",
    answer: "We support JPEG, PNG, WebP, and GIF image formats. Images should be under 5MB in size for optimal performance.",
  },
  {
    question: "Can I make my recipes private?",
    answer: "Yes, when creating or editing a recipe, you can set the status to 'Draft'. Draft recipes are only visible to you until you're ready to publish them.",
  },
  {
    question: "How do reviews and ratings work?",
    answer: "Any logged-in user (except the recipe author) can leave a star rating and optional written review on recipes they've tried. The average rating is displayed on the recipe page.",
  },
  {
    question: "What are allergen warnings?",
    answer: "When creating a recipe, you can select which common allergens are present in your dish (nuts, dairy, gluten, etc.). This helps users with dietary restrictions quickly identify whether a recipe is safe for them.",
  },
  {
    question: "Is CookBook free to use?",
    answer: "Yes! CookBook is completely free to use. You can create an unlimited number of recipes, save favorites, and interact with the community at no cost.",
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-accent-light to-secondary-light py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-center gap-3 mb-4">
            <HelpCircle className="text-accent" size={48} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-text text-center mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-text-secondary text-center max-w-2xl mx-auto">
            Find answers to common questions about using CookBook
          </p>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-bg-secondary rounded-lg shadow-md p-6 border border-border"
            >
              <h2 className="text-xl font-bold text-text mb-3 flex items-start gap-2">
                <span className="text-accent flex-shrink-0">Q:</span>
                {faq.question}
              </h2>
              <p className="text-text-secondary leading-relaxed pl-6">
                <span className="font-semibold text-accent">A:</span> {faq.answer}
              </p>
            </div>
          ))}
        </div>

        {/* Still Have Questions Section */}
        <div className="mt-12 bg-accent-light rounded-lg p-8 text-center border border-accent/20">
          <h2 className="text-2xl font-bold text-text mb-3">
            Still have questions?
          </h2>
          <p className="text-text-secondary mb-6">
            Can&apos;t find the answer you&apos;re looking for? Reach out to our support team.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-bg font-medium rounded-2xl transition-colors shadow-md"
          >
            Contact Us
          </Link>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-accent hover:text-accent-hover font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

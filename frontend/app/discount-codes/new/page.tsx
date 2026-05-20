import { DiscountCodeForm } from "@/components/discount-code-form";

export default function NewDiscountCodePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <DiscountCodeForm />
      </div>
    </main>
  );
}

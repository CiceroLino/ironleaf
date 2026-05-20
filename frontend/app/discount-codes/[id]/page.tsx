import { DiscountCodeDetail } from "@/components/discount-code-detail";

export default async function DiscountCodeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <DiscountCodeDetail id={id} />;
}

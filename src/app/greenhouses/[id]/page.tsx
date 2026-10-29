import { GreenhouseDetail } from "@/components/GreenhouseDetail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GreenhouseDetail greenhouseId={Number(id)} />;
}

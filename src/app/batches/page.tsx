import { Suspense } from "react";
import { BatchesPage } from "@/components/BatchesPage";

export default function Page() {
  return (
    <Suspense fallback={<p className="lede">배치를 불러오는 중입니다.</p>}>
      <BatchesPage />
    </Suspense>
  );
}

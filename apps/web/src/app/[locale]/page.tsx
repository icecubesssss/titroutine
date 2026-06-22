import { redirect } from "next/navigation";
import { getDashboard } from "@/lib/data";
import { HomeView } from "@/components/home/HomeView";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const data = await getDashboard();

  // Middleware should have redirected unauthenticated users already; this is a
  // defensive fallback.
  if (!data) {
    redirect(`/${locale}/login`);
  }

  return <HomeView data={data} />;
}

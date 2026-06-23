import { redirect } from "next/navigation";
import { getDashboard } from "@/lib/data";
import { HomeView } from "@/components/home/HomeView";

export default async function Home(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { locale } = await props.params;
  const searchParams = await props.searchParams;
  const data = await getDashboard(searchParams.date);

  // Middleware should have redirected unauthenticated users already; this is a
  // defensive fallback.
  if (!data) {
    redirect(`/${locale}/login`);
  }

  return <HomeView data={data} />;
}

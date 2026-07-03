import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { CustomerSiteDemo } from "@/components/demo/customer-site-demo";

export default async function DemoCustomerSitePage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/demo/customer-site");

  return <CustomerSiteDemo />;
}

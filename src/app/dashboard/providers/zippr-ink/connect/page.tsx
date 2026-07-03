import { redirect } from "next/navigation";

/** Legacy hyphenated URL → canonical provider slug */
export default function LegacyZipprConnectPage() {
  redirect("/dashboard/providers/zippr_ink/connect");
}

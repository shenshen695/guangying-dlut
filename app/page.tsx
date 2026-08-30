import { redirect } from "next/navigation";

/**
 * Root path now leads to the role-selection welcome page.
 * All original home content is preserved at its own page.
 */
export default function RootPage() {
  redirect("/welcome");
}

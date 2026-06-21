import { redirect } from "next/navigation";

// App opens straight to the POS checkout screen (not a dashboard).
export default function HomePage() {
  redirect("/checkout");
}

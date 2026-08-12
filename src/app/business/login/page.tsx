import { redirect } from "next/navigation";

/**
 * "כניסה לניהול העסק" בפוטר מצביע לכאן, אבל האימות מאוחד — אין
 * טופס נפרד לבעלי עסקים. מפנה ל-/login עם היעד הנכון אחרי הכניסה.
 */
export default function BusinessLoginPage() {
  redirect("/login?next=/business/dashboard");
}

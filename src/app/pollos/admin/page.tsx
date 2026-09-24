import { cookies } from "next/headers";
import { getOperator } from "@/app/pollos/actions/admin-auth";
import { getDashboardData } from "@/app/pollos/actions/admin-pedidos";
import AdminDashboard from "@/components/admin/AdminDashboard";
import OperatorSelector from "@/components/admin/OperatorSelector";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Check operator (proxy already ensures user is authenticated)
  const operator = await getOperator();

  if (!operator) {
    // User is authenticated but hasn't selected an operator yet
    return <OperatorSelector />;
  }

  const data = await getDashboardData();

  return <AdminDashboard data={data} operator={operator} />;
}

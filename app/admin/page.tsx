import { AdminShell } from "@/components/admin/admin-shell";
import { AdminGate } from "@/components/auth/admin-gate";

export default function AdminPage() {
    return (
        <AdminGate>
            <AdminShell />
        </AdminGate>
    ); 
}

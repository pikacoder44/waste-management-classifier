// app/admin/layout.tsx
import {ProtectedAdminRoute} from "@/app/components/ProtectedAdminRoute";

export default function AdminLayout({children}: {children: React.ReactNode}) {
    return (
        <ProtectedAdminRoute>
            {children}
        </ProtectedAdminRoute>
    );
}
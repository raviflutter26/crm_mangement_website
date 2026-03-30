import Sidebar from "@/components/common/Sidebar";
import Topbar from "@/components/common/Topbar";
import RoleGuard from "@/components/guards/RoleGuard";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <RoleGuard allowedRoles={['superadmin']}>
            <div className="page-wrapper">
                <Sidebar />
                <div className="main-content">
                    <Topbar />
                    <div className="page-content animate-in">
                        {children}
                    </div>
                </div>
            </div>
        </RoleGuard>
    );
}

/**
 * Protected Route Component
 * Wraps routes that require authentication
 */

import React from 'react';

interface ProtectedRouteProps {
    isAuthenticated: boolean;
    requiredRole?: string;
    userRole?: string | null;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    isAuthenticated,
    requiredRole,
    userRole,
    children,
    fallback
}) => {
    // Check authentication
    if (!isAuthenticated) {
        return fallback || <div className="protected-route-fallback">Please log in to access this page.</div>;
    }

    // Check role-based access
    if (requiredRole && userRole !== requiredRole) {
        return (
            fallback || (
                <div className="protected-route-fallback">
                    You don't have permission to access this page. Required role: {requiredRole}
                </div>
            )
        );
    }

    return <>{children}</>;
};

export default ProtectedRoute;

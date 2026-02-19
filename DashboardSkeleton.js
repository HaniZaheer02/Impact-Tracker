import React from 'react';

const DashboardSkeleton = () => {
    return (
        <div className="animate-pulse">
            <div className="skeleton-base skeleton-title mb-4"></div>

            <div className="row g-4 mb-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="col-md-4">
                        <div className="skeleton-card p-4">
                            <div className="skeleton-base skeleton-text w-50"></div>
                            <div className="skeleton-base skeleton-text w-75 h-50"></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="skeleton-map skeleton-base mb-4"></div>

            <div className="skeleton-card h-100 p-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="skeleton-base skeleton-text w-100 mb-3"></div>
                ))}
            </div>
        </div>
    );
};

export default DashboardSkeleton;
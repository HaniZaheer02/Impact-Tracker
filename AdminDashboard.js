import React from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';

const AdminDashboard = () => (
    <DashboardLayout>
        <h2 className="text-info">Admin Control Center</h2>
        <p>Here you can manage vendors, approve donations, and track global impact.</p>
        <div className="row mt-4">
            <div className="col-md-4"><div className="p-3 bg-primary rounded">Total Donors: 12</div></div>
            <div className="col-md-4"><div className="p-3 bg-success rounded">Total Impact: $5,000</div></div>
        </div>
    </DashboardLayout>
);

export default AdminDashboard;
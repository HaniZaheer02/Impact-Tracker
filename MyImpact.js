import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/index.ts';
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../layouts/DashboardLayout';
import { motion } from 'framer-motion';
import { History, DollarSign, Target, Award } from 'lucide-react';
import DashboardSkeleton from 'components/DashboardSkeleton.js';

const MyImpact = () => {
    const { user } = useAuth();
    const [myDonations, setMyDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalPersonalImpact, setTotalPersonalImpact] = useState(0);

    useEffect(() => {
        if (!user) return;

        // Query only donations belonging to this user's UID
        const q = query(
            collection(db, "donations"),
            where("donorId", "==", user.uid),
            orderBy("timestamp", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setMyDonations(docs);

            // Calculate total impact amount
            const total = docs.reduce((sum, d) => sum + (d.amount || 0), 0);
            setTotalPersonalImpact(total);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching personal impact:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    if (loading) return <DashboardLayout><DashboardSkeleton /></DashboardLayout>;
    return (
        <DashboardLayout>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="mb-4">
                    <h2 className="auth-heading-gradient mb-1">My Impact</h2>
                    <p className="text-muted small">Tracking your personal journey in changing the world.</p>
                </div>

                {/* PERSONAL STATS HEADER */}
                <div className="row g-4 mb-5">
                    <div className="col-md-6">
                        <div className="stat-card d-flex align-items-center justify-content-between h-100">
                            <div>
                                <span className="text-muted small fw-bold">Total Contribution</span>
                                <h1 className="fw-bold mt-2 mb-0" style={{ color: 'var(--accent-primary)' }}>
                                    ${totalPersonalImpact.toLocaleString()}
                                </h1>
                            </div>
                            <div className="bg-info bg-opacity-10 p-3 rounded-circle">
                                <DollarSign size={32} className="text-info" />
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="stat-card d-flex align-items-center justify-content-between h-100">
                            <div>
                                <span className="text-muted small fw-bold">Impact Level</span>
                                <h3 className="fw-bold mt-2 mb-0 text-white">
                                    {totalPersonalImpact > 500 ? 'Platinum Donor' : totalPersonalImpact > 100 ? 'Gold Donor' : 'Rising Star'}
                                </h3>
                            </div>
                            <div className="bg-warning bg-opacity-10 p-3 rounded-circle">
                                <Award size={32} className="text-warning" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* IMPACT LEDGER TABLE */}
                <div className="stat-card p-0 overflow-hidden">
                    <div className="p-4 border-bottom border-secondary border-opacity-25 d-flex align-items-center">
                        <History size={20} className="text-info me-2" />
                        <h5 className="mb-0">Impact Ledger</h5>
                    </div>
                    <div className="impact-table-container shadow-lg">
                        <div className="table-responsive">
                            <table className="table table-dark impact-table mb-0">
                                <thead>
                                    <tr>
                                        <th className="ps-4">Date & Time</th>
                                        <th>Impact Amount</th>
                                        <th>Region</th>
                                        <th>Donation Type</th>
                                        <th className="text-end pe-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myDonations.map((dn) => (
                                        <tr key={dn.id}>
                                            <td className="ps-4">
                                                <div className="fw-bold">{dn.timestamp?.toDate().toLocaleDateString()}</div>
                                                <div className="text-muted small">
                                                    {dn.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="impact-amount">${dn.amount?.toLocaleString()}</span>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <Target size={14} className="text-info me-2" />
                                                    {dn.region}
                                                </div>
                                            </td>
                                            <td className="text-muted">{dn.type}</td>
                                            <td className="text-end pe-4">
                                                <span className="status-badge status-verified">Verified</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </motion.div>
        </DashboardLayout>
    );
};

export default MyImpact;
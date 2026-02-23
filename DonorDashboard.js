import React, { useEffect, useState } from 'react';
import { db } from '../../firebase/index.ts';
import { doc, onSnapshot, collection, query, orderBy, limit } from "firebase/firestore";
import { motion } from 'framer-motion';
import DashboardLayout from '../../layouts/DashboardLayout';
import GlobalImpactMap from '../../components/GlobalImpactMap';
import DashboardSkeleton from '../../components/DashboardSkeleton';

const DonorDashboard = () => {
	const [loading, setLoading] = useState(true);
	const [recentDonations, setRecentDonations] = useState([]);
	const [stats, setStats] = useState({
		totalDonations: 0,
		uniqueDonorsCount: 0,
		fundsTransferred: 0
	});

	useEffect(() => {
		// Reference the specific document
		const statsRef = doc(db, "metadata", "globalStats");

		// Set a safety timeout: If Firebase takes > 5 seconds, stop loading
		const timer = setTimeout(() => {
			if (loading) setLoading(false);
		}, 5000);

		// Listen for real-time updates
		const unsubscribe = onSnapshot(statsRef, (snapshot) => {
			if (snapshot.exists()) {
				setStats(snapshot.data());
			} else {
				console.warn("Global stats document not found. Using defaults.");
			}
			setLoading(false);
			clearTimeout(timer);
		}, (error) => {
			console.error("Firestore Error:", error);
			setLoading(false);
		});

		return () => {
			unsubscribe();
			clearTimeout(timer);
		};
	}, [loading]);

	const statItems = [
		{ label: "Total Donations", val: `$${stats.totalDonations.toLocaleString()}`, color: "var(--accent-primary)" },
		{ label: "Unique Donors", val: stats.uniqueDonorsCount, color: "#10B981" },
		{ label: "Transferred", val: `$${stats.fundsTransferred.toLocaleString()}`, color: "#F59E0B" }
	];

	useEffect(() => {
		const q = query(
			collection(db, "donations"),
			orderBy("timestamp", "desc"),
			limit(5)
		);

		const unsubRecent = onSnapshot(q, (snapshot) => {
			const donations = snapshot.docs.map(doc => ({
				id: doc.id,
				...doc.data()
			}));
			setRecentDonations(donations);
		});

		return () => unsubRecent();
	}, []);

	if (loading) return <DashboardLayout><DashboardSkeleton /></DashboardLayout>;
	return (
		<DashboardLayout>
			<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
				<div className="d-flex justify-content-between align-items-end mb-4">
					<div>
						<h2 className="auth-heading-gradient mb-1">Global Impact Overview</h2>
						<p className="text-muted small">Real-time tracking of worldwide generosity</p>
					</div>
				</div>

				{/* Stats Grid */}
				<div className="row g-4 mb-4">
					{statItems.map((s, i) => (
						<div key={i} className="col-md-4">
							<div className="stat-card">
								<span className="text-muted small fw-medium">{s.label}</span>
								<h2 className="mt-2 fw-bold" style={{ color: s.color }}>{s.val}</h2>
							</div>
						</div>
					))}
				</div>

				{/* Map Section */}
				<div className="stat-card p-0 mb-4 overflow-hidden" style={{ height: '450px', position: 'relative' }}>
					<div className="p-3 d-flex justify-content-between align-items-center" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, background: 'rgba(0,0,0,0.3)' }}>
						<span className="text-white small fw-bold">Live Impact Tracking</span>
						<span className="badge bg-danger">● LIVE</span>
					</div>
					<GlobalImpactMap />
				</div>

				{/* Recent Table */}
				<div className="stat-card border-0 p-0 overflow-hidden">
					<div className="p-3 border-bottom border-secondary border-opacity-25">
						<h6 className="mb-0">Recent Activity</h6>
					</div>
					<div className="table-responsive">
						<table className="table table-dark table-hover mb-0">
							<thead className="small text-muted">
								<tr>
									<th className="ps-4">DONOR</th>
									<th>AMOUNT</th>
									<th>DESTINATION</th>
									<th>TYPE</th>
									<th className="text-end pe-4">STATUS</th>
								</tr>
							</thead>
							<tbody className="small">
								{recentDonations.length > 0 ? recentDonations.map((dn) => (
									<tr key={dn.id}>
										<td className="ps-4">{dn.anonymous ? "Anonymous" : dn.donorName}</td>
										<td className="fw-bold text-info">${dn.amount?.toLocaleString()}</td>
										<td>{dn.region}</td>
										<td>{dn.type}</td>
										<td className="text-end pe-4">
											<span className={`badge bg-opacity-10 border border-opacity-25 ${dn.status === 'Verified' ? 'text-success border-success' : 'text-warning border-warning'
												}`}>
												{dn.status || 'Pending'}
											</span>
										</td>
									</tr>
								)) : (
									<tr>
										<td colSpan="5" className="text-center py-4 text-muted">No recent donations found.</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			</motion.div>
		</DashboardLayout >
	);
};

export default DonorDashboard;
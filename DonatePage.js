import React, { useState } from 'react';
import { db } from '../../firebase/index.ts';
import { collection, doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../layouts/DashboardLayout';
import { motion } from 'framer-motion';
import { Heart, Globe, ShieldCheck, CreditCard, DollarSign, User, HelpingHand } from 'lucide-react';

const DonatePage = () => {
    const { user } = useAuth();
    const [amount, setAmount] = useState(50);
    const [customAmount, setCustomAmount] = useState('');
    const [region, setRegion] = useState('Palestine');
    const [impactType, setImpactType] = useState('Food Aid');
    const [donorName, setDonorName] = useState(user?.displayName || '');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [loading, setLoading] = useState(false);

    const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvc: '' });

    const regions = ["Palestine", "Sudan", "Congo", "Syria", "Lebanon", "Pakistan", "Afghanistan"];
    const impactTypes = ["Food Aid", "Medical Supplies", "Clean Water", "Shelter", "Education"];

    const handleDonation = async (e) => {
        e.preventDefault();
        setLoading(true);
        const finalAmount = Number(customAmount || amount);

        try {
            await runTransaction(db, async (transaction) => {
                // Reference Global Stats
                const statsRef = doc(db, "metadata", "globalStats");
                const statsDoc = await transaction.get(statsRef);

                if (!statsDoc.exists()) {
                    throw new Error("Stats document does not exist!");
                }

                // Prepare Donation Data
                const donationRef = doc(collection(db, "donations"));
                const donationData = {
                    amount: finalAmount,
                    donorName: isAnonymous ? "Anonymous" : donorName,
                    donorId: user?.uid,
                    region: region,
                    type: impactType,
                    anonymous: isAnonymous,
                    status: "Verified",
                    timestamp: serverTimestamp()
                };

                // Perform Atomic Updates
                transaction.set(donationRef, donationData);
                transaction.update(statsRef, {
                    totalDonations: statsDoc.data().totalDonations + finalAmount,
                    uniqueDonorsCount: statsDoc.data().uniqueDonorsCount + 1
                });
            });

            alert("Success! Your impact has been recorded.");
            setCustomAmount('');
        } catch (error) {
            console.error("Transaction failed: ", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="container py-2">
                <div className="row justify-content-center">
                    <div className="col-lg-8">
                        <div className="auth-card-custom p-0 overflow-hidden">
                            <div className="p-4 text-center border-bottom border-secondary border-opacity-25 bg-grad-action text-white">
                                <Heart size={32} className="mb-2" />
                                <h2 className="fw-bold mb-0">Focus Your Impact</h2>
                                <p className="small opacity-75 mb-0">Your contribution changes lives in real-time.</p>
                            </div>

                            <form onSubmit={handleDonation} className="p-4">
                                {/* IDENTITY */}
                                <div className="mb-4">
                                    <h6 className="text-info mb-3 d-flex align-items-center"><User size={16} className="me-2" /> Donor Identity</h6>
                                    <div className="form-check form-switch mb-3">
                                        <input
                                            className="form-check-input" type="checkbox" id="anon"
                                            checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)}
                                        />
                                        <label className="form-check-label text-white small ms-2" htmlFor="anon">Donate Anonymously</label>
                                    </div>
                                    {!isAnonymous && (
                                        <input
                                            type="text" className="form-control form-input-custom"
                                            placeholder="Display Name on Impact List"
                                            value={donorName} onChange={(e) => setDonorName(e.target.value)}
                                        />
                                    )}
                                </div>
                                {/* DONATION DETAILS*/}
                                <div className="mb-4">
                                    <h6 className="text-info mb-3 d-flex align-items-center"><DollarSign size={16} className="me-2" /> Amount & Focus</h6>
                                    <div className="d-flex flex-wrap gap-3 mb-4">
                                        {[25, 50, 100, 250].map(val => (
                                            <button
                                                key={val} type="button"
                                                className={`btn ${amount === val && !customAmount ? 'btn-grad-custom' : 'btn-outline-secondary text-white'}`}
                                                onClick={() => { setAmount(val); setCustomAmount(''); }}
                                            >
                                                ${val}
                                            </button>
                                        ))}
                                        <input
                                            type="number" className="form-control form-input-custom"
                                            style={{ width: '120px' }} placeholder="Custom"
                                            value={customAmount} onChange={(e) => { setCustomAmount(e.target.value); setAmount(0); }}
                                        />
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <h6 className="text-info mb-3 d-flex align-items-center"><Globe size={16} className="me-2" /> Target Region</h6>
                                            <select className="form-select form-input-custom" value={region} onChange={(e) => setRegion(e.target.value)}>
                                                {regions.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <h6 className="text-info mb-3 d-flex align-items-center"><HelpingHand size={16} className="me-2" /> Impact Type</h6>
                                            <select className="form-select form-input-custom" value={impactType} onChange={(e) => setImpactType(e.target.value)}>
                                                {impactTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* PAYMENT DETAILS */}
                                <div className="mb-4">
                                    <h6 className="text-info mb-3 d-flex align-items-center"><CreditCard size={16} className="me-2" /> Payment Details</h6>
                                    <input
                                        type="text" className="form-control form-input-custom mb-3"
                                        placeholder="Card Number"
                                        value={cardDetails.number} onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                                    />
                                    <div className="row">
                                        <div className="col-6">
                                            <input
                                                type="text" className="form-control form-input-custom"
                                                placeholder="MM/YY"
                                                value={cardDetails.expiry} onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-6">
                                            <input
                                                type="text" className="form-control form-input-custom"
                                                placeholder="CVC"
                                                value={cardDetails.cvc} onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" disabled={loading} className="btn btn-grad-custom w-100 py-3 fw-bold">
                                    {loading ? 'Processing...' : 'Complete Secure Donation'}
                                </button>

                                <div className="text-center mt-3">
                                    <span className="text-muted small"><ShieldCheck size={14} /> 256-bit Encrypted SSL Connection</span>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </motion.div>
        </DashboardLayout>
    );
};

export default DonatePage;
"use client";

interface PTSlabsModalProps {
    isOpen: boolean;
    onClose: () => void;
    state: string;
    slabs: any[];
}

export default function PTSlabsModal({ isOpen, onClose, state, slabs }: PTSlabsModalProps) {
    if (!isOpen) return null;

    return (
        <div style={{ 
            position: "fixed", 
            top: 0, left: 0, right: 0, bottom: 0, 
            background: "rgba(0,0,0,0.5)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            zIndex: 1100 
        }}>
            <div className="card shadow-lg" style={{ width: "500px", padding: "30px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                    <h3 style={{ fontWeight: 700 }}>PT Slabs - {state}</h3>
                    <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: "20px" }}>&times;</button>
                </div>

                <div className="table-wrapper">
                    <table style={{ background: "white" }}>
                        <thead>
                            <tr style={{ background: "#F8FAFC" }}>
                                <th>Salary Range (Monthly)</th>
                                <th>PT Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {slabs.length > 0 ? slabs.map((slab, i) => (
                                <tr key={i}>
                                    <td>
                                        ₹{slab.minSalary.toLocaleString()} - {slab.maxSalary ? `₹${slab.maxSalary.toLocaleString()}` : 'Above'}
                                    </td>
                                    <td>₹{slab.taxAmount.toLocaleString()}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={2} style={{ textAlign: "center", padding: "20px" }}>No slabs configured for this state.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={{ marginTop: "30px", display: "flex", justifyContent: "flex-end" }}>
                    <button className="btn btn-primary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}

import type { Dispatch, FormEvent, SetStateAction } from "react";
import { FiCalendar, FiEdit2, FiTrash2, FiXCircle } from "react-icons/fi";
import { LABEL_STYLE, MODAL_BG, type Candidate, type FeedbackForm, type Interview, type InterviewForm, type Person } from "./types";

interface InterviewsModalProps {
    candidate: Candidate;
    interviews: Interview[];
    people: Person[];
    interviewForm: InterviewForm;
    setInterviewForm: Dispatch<SetStateAction<InterviewForm>>;
    feedbackFor: string;
    setFeedbackFor: (id: string) => void;
    feedbackForm: FeedbackForm;
    setFeedbackForm: Dispatch<SetStateAction<FeedbackForm>>;
    onOpenFeedback: (iv: Interview) => void;
    onCancelInterview: (iv: Interview) => void;
    onSubmitFeedback: (e: FormEvent) => void;
    onSchedule: (e: FormEvent) => void;
    onClose: () => void;
}

/** A candidate's interviews: the list, feedback for one of them, and scheduling a new round. */
export default function InterviewsModal({
    candidate, interviews, people, interviewForm, setInterviewForm, feedbackFor, setFeedbackFor,
    feedbackForm, setFeedbackForm, onOpenFeedback, onCancelInterview, onSubmitFeedback, onSchedule, onClose,
}: InterviewsModalProps) {
    return (
        <div style={MODAL_BG}>
            <div className="card animate-in" style={{ width: "720px", maxHeight: "88vh", overflow: "auto", padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h2 style={{ margin: 0 }}>Interviews — {candidate.firstName} {candidate.lastName}</h2>
                    <button className="btn btn-secondary btn-sm" onClick={onClose}><FiXCircle /> Close</button>
                </div>
                {interviews.length === 0 ? (
                    <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No interviews scheduled yet.</p>
                ) : (
                    <div className="table-wrapper" style={{ marginBottom: "16px" }}>
                        <table>
                            <thead><tr><th>Round</th><th>When</th><th>Interviewer</th><th>Mode</th><th>Rating</th><th>Result</th><th></th></tr></thead>
                            <tbody>
                                {interviews.map(iv => (
                                    <tr key={iv._id}>
                                        <td style={{ fontWeight: 600 }}>{iv.round}</td>
                                        <td>{new Date(iv.scheduledAt).toLocaleString()}</td>
                                        <td>{iv.interviewer ? `${iv.interviewer.firstName} ${iv.interviewer.lastName}` : "-"}</td>
                                        <td>{iv.mode}{iv.location ? ` · ${iv.location}` : ""}</td>
                                        <td>{iv.rating ? `${iv.rating}/5` : "-"}</td>
                                        <td><span className={`badge ${iv.result === "passed" ? "active" : iv.result === "failed" || iv.result === "no-show" ? "inactive" : "pending"}`}>{iv.result}</span></td>
                                        <td>
                                            <div style={{ display: "flex", gap: "6px" }}>
                                                <button className="btn btn-secondary btn-sm" onClick={() => onOpenFeedback(iv)}><FiEdit2 /> Feedback</button>
                                                <button className="btn btn-secondary btn-sm" onClick={() => onCancelInterview(iv)} style={{ color: "var(--error)" }}><FiTrash2 /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {feedbackFor && (
                    <form onSubmit={onSubmitFeedback} style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px", border: "1px solid var(--border)", borderRadius: "10px", marginBottom: "16px" }}>
                        <h3 style={{ margin: 0, fontSize: "15px" }}>Record feedback</h3>
                        <div className="grid-2">
                            <div>
                                <label style={LABEL_STYLE}>Rating (1–5)</label>
                                <select className="form-input" value={feedbackForm.rating} onChange={e => setFeedbackForm({ ...feedbackForm, rating: e.target.value })}>
                                    <option value="">—</option>
                                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={LABEL_STYLE}>Result</label>
                                <select className="form-input" value={feedbackForm.result} onChange={e => setFeedbackForm({ ...feedbackForm, result: e.target.value })}>
                                    {["pending", "passed", "failed", "on-hold", "no-show"].map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label style={LABEL_STYLE}>Feedback</label>
                            <textarea className="form-input" rows={3} style={{ resize: "none" }} value={feedbackForm.feedback} onChange={e => setFeedbackForm({ ...feedbackForm, feedback: e.target.value })} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setFeedbackFor("")}>Cancel</button>
                            <button type="submit" className="btn btn-primary">Save Feedback</button>
                        </div>
                    </form>
                )}

                {!["hired", "rejected"].includes(candidate.status) && (
                    <form onSubmit={onSchedule} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <h3 style={{ margin: 0, fontSize: "15px" }}>Schedule an interview</h3>
                        <div className="grid-2">
                            <div>
                                <label style={LABEL_STYLE}>Round</label>
                                <input className="form-input" value={interviewForm.round || ""} onChange={e => setInterviewForm({ ...interviewForm, round: e.target.value })} />
                            </div>
                            <div>
                                <label style={LABEL_STYLE}>Interviewer *</label>
                                <select required className="form-input" value={interviewForm.interviewer || ""} onChange={e => setInterviewForm({ ...interviewForm, interviewer: e.target.value })}>
                                    <option value="">Select interviewer…</option>
                                    {people.map(p => <option key={p._id} value={p._id}>{p.firstName} {p.lastName}{p.designation ? ` — ${p.designation}` : ""}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid-2">
                            <div>
                                <label style={LABEL_STYLE}>Date &amp; time *</label>
                                <input required type="datetime-local" className="form-input" value={interviewForm.scheduledAt || ""} onChange={e => setInterviewForm({ ...interviewForm, scheduledAt: e.target.value })} />
                            </div>
                            <div>
                                <label style={LABEL_STYLE}>Duration (minutes)</label>
                                <input type="number" min={5} className="form-input" value={interviewForm.durationMinutes || 60} onChange={e => setInterviewForm({ ...interviewForm, durationMinutes: parseInt(e.target.value) || 60 })} />
                            </div>
                        </div>
                        <div className="grid-2">
                            <div>
                                <label style={LABEL_STYLE}>Mode</label>
                                <select className="form-input" value={interviewForm.mode} onChange={e => setInterviewForm({ ...interviewForm, mode: e.target.value })}>
                                    <option value="video">Video</option>
                                    <option value="phone">Phone</option>
                                    <option value="in-person">In person</option>
                                </select>
                            </div>
                            <div>
                                <label style={LABEL_STYLE}>{interviewForm.mode === "in-person" ? "Location" : "Meeting link / number"}</label>
                                <input className="form-input" value={interviewForm.location || ""} onChange={e => setInterviewForm({ ...interviewForm, location: e.target.value })} />
                            </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button type="submit" className="btn btn-primary"><FiCalendar /> Schedule</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

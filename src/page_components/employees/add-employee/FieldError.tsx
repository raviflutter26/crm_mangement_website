/** The inline message under a wizard field. */
export default function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <div style={{ color: "red", fontSize: "11px", marginTop: "4px" }}>{message}</div>;
}

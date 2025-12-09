import { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

function Notes({ tripId }) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const notesDoc = await getDoc(doc(db, "tripNotes", tripId));
        if (notesDoc.exists()) {
          setNotes(notesDoc.data().content || "");
        }
      } catch (error) {
        console.error("Error loading notes:", error);
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, [tripId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "tripNotes", tripId), {
        content: notes,
        updatedAt: new Date().toISOString(),
        tripId: tripId,
      });
      alert("✅ Notes saved!");
    } catch (error) {
      alert("Error saving notes: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          color: "#666",
        }}
      >
        Loading notes...
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "15px",
        }}
      >
        <h2 style={{ fontSize: "20px", color: "#333", margin: 0 }}>
          Trip Notes
        </h2>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "8px 16px",
            background: saving
              ? "#ccc"
              : "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            color: "white",
            border: "none",
            borderRadius: "20px",
            cursor: saving ? "not-allowed" : "pointer",
            fontSize: "13px",
            fontWeight: "bold",
            whiteSpace: "nowrap",
          }}
        >
          {saving ? "Saving..." : "💾 Save"}
        </button>
      </div>

      <div
        style={{
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Write general trip information here...&#10;&#10;Anything you want to remember!"
          style={{
            width: "100%",
            minHeight: "400px",
            padding: "20px",
            fontSize: "15px",
            lineHeight: "1.6",
            border: "none",
            outline: "none",
            fontFamily: "inherit",
            resize: "vertical",
            boxSizing: "border-box",
            color: "#333",
          }}
        />
      </div>

      <div
        style={{
          marginTop: "15px",
          padding: "12px",
          background: "#e3f2fd",
          borderRadius: "8px",
          fontSize: "13px",
          color: "#1565c0",
          border: "1px solid #90caf9",
        }}
      >
        💡 <strong>Tip:</strong> These notes are shared with all trip members.
        Use it for important info everyone should know!
      </div>
    </div>
  );
}

export default Notes;

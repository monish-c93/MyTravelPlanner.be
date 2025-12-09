import { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

function Checklist({ tripId }) {
  const [checklists, setChecklists] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [itemText, setItemText] = useState("");
  const [category, setCategory] = useState("Packing");

  useEffect(() => {
    const q = query(
      collection(db, "checklists"),
      where("tripId", "==", tripId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const checklistData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setChecklists(checklistData);
    });

    return () => unsubscribe();
  }, [tripId]);

  const handleAddItem = async (e) => {
    e.preventDefault();

    try {
      await addDoc(collection(db, "checklists"), {
        tripId: tripId,
        text: itemText,
        category: category,
        completed: false,
        createdAt: new Date().toISOString(),
      });

      setItemText("");
      setShowForm(false);
      alert("✅ Item added!");
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const toggleComplete = async (itemId, currentStatus) => {
    try {
      await updateDoc(doc(db, "checklists", itemId), {
        completed: !currentStatus,
      });
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const deleteItem = async (itemId) => {
    if (window.confirm("Delete this item?")) {
      try {
        await deleteDoc(doc(db, "checklists", itemId));
      } catch (error) {
        alert("Error: " + error.message);
      }
    }
  };

  const editItem = async (itemId, currentText) => {
    const newText = prompt("Edit item:", currentText);
    if (!newText || newText.trim() === "") return;

    try {
      await updateDoc(doc(db, "checklists", itemId), {
        text: newText.trim(),
      });
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const groupedChecklists = checklists.reduce((groups, item) => {
    const cat = item.category || "Other";
    if (!groups[cat]) {
      groups[cat] = [];
    }
    groups[cat].push(item);
    return groups;
  }, {});

  const categories = ["Packing", "Documents", "Bookings", "To-Do", "Other"];

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
          Checklist
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: "8px 16px",
            background: showForm
              ? "#f5576c"
              : "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
            color: "white",
            border: "none",
            borderRadius: "20px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "bold",
            whiteSpace: "nowrap",
          }}
        >
          {showForm ? "✕ Cancel" : "+ Add"}
        </button>
      </div>

      {showForm && (
        <div
          style={{
            background: "white",
            padding: "15px",
            borderRadius: "12px",
            marginBottom: "15px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <form onSubmit={handleAddItem}>
            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  color: "#555",
                  fontWeight: "600",
                  fontSize: "13px",
                }}
              >
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  fontSize: "15px",
                  borderRadius: "8px",
                  border: "2px solid #e0e0e0",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  color: "#555",
                  fontWeight: "600",
                  fontSize: "13px",
                }}
              >
                Item *
              </label>
              <input
                type="text"
                value={itemText}
                onChange={(e) => setItemText(e.target.value)}
                placeholder="e.g., Passport, Sunscreen"
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  fontSize: "15px",
                  borderRadius: "8px",
                  border: "2px solid #e0e0e0",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "12px",
                background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "15px",
                fontWeight: "bold",
              }}
            >
              Add to Checklist ✓
            </button>
          </form>
        </div>
      )}

      {checklists.length === 0 ? (
        <div
          style={{
            background: "white",
            padding: "40px 20px",
            borderRadius: "12px",
            textAlign: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "10px" }}>✓</div>
          <h3 style={{ color: "#333", marginBottom: "8px", fontSize: "16px" }}>
            No items yet
          </h3>
          <p style={{ color: "#666", fontSize: "14px" }}>
            Tap + Add to start your checklist!
          </p>
        </div>
      ) : (
        <div>
          {categories.map((cat) => {
            const items = groupedChecklists[cat];
            if (!items || items.length === 0) return null;

            const completedCount = items.filter(
              (item) => item.completed
            ).length;
            const totalCount = items.length;

            return (
              <div key={cat} style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <h3
                    style={{
                      color: "#333",
                      fontSize: "16px",
                      margin: 0,
                    }}
                  >
                    {cat}
                  </h3>
                  <span
                    style={{
                      padding: "4px 12px",
                      background:
                        completedCount === totalCount
                          ? "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
                          : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: "white",
                      borderRadius: "16px",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    {completedCount}/{totalCount}
                  </span>
                </div>

                <div
                  style={{
                    background: "white",
                    borderRadius: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    overflow: "hidden",
                  }}
                >
                  {items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: "12px 15px",
                        borderBottom: "1px solid #f0f0f0",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          marginBottom: "8px",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() =>
                            toggleComplete(item.id, item.completed)
                          }
                          style={{
                            width: "20px",
                            height: "20px",
                            minWidth: "20px",
                            cursor: "pointer",
                            accentColor: "#43e97b",
                          }}
                        />
                        <span
                          style={{
                            flex: 1,
                            fontSize: "15px",
                            color: item.completed ? "#999" : "#333",
                            textDecoration: item.completed
                              ? "line-through"
                              : "none",
                            wordBreak: "break-word",
                          }}
                        >
                          {item.text}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          paddingLeft: "32px",
                        }}
                      >
                        <button
                          onClick={() => editItem(item.id, item.text)}
                          style={{
                            flex: 1,
                            padding: "6px",
                            background: "transparent",
                            color: "#667eea",
                            border: "1px solid #667eea",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "bold",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          style={{
                            flex: 1,
                            padding: "6px",
                            background: "transparent",
                            color: "#dc3545",
                            border: "1px solid #dc3545",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "bold",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Checklist;

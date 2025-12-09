import Checklist from "./Checklist";
import Expenses from "./Expenses";
import { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  updateDoc,
  deleteDoc,
  getDocs,
} from "firebase/firestore";
import Notes from "./Notes";

// Member List Component with Name Fetching
function MembersList({ members, tripCreator, onRemove }) {
  const [memberNames, setMemberNames] = useState({});

  useEffect(() => {
    const fetchMemberNames = async () => {
      const names = {};

      for (const email of members) {
        const q = query(collection(db, "users"), where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          names[email] = querySnapshot.docs[0].data().name;
        } else {
          names[email] = email.split("@")[0];
        }
      }

      setMemberNames(names);
    };

    fetchMemberNames();
  }, [members]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {members.map((member, index) => (
        <div
          key={index}
          style={{
            background: "white",
            padding: "15px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            border: member === tripCreator ? "2px solid #667eea" : "none",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: member !== tripCreator ? "10px" : "0",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                minWidth: "40px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "bold",
                fontSize: "18px",
              }}
            >
              {(memberNames[member] || member).charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "16px",
                  color: "#333",
                  fontWeight: member === tripCreator ? "bold" : "600",
                  marginBottom: "2px",
                }}
              >
                {memberNames[member] || "Loading..."}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#888",
                  wordBreak: "break-word",
                }}
              >
                {member}
              </div>
              {member === tripCreator && (
                <div
                  style={{
                    fontSize: "11px",
                    color: "#667eea",
                    fontWeight: "bold",
                    marginTop: "4px",
                  }}
                >
                  ✓ Trip Creator
                </div>
              )}
            </div>
          </div>

          {member !== tripCreator && (
            <button
              onClick={() => onRemove(member)}
              style={{
                width: "100%",
                padding: "8px",
                background: "transparent",
                color: "#dc3545",
                border: "1px solid #dc3545",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "bold",
              }}
            >
              Remove
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function TripDetails({ tripId, onBack }) {
  const [trip, setTrip] = useState(null);
  const [itineraries, setItineraries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [activity, setActivity] = useState("");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState("");
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [activeTab, setActiveTab] = useState("itinerary");

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "trips", tripId), (docSnapshot) => {
      if (docSnapshot.exists()) {
        setTrip({ id: docSnapshot.id, ...docSnapshot.data() });
      }
    });

    return () => unsubscribe();
  }, [tripId]);

  useEffect(() => {
    const q = query(
      collection(db, "itineraries"),
      where("tripId", "==", tripId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itinerariesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItineraries(itinerariesData);
    });

    return () => unsubscribe();
  }, [tripId]);

  const handleAddItinerary = async (e) => {
    e.preventDefault();

    if (date < trip.startDate || date > trip.endDate) {
      const proceed = window.confirm(
        `⚠️ Warning: This activity date (${date}) is outside your trip dates (${trip.startDate} to ${trip.endDate}).\n\nDo you want to add it anyway?`
      );
      if (!proceed) return;
    }

    try {
      await addDoc(collection(db, "itineraries"), {
        tripId: tripId,
        date: date,
        time: time,
        activity: activity,
        location: location,
        notes: notes,
        createdAt: new Date().toISOString(),
      });

      setDate("");
      setTime("");
      setActivity("");
      setLocation("");
      setNotes("");
      setShowForm(false);
      alert("✅ Activity added!");
    } catch (error) {
      alert("Error adding activity: " + error.message);
    }
  };

  const handleEditItinerary = async (itemId, currentItem) => {
    const newActivity = prompt("Activity:", currentItem.activity);
    if (!newActivity) return;

    const newDate = prompt("Date (YYYY-MM-DD):", currentItem.date);
    if (!newDate) return;

    const newTime = prompt("Time (HH:MM):", currentItem.time);
    if (!newTime) return;

    const newLocation = prompt("Location:", currentItem.location || "");
    const newNotes = prompt("Notes:", currentItem.notes || "");

    if (newDate < trip.startDate || newDate > trip.endDate) {
      const proceed = window.confirm(
        `⚠️ Warning: This date (${newDate}) is outside your trip dates.\n\nUpdate anyway?`
      );
      if (!proceed) return;
    }

    try {
      await updateDoc(doc(db, "itineraries", itemId), {
        activity: newActivity,
        date: newDate,
        time: newTime,
        location: newLocation,
        notes: newNotes,
      });
      alert("✅ Activity updated!");
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const handleDeleteItinerary = async (itemId) => {
    if (!window.confirm("Delete this activity?")) return;

    try {
      await deleteDoc(doc(db, "itineraries", itemId));
      alert("✅ Deleted!");
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();

    if (!memberEmail.trim()) {
      alert("Please enter an email");
      return;
    }

    if (trip.members.includes(memberEmail.toLowerCase())) {
      alert("Already a member!");
      return;
    }

    try {
      const updatedMembers = [...trip.members, memberEmail.toLowerCase()];
      await updateDoc(doc(db, "trips", tripId), {
        members: updatedMembers,
      });

      setMemberEmail("");
      setShowMemberForm(false);
      alert("✅ Member added!");
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const handleRemoveMember = async (email) => {
    if (!window.confirm(`Remove ${email}?`)) return;

    if (email === trip.createdBy) {
      alert("Cannot remove trip creator!");
      return;
    }

    try {
      const updatedMembers = trip.members.filter((member) => member !== email);
      await updateDoc(doc(db, "trips", tripId), {
        members: updatedMembers,
      });
      alert("✅ Removed!");
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const groupedItineraries = itineraries.reduce((groups, item) => {
    const date = item.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {});

  if (!trip) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>
    );
  }

  const tabs = [
    { id: "members", icon: "👥", label: "Members" },
    { id: "itinerary", icon: "📅", label: "Itinerary" },
    { id: "expenses", icon: "💰", label: "Expenses" },
    { id: "checklist", icon: "✓", label: "Checklist" },
    { id: "notes", icon: "📝", label: "Notes" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        paddingBottom: "80px",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: "20px",
          color: "white",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <button
          onClick={onBack}
          style={{
            padding: "8px 16px",
            background: "rgba(255,255,255,0.2)",
            border: "1px solid white",
            color: "white",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "bold",
            marginBottom: "15px",
          }}
        >
          ← Back
        </button>

        <h1
          style={{
            margin: "0 0 8px 0",
            fontSize: "24px",
            fontWeight: "bold",
          }}
        >
          {trip.name}
        </h1>
        <p style={{ margin: "4px 0", fontSize: "14px", opacity: 0.9 }}>
          📍 {trip.destination}
        </p>
        <p style={{ margin: "4px 0", fontSize: "13px", opacity: 0.9 }}>
          📅 {trip.startDate} → {trip.endDate}
        </p>
      </div>

      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "white",
          borderTop: "1px solid #e0e0e0",
          display: "flex",
          justifyContent: "space-around",
          padding: "8px 0",
          zIndex: 100,
          boxShadow: "0 -2px 10px rgba(0,0,0,0.1)",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: "10px 8px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              color: activeTab === tab.id ? "#667eea" : "#999",
              fontWeight: activeTab === tab.id ? "bold" : "normal",
              fontSize: "12px",
              transition: "all 0.3s ease",
            }}
          >
            <span style={{ fontSize: "20px" }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div style={{ padding: "15px" }}>
        {/* Members Tab */}
        {activeTab === "members" && (
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
                Members ({trip.members.length})
              </h2>
              <button
                onClick={() => setShowMemberForm(!showMemberForm)}
                style={{
                  padding: "8px 16px",
                  background: showMemberForm
                    ? "#f5576c"
                    : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "20px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "bold",
                  whiteSpace: "nowrap",
                }}
              >
                {showMemberForm ? "✕ Cancel" : "+ Add"}
              </button>
            </div>

            {showMemberForm && (
              <div
                style={{
                  background: "white",
                  padding: "15px",
                  borderRadius: "12px",
                  marginBottom: "15px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                <form onSubmit={handleAddMember}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      color: "#555",
                      fontWeight: "600",
                      fontSize: "13px",
                    }}
                  >
                    Member Email
                  </label>
                  <input
                    type="email"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    placeholder="friend@example.com"
                    required
                    style={{
                      width: "100%",
                      padding: "12px",
                      fontSize: "15px",
                      borderRadius: "8px",
                      border: "2px solid #e0e0e0",
                      outline: "none",
                      marginBottom: "10px",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      width: "100%",
                      padding: "12px",
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "15px",
                      fontWeight: "bold",
                    }}
                  >
                    Add Member
                  </button>
                </form>
              </div>
            )}

            <MembersList
              members={trip.members}
              tripCreator={trip.createdBy}
              onRemove={handleRemoveMember}
            />
          </div>
        )}

        {/* Itinerary Tab */}
        {activeTab === "itinerary" && (
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
                Activities ({itineraries.length})
              </h2>
              <button
                onClick={() => setShowForm(!showForm)}
                style={{
                  padding: "8px 16px",
                  background: showForm
                    ? "#f5576c"
                    : "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
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
                <h3
                  style={{
                    marginTop: 0,
                    marginBottom: "15px",
                    color: "#333",
                    fontSize: "16px",
                  }}
                >
                  Add Activity
                </h3>
                <form onSubmit={handleAddItinerary}>
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
                      Date *
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={trip.startDate}
                      max={trip.endDate}
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
                      Time *
                    </label>
                    <select
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
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
                    >
                      <option value="">Select time</option>
                      <option value="00:00">12:00 AM</option>
                      <option value="06:00">6:00 AM</option>
                      <option value="07:00">7:00 AM</option>
                      <option value="08:00">8:00 AM</option>
                      <option value="09:00">9:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="13:00">1:00 PM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="15:00">3:00 PM</option>
                      <option value="16:00">4:00 PM</option>
                      <option value="17:00">5:00 PM</option>
                      <option value="18:00">6:00 PM</option>
                      <option value="19:00">7:00 PM</option>
                      <option value="20:00">8:00 PM</option>
                      <option value="21:00">9:00 PM</option>
                      <option value="22:00">10:00 PM</option>
                      <option value="23:00">11:00 PM</option>
                    </select>
                  </div>

                  {date && (date < trip.startDate || date > trip.endDate) && (
                    <div
                      style={{
                        padding: "10px",
                        background: "#fff3cd",
                        border: "1px solid #ffc107",
                        borderRadius: "8px",
                        marginBottom: "12px",
                        fontSize: "13px",
                        color: "#856404",
                      }}
                    >
                      ⚠️ Date outside trip range
                    </div>
                  )}

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
                      Activity *
                    </label>
                    <input
                      type="text"
                      value={activity}
                      onChange={(e) => setActivity(e.target.value)}
                      placeholder="e.g., Visit Eiffel Tower"
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
                      Location
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., Paris, France"
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
                      Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any notes..."
                      rows="3"
                      style={{
                        width: "100%",
                        padding: "12px",
                        fontSize: "15px",
                        borderRadius: "8px",
                        border: "2px solid #e0e0e0",
                        outline: "none",
                        fontFamily: "inherit",
                        resize: "vertical",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      width: "100%",
                      padding: "12px",
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "15px",
                      fontWeight: "bold",
                    }}
                  >
                    Add Activity 📝
                  </button>
                </form>
              </div>
            )}

            {Object.keys(groupedItineraries).length === 0 ? (
              <div
                style={{
                  background: "white",
                  padding: "40px 20px",
                  borderRadius: "12px",
                  textAlign: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                <div style={{ fontSize: "48px", marginBottom: "10px" }}>📅</div>
                <h3
                  style={{
                    color: "#333",
                    marginBottom: "8px",
                    fontSize: "16px",
                  }}
                >
                  No activities yet
                </h3>
                <p style={{ color: "#666", fontSize: "14px" }}>
                  Tap + Add to start planning!
                </p>
              </div>
            ) : (
              Object.keys(groupedItineraries)
                .sort()
                .map((date) => (
                  <div key={date} style={{ marginBottom: "20px" }}>
                    <h3
                      style={{
                        color: "#333",
                        fontSize: "16px",
                        marginBottom: "10px",
                        paddingBottom: "8px",
                        borderBottom: "2px solid #667eea",
                      }}
                    >
                      📅{" "}
                      {new Date(date + "T00:00:00").toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </h3>

                    {groupedItineraries[date].map((item) => (
                      <div
                        key={item.id}
                        style={{
                          background: "white",
                          padding: "15px",
                          borderRadius: "12px",
                          marginBottom: "10px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                          borderLeft: "4px solid #667eea",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: "12px",
                            marginBottom: "10px",
                          }}
                        >
                          <div
                            style={{
                              padding: "6px 10px",
                              background:
                                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                              color: "white",
                              borderRadius: "6px",
                              fontSize: "13px",
                              fontWeight: "bold",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.time}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4
                              style={{
                                margin: "0 0 6px 0",
                                color: "#333",
                                fontSize: "15px",
                                fontWeight: "bold",
                              }}
                            >
                              {item.activity}
                            </h4>

                            {item.location && (
                              <p
                                style={{
                                  margin: "4px 0",
                                  color: "#666",
                                  fontSize: "13px",
                                }}
                              >
                                📍 {item.location}
                              </p>
                            )}

                            {item.notes && (
                              <p
                                style={{
                                  margin: "6px 0 0 0",
                                  color: "#888",
                                  fontSize: "13px",
                                  fontStyle: "italic",
                                }}
                              >
                                💡 {item.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                          }}
                        >
                          <button
                            onClick={() => handleEditItinerary(item.id, item)}
                            style={{
                              flex: 1,
                              padding: "8px",
                              background: "#667eea",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "13px",
                              fontWeight: "bold",
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteItinerary(item.id)}
                            style={{
                              flex: 1,
                              padding: "8px",
                              background: "#f5576c",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "13px",
                              fontWeight: "bold",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
            )}
          </div>
        )}

        {/* Expenses Tab */}
        {activeTab === "expenses" && (
          <Expenses tripId={tripId} tripMembers={trip.members} />
        )}

        {/* Checklist Tab */}
        {activeTab === "checklist" && <Checklist tripId={tripId} />}
        {/* Notes Tab */}
        {activeTab === "notes" && <Notes tripId={tripId} />}
      </div>
    </div>
  );
}

export default TripDetails;

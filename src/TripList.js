import { useState, useEffect } from "react";
import { db, auth } from "./firebase";
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
import TripDetails from "./TripDetails";

function TripList() {
  const [trips, setTrips] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [tripName, setTripName] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedTrip, setSelectedTrip] = useState(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "trips"),
      where("members", "array-contains", auth.currentUser.email)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tripsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTrips(tripsData);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateTrip = async (e) => {
    e.preventDefault();

    // Check for overlapping trips
    const hasOverlap = trips.some((trip) => {
      const tripStart = new Date(trip.startDate);
      const tripEnd = new Date(trip.endDate);
      const newStart = new Date(startDate);
      const newEnd = new Date(endDate);

      return newStart <= tripEnd && newEnd >= tripStart;
    });

    if (hasOverlap) {
      const proceed = window.confirm(
        `⚠️ Warning: This trip overlaps with one or more of your existing trips!\n\nDo you want to create it anyway?`
      );
      if (!proceed) return;
    }

    try {
      await addDoc(collection(db, "trips"), {
        name: tripName,
        destination: destination,
        startDate: startDate,
        endDate: endDate,
        members: [auth.currentUser.email],
        createdBy: auth.currentUser.email,
        createdAt: new Date().toISOString(),
      });

      setTripName("");
      setDestination("");
      setStartDate("");
      setEndDate("");
      setShowForm(false);
      alert("🎉 Trip created successfully!");
    } catch (error) {
      alert("Error creating trip: " + error.message);
    }
  };

  const handleEditTrip = async (tripId, currentTrip) => {
    const newName = prompt("Trip Name:", currentTrip.name);
    if (!newName) return;

    const newDestination = prompt("Destination:", currentTrip.destination);
    if (!newDestination) return;

    let newStartDate = prompt(
      "Start Date (YYYY-MM-DD):",
      currentTrip.startDate
    );
    if (!newStartDate) return;

    let newEndDate = prompt("End Date (YYYY-MM-DD):", currentTrip.endDate);
    if (!newEndDate) return;

    // Validate end date is not before start date
    if (newEndDate < newStartDate) {
      alert("❌ End date cannot be before start date!");
      return;
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(newStartDate) || !dateRegex.test(newEndDate)) {
      alert("❌ Please use the format YYYY-MM-DD (e.g., 2025-12-25)");
      return;
    }

    // Check for overlapping trips (excluding current trip)
    const hasOverlap = trips.some((trip) => {
      if (trip.id === tripId) return false;

      const tripStart = new Date(trip.startDate);
      const tripEnd = new Date(trip.endDate);
      const newStart = new Date(newStartDate);
      const newEnd = new Date(newEndDate);

      return newStart <= tripEnd && newEnd >= tripStart;
    });

    if (hasOverlap) {
      const proceed = window.confirm(
        `⚠️ Warning: These dates overlap with another trip!\n\nUpdate anyway?`
      );
      if (!proceed) return;
    }

    try {
      await updateDoc(doc(db, "trips", tripId), {
        name: newName,
        destination: newDestination,
        startDate: newStartDate,
        endDate: newEndDate,
      });
      alert("✅ Trip updated successfully!");
    } catch (error) {
      alert("Error updating trip: " + error.message);
    }
  };

  const handleDeleteTrip = async (tripId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this trip? This will also delete all itineraries and checklists for this trip."
      )
    ) {
      return;
    }

    try {
      await deleteDoc(doc(db, "trips", tripId));
      alert("✅ Trip deleted successfully!");
    } catch (error) {
      alert("Error deleting trip: " + error.message);
    }
  };

  if (selectedTrip) {
    return (
      <TripDetails tripId={selectedTrip} onBack={() => setSelectedTrip(null)} />
    );
  }

  return (
    <div
      style={{
        padding: "40px 20px",
        maxWidth: "1000px",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <h2
          style={{
            fontSize: "32px",
            color: "#333",
            margin: 0,
          }}
        >
          My Trips
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: "12px 28px",
            background: showForm
              ? "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
              : "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
            color: "white",
            border: "none",
            borderRadius: "25px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            boxShadow: "0 4px 15px rgba(79, 172, 254, 0.4)",
          }}
          onMouseOver={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 6px 20px rgba(79, 172, 254, 0.6)";
          }}
          onMouseOut={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 15px rgba(79, 172, 254, 0.4)";
          }}
        >
          {showForm ? "✕ Cancel" : "+ New Trip"}
        </button>
      </div>

      {showForm && (
        <div
          style={{
            background: "white",
            padding: "30px",
            borderRadius: "16px",
            marginBottom: "30px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: "25px",
              color: "#333",
              fontSize: "24px",
            }}
          >
            Create New Trip
          </h3>
          <form onSubmit={handleCreateTrip}>
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#555",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                Trip Name *
              </label>
              <input
                type="text"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                placeholder="e.g., Europe Summer Adventure"
                required
                style={{
                  width: "100%",
                  padding: "14px",
                  fontSize: "16px",
                  borderRadius: "10px",
                  border: "2px solid #e0e0e0",
                  outline: "none",
                  backgroundColor: "#f8f9fa",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#555",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                Destination *
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g., Paris, France"
                required
                style={{
                  width: "100%",
                  padding: "14px",
                  fontSize: "16px",
                  borderRadius: "10px",
                  border: "2px solid #e0e0e0",
                  outline: "none",
                  backgroundColor: "#f8f9fa",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
              />
            </div>

            <div style={{ display: "flex", gap: "20px", marginBottom: "25px" }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "#555",
                    fontWeight: "600",
                    fontSize: "14px",
                  }}
                >
                  Start Date *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "14px",
                    fontSize: "16px",
                    borderRadius: "10px",
                    border: "2px solid #e0e0e0",
                    outline: "none",
                    backgroundColor: "#f8f9fa",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                  onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "#555",
                    fontWeight: "600",
                    fontSize: "14px",
                  }}
                >
                  End Date *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  min={startDate}
                  style={{
                    width: "100%",
                    padding: "14px",
                    fontSize: "16px",
                    borderRadius: "10px",
                    border: "2px solid #e0e0e0",
                    outline: "none",
                    backgroundColor: "#f8f9fa",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                  onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
                />
              </div>
            </div>

            <button
              type="submit"
              style={{
                padding: "14px 32px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "bold",
                boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
              }}
              onMouseOver={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow =
                  "0 6px 20px rgba(102, 126, 234, 0.6)";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow =
                  "0 4px 15px rgba(102, 126, 234, 0.4)";
              }}
            >
              Create Trip ✈️
            </button>
          </form>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "25px",
        }}
      >
        {trips.length === 0 ? (
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "60px 20px",
              background: "white",
              borderRadius: "16px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ fontSize: "64px", marginBottom: "20px" }}>✈️</div>
            <h3 style={{ color: "#333", marginBottom: "10px" }}>
              No trips yet
            </h3>
            <p style={{ color: "#666" }}>
              Create your first trip to get started!
            </p>
          </div>
        ) : (
          trips.map((trip) => (
            <div
              key={trip.id}
              onClick={() => setSelectedTrip(trip.id)}
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "25px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow =
                  "0 15px 50px rgba(0,0,0,0.15)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 10px 40px rgba(0,0,0,0.1)";
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "6px",
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                }}
              ></div>

              <h3
                style={{
                  marginTop: "10px",
                  marginBottom: "15px",
                  color: "#333",
                  fontSize: "20px",
                }}
              >
                {trip.name}
              </h3>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "12px",
                  color: "#666",
                }}
              >
                <span style={{ fontSize: "20px", marginRight: "10px" }}>
                  📍
                </span>
                <span style={{ fontSize: "15px" }}>{trip.destination}</span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "12px",
                  color: "#666",
                }}
              >
                <span style={{ fontSize: "20px", marginRight: "10px" }}>
                  📅
                </span>
                <span style={{ fontSize: "14px" }}>
                  {trip.startDate} → {trip.endDate}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: "#666",
                  marginBottom: "15px",
                }}
              >
                <span style={{ fontSize: "20px", marginRight: "10px" }}>
                  👥
                </span>
                <span style={{ fontSize: "14px" }}>
                  {trip.members.length} member
                  {trip.members.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div
                style={{
                  marginTop: "20px",
                  paddingTop: "15px",
                  borderTop: "1px solid #e0e0e0",
                  display: "flex",
                  gap: "10px",
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditTrip(trip.id, trip);
                  }}
                  style={{
                    flex: 1,
                    padding: "8px 16px",
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "bold",
                  }}
                  onMouseOver={(e) => (e.target.style.opacity = "0.8")}
                  onMouseOut={(e) => (e.target.style.opacity = "1")}
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTrip(trip.id);
                  }}
                  style={{
                    flex: 1,
                    padding: "8px 16px",
                    background:
                      "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "bold",
                  }}
                  onMouseOver={(e) => (e.target.style.opacity = "0.8")}
                  onMouseOut={(e) => (e.target.style.opacity = "1")}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TripList;

import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import TripList from "./TripList";

function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchUserName = async () => {
      if (user) {
        const q = query(collection(db, "users"), where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setUserName(querySnapshot.docs[0].data().name);
        }
      }
    };
    fetchUserName();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        setUser(userCredential.user);
      } else {
        if (!name.trim()) {
          setError("Please enter your name");
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        await addDoc(collection(db, "users"), {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          name: name,
          createdAt: new Date().toISOString(),
        });

        setUser(userCredential.user);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserName("");
      setEmail("");
      setPassword("");
      setName("");
    } catch (err) {
      setError(err.message);
    }
  };

  if (user) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f0f2f5" }}>
        {/* Fixed Mobile-Optimized Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            padding: "15px 20px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            color: "white",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              maxWidth: "1200px",
              margin: "0 auto",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: "bold",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                ✈️ Travel Planner
              </h2>
              <p
                style={{
                  margin: "4px 0 0 0",
                  fontSize: "13px",
                  opacity: 0.9,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {userName || user.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: "8px 16px",
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "white",
                border: "1px solid rgba(255, 255, 255, 0.5)",
                borderRadius: "20px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
                whiteSpace: "nowrap",
                marginLeft: "10px",
                backdropFilter: "blur(10px)",
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
              }}
            >
              Logout
            </button>
          </div>
        </div>
        <TripList />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      {/* Login Form */}
      <div
        style={{
          maxWidth: "440px",
          width: "100%",
          background: "white",
          padding: "40px",
          borderRadius: "20px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div style={{ fontSize: "50px", marginBottom: "15px" }}>✈️</div>
          <h1
            style={{
              fontSize: "32px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: "10px",
              fontWeight: "bold",
            }}
          >
            Travel Planner
          </h1>
          <p style={{ color: "#666", fontSize: "16px", margin: 0 }}>
            {isLogin ? "Welcome back!" : "Create your account"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#333",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                Your Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
                style={{
                  width: "100%",
                  padding: "14px",
                  fontSize: "16px",
                  borderRadius: "10px",
                  border: "2px solid #e0e0e0",
                  outline: "none",
                  backgroundColor: "#f8f9fa",
                  boxSizing: "border-box",
                  transition: "border-color 0.3s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
              />
            </div>
          )}

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#333",
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
                transition: "border-color 0.3s",
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
                color: "#333",
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
                transition: "border-color 0.3s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#667eea")}
              onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
            />
          </div>

          {error && (
            <div
              style={{
                padding: "12px",
                backgroundColor: "#fee",
                color: "#c33",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "14px",
                border: "1px solid #fcc",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "16px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "18px",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
              transition: "all 0.3s",
            }}
            onMouseOver={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.6)";
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.4)";
            }}
          >
            {isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        <div
          style={{
            textAlign: "center",
            marginTop: "25px",
            paddingTop: "25px",
            borderTop: "1px solid #e0e0e0",
          }}
        >
          <span style={{ color: "#666" }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            onClick={() => setIsLogin(!isLogin)}
            style={{
              background: "none",
              border: "none",
              color: "#667eea",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "16px",
            }}
            onMouseOver={(e) => (e.target.style.textDecoration = "underline")}
            onMouseOut={(e) => (e.target.style.textDecoration = "none")}
          >
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Auth;

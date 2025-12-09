import { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

// Common currencies
const CURRENCIES = [
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
];

function Expenses({ tripId, tripMembers }) {
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [paidBy, setPaidBy] = useState("");
  const [splitAmong, setSplitAmong] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "expenses"), where("tripId", "==", tripId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expensesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setExpenses(expensesData);
    });

    return () => unsubscribe();
  }, [tripId]);

  const handleAddExpense = async (e) => {
    e.preventDefault();

    if (splitAmong.length === 0) {
      alert("Please select at least one person");
      return;
    }

    try {
      if (editingExpense) {
        // Update existing expense
        await updateDoc(doc(db, "expenses", editingExpense.id), {
          description: description,
          amount: parseFloat(amount),
          currency: currency,
          paidBy: paidBy,
          splitAmong: splitAmong,
          updatedAt: new Date().toISOString(),
        });
        alert("✅ Expense updated!");
      } else {
        // Add new expense
        await addDoc(collection(db, "expenses"), {
          tripId: tripId,
          description: description,
          amount: parseFloat(amount),
          currency: currency,
          paidBy: paidBy,
          splitAmong: splitAmong,
          createdAt: new Date().toISOString(),
          createdBy: auth.currentUser.email,
        });
        alert("✅ Expense added!");
      }

      resetForm();
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setDescription(expense.description);
    setAmount(expense.amount.toString());
    setCurrency(expense.currency || "EUR");
    setPaidBy(expense.paidBy);
    setSplitAmong(expense.splitAmong);
    setShowForm(true);
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm("Delete this expense?")) return;

    try {
      await deleteDoc(doc(db, "expenses", expenseId));
      alert("✅ Deleted!");
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const resetForm = () => {
    setDescription("");
    setAmount("");
    setCurrency("EUR");
    setPaidBy("");
    setSplitAmong([]);
    setShowForm(false);
    setEditingExpense(null);
  };

  const toggleSplitMember = (member) => {
    if (splitAmong.includes(member)) {
      setSplitAmong(splitAmong.filter((m) => m !== member));
    } else {
      setSplitAmong([...splitAmong, member]);
    }
  };

  const calculateBalances = () => {
    const balancesByCurrency = {};

    expenses.forEach((expense) => {
      const curr = expense.currency || "EUR";

      if (!balancesByCurrency[curr]) {
        balancesByCurrency[curr] = {};
        tripMembers.forEach((member) => {
          balancesByCurrency[curr][member] = 0;
        });
      }

      const sharePerPerson = expense.amount / expense.splitAmong.length;
      balancesByCurrency[curr][expense.paidBy] += expense.amount;
      expense.splitAmong.forEach((member) => {
        balancesByCurrency[curr][member] -= sharePerPerson;
      });
    });

    return balancesByCurrency;
  };

  const calculateSettlements = (balances) => {
    const settlements = [];

    const creditors = Object.entries(balances)
      .filter(([_, balance]) => balance > 0.01)
      .sort((a, b) => b[1] - a[1]);

    const debtors = Object.entries(balances)
      .filter(([_, balance]) => balance < -0.01)
      .sort((a, b) => a[1] - b[1]);

    let i = 0,
      j = 0;

    while (i < creditors.length && j < debtors.length) {
      const [creditor, creditAmount] = creditors[i];
      const [debtor, debtAmount] = debtors[j];

      const settleAmount = Math.min(creditAmount, Math.abs(debtAmount));

      settlements.push({
        from: debtor,
        to: creditor,
        amount: settleAmount,
      });

      creditors[i][1] -= settleAmount;
      debtors[j][1] += settleAmount;

      if (creditors[i][1] < 0.01) i++;
      if (Math.abs(debtors[j][1]) < 0.01) j++;
    }

    return settlements;
  };

  const getCurrencySymbol = (code) => {
    const curr = CURRENCIES.find((c) => c.code === code);
    return curr ? curr.symbol : code;
  };

  const balancesByCurrency = calculateBalances();
  const totalsByCurrency = {};

  expenses.forEach((exp) => {
    const curr = exp.currency || "EUR";
    totalsByCurrency[curr] = (totalsByCurrency[curr] || 0) + exp.amount;
  });

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
        <div>
          <h2 style={{ fontSize: "20px", color: "#333", margin: 0 }}>
            Expenses
          </h2>
          <div style={{ marginTop: "6px" }}>
            {Object.entries(totalsByCurrency).map(([curr, total]) => (
              <div
                key={curr}
                style={{
                  color: "#666",
                  fontSize: "13px",
                  fontWeight: "bold",
                }}
              >
                {getCurrencySymbol(curr)} {total.toFixed(2)}
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
          style={{
            padding: "8px 16px",
            background: showForm
              ? "#f5576c"
              : "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
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
            {editingExpense ? "Edit Expense" : "Add Expense"}
          </h3>
          <form onSubmit={handleAddExpense}>
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
                Description *
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Hotel, Dinner"
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

            <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
              <div style={{ flex: 2 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    color: "#555",
                    fontWeight: "600",
                    fontSize: "13px",
                  }}
                >
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
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

              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    color: "#555",
                    fontWeight: "600",
                    fontSize: "13px",
                  }}
                >
                  Currency *
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
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
                  {CURRENCIES.map((curr) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.symbol} {curr.code}
                    </option>
                  ))}
                </select>
              </div>
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
                Paid By *
              </label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
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
                <option value="">Select who paid</option>
                {tripMembers.map((member) => (
                  <option key={member} value={member}>
                    {member}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#555",
                  fontWeight: "600",
                  fontSize: "13px",
                }}
              >
                Split Among *
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {tripMembers.map((member) => (
                  <button
                    key={member}
                    type="button"
                    onClick={() => toggleSplitMember(member)}
                    style={{
                      padding: "8px 12px",
                      background: splitAmong.includes(member)
                        ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                        : "#f0f0f0",
                      color: splitAmong.includes(member) ? "white" : "#333",
                      border: "none",
                      borderRadius: "16px",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: splitAmong.includes(member)
                        ? "bold"
                        : "normal",
                    }}
                  >
                    {splitAmong.includes(member) ? "✓ " : ""}
                    {member.split("@")[0]}
                  </button>
                ))}
              </div>
              {splitAmong.length > 0 && (
                <p
                  style={{
                    marginTop: "8px",
                    fontSize: "13px",
                    color: "#666",
                  }}
                >
                  {getCurrencySymbol(currency)}{" "}
                  {amount
                    ? (parseFloat(amount) / splitAmong.length).toFixed(2)
                    : "0.00"}{" "}
                  per person
                </p>
              )}
            </div>

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "12px",
                background: editingExpense
                  ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  : "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "15px",
                fontWeight: "bold",
              }}
            >
              {editingExpense ? "✓ Update Expense" : "Add Expense 💰"}
            </button>
          </form>
        </div>
      )}

      {expenses.length > 0 && Object.keys(balancesByCurrency).length > 0 && (
        <div style={{ marginBottom: "15px" }}>
          {Object.entries(balancesByCurrency).map(([curr, balances]) => {
            const settlements = calculateSettlements(balances);
            if (settlements.length === 0) return null;

            return (
              <div
                key={curr}
                style={{
                  background:
                    "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
                  padding: "15px",
                  borderRadius: "12px",
                  marginBottom: "10px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                <h3
                  style={{
                    marginTop: 0,
                    marginBottom: "12px",
                    color: "#333",
                    fontSize: "16px",
                  }}
                >
                  💸 Who Owes Whom ({getCurrencySymbol(curr)})
                </h3>
                {settlements.map((settlement, index) => (
                  <div
                    key={index}
                    style={{
                      background: "white",
                      padding: "12px",
                      borderRadius: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#333",
                        marginBottom: "6px",
                      }}
                    >
                      <strong>{settlement.from.split("@")[0]}</strong> owes{" "}
                      <strong>{settlement.to.split("@")[0]}</strong>
                    </div>
                    <div
                      style={{
                        padding: "6px 12px",
                        background:
                          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "white",
                        borderRadius: "16px",
                        fontWeight: "bold",
                        fontSize: "16px",
                        display: "inline-block",
                      }}
                    >
                      {getCurrencySymbol(curr)} {settlement.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {expenses.length === 0 ? (
        <div
          style={{
            background: "white",
            padding: "40px 20px",
            borderRadius: "12px",
            textAlign: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "10px" }}>💰</div>
          <h3 style={{ color: "#333", marginBottom: "8px", fontSize: "16px" }}>
            No expenses yet
          </h3>
          <p style={{ color: "#666", fontSize: "14px" }}>
            Tap + Add to start tracking!
          </p>
        </div>
      ) : (
        <div>
          <h3 style={{ fontSize: "16px", color: "#333", marginBottom: "12px" }}>
            All Expenses ({expenses.length})
          </h3>
          {expenses.map((expense) => (
            <div
              key={expense.id}
              style={{
                background: "white",
                padding: "15px",
                borderRadius: "12px",
                marginBottom: "10px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "10px",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4
                    style={{
                      margin: "0 0 6px 0",
                      color: "#333",
                      fontSize: "15px",
                      fontWeight: "bold",
                    }}
                  >
                    {expense.description}
                  </h4>
                  <p
                    style={{ margin: "4px 0", color: "#666", fontSize: "13px" }}
                  >
                    💳 Paid by: <strong>{expense.paidBy.split("@")[0]}</strong>
                  </p>
                  <p
                    style={{ margin: "4px 0", color: "#666", fontSize: "13px" }}
                  >
                    👥 Split:{" "}
                    {expense.splitAmong.map((m) => m.split("@")[0]).join(", ")}
                  </p>
                  <p
                    style={{ margin: "4px 0", color: "#888", fontSize: "12px" }}
                  >
                    {getCurrencySymbol(expense.currency || "EUR")}{" "}
                    {(expense.amount / expense.splitAmong.length).toFixed(2)}{" "}
                    per person
                  </p>
                </div>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#667eea",
                    marginLeft: "10px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {getCurrencySymbol(expense.currency || "EUR")}{" "}
                  {expense.amount.toFixed(2)}
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleEditExpense(expense)}
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
                  onClick={() => handleDeleteExpense(expense.id)}
                  style={{
                    flex: 1,
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
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Expenses;

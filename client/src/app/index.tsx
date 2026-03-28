import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  Alert,
  StyleSheet,
} from "react-native";

// Define each expense object coming back from API
type Expense = {
  id: number;
  title: string;
  amount: number;
  date: string;
  category: string;
  note: string;
};

export default function Index() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  // Controlled inputs driven by state, onChangeText triggers re-render
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await fetch("http://localhost:3000/api");
      const data = await res.json();
      setExpenses(data);
    } catch (err) {
      console.log(err);
    }
  };

  const addExpense = async () => {
    // Validation used to check required fields before anything hits the server
    // trim() strips whitespace so a blank space doesn't count as valid input
    if (!title.trim() || !amount.trim() || !date.trim() || !category.trim()) {
      Alert.alert("Missing fields", "Please fill in title, amount, date, and category.");
      return; // exits early, nothing gets sent
    }

    try {
      // POST request to the API with the form data as JSON in the body
      const res = await fetch("http://localhost:3000/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" }, // tells server to expect JSON
        body: JSON.stringify({
          title: title.trim(),
          amount: Number(amount), // TextInput always returns a string, convert to number
          date: date.trim(),
          category: category.trim(),
          note: note.trim(),
        }),
      });

      const data = await res.json();
      console.log(data);

      // clear all form fields after a successful submission
      setTitle(""); setAmount(""); setDate(""); setCategory(""); setNote("");

      // refetch the list so the new expense appears immediately
      await fetchExpenses();

    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Error, couldn't add expense.");
    }
  };

  // DELETE single expense by ID — sends DELETE to /api/:id
  const deleteExpense = async (id: number) => {
    try {
      await fetch(`http://localhost:3000/api/${id}`, {
        method: "DELETE",
      });
      await fetchExpenses(); // refresh list after deletion
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Couldn't delete expense.");
    }
  };

  // DELETE all expenses which sends DELETE to /api with no ID, wipes the whole table
  const clearAllExpenses = async () => {
    try {
      await fetch("http://localhost:3000/api", {
        method: "DELETE",
      });
      await fetchExpenses();
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Couldn't clear expenses.");
    }
  };

    // GET single expense by ID and store it in selectedExpense state
  // used to show the detail view for one specific record
  const viewExpense = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:3000/api/${id}`);
      const data = await res.json();
      setSelectedExpense(data); // triggers detail view to render
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Couldn't load expense details.");
    }
  };

  // GET single expense by ID and populate the form fields with its data
  // sets editingId so the form knows it's in edit mode, not create mode
  const startEditExpense = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:3000/api/${id}`);
      const data = await res.json();
      setEditingId(data.id);
      setTitle(data.title);
      setAmount(String(data.amount)); // amount is a number in DB, convert back to string for TextInput
      setDate(data.date);
      setCategory(data.category);
      setNote(data.note || ""); // fallback to empty string if note is null
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Couldn't load expense for editing.");
    }
  };

  // PUT request is sent to update the expense, only runs if editingId is set
  // similar validation as addExpense, required fields checked before hitting the server
  const updateExpense = async () => {
    if (editingId === null) return; // guard — do nothing if not in edit mode
    if (!title.trim() || !amount.trim() || !date.trim() || !category.trim()) {
      Alert.alert("Missing fields", "Please fill in title, amount, date, and category.");
      return;
    }
    try {
      await fetch(`http://localhost:3000/api/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          amount: Number(amount), // convert string back to number before sending
          date: date.trim(),
          category: category.trim(),
          note: note.trim(),
        }),
      });

      setEditingId(null); // exit edit mode
      setTitle(""); setAmount(""); setDate(""); setCategory(""); setNote(""); // clear form

      await fetchExpenses(); // refresh the list

      // if the updated expense is currently being viewed, refresh the detail view too
      if (selectedExpense && selectedExpense.id === editingId) {
        await viewExpense(editingId);
      }
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Couldn't update expense.");
    }
  };

  // Cancel edit mode, clears editingId and resets all form fields back to empty
  const cancelEdit = () => {
    setEditingId(null);
    setTitle(""); setAmount(""); setDate(""); setCategory(""); setNote("");
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>SpendSimple+</Text>
      <Text style={styles.subheading}>Track your expenses</Text>

      {/* Form card — all inputs and the submit button */}
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>
          {editingId === null ? "Add Expense" : "Edit Expense"}
        </Text>

        {/* Each TextInput is a controlled component — value bound to state, onChangeText updates it */}
        <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
        <TextInput style={styles.input} placeholder="Amount" value={amount} onChangeText={setAmount}
          keyboardType="numeric"
        />
        <TextInput style={styles.input} placeholder="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
        <TextInput style={styles.input} placeholder="Category" value={category} onChangeText={setCategory} />
        <TextInput style={styles.input} placeholder="Note" value={note} onChangeText={setNote} />

        {/* Pressable is the recommended button component in React Native — onPress calls addExpense */}
        {editingId === null ? (
          <Pressable style={styles.addButton} onPress={addExpense}>
            <Text style={styles.addButtonText}>Add Expense</Text>
          </Pressable>
        ) : (
          <>
            <Pressable style={styles.addButton} onPress={updateExpense}>
              <Text style={styles.addButtonText}>Save Changes</Text>
            </Pressable>

            <Pressable style={styles.cancelButton} onPress={cancelEdit}>
              <Text style={styles.buttonText}>Cancel Edit</Text>
            </Pressable>
          </>
        )}

        <Pressable style={styles.clearButton} onPress={clearAllExpenses}>
          <Text style={styles.buttonText}>Clear All Expenses</Text>
        </Pressable>
      </View>

      {selectedExpense && (
        <View style={styles.detailCard}>
          <Text style={styles.sectionTitle}>Selected Expense</Text>
          <Text style={styles.cardTitle}>{selectedExpense.title}</Text>
          <Text>Amount: ${selectedExpense.amount}</Text>
          <Text>Date: {selectedExpense.date}</Text>
          <Text>Category: {selectedExpense.category}</Text>
          <Text>Note: {selectedExpense.note || "None"}</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>All Expenses</Text>

      {/* FlatList only renders what's visible on screen for performance */}
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text>No expenses yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text>Amount: ${item.amount}</Text>
            <Text>Date: {item.date}</Text>
            <Text>Category: {item.category}</Text>
            <Text>Note: {item.note || "None"}</Text>

            <View style={styles.cardActions}>
              <Pressable
                style={styles.viewButton}
                onPress={() => viewExpense(item.id)}
              >
                <Text style={styles.buttonText}>View</Text>
              </Pressable>

              <Pressable
                style={styles.editButton}
                onPress={() => startEditExpense(item.id)}
              >
                <Text style={styles.buttonText}>Edit</Text>
              </Pressable>

              <Pressable
                style={styles.deleteButton}
                onPress={() => deleteExpense(item.id)}
              >
                <Text style={styles.buttonText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}

// styles outside the component StyleSheet.create optimizes at load time
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f4f4f4",
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  subheading: {
    fontSize: 16,
    marginBottom: 16,
    color: "#555",
  },
  formCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  detailCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: "#222",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "white",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
  },
  clearButton: {
    backgroundColor: "#7a1f1f",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
    cancelButton: {
    backgroundColor: "#777",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  viewButton: {
    backgroundColor: "#2a5d9f",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  editButton: {
    backgroundColor: "#555",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  deleteButton: {
    backgroundColor: "#7a1f1f",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
  cardActions: {
    marginTop: 8,
  },
});

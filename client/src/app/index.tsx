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
    // Validation — check required fields before anything hits the server
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

      // Clear all form fields after a successful submission
      setTitle(""); setAmount(""); setDate(""); setCategory(""); setNote("");

      // Re-fetch the list so the new expense appears immediately
      await fetchExpenses();

    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Error, couldn't add expense.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>SpendSimple+</Text>
      <Text style={styles.subheading}>Track your expenses</Text>

      {/* Form card — all inputs and the submit button */}
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Add Expense</Text>

        {/* Each TextInput is a controlled component — value bound to state, onChangeText updates it */}
        <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
        <TextInput style={styles.input} placeholder="Amount" value={amount} onChangeText={setAmount}
          keyboardType="numeric"
        />
        <TextInput style={styles.input} placeholder="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
        <TextInput style={styles.input} placeholder="Category" value={category} onChangeText={setCategory} />
        <TextInput style={styles.input} placeholder="Note" value={note} onChangeText={setNote} />

        {/* Pressable is the recommended button component in React Native — onPress calls addExpense */}
        <Pressable style={styles.addButton} onPress={addExpense}>
          <Text style={styles.addButtonText}>Add Expense</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>All Expenses</Text>

      {/* FlatList — only renders what's visible on screen for performance */}
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
            {/* fallback if note is empty */}
            <Text>Note: {item.note || "None"}</Text>
          </View>
        )}
      />
    </View>
  );

} // component closes here

// styles outside the component — StyleSheet.create optimizes at load time
// better performance than inline styles which create a new object on every render
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
});

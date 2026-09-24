// ===== FIREBASE IMPORTS =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// ===== INISIALISASI FIREBASE =====
const firebaseConfig = {
  apiKey: "AIzaSyDUfqXGfzuh6kE0PjMjfHS2K6IlWRnH_SU",
  authDomain: "crud-mobile-f4d6f.firebaseapp.com",
  projectId: "crud-mobile-f4d6f",
  storageBucket: "crud-mobile-f4d6f.firebasestorage.app",
  messagingSenderId: "76964578376",
  appId: "1:76964578376:web:40d46bba31371c861b847d",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const expenseCollection = collection(db, "expenses");

// Format Rupiah
const formatRupiah = (angka) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);

// Query urutkun berdasarkan waktu terbaru
const q = query(expenseCollection, orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
  const list = document.getElementById("expense-list");
  list.innerHTML = ""; // Kosongkan tabel sebelum render ulang

  let totalMonth = 0;
  let totalAll = 0;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  if (snapshot.empty) {
    list.innerHTML =
      '<tr class="empty-row"><td colspan="5" class="empty-state">Belum ada data.</td></tr>';
  }

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;
    const expDate = data.createdAt?.toDate() || new Date();

    // Hitung statistik
    totalAll += data.amount;
    if (
      expDate.getMonth() === currentMonth &&
      expDate.getFullYear() === currentYear
    ) {
      totalMonth += data.amount;
    }

    // Render baris tabel
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${expDate.toLocaleDateString("id-ID")}</td>
            <td>${data.description}</td>
            <td><span class="badge badge-${data.category.toLowerCase()}">${data.category}</span></td>
            <td>${formatRupiah(data.amount)}</td>
            <td>
                <button class="action-btn btn-edit" onclick="window.editExpense('${id}', '${data.description}', ${data.amount}, '${data.category}')">Edit</button>
                <button class="action-btn btn-delete" onclick="window.deleteExpense('${id}')">Hapus</button>
            </td>
        `;

    // Tap row di mobile untuk toggle tombol aksi
    row.addEventListener("click", (e) => {
      if (e.target.classList.contains("action-btn")) return; // jangan toggle kalau klik tombol
      const allRows = document.querySelectorAll("#expense-list tr");
      allRows.forEach((r) => {
        if (r !== row) r.classList.remove("selected");
      });
      row.classList.toggle("selected");
    });

    list.appendChild(row);
  });

  // Update UI Statistik
  const remaining = 1500000 - totalMonth;
  document.getElementById("stat-total").textContent = formatRupiah(totalAll);
  document.getElementById("stat-month").textContent = formatRupiah(totalMonth);
  document.getElementById("stat-budget").textContent = formatRupiah(remaining);

  // Cek defisit
  const budgetCard = document.getElementById("card-budget");
  const alertBudget = document.getElementById("alert-budget");
  if (remaining < 0) {
    budgetCard.classList.add("over");
    alertBudget.style.display = "block";
    alertBudget.textContent = `⚠️ Budget bulan ini melebihi batas! Kelebihan ${formatRupiah(Math.abs(remaining))}`;
  } else {
    budgetCard.classList.remove("over");
    alertBudget.style.display = "none";
  }
});

// 1. HANDLE FORM SUBMIT (CREATE / UPDATE)
document
  .getElementById("expense-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const desc = document.getElementById("desc").value;
    const amount = Number(document.getElementById("amount").value);
    const category = document.getElementById("category").value;
    const editId = document.getElementById("edit-id").value;

    try {
      if (editId) {
        // MODE UPDATE
        await updateDoc(doc(db, "expenses", editId), {
          description: desc,
          amount: amount,
          category: category,
        });
      } else {
        // MODE CREATE
        await addDoc(expenseCollection, {
          description: desc,
          amount: amount,
          category: category,
          createdAt: serverTimestamp(),
        });
      }
      resetForm(); // Bersihkan form setelah sukses
    } catch (error) {
      console.error("Error: ", error);
      alert("Gagal menyimpan data.");
    }
  });

// 2. FUNGSI DELETE (Harus global agar bisa dipanggil onclick di HTML)
window.deleteExpense = async (id) => {
  if (confirm("Yakin ingin menghapus data ini?")) {
    await deleteDoc(doc(db, "expenses", id));
  }
};

// 3. FUNGSI EDIT (Mengisi form dengan data yang ada)
window.editExpense = (id, desc, amount, category) => {
  document.getElementById("desc").value = desc;
  document.getElementById("amount").value = amount;
  document.getElementById("category").value = category;
  document.getElementById("edit-id").value = id; // Kunci mode edit!

  document.getElementById("btn-submit").textContent = "Update";
  document.getElementById("btn-cancel").style.display = "inline-block";
};

// 4. RESET FORM
function resetForm() {
  document.getElementById("expense-form").reset();
  document.getElementById("edit-id").value = "";
  document.getElementById("btn-submit").textContent = "Tambah";
  document.getElementById("btn-cancel").style.display = "none";
}

document.getElementById("btn-cancel").addEventListener("click", resetForm);

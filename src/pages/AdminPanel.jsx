import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { adminAPI, productAPI, settingsAPI } from "../services/api";
import { useSettings } from "../contexts/SettingsContext";
import { formatCurrency, getCurrencySymbol } from "../utils/currency";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Admin Panel - Complete admin dashboard with member management, products, transactions, and withdrawals
 */
const AdminPanel = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState("members");
  const [loading, setLoading] = useState(false);

  // Member Management
  const [members, setMembers] = useState([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  // Product Management
  const [products, setProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: "",
    price: "",
    description: "",
    imageUrl: "",
    validityDays: "45",
    earnAmount: "",
    totalEarning: "",
  });

  // Transactions
  const [transactions, setTransactions] = useState([]);

  // Withdrawals
  const [withdrawals, setWithdrawals] = useState([]);

  // Recharge Management
  const [pendingRecharges, setPendingRecharges] = useState([]);

  // Member Details Modal
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberDetails, setMemberDetails] = useState(null);
  const [loadingMemberDetails, setLoadingMemberDetails] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editValues, setEditValues] = useState({});

  // Settings
  const { settings: contextSettings, loadSettings: reloadSettings } =
    useSettings();
  const [settings, setSettings] = useState({
    bKashNumber: "",
    bikashQRCodeId: "",
    totalSystemCurrency: 0,
    currency: "USD",
    referralBonus: 200,
    supportNumber: "+601121222669",
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Sync context settings with local state
  useEffect(() => {
    if (contextSettings) {
      setSettings(contextSettings);
    }
  }, [contextSettings]);

  // Load members
  const loadMembers = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAllMembers();
      if (response.success) {
        setMembers(response.data.members || []);
      }
    } catch (error) {
      alert("Failed to load members: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load products
  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await productAPI.getProducts();
      if (response.success) {
        setProducts(response.data.products || []);
      }
    } catch (error) {
      alert("Failed to load products: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load transactions
  const loadTransactions = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAllTransactions();
      if (response.success) {
        setTransactions(response.data.transactions || []);
      }
    } catch (error) {
      alert("Failed to load transactions: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load withdrawals
  const loadWithdrawals = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAllWithdrawals();
      if (response.success) {
        setWithdrawals(response.data.withdrawals || []);
      }
    } catch (error) {
      alert("Failed to load withdrawals: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load pending recharges
  const loadPendingRecharges = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAllPendingRecharges();
      if (response.success) {
        setPendingRecharges(response.data.recharges || []);
      }
    } catch (error) {
      alert("Failed to load pending recharges: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load settings
  const loadSettings = async () => {
    try {
      await reloadSettings();
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  // Save settings
  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Default customer support number
      const DEFAULT_SUPPORT_NUMBER = "+601121222669";

      // Prepare settings to save - use default if support number is empty
      const settingsToSave = {
        ...settings,
        supportNumber: settings.supportNumber?.trim() || DEFAULT_SUPPORT_NUMBER,
      };

      await settingsAPI.updateSettings(null, settingsToSave);
      alert("Settings saved successfully");
      setShowSettingsModal(false);
      await loadSettings();
    } catch (error) {
      alert("Failed to save settings: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle recharge approval/rejection
  const handleRechargeAction = async (rechargeId, status) => {
    const action = status === "approved" ? "approve" : "reject";
    if (!confirm(`Are you sure you want to ${action} this recharge request?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await adminAPI.updateRechargeStatus(
        null,
        rechargeId,
        status,
      );
      if (response.success) {
        await loadPendingRecharges();
        alert(`Recharge ${action}d successfully`);
      }
    } catch (error) {
      alert("Failed to update recharge status: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load transactions, withdrawals, and settings on mount for stats calculation
  useEffect(() => {
    loadTransactions();
    loadWithdrawals();
    loadSettings();
  }, []);

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === "members") loadMembers();
    if (activeTab === "products") loadProducts();
    if (activeTab === "transactions") loadTransactions();
    if (activeTab === "withdrawals") loadWithdrawals();
    if (activeTab === "recharges") loadPendingRecharges();
    if (activeTab === "settings") loadSettings();
  }, [activeTab]);

  // Toggle member activation
  const handleToggleMember = async (memberId, currentStatus) => {
    if (
      !confirm(
        `Are you sure you want to ${currentStatus ? "deactivate" : "activate"} this member?`,
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await adminAPI.toggleMemberStatus(
        null,
        memberId,
        !currentStatus,
      );
      if (response.success) {
        await loadMembers();
        alert(
          `Member ${!currentStatus ? "activated" : "deactivated"} successfully`,
        );
        // Refresh member details if modal is open
        if (selectedMember === memberId) {
          await loadMemberDetails(memberId);
        }
      }
    } catch (error) {
      alert("Failed to update member: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // View member details
  const handleViewMemberDetails = async (memberId) => {
    setSelectedMember(memberId);
    await loadMemberDetails(memberId);
  };

  // Load member details
  const loadMemberDetails = async (memberId) => {
    setLoadingMemberDetails(true);
    try {
      const response = await adminAPI.getMemberDetails(null, memberId);
      if (response.success) {
        setMemberDetails(response.data);
      }
    } catch (error) {
      alert("Failed to load member details: " + error.message);
      setSelectedMember(null);
    } finally {
      setLoadingMemberDetails(false);
    }
  };

  // Handle save field edit
  const handleSaveEdit = async (fieldType, fieldKey, value) => {
    if (!selectedMember) return;

    try {
      if (fieldType === "user") {
        await adminAPI.updateMemberUser(null, selectedMember, {
          [fieldKey]: value,
        });
      } else if (fieldType === "wallet") {
        await adminAPI.updateMemberWallet(null, selectedMember, {
          [fieldKey]: parseFloat(value) || 0,
        });
      } else if (fieldType === "transaction") {
        // Extract transaction ID from editingField (format: txn-amount-{id} or txn-status-{id})
        const transactionId = editingField.split("-").slice(2).join("-");
        const updates = {};
        if (fieldKey === "amount") updates.amount = parseFloat(value) || 0;
        else if (fieldKey === "status") updates.status = value;
        await adminAPI.updateTransaction(null, transactionId, updates);
      }

      await loadMemberDetails(selectedMember);
      setEditingField(null);
      setEditValues({});
      alert("Updated successfully");
    } catch (error) {
      alert("Failed to update: " + error.message);
    }
  };

  // Handle delete transaction
  const handleDeleteTransaction = async (transactionId) => {
    if (
      !confirm(
        "Are you sure you want to delete this transaction? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await adminAPI.deleteTransaction(null, transactionId);
      await loadMemberDetails(selectedMember);
      alert("Transaction deleted successfully");
    } catch (error) {
      alert("Failed to delete transaction: " + error.message);
    }
  };

  // Handle product form submit
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const validityDaysParsed = parseInt(productForm.validityDays, 10);
      const validityDays =
        Number.isFinite(validityDaysParsed) && validityDaysParsed > 0
          ? validityDaysParsed
          : 45;

      const payload = {
        name: productForm.name,
        price: parseFloat(productForm.price),
        description: productForm.description,
        imageUrl: productForm.imageUrl,
        validityDays,
        // We now prefer duration-based validity. Keep validateDate cleared.
        validateDate: null,
        earnAmount: productForm.earnAmount
          ? parseFloat(productForm.earnAmount)
          : 0,
        totalEarning: productForm.totalEarning
          ? parseFloat(productForm.totalEarning)
          : 0,
      };

      if (editingProduct) {
        await productAPI.updateProduct(null, editingProduct.id, payload);
        alert("Product updated successfully");
      } else {
        await productAPI.addProduct(null, payload);
        alert("Product added successfully");
      }
      setShowProductModal(false);
      setEditingProduct(null);
      setProductForm({
        name: "",
        price: "",
        description: "",
        imageUrl: "",
        validityDays: "45",
        earnAmount: "",
        totalEarning: "",
      });
      await loadProducts();
    } catch (error) {
      alert("Failed to save product: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle withdrawal approval/rejection
  const handleWithdrawalAction = async (withdrawalId, status) => {
    const action = status === "approved" ? "approve" : "reject";
    if (!confirm(`Are you sure you want to ${action} this withdrawal?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await adminAPI.updateWithdrawalStatus(
        null,
        withdrawalId,
        status,
      );
      if (response.success) {
        await loadWithdrawals();
        alert(`Withdrawal ${action}d successfully`);
      }
    } catch (error) {
      alert("Failed to update withdrawal: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Format date helper
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
      if (timestamp.toMillis) {
        return new Date(timestamp.toMillis()).toLocaleString();
      }
      return new Date(timestamp).toLocaleString();
    } catch {
      return "N/A";
    }
  };

  const getProductValidityDays = (product) => {
    const asNumber = Number(product?.validityDays);
    if (!Number.isNaN(asNumber) && asNumber > 0) return Math.floor(asNumber);

    // Backward compatibility: derive "days" from validateDate if present
    if (product?.validateDate) {
      const now = new Date();
      const validateDate = product.validateDate?.toDate
        ? product.validateDate.toDate()
        : product.validateDate?.toMillis
          ? new Date(product.validateDate.toMillis())
          : new Date(product.validateDate);
      if (!Number.isNaN(validateDate?.getTime?.())) {
        const msPerDay = 1000 * 60 * 60 * 24;
        return Math.max(0, Math.ceil((validateDate - now) / msPerDay));
      }
    }

    return null;
  };

  // Calculate totals
  const totalRecharge = transactions
    .filter(
      (t) =>
        t.type === "recharge" &&
        (t.status === "approved" || t.status === "completed"),
    )
    .reduce((sum, t) => {
      const amount =
        typeof t.amount === "number" ? t.amount : parseFloat(t.amount) || 0;
      return sum + amount;
    }, 0);

  const totalWithdraw = withdrawals
    .filter((w) => w.status === "approved")
    .reduce((sum, w) => {
      const amount =
        typeof w.amount === "number" ? w.amount : parseFloat(w.amount) || 0;
      return sum + amount;
    }, 0);

  // Calculate Total Balance (Recharge - Withdraw)
  const totalBalance = totalRecharge - totalWithdraw;

  // Check if current date is 1st to 5th of month
  const canReset = () => {
    const today = new Date();
    const day = today.getDate();
    return day >= 1 && day <= 5;
  };

  const stats = {
    totalMembers: members.length,
    activeMembers: members.filter((m) => m.isActive).length,
    inactiveMembers: members.filter((m) => !m.isActive).length,
    totalProducts: products.length,
    pendingWithdrawals: withdrawals.filter((w) => w.status === "pending")
      .length,
    totalTransactions: transactions.length,
    totalRecharge,
    totalWithdraw,
    totalBalance,
    totalSystemCurrency: settings.totalSystemCurrency || 0,
  };

  // Reset Balance, Recharge, and Withdraw data
  const handleResetData = async () => {
    if (!canReset()) {
      alert("Reset is only available from 1st to 5th of each month");
      return;
    }

    if (
      !confirm(
        "Are you sure you want to reset all Balance, Recharge, and Withdraw data? This action cannot be undone!",
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      // Get all wallets
      const walletsRef = collection(db, "wallets");
      const walletsSnapshot = await getDocs(walletsRef);

      const batch = writeBatch(db);
      let resetCount = 0;

      walletsSnapshot.forEach((walletDoc) => {
        batch.update(walletDoc.ref, {
          balanceWallet: 0,
          rechargeWallet: 0,
          totalEarnings: 0,
          totalWithdrawals: 0,
          incomeToday: 0,
          incomeYesterday: 0,
          lossToday: 0,
          lossTotal: 0,
          updatedAt: serverTimestamp(),
        });
        resetCount++;
      });

      await batch.commit();
      alert(
        `Successfully reset ${resetCount} wallets. Please note: Transaction history remains but balances are reset.`,
      );

      // Reload data
      await loadTransactions();
      await loadWithdrawals();
    } catch (error) {
      alert(`Failed to reset data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Admin Header */}
      <header className="bg-gray-900 border-b border-gray-700 py-4 px-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold tracking-wider">Admin Panel</h1>
            <p className="text-sm text-gray-400 mt-1">
              Welcome, {user?.name || "Admin"}
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm transition-colors"
          >
            Back to App
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-gray-400 text-xs mb-1">Total Members</div>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-gray-400 text-xs mb-1">Active Members</div>
            <div className="text-2xl font-bold text-green-400">
              {stats.activeMembers}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-gray-400 text-xs mb-1">Inactive Members</div>
            <div className="text-2xl font-bold text-red-400">
              {stats.inactiveMembers}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-gray-400 text-xs mb-1">Products</div>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-gray-400 text-xs mb-1">
              Pending Withdrawals
            </div>
            <div className="text-2xl font-bold text-orange-400">
              {stats.pendingWithdrawals}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-gray-400 text-xs mb-1">Transactions</div>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-gray-400 text-xs mb-1">Total Recharge</div>
            <div className="text-2xl font-bold text-green-400">
              {formatCurrency(stats.totalRecharge, settings.currency)}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-gray-400 text-xs mb-1">Total Withdraw</div>
            <div className="text-2xl font-bold text-red-400">
              {formatCurrency(stats.totalWithdraw, settings.currency)}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 border-yellow-500/50">
            <div className="text-gray-400 text-xs mb-1">System Currency</div>
            <div className="text-2xl font-bold text-yellow-400">
              {formatCurrency(stats.totalSystemCurrency, settings.currency)}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 border-blue-500/50">
            <div className="text-gray-400 text-xs mb-1">Total Balance</div>
            <div
              className={`text-2xl font-bold ${stats.totalBalance >= 0 ? "text-blue-400" : "text-red-400"}`}
            >
              {formatCurrency(stats.totalBalance, settings.currency)}
            </div>
            <div className="text-[10px] text-gray-500 mt-1">
              Recharge - Withdraw
            </div>
          </div>
        </div>

        {/* Reset Data Button (only visible 1st to 5th of month) */}
        {canReset() && (
          <div className="mb-6 bg-gradient-to-r from-red-900 to-orange-900 rounded-lg p-4 border-2 border-red-500/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-red-200 mb-1">
                  ⚠️ Monthly Reset Available
                </h3>
                <p className="text-xs text-red-300">
                  Reset all wallet balances (1st to 5th only)
                </p>
              </div>
              <button
                onClick={handleResetData}
                disabled={loading}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Resetting..." : "Reset All Balances"}
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 mb-6">
          <div className="flex border-b border-gray-700 overflow-x-auto">
            {[
              { id: "members", label: "Members" },
              { id: "products", label: "Products" },
              { id: "transactions", label: "All Transactions" },
              { id: "withdrawals", label: "Withdrawals" },
              { id: "recharges", label: "Pending Recharges" },
              { id: "settings", label: "Settings" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-white border-b-2 border-blue-500"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {loading && (
              <div className="text-center py-8 text-gray-400">Loading...</div>
            )}

            {/* Members Tab */}
            {activeTab === "members" && !loading && (
              <div>
                <div className="mb-4 flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">Member Management</h2>
                    {memberSearchQuery.trim() && (
                      <p className="text-sm text-gray-400 mt-1">
                        Showing{" "}
                        {
                          members.filter((member) => {
                            const query = memberSearchQuery
                              .toLowerCase()
                              .trim();
                            const name = (member.name || "").toLowerCase();
                            const phone = (member.phone || "").toLowerCase();
                            const userId = (
                              member.id ||
                              member.userId ||
                              ""
                            ).toLowerCase();
                            return (
                              name.includes(query) ||
                              phone.includes(query) ||
                              userId.includes(query)
                            );
                          }).length
                        }{" "}
                        of {members.length} members
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Search by name, phone, or user ID..."
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[250px]"
                    />
                    {memberSearchQuery.trim() && (
                      <button
                        onClick={() => setMemberSearchQuery("")}
                        className="px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-sm"
                        title="Clear search"
                      >
                        ✕
                      </button>
                    )}
                    <button
                      onClick={loadMembers}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="p-3">User ID</th>
                        <th className="p-3">Name</th>
                        <th className="p-3">Phone</th>
                        <th className="p-3">Balance</th>
                        <th className="p-3">Recharge</th>
                        <th className="p-3">Total earnings</th>
                        <th className="p-3">Total withdrawals</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Joined</th>
                        <th className="p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members
                        .filter((member) => {
                          if (!memberSearchQuery.trim()) return true;
                          const query = memberSearchQuery.toLowerCase().trim();
                          const name = (member.name || "").toLowerCase();
                          const phone = (member.phone || "").toLowerCase();
                          const userId = (
                            member.id ||
                            member.userId ||
                            ""
                          ).toLowerCase();
                          return (
                            name.includes(query) ||
                            phone.includes(query) ||
                            userId.includes(query)
                          );
                        })
                        .map((member) => (
                          <tr
                            key={member.id}
                            className="border-b border-gray-700"
                          >
                            <td
                              className="p-3 font-mono text-xs text-gray-400"
                              title={member.id}
                            >
                              {member.id.length > 12
                                ? `${member.id.slice(0, 8)}…`
                                : member.id}
                            </td>
                            <td className="p-3">{member.name}</td>
                            <td className="p-3">{member.phone}</td>
                            <td className="p-3 text-green-400 whitespace-nowrap">
                              {formatCurrency(
                                member.balanceWallet ?? 0,
                                settings.currency,
                              )}
                            </td>
                            <td className="p-3 text-gray-300 whitespace-nowrap">
                              {formatCurrency(
                                member.rechargeWallet ?? 0,
                                settings.currency,
                              )}
                            </td>
                            <td className="p-3 text-gray-300 whitespace-nowrap">
                              {formatCurrency(
                                member.totalEarnings ?? 0,
                                settings.currency,
                              )}
                            </td>
                            <td className="p-3 text-gray-300 whitespace-nowrap">
                              {formatCurrency(
                                member.totalWithdrawals ?? 0,
                                settings.currency,
                              )}
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  member.isActive
                                    ? "bg-green-900 text-green-300"
                                    : "bg-red-900 text-red-300"
                                }`}
                              >
                                {member.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="p-3 text-sm text-gray-400">
                              {formatDate(member.createdAt)}
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    handleViewMemberDetails(member.id)
                                  }
                                  className="px-3 py-1 rounded text-xs bg-blue-600 hover:bg-blue-700"
                                >
                                  View Details
                                </button>
                                <button
                                  onClick={() =>
                                    handleToggleMember(
                                      member.id,
                                      member.isActive,
                                    )
                                  }
                                  className={`px-3 py-1 rounded text-xs ${
                                    member.isActive
                                      ? "bg-red-600 hover:bg-red-700"
                                      : "bg-green-600 hover:bg-green-700"
                                  }`}
                                >
                                  {member.isActive ? "Deactivate" : "Activate"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      {members.filter((member) => {
                        if (!memberSearchQuery.trim()) return true;
                        const query = memberSearchQuery.toLowerCase().trim();
                        const name = (member.name || "").toLowerCase();
                        const phone = (member.phone || "").toLowerCase();
                        const userId = (
                          member.id ||
                          member.userId ||
                          ""
                        ).toLowerCase();
                        return (
                          name.includes(query) ||
                          phone.includes(query) ||
                          userId.includes(query)
                        );
                      }).length === 0 && (
                        <tr>
                          <td
                            colSpan="10"
                            className="p-6 text-center text-gray-400"
                          >
                            {memberSearchQuery.trim()
                              ? `No members found matching "${memberSearchQuery}"`
                              : "No members found"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Products Tab */}
            {activeTab === "products" && !loading && (
              <div>
                <div className="mb-4 flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Product Management</h2>
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setProductForm({
                        name: "",
                        price: "",
                        description: "",
                        imageUrl: "",
                        validityDays: "45",
                        earnAmount: "",
                        totalEarning: "",
                      });
                      setShowProductModal(true);
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-sm"
                  >
                    Add Product
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="bg-gray-700 p-4 rounded-lg border border-gray-600"
                    >
                      <h3 className="font-semibold mb-2">{product.name}</h3>
                      <p className="text-green-400 text-lg font-bold mb-2">
                        {formatCurrency(product.price, settings.currency)}
                      </p>
                      <p className="text-gray-400 text-sm mb-2">
                        Validity:{" "}
                        {getProductValidityDays(product) !== null
                          ? `${getProductValidityDays(product)} days`
                          : "—"}
                      </p>
                      {product.description && (
                        <p className="text-gray-400 text-sm mb-3">
                          {product.description}
                        </p>
                      )}
                      <button
                        onClick={() => {
                          setEditingProduct(product);
                          const validityDays = getProductValidityDays(product);

                          setProductForm({
                            name: product.name,
                            price: product.price.toString(),
                            description: product.description || "",
                            imageUrl: product.imageUrl || "",
                            validityDays:
                              validityDays !== null
                                ? validityDays.toString()
                                : "45",
                            earnAmount: (product.earnAmount || 0).toString(),
                            totalEarning: (
                              product.totalEarning || 0
                            ).toString(),
                          });
                          setShowProductModal(true);
                        }}
                        className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                  {products.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-400">
                      No products found
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Transactions Tab */}
            {activeTab === "transactions" && !loading && (
              <div>
                <div className="mb-4 flex justify-between items-center">
                  <h2 className="text-xl font-semibold">All Transactions</h2>
                  <button
                    onClick={loadTransactions}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm"
                  >
                    Refresh
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="p-3">User</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => (
                        <tr
                          key={transaction.id}
                          className="border-b border-gray-700"
                        >
                          <td className="p-3">
                            <div>{transaction.userName}</div>
                            <div className="text-xs text-gray-400">
                              {transaction.userPhone}
                            </div>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                transaction.type === "recharge"
                                  ? "bg-blue-900 text-blue-300"
                                  : "bg-purple-900 text-purple-300"
                              }`}
                            >
                              {transaction.type}
                            </span>
                          </td>
                          <td className="p-3 font-semibold">
                            {formatCurrency(
                              transaction.amount,
                              settings.currency,
                            )}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                transaction.status === "completed"
                                  ? "bg-green-900 text-green-300"
                                  : transaction.status === "pending"
                                    ? "bg-yellow-900 text-yellow-300"
                                    : "bg-red-900 text-red-300"
                              }`}
                            >
                              {transaction.status}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-gray-400">
                            {formatDate(transaction.createdAt)}
                          </td>
                        </tr>
                      ))}
                      {transactions.length === 0 && (
                        <tr>
                          <td
                            colSpan="5"
                            className="p-6 text-center text-gray-400"
                          >
                            No transactions found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Withdrawals Tab */}
            {activeTab === "withdrawals" && !loading && (
              <div>
                <div className="mb-4 flex justify-between items-center">
                  <h2 className="text-xl font-semibold">
                    Withdrawal Management
                  </h2>
                  <button
                    onClick={loadWithdrawals}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm"
                  >
                    Refresh
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="p-3">User</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Payment Method</th>
                        <th className="p-3">Account Number</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawals.map((withdrawal) => (
                        <tr
                          key={withdrawal.id}
                          className="border-b border-gray-700"
                        >
                          <td className="p-3">
                            <div>{withdrawal.userName}</div>
                            <div className="text-xs text-gray-400">
                              {withdrawal.userPhone}
                            </div>
                          </td>
                          <td className="p-3 font-semibold text-red-400">
                            <div>
                              <div className="font-semibold">
                                {formatCurrency(
                                  withdrawal.amount,
                                  settings.currency,
                                )}
                              </div>
                              {withdrawal.vatTax && (
                                <div className="text-xs text-gray-400 mt-1">
                                  VAT (10%):{" "}
                                  {formatCurrency(
                                    withdrawal.vatTax,
                                    settings.currency,
                                  )}{" "}
                                  | Net:{" "}
                                  {formatCurrency(
                                    withdrawal.netAmount ||
                                      withdrawal.amount - withdrawal.vatTax,
                                    settings.currency,
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            {withdrawal.paymentMethod ? (
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  withdrawal.paymentMethod === "bikash"
                                    ? "bg-green-900 text-green-300"
                                    : withdrawal.paymentMethod === "touchngo"
                                      ? "bg-blue-900 text-blue-300"
                                      : "bg-orange-900 text-orange-300"
                                }`}
                              >
                                {withdrawal.paymentMethod === "touchngo"
                                  ? "TOUCH 'N GO"
                                  : withdrawal.paymentMethod.toUpperCase()}
                              </span>
                            ) : (
                              <span className="text-gray-500 text-xs">N/A</span>
                            )}
                          </td>
                          <td className="p-3">
                            {withdrawal.paymentNumber ? (
                              <div>
                                <div className="text-sm font-medium text-gray-300">
                                  {withdrawal.paymentNumber}
                                </div>
                                {withdrawal.paymentName && (
                                  <div className="text-xs text-gray-500">
                                    {withdrawal.paymentName}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-500 text-xs">N/A</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                withdrawal.status === "approved"
                                  ? "bg-green-900 text-green-300"
                                  : withdrawal.status === "pending"
                                    ? "bg-yellow-900 text-yellow-300"
                                    : "bg-red-900 text-red-300"
                              }`}
                            >
                              {withdrawal.status}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-gray-400">
                            {formatDate(withdrawal.createdAt)}
                          </td>
                          <td className="p-3">
                            {withdrawal.status === "pending" && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    handleWithdrawalAction(
                                      withdrawal.id,
                                      "approved",
                                    )
                                  }
                                  className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() =>
                                    handleWithdrawalAction(
                                      withdrawal.id,
                                      "rejected",
                                    )
                                  }
                                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {withdrawals.length === 0 && (
                        <tr>
                          <td
                            colSpan="7"
                            className="p-6 text-center text-gray-400"
                          >
                            No withdrawals found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pending Recharges Tab */}
            {activeTab === "recharges" && !loading && (
              <div>
                <div className="mb-4 flex justify-between items-center">
                  <h2 className="text-xl font-semibold">
                    Pending Recharge Requests
                  </h2>
                  <button
                    onClick={loadPendingRecharges}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm"
                  >
                    Refresh
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="p-3">User</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Proof</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingRecharges.map((recharge) => (
                        <tr
                          key={recharge.id}
                          className="border-b border-gray-700"
                        >
                          <td className="p-3">
                            <div>{recharge.userName}</div>
                            <div className="text-xs text-gray-400">
                              {recharge.userPhone}
                            </div>
                          </td>
                          <td className="p-3 font-semibold text-green-400">
                            {formatCurrency(recharge.amount, settings.currency)}
                          </td>
                          <td className="p-3">
                            {recharge.proofImageUrl ? (
                              <a
                                href={recharge.proofImageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 text-sm"
                              >
                                View Proof
                              </a>
                            ) : (
                              <span className="text-gray-500 text-sm">
                                No proof
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-sm text-gray-400">
                            {formatDate(recharge.createdAt)}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleRechargeAction(recharge.id, "approved")
                                }
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  handleRechargeAction(recharge.id, "rejected")
                                }
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {pendingRecharges.length === 0 && (
                        <tr>
                          <td
                            colSpan="5"
                            className="p-6 text-center text-gray-400"
                          >
                            No pending recharge requests
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && !loading && (
              <div>
                <div className="mb-4 flex justify-between items-center">
                  <h2 className="text-xl font-semibold">App Settings</h2>
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-sm"
                  >
                    Edit Settings
                  </button>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Touch 'n Go Number
                    </label>
                    <p className="text-white">
                      {settings.bKashNumber || "Not set"}
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Touch 'n Go QR Code ID
                    </label>
                    <p className="text-white">
                      {settings.bikashQRCodeId || "Not set"}
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Currency
                    </label>
                    <p className="text-white">
                      {settings.currency || "USD"} (
                      {getCurrencySymbol(settings.currency || "USD")})
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Total System Currency
                    </label>
                    <p className="text-white text-lg font-semibold">
                      {formatCurrency(
                        settings.totalSystemCurrency || 0,
                        settings.currency,
                      )}
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Invitation Bonus
                    </label>
                    <p className="text-white text-lg font-semibold">
                      {formatCurrency(
                        settings.referralBonus || 200,
                        settings.currency,
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Bonus amount the referrer gets after the referred user’s
                      first product purchase
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Support Number (WhatsApp)
                    </label>
                    <p className="text-white">
                      {settings.supportNumber || "+601121222669"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Edit Settings</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Touch 'n Go Number
              </label>
              <input
                type="text"
                value={settings.bKashNumber}
                onChange={(e) =>
                  setSettings({ ...settings, bKashNumber: e.target.value })
                }
                placeholder="Enter Touch 'n Go number"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Touch 'n Go QR Code ID
              </label>
              <input
                type="text"
                value={settings.bikashQRCodeId || ""}
                onChange={(e) =>
                  setSettings({ ...settings, bikashQRCodeId: e.target.value })
                }
                placeholder="Enter Touch 'n Go QR Code ID (used for QR code generation)"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
              <p className="text-xs text-gray-400 mt-1">
                This QR Code ID will always be used for payment QR codes
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Currency</label>
              <select
                value={settings.currency || "USD"}
                onChange={(e) =>
                  setSettings({ ...settings, currency: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="USD">USD ($) - US Dollar</option>
                <option value="BDT">BDT (৳) - Bangladeshi Taka</option>
                <option value="MYR">MYR (RM) - Malaysian Ringgit</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Select the currency for the system
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Total System Currency
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.totalSystemCurrency || 0}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    totalSystemCurrency: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="Enter total system currency"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
              <p className="text-xs text-gray-400 mt-1">
                Total amount of currency in the system
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Invitation Bonus
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.referralBonus || 200}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    referralBonus: parseFloat(e.target.value) || 200,
                  })
                }
                placeholder="Enter invitation bonus amount"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
              <p className="text-xs text-gray-400 mt-1">
                Bonus amount the referrer gets after the referred user’s first
                product purchase
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Support Number (WhatsApp)
              </label>
              <input
                type="text"
                value={settings.supportNumber || ""}
                onChange={(e) =>
                  setSettings({ ...settings, supportNumber: e.target.value })
                }
                placeholder="+601121222669 (default)"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
              <p className="text-xs text-gray-400 mt-1">
                Support number that users can click to contact via WhatsApp.
                Default: +601121222669
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveSettings}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded disabled:opacity-50"
              >
                Save Settings
              </button>
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  loadSettings();
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">
              {editingProduct ? "Edit Product" : "Add Product"}
            </h2>
            <form onSubmit={handleProductSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Product Name
                </label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm({ ...productForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) =>
                    setProductForm({ ...productForm, price: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  rows="3"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Product Image URL
                </label>
                <input
                  type="url"
                  value={productForm.imageUrl}
                  onChange={(e) =>
                    setProductForm({ ...productForm, imageUrl: e.target.value })
                  }
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Validity (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={productForm.validityDays}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      validityDays: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Default is 45 days. If you leave it empty, it will save as 45
                  days.
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Earn Amount (Daily)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={productForm.earnAmount}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      earnAmount: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Amount user can earn daily from this product
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Total Earning (Maximum)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={productForm.totalEarning}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      totalEarning: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Maximum total amount user can earn from this product (0 =
                  unlimited)
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
                  disabled={loading}
                >
                  {editingProduct ? "Update" : "Add"} Product
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProductModal(false);
                    setEditingProduct(null);
                    setProductForm({
                      name: "",
                      price: "",
                      description: "",
                      imageUrl: "",
                      validityDays: "45",
                      earnAmount: "",
                      totalEarning: "",
                    });
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Details Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-800 rounded-lg p-6 max-w-6xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto">
            {loadingMemberDetails ? (
              <div className="text-center py-8 text-gray-400">
                Loading member details...
              </div>
            ) : memberDetails ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold">Member Details</h2>
                  <button
                    onClick={() => {
                      setSelectedMember(null);
                      setMemberDetails(null);
                      setEditingField(null);
                      setEditValues({});
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
                  >
                    Close
                  </button>
                </div>

                {/* User Info Section */}
                <div className="bg-gray-700 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold mb-4">
                    User Information
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-gray-400">User ID</label>
                      <div className="text-sm font-mono">
                        {memberDetails.user.userId || memberDetails.user.id}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Name</label>
                      {editingField === "user-name" ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={
                              editValues.name || memberDetails.user.name || ""
                            }
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                name: e.target.value,
                              })
                            }
                            className="flex-1 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-sm"
                            autoFocus
                          />
                          <button
                            onClick={() =>
                              handleSaveEdit("user", "name", editValues.name)
                            }
                            className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingField(null)}
                            className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {memberDetails.user.name || "N/A"}
                          </span>
                          <button
                            onClick={() => {
                              setEditingField("user-name");
                              setEditValues({
                                name: memberDetails.user.name || "",
                              });
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Phone</label>
                      {editingField === "user-phone" ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={
                              editValues.phone || memberDetails.user.phone || ""
                            }
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                phone: e.target.value,
                              })
                            }
                            className="flex-1 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-sm"
                            autoFocus
                          />
                          <button
                            onClick={() =>
                              handleSaveEdit("user", "phone", editValues.phone)
                            }
                            className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingField(null)}
                            className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {memberDetails.user.phone || "N/A"}
                          </span>
                          <button
                            onClick={() => {
                              setEditingField("user-phone");
                              setEditValues({
                                phone: memberDetails.user.phone || "",
                              });
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Status</label>
                      <div className="text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            memberDetails.user.isActive
                              ? "bg-green-900 text-green-300"
                              : "bg-red-900 text-red-300"
                          }`}
                        >
                          {memberDetails.user.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Joined</label>
                      <div className="text-sm">
                        {formatDate(memberDetails.user.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Wallet Balances Section */}
                <div className="bg-gray-700 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold mb-4">
                    Wallet Balances
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      {
                        field: "balanceWallet",
                        label: "Balance Wallet",
                        editable: true,
                      },
                      {
                        field: "lastRechargeAmount",
                        label: "Last Recharge Amount",
                        editable: false,
                      },
                      {
                        field: "totalEarnings",
                        label: "Total Earnings",
                        editable: true,
                      },
                      {
                        field: "totalWithdrawals",
                        label: "Total Withdrawals",
                        editable: true,
                      },
                    ].map(({ field, label, editable }) => (
                      <div key={field}>
                        <label className="text-xs text-gray-400">
                          {label}
                          {memberDetails.wallet.lastRechargeDate &&
                            field === "lastRechargeAmount" && (
                              <span className="block text-[10px] text-gray-500 mt-0.5">
                                {formatDate(
                                  memberDetails.wallet.lastRechargeDate,
                                )}
                              </span>
                            )}
                        </label>
                        {editingField === `wallet-${field}` && editable ? (
                          <div className="flex gap-2 mt-1">
                            <input
                              type="number"
                              step="0.01"
                              value={
                                editValues[field] ??
                                memberDetails.wallet[field] ??
                                0
                              }
                              onChange={(e) =>
                                setEditValues({
                                  ...editValues,
                                  [field]: e.target.value,
                                })
                              }
                              className="flex-1 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-sm"
                              autoFocus
                            />
                            <button
                              onClick={() =>
                                handleSaveEdit(
                                  "wallet",
                                  field,
                                  editValues[field],
                                )
                              }
                              className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingField(null)}
                              className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-sm font-semibold ${field === "lastRechargeAmount" ? "text-blue-400" : "text-green-400"}`}
                            >
                              {formatCurrency(
                                memberDetails.wallet[field] ?? 0,
                                settings.currency,
                              )}
                            </span>
                            {editable && (
                              <button
                                onClick={() => {
                                  setEditingField(`wallet-${field}`);
                                  setEditValues({
                                    [field]: memberDetails.wallet[field] ?? 0,
                                  });
                                }}
                                className="text-xs text-blue-400 hover:text-blue-300"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Transactions Section */}
                <div className="bg-gray-700 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold mb-4">
                    All Transactions ({memberDetails.transactions.length})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-600">
                        <tr>
                          <th className="p-2 text-left">Type</th>
                          <th className="p-2 text-left">Amount</th>
                          <th className="p-2 text-left">Status</th>
                          <th className="p-2 text-left">Date</th>
                          <th className="p-2 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {memberDetails.transactions.map((txn) => (
                          <tr key={txn.id} className="border-b border-gray-600">
                            <td className="p-2">
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  txn.type === "recharge"
                                    ? "bg-blue-900 text-blue-300"
                                    : txn.type === "withdraw"
                                      ? "bg-red-900 text-red-300"
                                      : txn.type === "purchase"
                                        ? "bg-purple-900 text-purple-300"
                                        : "bg-green-900 text-green-300"
                                }`}
                              >
                                {txn.type}
                              </span>
                            </td>
                            <td className="p-2">
                              {editingField === `txn-amount-${txn.id}` ? (
                                <div className="flex gap-2">
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={editValues.amount ?? txn.amount ?? 0}
                                    onChange={(e) =>
                                      setEditValues({
                                        ...editValues,
                                        amount: e.target.value,
                                      })
                                    }
                                    className="w-24 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-sm"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() =>
                                      handleSaveEdit(
                                        "transaction",
                                        "amount",
                                        editValues.amount,
                                      )
                                    }
                                    className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingField(null)}
                                    className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span>
                                    {formatCurrency(
                                      txn.amount ?? 0,
                                      settings.currency,
                                    )}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setEditingField(`txn-amount-${txn.id}`);
                                      setEditValues({
                                        amount: txn.amount ?? 0,
                                      });
                                    }}
                                    className="text-xs text-blue-400 hover:text-blue-300"
                                  >
                                    Edit
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="p-2">
                              {editingField === `txn-status-${txn.id}` ? (
                                <div className="flex gap-2">
                                  <select
                                    value={
                                      editValues.status ??
                                      txn.status ??
                                      "pending"
                                    }
                                    onChange={(e) =>
                                      setEditValues({
                                        ...editValues,
                                        status: e.target.value,
                                      })
                                    }
                                    className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-sm"
                                    autoFocus
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="completed">Completed</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                  </select>
                                  <button
                                    onClick={() =>
                                      handleSaveEdit(
                                        "transaction",
                                        "status",
                                        editValues.status,
                                      )
                                    }
                                    className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingField(null)}
                                    className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${
                                      txn.status === "completed" ||
                                      txn.status === "approved"
                                        ? "bg-green-900 text-green-300"
                                        : txn.status === "pending"
                                          ? "bg-yellow-900 text-yellow-300"
                                          : "bg-red-900 text-red-300"
                                    }`}
                                  >
                                    {txn.status}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setEditingField(`txn-status-${txn.id}`);
                                      setEditValues({
                                        status: txn.status ?? "pending",
                                      });
                                    }}
                                    className="text-xs text-blue-400 hover:text-blue-300"
                                  >
                                    Edit
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="p-2 text-xs text-gray-400">
                              {formatDate(txn.createdAt)}
                            </td>
                            <td className="p-2">
                              <button
                                onClick={() => handleDeleteTransaction(txn.id)}
                                className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                        {memberDetails.transactions.length === 0 && (
                          <tr>
                            <td
                              colSpan="5"
                              className="p-4 text-center text-gray-400"
                            >
                              No transactions found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Purchased Products Section */}
                <div className="bg-gray-700 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold mb-4">
                    Purchased Products ({memberDetails.purchases.length})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-600">
                        <tr>
                          <th className="p-2 text-left">Product Name</th>
                          <th className="p-2 text-left">Price</th>
                          <th className="p-2 text-left">Status</th>
                          <th className="p-2 text-left">Purchase Date</th>
                          <th className="p-2 text-left">Total Earnings</th>
                        </tr>
                      </thead>
                      <tbody>
                        {memberDetails.purchases.map((purchase) => (
                          <tr
                            key={purchase.id}
                            className="border-b border-gray-600"
                          >
                            <td className="p-2">
                              {purchase.productName || "N/A"}
                            </td>
                            <td className="p-2">
                              {formatCurrency(
                                purchase.productPrice ?? 0,
                                settings.currency,
                              )}
                            </td>
                            <td className="p-2">
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  purchase.status === "active"
                                    ? "bg-green-900 text-green-300"
                                    : "bg-red-900 text-red-300"
                                }`}
                              >
                                {purchase.status || "N/A"}
                              </span>
                            </td>
                            <td className="p-2 text-xs text-gray-400">
                              {formatDate(purchase.purchaseDate)}
                            </td>
                            <td className="p-2">
                              {formatCurrency(
                                purchase.totalEarnings ?? 0,
                                settings.currency,
                              )}
                            </td>
                          </tr>
                        ))}
                        {memberDetails.purchases.length === 0 && (
                          <tr>
                            <td
                              colSpan="5"
                              className="p-4 text-center text-gray-400"
                            >
                              No purchases found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Last Earnings Section */}
                {memberDetails.lastEarnings.length > 0 && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">
                      Recent Earnings ({memberDetails.lastEarnings.length})
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-600">
                          <tr>
                            <th className="p-2 text-left">Product</th>
                            <th className="p-2 text-left">Amount</th>
                            <th className="p-2 text-left">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {memberDetails.lastEarnings.map((earning) => (
                            <tr
                              key={earning.id}
                              className="border-b border-gray-600"
                            >
                              <td className="p-2">
                                {earning.productName || "N/A"}
                              </td>
                              <td className="p-2 text-green-400 font-semibold">
                                {formatCurrency(
                                  earning.amount ?? 0,
                                  settings.currency,
                                )}
                              </td>
                              <td className="p-2 text-xs text-gray-400">
                                {formatDate(earning.createdAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                Failed to load member details
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;

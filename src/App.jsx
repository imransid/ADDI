import React, { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "./store/authSlice";
import { getDoc, doc } from "firebase/firestore";
import { db } from "./config/firebase";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Product from "./pages/Product";
import Cashback from "./pages/Cashback";
import Prize from "./pages/Prize";
import User from "./pages/User";
import Recharge from "./pages/Recharge";
import Withdraw from "./pages/Withdraw";
import MyProduct from "./pages/MyProduct";
import Invitation from "./pages/Invitation";
import AppDownload from "./pages/AppDownload";
import MyTeams from "./pages/MyTeams";
import Online from "./pages/Online";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminPanel from "./pages/AdminPanel";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import SeedAdmin from "./utils/seedAdmin";

// Component to check user status on app load
const AuthChecker = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    const checkUserStatus = async () => {
      // Only check if user is authenticated and not on login/register pages
      if (isAuthenticated && user && !['/login', '/register'].includes(location.pathname)) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.id));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // If user is not admin and not active, logout
            if (userData.role !== 'admin' && !userData.isActive) {
              await dispatch(logoutUser()).unwrap();
              navigate('/login', { replace: true });
            }
          } else {
            // User document doesn't exist, logout
            await dispatch(logoutUser()).unwrap();
            navigate('/login', { replace: true });
          }
        } catch (error) {
          console.error('Error checking user status:', error);
          // On error, logout to be safe
          await dispatch(logoutUser()).unwrap();
          navigate('/login', { replace: true });
        }
      }
    };

    checkUserStatus();
  }, [isAuthenticated, user, dispatch, navigate, location.pathname]);

  return null;
};

const App = () => {
  return (
    <>
      <AuthChecker />
      <Routes>
      {/* Auth routes without Layout - redirect if already authenticated */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Seed Admin Route - Remove this after seeding */}
      <Route path="/seed-admin" element={<SeedAdmin />} />

      {/* Admin routes - separate from main layout */}
      <Route
        path="/admin"
        element={
          <AdminProtectedRoute>
            <AdminPanel />
          </AdminProtectedRoute>
        }
      />

      {/* Protected routes with Layout */}
      <Route path="/" element={<Layout />}>
        <Route
          index
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="product"
          element={
            <ProtectedRoute>
              <Product />
            </ProtectedRoute>
          }
        />
        <Route
          path="cashback"
          element={
            <ProtectedRoute>
              <Cashback />
            </ProtectedRoute>
          }
        />
        <Route
          path="prize"
          element={
            <ProtectedRoute>
              <Prize />
            </ProtectedRoute>
          }
        />
        <Route
          path="user"
          element={
            <ProtectedRoute>
              <User />
            </ProtectedRoute>
          }
        />
        <Route
          path="recharge"
          element={
            <ProtectedRoute>
              <Recharge />
            </ProtectedRoute>
          }
        />
        <Route
          path="withdraw"
          element={
            <ProtectedRoute>
              <Withdraw />
            </ProtectedRoute>
          }
        />
        <Route
          path="my-product"
          element={
            <ProtectedRoute>
              <MyProduct />
            </ProtectedRoute>
          }
        />
        <Route
          path="invitation"
          element={
            <ProtectedRoute>
              <Invitation />
            </ProtectedRoute>
          }
        />
        <Route
          path="app-download"
          element={
            <ProtectedRoute>
              <AppDownload />
            </ProtectedRoute>
          }
        />
        <Route
          path="redeem-bonus"
          element={
            <ProtectedRoute>
              <RedeemBonus />
            </ProtectedRoute>
          }
        />
        <Route
          path="my-teams"
          element={
            <ProtectedRoute>
              <MyTeams />
            </ProtectedRoute>
          }
        />
        <Route
          path="online"
          element={
            <ProtectedRoute>
              <Online />
            </ProtectedRoute>
          }
        />
        {/* Redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
    </>
  );
};

export default App;

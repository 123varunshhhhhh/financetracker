
import { auth, db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc,
  onSnapshot
} from "firebase/firestore";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";

// ==================== Type Definitions ====================
export type Theme = 'light' | 'dark' | 'system';
export type DefaultView = 'dashboard' | 'transactions' | 'budget' | 'analytics';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD';
export type Timezone = 'America/New_York' | 'America/Chicago' | 'America/Denver' | 'America/Los_Angeles';

export interface UserSettings {
  firstName: string;
  lastName: string;
  email: string;
  currency: Currency;
  timezone: Timezone;
  emailNotifications: boolean;
  pushNotifications: boolean;
  budgetAlerts: boolean;
  goalReminders: boolean;
  weeklyReports: boolean;
  dataSharing: boolean;
  analyticsTracking: boolean;
  marketingEmails: boolean;
  theme: Theme;
  compactView: boolean;
  showBalances: boolean;
  defaultView: DefaultView;
}

export interface TransactionData {
  amount: number;
  category: string;
  date: string;
  description: string;
  type: 'income' | 'expense';
  time?: string;
}

export interface Transaction extends TransactionData {
  id: string;
  createdAt: string;
}

export interface BudgetData {
  category: string;
  budgeted: number;
  spent?: number;
  period: 'weekly' | 'monthly' | 'yearly';
  color?: string;
}

export interface Budget extends BudgetData {
  id: string;
  createdAt: string;
  spent: number;
}

export interface GoalData {
  title: string;
  description: string;
  targetAmount: number;
  currentAmount?: number;
  targetDate: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status?: 'active' | 'completed' | 'paused';
  monthlyContribution: number;
}

export interface Goal extends GoalData {
  id: string;
  createdAt: string;
  currentAmount: number;
  status: 'active' | 'completed' | 'paused';
}

// ==================== Helper ====================
export function getCurrentUserId() {
  if (!auth.currentUser) throw new Error("Not authenticated");
  return auth.currentUser.uid;
}

// ==================== Transactions API ====================
export async function addTransaction(data: TransactionData) {
  const userId = getCurrentUserId();
  const ref = collection(db, "users", userId, "transactions");
  return await addDoc(ref, {
    ...data,
    createdAt: new Date().toISOString()
  });
}

export async function getTransactions(): Promise<Transaction[]> {
  const userId = getCurrentUserId();
  const ref = collection(db, "users", userId, "transactions");
  const snapshot = await getDocs(ref);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data() as Omit<Transaction, 'id'>
  }));
}

export async function updateTransaction(id: string, data: Partial<TransactionData>) {
  const userId = getCurrentUserId();
  const ref = doc(db, "users", userId, "transactions", id);
  return await updateDoc(ref, data);
}

export async function deleteTransaction(id: string) {
  const userId = getCurrentUserId();
  const ref = doc(db, "users", userId, "transactions", id);
  return await deleteDoc(ref);
}

// ==================== Budgets API ====================
export async function addBudget(data: BudgetData) {
  const userId = getCurrentUserId();
  const ref = collection(db, "users", userId, "budgets");
  return await addDoc(ref, {
    ...data,
    spent: data.spent || 0,
    createdAt: new Date().toISOString()
  });
}

export async function getBudgets(): Promise<Budget[]> {
  const userId = getCurrentUserId();
  const ref = collection(db, "users", userId, "budgets");
  const snapshot = await getDocs(ref);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data() as Omit<Budget, 'id'>
  }));
}

export async function updateBudget(id: string, data: Partial<BudgetData>) {
  const userId = getCurrentUserId();
  const ref = doc(db, "users", userId, "budgets", id);
  return await updateDoc(ref, data);
}

export async function deleteBudget(id: string) {
  const userId = getCurrentUserId();
  const ref = doc(db, "users", userId, "budgets", id);
  return await deleteDoc(ref);
}

// ==================== Goals API ====================
export async function addGoal(data: GoalData) {
  const userId = getCurrentUserId();
  const ref = collection(db, "users", userId, "goals");
  return await addDoc(ref, {
    ...data,
    currentAmount: data.currentAmount || 0,
    status: data.status || 'active',
    createdAt: new Date().toISOString()
  });
}

export async function getGoals(): Promise<Goal[]> {
  const userId = getCurrentUserId();
  const ref = collection(db, "users", userId, "goals");
  const snapshot = await getDocs(ref);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data() as Omit<Goal, 'id'>
  }));
}

export async function updateGoal(id: string, data: Partial<GoalData>) {
  const userId = getCurrentUserId();
  const ref = doc(db, "users", userId, "goals", id);
  return await updateDoc(ref, data);
}

export async function deleteGoal(id: string) {
  const userId = getCurrentUserId();
  const ref = doc(db, "users", userId, "goals", id);
  return await deleteDoc(ref);
}

// ==================== User Settings API ====================
export async function saveUserSettings(settings: UserSettings) {
  const userId = getCurrentUserId();
  const ref = doc(db, "users", userId);
  // Use setDoc with merge: true to create or update the document
  return await setDoc(ref, { settings }, { merge: true });
}

export async function getUserSettings(): Promise<UserSettings | null> {
  const userId = getCurrentUserId();
  const ref = doc(db, "users", userId);
  const docSnap = await getDoc(ref);
  return docSnap.data()?.settings || null;
}

export async function deleteAccountAndData() {
  const userId = getCurrentUserId();
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  // Delete all user subcollections
  const collections = ["transactions", "budgets", "goals"];
  const batchDeletes = collections.map(async (collectionName) => {
    const ref = collection(db, "users", userId, collectionName);
    const snapshot = await getDocs(ref);
    const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
    return Promise.all(deletePromises);
  });

  await Promise.all(batchDeletes);
  await deleteDoc(doc(db, "users", userId));
  await user.delete();
}

export async function changeUserPassword(currentPassword: string, newPassword: string) {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error("Not authenticated");

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

// ==================== Real-time Listeners ====================
export function onBudgetsSnapshot(callback: (budgets: Budget[]) => void) {
  const userId = getCurrentUserId();
  const ref = collection(db, "users", userId, "budgets");
  return onSnapshot(ref, (snapshot) => {
    const budgets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<Budget, 'id'>
    }));
    callback(budgets);
  });
}

export function onTransactionsSnapshot(callback: (transactions: Transaction[]) => void) {
  const userId = getCurrentUserId();
  const ref = collection(db, "users", userId, "transactions");
  return onSnapshot(ref, (snapshot) => {
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<Transaction, 'id'>
    }));
    callback(transactions);
  });
}

export function onGoalsSnapshot(callback: (goals: Goal[]) => void) {
  const userId = getCurrentUserId();
  const ref = collection(db, "users", userId, "goals");
  return onSnapshot(ref, (snapshot) => {
    const goals = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<Goal, 'id'>
    }));
    callback(goals);
  });
}

// ==================== Dev Utility: Reset Data ====================
export async function resetUserBudgetsAndTransactions() {
  const userId = getCurrentUserId();
  const budgetsRef = collection(db, "users", userId, "budgets");
  const transactionsRef = collection(db, "users", userId, "transactions");
  const [budgetsSnap, transactionsSnap] = await Promise.all([
    getDocs(budgetsRef),
    getDocs(transactionsRef)
  ]);
  const deletePromises = [
    ...budgetsSnap.docs.map(docSnap => deleteDoc(doc(budgetsRef, docSnap.id))),
    ...transactionsSnap.docs.map(docSnap => deleteDoc(doc(transactionsRef, docSnap.id)))
  ];
  await Promise.all(deletePromises);
}

// ==================== Goal Deposits API ====================
export interface GoalDeposit {
  id: string;
  goalId: string;
  amount: number;
  date: string;
  description?: string;
}

export async function addGoalDeposit(goalId: string, amount: number, description?: string) {
  const userId = getCurrentUserId();
  const ref = collection(db, "users", userId, "goalDeposits");
  return await addDoc(ref, {
    goalId,
    amount,
    date: new Date().toISOString(),
    description: description || ''
  });
}

export async function getGoalDeposits(): Promise<GoalDeposit[]> {
  const userId = getCurrentUserId();
  const ref = collection(db, "users", userId, "goalDeposits");
  const snapshot = await getDocs(ref);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data() as Omit<GoalDeposit, 'id'>
  }));
}

export function onGoalDepositsSnapshot(callback: (deposits: GoalDeposit[]) => void) {
  const userId = getCurrentUserId();
  const ref = collection(db, "users", userId, "goalDeposits");
  return onSnapshot(ref, (snapshot) => {
    const deposits = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<GoalDeposit, 'id'>
    }));
    callback(deposits);
  });
}


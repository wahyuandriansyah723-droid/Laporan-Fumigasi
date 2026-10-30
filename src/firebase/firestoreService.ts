import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './config';
import {
  InventoryItem,
  StockTransaction,
  MasterSupplier,
  MasterLocation,
  MasterOperator,
  MasterProjectDestination,
  MasterUnit,
  MasterChemicalMedicine,
  MasterFuelType,
  MasterEquipmentInventory,
  SystemSettings,
} from '../types/inventory';
import { AuthUser } from '../types/auth';
import { FumigationJobReport } from '../types/jobs';
import { RawMaterialRecommendation } from '../types/recommendations';
import { INITIAL_ITEMS, INITIAL_TRANSACTIONS } from '../data/initialData';
import { INITIAL_AUTH_USERS, getDefaultPermissionsForRole } from '../data/initialAuthUsers';
import { INITIAL_JOB_REPORTS } from '../data/initialJobReports';
import { INITIAL_RAW_RECOMMENDATIONS } from '../data/initialRecommendations';
import {
  INITIAL_SUPPLIERS,
  INITIAL_LOCATIONS,
  INITIAL_OPERATORS,
  INITIAL_PROJECT_DESTINATIONS,
  INITIAL_UNITS,
  INITIAL_CHEMICAL_MEDICINES,
  INITIAL_FUEL_TYPES,
  INITIAL_EQUIPMENT_INVENTORY,
  INITIAL_SYSTEM_SETTINGS,
} from '../data/initialMasterData';

export const COLLECTIONS = {
  ITEMS: 'inventory_items',
  TRANSACTIONS: 'stock_transactions',
  JOB_REPORTS: 'job_reports',
  RECOMMENDATIONS: 'raw_recommendations',
  USERS: 'auth_users',
  SUPPLIERS: 'master_suppliers',
  LOCATIONS: 'master_locations',
  OPERATORS: 'master_operators',
  DESTINATIONS: 'master_destinations',
  UNITS: 'master_units',
  MEDICINES: 'master_medicines',
  FUELS: 'master_fuels',
  EQUIPMENT: 'master_equipment',
  SETTINGS: 'system_settings',
} as const;

// 1. INVENTORY ITEMS (Real-time listener)
export const subscribeInventoryItems = (
  callback: (items: InventoryItem[]) => void
): (() => void) => {
  const colRef = collection(db, COLLECTIONS.ITEMS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: InventoryItem[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as InventoryItem);
      });
      callback(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, COLLECTIONS.ITEMS);
    }
  );
};

export const saveInventoryItem = async (item: InventoryItem): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.ITEMS, item.id);
    await setDoc(docRef, item, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${COLLECTIONS.ITEMS}/${item.id}`);
  }
};

export const deleteInventoryItem = async (itemId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.ITEMS, itemId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${COLLECTIONS.ITEMS}/${itemId}`);
  }
};

// 2. STOCK TRANSACTIONS (Real-time listener)
export const subscribeStockTransactions = (
  callback: (transactions: StockTransaction[]) => void
): (() => void) => {
  const colRef = collection(db, COLLECTIONS.TRANSACTIONS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: StockTransaction[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as StockTransaction);
      });
      // Sort by timestamp descending (newest first)
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, COLLECTIONS.TRANSACTIONS);
    }
  );
};

export const saveStockTransaction = async (trx: StockTransaction): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.TRANSACTIONS, trx.id);
    await setDoc(docRef, trx, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${COLLECTIONS.TRANSACTIONS}/${trx.id}`);
  }
};

export const deleteStockTransaction = async (trxId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.TRANSACTIONS, trxId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${COLLECTIONS.TRANSACTIONS}/${trxId}`);
  }
};

export const deleteAllStockTransactions = async (): Promise<void> => {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.TRANSACTIONS));
    const batch = writeBatch(db);
    snap.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, COLLECTIONS.TRANSACTIONS);
  }
};

// 3. JOB REPORTS (Real-time listener)
export const subscribeJobReports = (
  callback: (reports: FumigationJobReport[]) => void
): (() => void) => {
  const colRef = collection(db, COLLECTIONS.JOB_REPORTS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: FumigationJobReport[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as FumigationJobReport);
      });
      list.sort((a, b) => new Date(b.executionDate || b.createdAt || 0).getTime() - new Date(a.executionDate || a.createdAt || 0).getTime());
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, COLLECTIONS.JOB_REPORTS);
    }
  );
};

export const saveJobReport = async (report: FumigationJobReport): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.JOB_REPORTS, report.id);
    await setDoc(docRef, report, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${COLLECTIONS.JOB_REPORTS}/${report.id}`);
  }
};

export const deleteJobReport = async (reportId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.JOB_REPORTS, reportId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${COLLECTIONS.JOB_REPORTS}/${reportId}`);
  }
};

// 4. RAW MATERIAL RECOMMENDATIONS (Real-time listener)
export const subscribeRawRecommendations = (
  callback: (recs: RawMaterialRecommendation[]) => void
): (() => void) => {
  const colRef = collection(db, COLLECTIONS.RECOMMENDATIONS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: RawMaterialRecommendation[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as RawMaterialRecommendation);
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, COLLECTIONS.RECOMMENDATIONS);
    }
  );
};

export const saveRawRecommendation = async (rec: RawMaterialRecommendation): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.RECOMMENDATIONS, rec.id);
    await setDoc(docRef, rec, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${COLLECTIONS.RECOMMENDATIONS}/${rec.id}`);
  }
};

export const deleteRawRecommendation = async (recId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.RECOMMENDATIONS, recId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${COLLECTIONS.RECOMMENDATIONS}/${recId}`);
  }
};

// 5. AUTH USERS (Real-time listener)
export const subscribeAuthUsers = (
  callback: (users: AuthUser[]) => void
): (() => void) => {
  const colRef = collection(db, COLLECTIONS.USERS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: AuthUser[] = [];
      snapshot.forEach((d) => {
        const u = d.data() as AuthUser;
        list.push({
          ...u,
          permissions: u.permissions || getDefaultPermissionsForRole(u.role),
        });
      });
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, COLLECTIONS.USERS);
    }
  );
};

export const saveAuthUser = async (user: AuthUser): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.USERS, user.id);
    await setDoc(docRef, user, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${COLLECTIONS.USERS}/${user.id}`);
  }
};

export const deleteAuthUser = async (userId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.USERS, userId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${COLLECTIONS.USERS}/${userId}`);
  }
};

// 6. MASTER DATA ITEMS (Generic CRUD & Listeners)
export function subscribeMasterCollection<T extends { id: string }>(
  collectionName: string,
  callback: (items: T[]) => void
): () => void {
  const colRef = collection(db, collectionName);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: T[] = [];
      snapshot.forEach((d) => list.push(d.data() as T));
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, collectionName);
    }
  );
}

export async function saveMasterDocument<T extends { id: string }>(
  collectionName: string,
  docItem: T
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docItem.id);
    await setDoc(docRef, docItem, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${docItem.id}`);
  }
}

export async function deleteMasterDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${docId}`);
  }
}

// 7. SYSTEM SETTINGS
export const subscribeSystemSettings = (
  callback: (settings: SystemSettings) => void
): (() => void) => {
  const docRef = doc(db, COLLECTIONS.SETTINGS, 'default_setting');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as SystemSettings);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, `${COLLECTIONS.SETTINGS}/default_setting`);
    }
  );
};

export const saveSystemSettings = async (settings: SystemSettings): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.SETTINGS, 'default_setting');
    await setDoc(docRef, settings, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${COLLECTIONS.SETTINGS}/default_setting`);
  }
};

// 8. AUTO-SEED DATABASE IF EMPTY ON FIRST BOOT
export const seedDatabaseIfEmpty = async (): Promise<void> => {
  try {
    // Check if items collection is empty
    const itemSnap = await getDocs(collection(db, COLLECTIONS.ITEMS));
    if (itemSnap.empty) {
      console.log('Seeding initial inventory items to Firestore...');
      const batch = writeBatch(db);
      INITIAL_ITEMS.forEach((it) => {
        batch.set(doc(db, COLLECTIONS.ITEMS, it.id), it);
      });
      await batch.commit();
    }

    // Check transactions
    const trxSnap = await getDocs(collection(db, COLLECTIONS.TRANSACTIONS));
    if (trxSnap.empty) {
      console.log('Seeding initial transactions to Firestore...');
      const batch = writeBatch(db);
      INITIAL_TRANSACTIONS.forEach((trx) => {
        batch.set(doc(db, COLLECTIONS.TRANSACTIONS, trx.id), trx);
      });
      await batch.commit();
    }

    // Check users
    const userSnap = await getDocs(collection(db, COLLECTIONS.USERS));
    if (userSnap.empty) {
      console.log('Seeding initial auth users to Firestore...');
      const batch = writeBatch(db);
      INITIAL_AUTH_USERS.forEach((user) => {
        batch.set(doc(db, COLLECTIONS.USERS, user.id), user);
      });
      await batch.commit();
    }

    // Check job reports
    const jobSnap = await getDocs(collection(db, COLLECTIONS.JOB_REPORTS));
    if (jobSnap.empty) {
      console.log('Seeding initial job reports to Firestore...');
      const batch = writeBatch(db);
      INITIAL_JOB_REPORTS.forEach((j) => {
        batch.set(doc(db, COLLECTIONS.JOB_REPORTS, j.id), j);
      });
      await batch.commit();
    }

    // Check recommendations
    const recSnap = await getDocs(collection(db, COLLECTIONS.RECOMMENDATIONS));
    if (recSnap.empty) {
      console.log('Seeding initial recommendations to Firestore...');
      const batch = writeBatch(db);
      INITIAL_RAW_RECOMMENDATIONS.forEach((r) => {
        batch.set(doc(db, COLLECTIONS.RECOMMENDATIONS, r.id), r);
      });
      await batch.commit();
    }

    // Check system settings
    const settingSnap = await getDocs(collection(db, COLLECTIONS.SETTINGS));
    if (settingSnap.empty) {
      await setDoc(doc(db, COLLECTIONS.SETTINGS, 'default_setting'), INITIAL_SYSTEM_SETTINGS);
    }

    // Check master data
    const supSnap = await getDocs(collection(db, COLLECTIONS.SUPPLIERS));
    if (supSnap.empty) {
      const b = writeBatch(db);
      INITIAL_SUPPLIERS.forEach((s) => b.set(doc(db, COLLECTIONS.SUPPLIERS, s.id), s));
      await b.commit();
    }

    const locSnap = await getDocs(collection(db, COLLECTIONS.LOCATIONS));
    if (locSnap.empty) {
      const b = writeBatch(db);
      INITIAL_LOCATIONS.forEach((l) => b.set(doc(db, COLLECTIONS.LOCATIONS, l.id), l));
      await b.commit();
    }

    const opSnap = await getDocs(collection(db, COLLECTIONS.OPERATORS));
    if (opSnap.empty) {
      const b = writeBatch(db);
      INITIAL_OPERATORS.forEach((o) => b.set(doc(db, COLLECTIONS.OPERATORS, o.id), o));
      await b.commit();
    }

    const destSnap = await getDocs(collection(db, COLLECTIONS.DESTINATIONS));
    if (destSnap.empty) {
      const b = writeBatch(db);
      INITIAL_PROJECT_DESTINATIONS.forEach((d) => b.set(doc(db, COLLECTIONS.DESTINATIONS, d.id), d));
      await b.commit();
    }

    const unitSnap = await getDocs(collection(db, COLLECTIONS.UNITS));
    if (unitSnap.empty) {
      const b = writeBatch(db);
      INITIAL_UNITS.forEach((u) => b.set(doc(db, COLLECTIONS.UNITS, u.id), u));
      await b.commit();
    }

    const medSnap = await getDocs(collection(db, COLLECTIONS.MEDICINES));
    if (medSnap.empty) {
      const b = writeBatch(db);
      INITIAL_CHEMICAL_MEDICINES.forEach((m) => b.set(doc(db, COLLECTIONS.MEDICINES, m.id), m));
      await b.commit();
    }

    const fuelSnap = await getDocs(collection(db, COLLECTIONS.FUELS));
    if (fuelSnap.empty) {
      const b = writeBatch(db);
      INITIAL_FUEL_TYPES.forEach((f) => b.set(doc(db, COLLECTIONS.FUELS, f.id), f));
      await b.commit();
    }

    const eqSnap = await getDocs(collection(db, COLLECTIONS.EQUIPMENT));
    if (eqSnap.empty) {
      const b = writeBatch(db);
      INITIAL_EQUIPMENT_INVENTORY.forEach((e) => b.set(doc(db, COLLECTIONS.EQUIPMENT, e.id), e));
      await b.commit();
    }

    console.log('✓ Firestore initial seeding check complete.');
  } catch (err) {
    console.error('Error seeding initial Firestore data:', err);
  }
};

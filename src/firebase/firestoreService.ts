import {
  collection,
  doc,
  getDoc,
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

/**
 * Recursively strips keys whose value is undefined, which Firestore rejects in setDoc/updateDoc.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

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
    await setDoc(docRef, sanitizeForFirestore(item), { merge: true });
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

export const deleteAllInventoryItems = async (): Promise<void> => {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.ITEMS));
    const docs = snap.docs;
    for (let i = 0; i < docs.length; i += 400) {
      const batch = writeBatch(db);
      docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, COLLECTIONS.ITEMS);
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
    await setDoc(docRef, sanitizeForFirestore(trx), { merge: true });
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
    const docs = snap.docs;
    for (let i = 0; i < docs.length; i += 400) {
      const batch = writeBatch(db);
      docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, COLLECTIONS.TRANSACTIONS);
  }
};

export const deleteAllOutflowTransactions = async (): Promise<void> => {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.TRANSACTIONS));
    const outDocs = snap.docs.filter((d) => {
      const data = d.data() as StockTransaction;
      return data.type === 'OUT';
    });
    for (let i = 0; i < outDocs.length; i += 400) {
      const batch = writeBatch(db);
      outDocs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
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
    await setDoc(docRef, sanitizeForFirestore(report), { merge: true });
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

export const deleteAllJobReports = async (jobType?: 'FUMIGASI' | 'SPRAYING_FOGGING'): Promise<void> => {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.JOB_REPORTS));
    const targetDocs = jobType
      ? snap.docs.filter((d) => (d.data() as FumigationJobReport).jobType === jobType)
      : snap.docs;
    for (let i = 0; i < targetDocs.length; i += 400) {
      const batch = writeBatch(db);
      targetDocs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, COLLECTIONS.JOB_REPORTS);
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
    await setDoc(docRef, sanitizeForFirestore(rec), { merge: true });
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
    await setDoc(docRef, sanitizeForFirestore(user), { merge: true });
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
    await setDoc(docRef, sanitizeForFirestore(docItem), { merge: true });
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
    await setDoc(docRef, sanitizeForFirestore(settings), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${COLLECTIONS.SETTINGS}/default_setting`);
  }
};

// 8. AUTO-SEED DATABASE ONLY ON ONCE-EVER CLEAN BOOT (DO NOT OVERWRITE OR RESURRECT DELETED DATA)
export const seedDatabaseIfEmpty = async (): Promise<void> => {
  try {
    const markerRef = doc(db, COLLECTIONS.SETTINGS, 'seed_marker');
    const markerSnap = await getDoc(markerRef);
    if (markerSnap.exists() && markerSnap.data()?.isSeeded) {
      // Database has already been initialized previously.
      // User modifications (edits, deletions, additions) are authoritative.
      // NEVER restore or re-add deleted items.
      return;
    }

    // Check if any collections already have user data (e.g. from Vercel or prior runs)
    const itemSnap = await getDocs(collection(db, COLLECTIONS.ITEMS));
    const trxSnap = await getDocs(collection(db, COLLECTIONS.TRANSACTIONS));
    const jobSnap = await getDocs(collection(db, COLLECTIONS.JOB_REPORTS));

    if (!itemSnap.empty || !trxSnap.empty || !jobSnap.empty) {
      // Data exists in Firestore already; mark as initialized and do not overwrite or reseed.
      await setDoc(markerRef, { isSeeded: true, seededAt: new Date().toISOString() }, { merge: true });
      return;
    }

    console.log('Seeding initial data for brand-new empty Firestore instance...');

    // 1. Initial inventory items
    const itemBatch = writeBatch(db);
    INITIAL_ITEMS.forEach((it) => {
      itemBatch.set(doc(db, COLLECTIONS.ITEMS, it.id), sanitizeForFirestore(it));
    });
    await itemBatch.commit();

    // 2. Initial transactions
    const trxBatch = writeBatch(db);
    INITIAL_TRANSACTIONS.forEach((trx) => {
      trxBatch.set(doc(db, COLLECTIONS.TRANSACTIONS, trx.id), sanitizeForFirestore(trx));
    });
    await trxBatch.commit();

    // 3. Initial auth users
    const userBatch = writeBatch(db);
    INITIAL_AUTH_USERS.forEach((user) => {
      userBatch.set(doc(db, COLLECTIONS.USERS, user.id), sanitizeForFirestore(user));
    });
    await userBatch.commit();

    // 4. Initial job reports
    const jobBatch = writeBatch(db);
    INITIAL_JOB_REPORTS.forEach((j) => {
      jobBatch.set(doc(db, COLLECTIONS.JOB_REPORTS, j.id), sanitizeForFirestore(j));
    });
    await jobBatch.commit();

    // 5. Initial recommendations
    const recBatch = writeBatch(db);
    INITIAL_RAW_RECOMMENDATIONS.forEach((r) => {
      recBatch.set(doc(db, COLLECTIONS.RECOMMENDATIONS, r.id), sanitizeForFirestore(r));
    });
    await recBatch.commit();

    // 6. Initial system settings
    await setDoc(doc(db, COLLECTIONS.SETTINGS, 'default_setting'), sanitizeForFirestore(INITIAL_SYSTEM_SETTINGS));

    // 7. Initial master data
    const supBatch = writeBatch(db);
    INITIAL_SUPPLIERS.forEach((s) => supBatch.set(doc(db, COLLECTIONS.SUPPLIERS, s.id), sanitizeForFirestore(s)));
    await supBatch.commit();

    const locBatch = writeBatch(db);
    INITIAL_LOCATIONS.forEach((l) => locBatch.set(doc(db, COLLECTIONS.LOCATIONS, l.id), sanitizeForFirestore(l)));
    await locBatch.commit();

    const opBatch = writeBatch(db);
    INITIAL_OPERATORS.forEach((o) => opBatch.set(doc(db, COLLECTIONS.OPERATORS, o.id), sanitizeForFirestore(o)));
    await opBatch.commit();

    const destBatch = writeBatch(db);
    INITIAL_PROJECT_DESTINATIONS.forEach((d) => destBatch.set(doc(db, COLLECTIONS.DESTINATIONS, d.id), sanitizeForFirestore(d)));
    await destBatch.commit();

    const unitBatch = writeBatch(db);
    INITIAL_UNITS.forEach((u) => unitBatch.set(doc(db, COLLECTIONS.UNITS, u.id), sanitizeForFirestore(u)));
    await unitBatch.commit();

    const medBatch = writeBatch(db);
    INITIAL_CHEMICAL_MEDICINES.forEach((m) => medBatch.set(doc(db, COLLECTIONS.MEDICINES, m.id), sanitizeForFirestore(m)));
    await medBatch.commit();

    const fuelBatch = writeBatch(db);
    INITIAL_FUEL_TYPES.forEach((f) => fuelBatch.set(doc(db, COLLECTIONS.FUELS, f.id), sanitizeForFirestore(f)));
    await fuelBatch.commit();

    const eqBatch = writeBatch(db);
    INITIAL_EQUIPMENT_INVENTORY.forEach((e) => eqBatch.set(doc(db, COLLECTIONS.EQUIPMENT, e.id), sanitizeForFirestore(e)));
    await eqBatch.commit();

    // Mark as initialized permanently so future boots NEVER resurrect deleted records
    await setDoc(markerRef, { isSeeded: true, seededAt: new Date().toISOString() }, { merge: true });
    console.log('✓ Firestore initial setup complete and seed_marker stored.');
  } catch (err) {
    console.error('Error in seedDatabaseIfEmpty:', err);
  }
};

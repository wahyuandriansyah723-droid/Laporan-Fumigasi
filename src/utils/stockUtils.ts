import { InventoryItem } from '../types/inventory';

/**
  * Safely get the minimum stock threshold for an item,
  * supporting both minimumStockThreshold and legacy minStockAlert.
  */
export function getMinThreshold(item: Partial<InventoryItem> | null | undefined): number {
  if (!item) return 0;
  if (typeof item.minimumStockThreshold === 'number') {
    return item.minimumStockThreshold;
  }
  if (typeof item.minStockAlert === 'number') {
    return item.minStockAlert;
  }
  return 0;
}

/**
 * Returns true if the current stock is below or equal to the minimum stock threshold.
 */
export function isBelowMinimumThreshold(item: InventoryItem): boolean {
  const threshold = getMinThreshold(item);
  return item.currentStock <= threshold;
}

/**
 * Returns true if the current stock is critically low (<= 50% of minimum threshold, or 0).
 */
export function isCriticallyBelowThreshold(item: InventoryItem): boolean {
  const threshold = getMinThreshold(item);
  if (threshold <= 0) return item.currentStock === 0;
  return item.currentStock <= threshold * 0.5;
}

/**
 * Calculates how many units are missing to reach the minimum stock threshold.
 */
export function getStockDeficit(item: InventoryItem): number {
  const threshold = getMinThreshold(item);
  return Math.max(0, threshold - item.currentStock);
}

/**
 * Suggests an optimal proactive restocking order quantity (deficit + 50% safety buffer).
 */
export function getSuggestedRestockQty(item: InventoryItem): number {
  const deficit = getStockDeficit(item);
  if (deficit <= 0) return 0;
  const buffer = Math.ceil(getMinThreshold(item) * 0.5);
  return deficit + buffer;
}

/**
 * Returns stock health analysis object.
 */
export function getStockThresholdStatus(item: InventoryItem): {
  isAlert: boolean;
  level: 'CRITICAL' | 'LOW' | 'OPTIMAL';
  ratioPercent: number; // currentStock / threshold * 100
  deficit: number;
  label: string;
} {
  const threshold = getMinThreshold(item);
  const deficit = getStockDeficit(item);
  const ratioPercent = threshold > 0 ? Math.round((item.currentStock / threshold) * 100) : 100;

  if (isCriticallyBelowThreshold(item)) {
    return {
      isAlert: true,
      level: 'CRITICAL',
      ratioPercent,
      deficit,
      label: item.currentStock === 0 ? 'Stok Habis (0%)' : `Kritis (${ratioPercent}% dari Ambang)`,
    };
  }

  if (isBelowMinimumThreshold(item)) {
    return {
      isAlert: true,
      level: 'LOW',
      ratioPercent,
      deficit,
      label: `Di Bawah Ambang (${ratioPercent}%)`,
    };
  }

  return {
    isAlert: false,
    level: 'OPTIMAL',
    ratioPercent,
    deficit: 0,
    label: `Aman (${ratioPercent}%)`,
  };
}

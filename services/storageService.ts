import { Asset, INITIAL_ASSETS } from '../types';
import { db, auth } from './firebase';
import { collection, doc, getDocs, setDoc, writeBatch } from 'firebase/firestore';

export const loadAssets = async (): Promise<Asset[]> => {
  try {
    const user = auth.currentUser;
    if (!user) return INITIAL_ASSETS;

    const querySnapshot = await getDocs(collection(db, 'users', user.uid, 'assets'));
    if (querySnapshot.empty) {
        return INITIAL_ASSETS;
    }
    
    return querySnapshot.docs.map(doc => doc.data() as Asset);
  } catch (e) {
    console.error("Failed to load assets from firestore", e);
    return INITIAL_ASSETS;
  }
};

export const saveAssets = async (assets: Asset[]): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    // Use a batch write for efficiency (though setDoc individually is fine for small updates, batch is better for full save)
    const batch = writeBatch(db);
    
    assets.forEach(asset => {
      const docRef = doc(db, 'users', user.uid, 'assets', asset.id);
      batch.set(docRef, asset);
    });

    await batch.commit();
  } catch (e) {
    console.error("Failed to save assets to firestore", e);
  }
};

export const calculateSummary = (assets: Asset[]) => {
  let totalValue = 0;
  let totalCost = 0;

  const typeMap = new Map<string, number>();

  assets.forEach(asset => {
    const value = asset.quantity * asset.currentPrice;
    const cost = asset.quantity * asset.avgPrice;
    totalValue += value;
    totalCost += cost;

    const currentTypeTotal = typeMap.get(asset.type) || 0;
    typeMap.set(asset.type, currentTypeTotal + value);
  });

  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  const allocation = Array.from(typeMap.entries()).map(([name, value]) => ({
    name,
    value
  }));

  return {
    totalValue,
    totalCost,
    totalGainLoss,
    totalGainLossPercent,
    allocation
  };
};
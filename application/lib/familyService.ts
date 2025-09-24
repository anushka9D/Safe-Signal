import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase-config';

export interface FamilyMember {
  id?: string;
  name: string;
  phoneNumber: string;
  relationship: string;
  email: string;
  status: 'safe' | 'in_danger';
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  lastUpdated: Date;
  userId: string;
  addedBy: string;
}

export const initializeFamilyCollection = async () => {
  try {
    // Check if the collection exists by trying to get a document
    const testDoc = doc(db, 'family', 'test');
    await getDoc(testDoc);
    
    console.log('Family collection is accessible');
    return true;
  } catch (error) {
    console.error('Error accessing family collection:', error);
    return false;
  }
};

export const createFamilyMember = async (memberData: Omit<FamilyMember, 'id'>) => {
  try {
    const familyRef = collection(db, 'family');
    const docRef = await setDoc(doc(familyRef), memberData);
    console.log('Family member created successfully');
    return docRef;
  } catch (error) {
    console.error('Error creating family member:', error);
    throw error;
  }
};

export const updateFamilyMemberStatus = async (
  memberId: string, 
  status: 'safe' | 'in_danger',
  location?: { latitude: number; longitude: number; address: string }
) => {
  try {
    const memberRef = doc(db, 'family', memberId);
    const updateData: any = {
      status,
      lastUpdated: new Date(),
    };
    
    if (location) {
      updateData.location = location;
    }
    
    await setDoc(memberRef, updateData, { merge: true });
    console.log('Family member status updated successfully');
  } catch (error) {
    console.error('Error updating family member status:', error);
    throw error;
  }
};
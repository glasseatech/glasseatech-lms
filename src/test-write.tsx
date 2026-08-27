import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export async function testWrite() {
  try {
    await setDoc(doc(db, 'courses_metadata', 'browser_test'), { buyCount: 1 });
    console.log("Browser write success!");
  } catch(e) {
    console.error("Browser write failed:", e);
  }
}

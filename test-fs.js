import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const fbApp = initializeApp(firebaseConfig);
const fsDb = getFirestore(fbApp, firebaseConfig.firestoreDatabaseId);

async function test() {
  try {
    await setDoc(doc(fsDb, 'courses_metadata', 'test'), { buyCount: 1 });
    const snap = await getDocs(collection(fsDb, 'courses_metadata'));
    snap.forEach(d => console.log(d.id, d.data()));
  } catch(e) {
    console.error(e);
  }
}
test();

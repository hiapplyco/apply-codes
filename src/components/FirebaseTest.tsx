import { useEffect, useState } from 'react';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { collection, addDoc, getDocs } from 'firebase/firestore';

export function FirebaseTest() {
  const [status, setStatus] = useState<string>('Checking Firebase...');
  const [user, setUser] = useState<any>(null);
  const [testData, setTestData] = useState<any[]>([]);

  useEffect(() => {
    testFirebase();
  }, []);

  const testFirebase = async () => {
    try {
      if (!isFirebaseConfigured()) {
        setStatus('Firebase not configured');
        return;
      }

      setStatus('Firebase configured! Testing auth...');

      // Test anonymous auth
      const userCredential = await signInAnonymously(auth);
      setUser(userCredential.user);
      setStatus(`Authenticated as: ${userCredential.user.uid}`);

      // Test Firestore write
      const docRef = await addDoc(collection(db, 'test'), {
        message: 'Hello from Firebase!',
        timestamp: new Date().toISOString(),
        userId: userCredential.user.uid
      });

      setStatus(`Document written with ID: ${docRef.id}`);

      // Test Firestore read
      const querySnapshot = await getDocs(collection(db, 'test'));
      const data: any[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setTestData(data);
      setStatus('Firebase test successful!');
    } catch (error: any) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="p-4 border rounded bg-gray-50">
      <h3 className="text-lg font-semibold mb-2">Firebase Status</h3>
      <p className="text-sm mb-2">{status}</p>
      {user && (
        <div className="text-sm">
          <p>User ID: {user.uid}</p>
          <p>Anonymous: {user.isAnonymous ? 'Yes' : 'No'}</p>
        </div>
      )}
      {testData.length > 0 && (
        <div className="mt-2">
          <p className="text-sm font-semibold">Test Documents:</p>
          <ul className="text-xs">
            {testData.map(doc => (
              <li key={doc.id}>{doc.message} ({doc.timestamp})</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
import { firebaseSupabaseAdapter } from "./firebase-adapter";

export const getFirestoreAdapter = () => {
  console.log("Using Firebase Firestore adapter");
  return firebaseSupabaseAdapter;
};

export const firestoreClient = getFirestoreAdapter();

export const getCurrentClientType = (): "firebase" => "firebase";

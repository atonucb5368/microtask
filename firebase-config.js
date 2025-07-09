// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC4XxHjQWQVLaIkxcWCm9oy03dTeT0OCbo",
  authDomain: "microtaskearning.firebaseapp.com",
  databaseURL: "https://microtaskearning-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "microtaskearning",
  storageBucket: "microtaskearning.firebasestorage.app",
  messagingSenderId: "341069455740",
  appId: "1:341069455740:web:f229c5b19f23a0760904f9"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth(); // Authentication
const database = firebase.database(); // Realtime Database
const firestore = firebase.firestore(); // Firestore
const storage = firebase.storage(); // Cloud Storage

// Firestore settings (optional)
firestore.settings({
  timestampsInSnapshots: true,
  merge: true
});

// Enable offline persistence for Firestore (optional)
firestore.enablePersistence()
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled
      // in one tab at a time.
      console.warn('Offline persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      // The current browser does not support all of the
      // features required to enable persistence
      console.warn('Current browser does not support offline persistence');
    }
  });

// Export services for use in other modules
export { auth, database, firestore, storage };

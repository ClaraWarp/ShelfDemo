import firebase from "firebase/compat/app";
import 'firebase/compat/firestore'

const firebaseApp = firebase.initializeApp({
    // this is where the key goes.
  });

const db = firebaseApp.firestore();


export default db;
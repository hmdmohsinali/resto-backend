import admin from "firebase-admin";
import dotenv from "dotenv";
dotenv.config();

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://resto-1dccd-default-rtdb.firebaseio.com"
});

export default admin;
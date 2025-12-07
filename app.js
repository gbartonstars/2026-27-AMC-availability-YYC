// Firebase config - REPLACE THESE VALUES with your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyD...", 
  authDomain: "star1-schedule.firebaseapp.com",
  databaseURL: "https://star1-schedule-default-rtdb.firebaseio.com/",
  projectId: "star1-schedule",
  storageBucket: "star1-schedule.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

class StaffScheduleApp {
  constructor() {
    this.currentStaff = null
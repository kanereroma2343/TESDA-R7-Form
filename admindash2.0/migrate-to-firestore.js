// Import required Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, get, query, limitToFirst, orderByChild } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getFirestore, collection, doc, setDoc, writeBatch } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAmgjzLx4mVkeWyfjwKNMtxmL9o1BesaW0",
    authDomain: "sampleform-fd82e.firebaseapp.com",
    databaseURL: "https://sampleform-fd82e-default-rtdb.firebaseio.com",
    projectId: "sampleform-fd82e",
    storageBucket: "sampleform-fd82e.firebasestorage.app",
    messagingSenderId: "129137441476",
    appId: "1:129137441476:web:e29e8ca547b93aa1d3a791",
    measurementId: "G-DZMYEG4NHL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const rtdb = getDatabase(app);
const firestore = getFirestore(app);

// Migration settings
const BATCH_SIZE = 500; // Number of documents to write in each batch
const PAGE_SIZE = 1000; // Number of documents to read at once

// Progress tracking
let totalMigrated = 0;
let totalErrors = 0;
let lastProcessedKey = null;

// Function to transform data for Firestore
function transformData(data) {
    // Add any necessary data transformations here
    return {
        ...data,
        migratedAt: new Date().toISOString(),
        // Add any additional fields or transformations needed
    };
}

// Function to write a batch of documents to Firestore
async function writeBatchToFirestore(documents) {
    const batch = writeBatch(firestore);
    
    for (const [key, data] of Object.entries(documents)) {
        const transformedData = transformData(data);
        const docRef = doc(firestore, 'applications', key);
        batch.set(docRef, transformedData);
    }
    
    try {
        await batch.commit();
        console.log(`Successfully wrote batch of ${Object.keys(documents).length} documents`);
        return true;
    } catch (error) {
        console.error('Error writing batch:', error);
        totalErrors++;
        return false;
    }
}

// Main migration function
async function migrateData() {
    console.log('Starting migration...');
    
    try {
        while (true) {
            // Construct query with pagination
            let dataQuery = query(
                ref(rtdb, 'applications'),
                orderByChild('timestamp'),
                limitToFirst(PAGE_SIZE)
            );
            
            // If we have a last processed key, start after it
            if (lastProcessedKey) {
                dataQuery = query(
                    ref(rtdb, 'applications'),
                    orderByChild('timestamp'),
                    limitToFirst(PAGE_SIZE)
                );
            }
            
            // Get data from Realtime Database
            const snapshot = await get(dataQuery);
            const data = snapshot.val();
            
            if (!data) {
                console.log('No more data to migrate');
                break;
            }
            
            // Process data in batches
            const entries = Object.entries(data);
            for (let i = 0; i < entries.length; i += BATCH_SIZE) {
                const batch = entries.slice(i, i + BATCH_SIZE);
                const batchObject = Object.fromEntries(batch);
                
                const success = await writeBatchToFirestore(batchObject);
                if (success) {
                    totalMigrated += batch.length;
                    console.log(`Progress: ${totalMigrated} documents migrated`);
                }
                
                // Update last processed key
                lastProcessedKey = batch[batch.length - 1][0];
            }
            
            // If we got less than PAGE_SIZE items, we're done
            if (Object.keys(data).length < PAGE_SIZE) {
                break;
            }
        }
        
        console.log('Migration completed!');
        console.log(`Total documents migrated: ${totalMigrated}`);
        console.log(`Total errors: ${totalErrors}`);
        
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

// Function to verify migration
async function verifyMigration() {
    try {
        // Get count from Realtime Database
        const rtdbSnapshot = await get(ref(rtdb, 'applications'));
        const rtdbCount = Object.keys(rtdbSnapshot.val() || {}).length;
        
        // Get count from Firestore
        const firestoreSnapshot = await getDocs(collection(firestore, 'applications'));
        const firestoreCount = firestoreSnapshot.size;
        
        console.log('Verification Results:');
        console.log(`Realtime Database count: ${rtdbCount}`);
        console.log(`Firestore count: ${firestoreCount}`);
        console.log(`Match: ${rtdbCount === firestoreCount ? 'Yes' : 'No'}`);
        
    } catch (error) {
        console.error('Verification failed:', error);
    }
}

// Start migration
migrateData().then(() => {
    console.log('Starting verification...');
    return verifyMigration();
}).catch(error => {
    console.error('Migration process failed:', error);
}); 
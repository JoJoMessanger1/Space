import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, getDocs, where, orderBy, limit, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

// DEIN CONFIG BLOCK
const firebaseConfig = {
  apiKey: "AIzaSyDdYLAaZqMeKTHLEfb1x8OFmF3S0TVfKTw", authDomain: "spacefollow-9da8b.firebaseapp.com", projectId: "spacefollow-9da8b", storageBucket: "spacefollow-9da8b.firebasestorage.app", messagingSenderId: "251895430596", appId: "1:251895430596:web:7477c495d525523815b891"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;

// --- AUTH LOGIK ---
document.getElementById('loginBtn').onclick = () => document.getElementById('authModal').style.display = 'block';

document.getElementById('submitAuth').onclick = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const username = document.getElementById('username').value;
    const bio = document.getElementById('bio').value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", userCredential.user.uid), {
            username: username,
            bio: bio,
            followers: []
        });
        location.reload();
    } catch (e) {
        // Wenn User existiert, versuchen einzuloggen
        await signInWithEmailAndPassword(auth, email, password);
        location.reload();
    }
};

// --- ARTIKEL ERSTELLEN ---
document.getElementById('publishBtn').onclick = async () => {
    if (!auth.currentUser) return alert("Bitte erst einloggen!");
    
    await addDoc(collection(db, "posts"), {
        uid: auth.currentUser.uid,
        author: (await getDoc(doc(db, "users", auth.currentUser.uid))).data().username,
        title: document.getElementById('postTitle').value,
        content: document.getElementById('postContent').value,
        video: document.getElementById('videoLink').value,
        likes: 0,
        createdAt: Date.now()
    });
    alert("Gepostet!");
    loadPosts();
};

// --- POSTS LADEN ---
async function loadPosts() {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(20));
    const querySnapshot = await getDocs(q);
    const container = document.getElementById('topArticles');
    container.innerHTML = "";

    querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const postDiv = document.createElement('div');
        postDiv.className = "card";
        postDiv.innerHTML = `
            <div class="profile-link" onclick="viewProfile('${data.uid}')">👤 ${data.author} ➔</div>
            <h3>${data.title}</h3>
            <p>${data.content}</p>
            ${data.video ? `<div class="video-container">Link: <a href="${data.video}" target="_blank">${data.video}</a></div>` : ''}
            <button onclick="likePost('${docSnap.id}')">❤️ Like (${data.likes})</button>
        `;
        container.appendChild(postDiv);
    });
}

// --- PROFIL ANSICHT ---
window.viewProfile = async (uid) => {
    const userSnap = await getDoc(doc(db, "users", uid));
    const userData = userSnap.data();
    
    document.getElementById('feed').style.display = 'none';
    const profilePage = document.getElementById('profilePage');
    profilePage.style.display = 'block';
    
    document.getElementById('profileHeader').innerHTML = `
        <h1>${userData.username}</h1>
        <p>${userData.bio}</p>
        <button onclick="followUser('${uid}')">Folgen</button>
    `;
};

window.followUser = async (uidToFollow) => {
    if(!auth.currentUser) return;
    const myRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(myRef, {
        following: arrayUnion(uidToFollow)
    });
    alert("Gefolgt!");
};

window.showHome = () => {
    document.getElementById('profilePage').style.display = 'none';
    document.getElementById('feed').style.display = 'block';
};

// Initialisierung
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('logoutBtn').style.display = 'block';
        loadPosts();
    }
});

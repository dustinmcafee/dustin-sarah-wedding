// ===========================
// Mobile Navigation
// ===========================
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// Close menu when clicking on a link
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
    });
});

// ===========================
// Gallery Lightbox
// ===========================
const galleryItems = document.querySelectorAll('.gallery-item');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.querySelector('.lightbox-close');
const lightboxPrev = document.querySelector('.lightbox-prev');
const lightboxNext = document.querySelector('.lightbox-next');

let currentImageIndex = 0;
const images = Array.from(galleryItems).map(item => item.querySelector('img').src);

galleryItems.forEach((item, index) => {
    item.addEventListener('click', () => {
        currentImageIndex = index;
        openLightbox();
    });
});

function openLightbox() {
    lightbox.classList.add('active');
    lightboxImg.src = images[currentImageIndex];
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function showNextImage() {
    currentImageIndex = (currentImageIndex + 1) % images.length;
    lightboxImg.src = images[currentImageIndex];
}

function showPrevImage() {
    currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
    lightboxImg.src = images[currentImageIndex];
}

lightboxClose.addEventListener('click', closeLightbox);
lightboxNext.addEventListener('click', showNextImage);
lightboxPrev.addEventListener('click', showPrevImage);

// Close lightbox on background click
lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
        closeLightbox();
    }
});

// Keyboard navigation for lightbox
document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;

    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') showNextImage();
    if (e.key === 'ArrowLeft') showPrevImage();
});

// ===========================
// RSVP Form
// ===========================
const rsvpForm = document.getElementById('rsvp-form');
const attendingRadios = document.querySelectorAll('input[name="attending"]');
const guestDetails = document.getElementById('guest-details');
const formMessage = document.getElementById('form-message');

// Show/hide guest details based on attendance
attendingRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'yes') {
            guestDetails.style.display = 'block';
            document.getElementById('num-guests').required = true;
        } else {
            guestDetails.style.display = 'none';
            document.getElementById('num-guests').required = false;
        }
    });
});

// Form submission
rsvpForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        firstName: document.getElementById('first-name').value,
        lastName: document.getElementById('last-name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        attending: document.querySelector('input[name="attending"]:checked').value,
        numGuests: document.getElementById('num-guests').value || null,
        dietaryRestrictions: document.getElementById('dietary-restrictions').value || null,
        message: document.getElementById('message').value,
        timestamp: new Date().toISOString()
    };

    try {
        // Save to Firebase
        await saveRSVP(formData);

        // Show success message
        showMessage('Thank you for your RSVP! We look forward to celebrating with you.', 'success');

        // Reset form
        rsvpForm.reset();
        guestDetails.style.display = 'none';

    } catch (error) {
        console.error('Error submitting RSVP:', error);
        showMessage('Oops! There was an error submitting your RSVP. Please try again or contact us directly.', 'error');
    }
});

function showMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;

    // Scroll to message
    formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Hide after 5 seconds
    setTimeout(() => {
        formMessage.style.display = 'none';
    }, 5000);
}

// ===========================
// Firebase Integration
// ===========================

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAU7WSwAKqLL6REJvGXhaMegk7zIHGMG3s",
    authDomain: "dustin-sarah-wedding.firebaseapp.com",
    projectId: "dustin-sarah-wedding",
    storageBucket: "dustin-sarah-wedding.firebasestorage.app",
    messagingSenderId: "522195401631",
    appId: "1:522195401631:web:06b3c0adf601a044c01baa"
};

// Initialize Firebase (will be loaded from CDN)
let db;

// Initialize Firebase when the page loads
async function initFirebase() {
    try {
        // Check if Firebase is loaded
        if (typeof firebase === 'undefined') {
            console.warn('Firebase not loaded. RSVP data will not be saved.');
            return;
        }

        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();

        console.log('Firebase initialized successfully');
    } catch (error) {
        console.error('Error initializing Firebase:', error);
    }
}

// Save RSVP to Firebase
async function saveRSVP(data) {
    if (!db) {
        throw new Error('Firebase not initialized');
    }

    // Add to Firestore
    const docRef = await db.collection('rsvps').add(data);

    // Send email notification
    await sendEmailNotification(data);

    return docRef.id;
}

// Send email notification (using Firebase Cloud Function)
async function sendEmailNotification(data) {
    if (!db) return;

    try {
        // This will trigger a Cloud Function to send email
        await db.collection('mail').add({
            to: 'dustin.mcafee@my.maryvillecollege.edu', // Your notification email
            message: {
                subject: `New RSVP from ${data.firstName} ${data.lastName}`,
                html: `
                    <h2>New Wedding RSVP</h2>
                    <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
                    <p><strong>Email:</strong> ${data.email}</p>
                    <p><strong>Phone:</strong> ${data.phone || 'N/A'}</p>
                    <p><strong>Attending:</strong> ${data.attending === 'yes' ? 'Yes' : 'No'}</p>
                    ${data.attending === 'yes' ? `
                        <p><strong>Number of Guests:</strong> ${data.numGuests}</p>
                        <p><strong>Dietary Restrictions:</strong> ${data.dietaryRestrictions || 'None'}</p>
                    ` : ''}
                    <p><strong>Message:</strong> ${data.message || 'N/A'}</p>
                    <p><strong>Submitted:</strong> ${new Date(data.timestamp).toLocaleString()}</p>
                `
            }
        });
    } catch (error) {
        console.error('Error sending email notification:', error);
    }
}

// Initialize Firebase when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFirebase);
} else {
    initFirebase();
}

// ===========================
// Smooth Scroll Enhancement
// ===========================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offset = 80; // Account for fixed navbar
            const targetPosition = target.offsetTop - offset;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ===========================
// Navbar Scroll Effect
// ===========================
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.15)';
    } else {
        navbar.style.boxShadow = '0 2px 15px rgba(0, 0, 0, 0.1)';
    }

    lastScroll = currentScroll;
});

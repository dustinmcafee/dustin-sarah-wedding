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

// Show/hide guest details and allergies based on attendance
const allergiesSection = document.getElementById('allergies-section');
const additionalGuestSection = document.getElementById('additional-guest');
const numGuestsSelect = document.getElementById('num-guests');

attendingRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'yes') {
            guestDetails.style.display = 'block';
            allergiesSection.style.display = 'block';
            document.getElementById('num-guests').required = true;
            // Check if we need to show additional guest fields
            updateAdditionalGuestVisibility();
        } else {
            guestDetails.style.display = 'none';
            allergiesSection.style.display = 'none';
            additionalGuestSection.style.display = 'none';
            document.getElementById('num-guests').required = false;
        }
    });
});

// Show/hide additional guest name fields based on number of guests
function updateAdditionalGuestVisibility() {
    const numGuests = parseInt(numGuestsSelect.value);
    if (numGuests === 2) {
        additionalGuestSection.style.display = 'block';
        document.getElementById('guest-first-name').required = true;
        document.getElementById('guest-last-name').required = true;
    } else {
        additionalGuestSection.style.display = 'none';
        document.getElementById('guest-first-name').required = false;
        document.getElementById('guest-last-name').required = false;
    }
}

numGuestsSelect.addEventListener('change', updateAdditionalGuestVisibility);

// Form submission
rsvpForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const numGuests = parseInt(document.getElementById('num-guests').value) || 1;

    // Collect additional guest info if 2 guests
    let additionalGuest = null;
    if (numGuests === 2) {
        const guestFirstName = document.getElementById('guest-first-name').value.trim();
        const guestLastName = document.getElementById('guest-last-name').value.trim();
        if (guestFirstName && guestLastName) {
            additionalGuest = {
                firstName: guestFirstName,
                lastName: guestLastName
            };
        }
    }

    const formData = {
        firstName: document.getElementById('first-name').value,
        lastName: document.getElementById('last-name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        attending: document.querySelector('input[name="attending"]:checked').value,
        numGuests: numGuests,
        additionalGuest: additionalGuest,
        allergies: document.getElementById('allergies').value || null,
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
        allergiesSection.style.display = 'none';
        additionalGuestSection.style.display = 'none';

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

// After-party invitee list
const afterPartyInvitees = [
    { firstName: 'Dakota', lastName: 'McAfee' },
    { firstName: 'Shae', lastName: 'Green' },
    { firstName: 'Cole', lastName: 'Green' },
    { firstName: 'Justin', lastName: 'Mcgee' },
    { firstName: 'Curt', lastName: 'Mandel' },
    { firstName: 'Bri', lastName: 'Murphy' },
    { firstName: 'Anna', lastName: 'Mandel' },
    { firstName: 'Jennifer', lastName: 'Kazer' },
    { firstName: 'Jeffrey', lastName: 'Kazer' },
    { firstName: 'Tyler', lastName: 'Davis' },
    { firstName: 'Candice', lastName: 'Littleton' },
    { firstName: 'Taylor', lastName: 'Hall' },
    { firstName: 'Marisa', lastName: 'Griffis' },
    { firstName: 'Logan', lastName: 'Russel' },
    { firstName: 'Aaron', lastName: 'Tipton' },
    { firstName: 'Caleb', lastName: 'Horn' },
    { firstName: 'Big Sarah', lastName: 'Roberts' },
    { firstName: 'Gavin', lastName: 'Powers' },
    { firstName: 'Destiny', lastName: 'Robbins' },
    { firstName: 'Trey', lastName: 'Howard' },
    { firstName: 'Althea', lastName: 'Knapp' },
    { firstName: 'Elyssa', lastName: 'Perkins' },
    { firstName: 'Robyn', lastName: 'Southam' },
    { firstName: 'Brady', lastName: 'Milward' },
    { firstName: 'Terry', lastName: 'Jones' },
    { firstName: 'Michael', lastName: 'Whaley' },
    { firstName: 'Brandon', lastName: 'Blair' },
    { firstName: 'Andrew', lastName: 'Hendrickson' },
    { firstName: 'Kayci', lastName: 'Austin' },
    { firstName: 'Drew', lastName: 'Brown' }
];

// Check if someone is on the after-party list
function isAfterPartyInvitee(firstName, lastName) {
    const first = firstName.trim().toLowerCase();
    const last = lastName.trim().toLowerCase();

    return afterPartyInvitees.some(invitee => {
        const invFirst = invitee.firstName.toLowerCase();
        const invLast = invitee.lastName.toLowerCase();

        // Match first name (allow partial matches like "Big Sarah" matching "Sarah")
        const firstMatch = first === invFirst ||
                          first.includes(invFirst) ||
                          invFirst.includes(first);

        // Match last name (allow empty last names in list)
        const lastMatch = invLast === '' ||
                         last === invLast ||
                         last.includes(invLast) ||
                         invLast.includes(last);

        return firstMatch && lastMatch;
    });
}

// Send after-party invitation email
async function sendAfterPartyInvitation(data) {
    if (!db) return;

    try {
        await db.collection('mail').add({
            to: data.email,
            from: 'dustin.mcafee@my.maryvillecollege.edu',
            replyTo: 'dustin.mcafee@my.maryvillecollege.edu',
            message: {
                subject: '🤫 You\'ve Been Selected - Secret After-Party',
                html: `
<div style="background: #0a0a0f; padding: 0; font-family: Arial, sans-serif;">
    <div style="background: linear-gradient(135deg, rgba(255,0,128,0.2) 0%, rgba(128,0,255,0.2) 50%, rgba(0,255,255,0.2) 100%); padding: 50px 20px; text-align: center; border-bottom: 2px solid #ff0080;">
        <div style="display: inline-block; border: 2px solid #ff0080; padding: 8px 20px; margin-bottom: 20px;">
            <p style="font-family: Arial, sans-serif; color: #ff0080; font-size: 12px; text-transform: uppercase; letter-spacing: 4px; margin: 0; font-weight: bold;">Top Secret</p>
        </div>
        <h1 style="color: #ffffff; font-size: 36px; font-weight: 900; text-transform: uppercase; letter-spacing: 4px; margin: 0 0 10px 0;">After Party</h1>
        <p style="color: #00ffff; font-size: 14px; text-transform: uppercase; letter-spacing: 6px; margin: 0;">You've Been Selected</p>
    </div>

    <div style="padding: 50px 40px; text-align: center;">
        <p style="color: #ffffff; font-size: 18px; margin: 0 0 10px 0;">Hey ${data.firstName},</p>
        <p style="color: #cccccc; font-size: 18px; line-height: 1.8; margin: 0 0 30px 0;">
            You're invited to stay for the <span style="color: #00ffff; font-weight: bold;">real party</span> after the wedding reception ends.
        </p>

        <div style="background: rgba(255, 0, 128, 0.1); border: 1px solid rgba(255, 0, 128, 0.3); border-radius: 8px; padding: 30px; margin: 0 0 30px 0; text-align: left;">
            <p style="color: #ff0080; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 15px 0; font-weight: bold;">The Cover Story</p>
            <p style="color: #cccccc; font-size: 16px; line-height: 1.8; margin: 0;">
                When the reception ends at <strong style="color: #ffffff;">9:00 PM</strong>, we'll start ushering guests out. You're on the <span style="color: #ff0080; font-weight: bold;">"clean-up crew"</span> — that's your reason to stay behind.
            </p>
        </div>

        <div style="background: rgba(0, 255, 255, 0.05); border: 1px solid rgba(0, 255, 255, 0.2); border-radius: 8px; padding: 30px; margin: 0 0 30px 0;">
            <p style="color: #00ffff; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 20px 0; font-weight: bold;">The Schedule</p>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <span style="color: #ff0080; font-size: 13px; font-weight: bold;">9:00 PM</span>
                    </td>
                    <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right;">
                        <span style="color: #ffffff; font-size: 15px;">Guests Leave</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <span style="color: #8000ff; font-size: 13px; font-weight: bold;">9:00 - 9:30 PM</span>
                    </td>
                    <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right;">
                        <span style="color: #ffffff; font-size: 15px;">"Clean-Up"</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <span style="color: #00ffff; font-size: 13px; font-weight: bold;">9:30 - 11:00 PM</span>
                    </td>
                    <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right;">
                        <span style="color: #00ffff; font-size: 15px; font-weight: bold;">THE RAVE</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 12px 0;">
                        <span style="color: #00ff80; font-size: 13px; font-weight: bold;">11:00 PM - 12:00 AM</span>
                    </td>
                    <td style="padding: 12px 0; text-align: right;">
                        <span style="color: #ffffff; font-size: 15px;">Actual Clean-Up</span>
                    </td>
                </tr>
            </table>
        </div>

        <p style="color: #888888; font-size: 15px; margin: 0 0 25px 0;">
            Let us know if you can stay for the after-party.
        </p>

        <a href="https://www.mcafee-mandel-wedding.com/afterparty.html" style="display: inline-block; background: linear-gradient(135deg, #ff0080 0%, #8000ff 100%); color: #ffffff; text-decoration: none; padding: 18px 50px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 4px; border-radius: 4px;">RSVP FOR AFTER-PARTY</a>
    </div>

    <div style="padding: 30px 40px; text-align: center; border-top: 1px solid rgba(255,0,128,0.3);">
        <div style="display: inline-block; background: rgba(255, 0, 128, 0.1); border: 1px solid #ff0080; border-radius: 4px; padding: 15px 30px;">
            <p style="color: #ff0080; font-size: 12px; text-transform: uppercase; letter-spacing: 3px; margin: 0; font-weight: bold;">🤫 Keep This Secret</p>
        </div>
    </div>

    <div style="background: rgba(255,255,255,0.02); padding: 25px 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
        <p style="color: #444444; font-size: 11px; letter-spacing: 2px; margin: 0;">D & S // 04.02.26</p>
    </div>
</div>
                `
            }
        });

        console.log('After-party invitation sent to:', data.email);
    } catch (error) {
        console.error('Error sending after-party invitation:', error);
    }
}

// Send email notification (using Firebase Cloud Function)
async function sendEmailNotification(data) {
    if (!db) return;

    try {
        // Check if on after-party list
        const isAfterPartyGuest = isAfterPartyInvitee(data.firstName, data.lastName);
        let afterPartyNote = isAfterPartyGuest && data.attending === 'yes'
            ? '<p style="background: #ff0080; color: white; padding: 10px; border-radius: 4px;"><strong>🎉 AFTER-PARTY INVITE SENT to ' + data.firstName + '!</strong></p>'
            : '';

        // Check additional guest for after-party list
        let additionalGuestNote = '';
        let additionalGuestAfterParty = false;
        if (data.additionalGuest && data.attending === 'yes') {
            const guest = data.additionalGuest;
            additionalGuestAfterParty = isAfterPartyInvitee(guest.firstName, guest.lastName);
            additionalGuestNote = `<p><strong>Additional Guest:</strong> ${guest.firstName} ${guest.lastName}</p>`;
            if (additionalGuestAfterParty) {
                afterPartyNote += '<p style="background: #ff0080; color: white; padding: 10px; border-radius: 4px;"><strong>🎉 AFTER-PARTY INVITE SENT to ' + guest.firstName + '!</strong></p>';
            }
        }

        const hasAfterPartyInvite = isAfterPartyGuest || additionalGuestAfterParty;

        // Send notification to you
        await db.collection('mail').add({
            to: 'dustin.mcafee@my.maryvillecollege.edu', // Your notification email
            message: {
                subject: `${hasAfterPartyInvite ? '🎉 ' : ''}New RSVP from ${data.firstName} ${data.lastName}`,
                html: `
                    <h2>New Wedding RSVP</h2>
                    ${afterPartyNote}
                    <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
                    <p><strong>Email:</strong> ${data.email}</p>
                    <p><strong>Phone:</strong> ${data.phone || 'N/A'}</p>
                    <p><strong>Attending:</strong> ${data.attending === 'yes' ? 'Yes' : 'No'}</p>
                    ${data.attending === 'yes' ? `
                        <p><strong>Number of Guests:</strong> ${data.numGuests}</p>
                        ${additionalGuestNote}
                        <p><strong>Dietary Restrictions/Allergies:</strong> ${data.allergies || 'None specified'}</p>
                    ` : ''}
                    <p><strong>Message:</strong> ${data.message || 'N/A'}</p>
                    <p><strong>Submitted:</strong> ${new Date(data.timestamp).toLocaleString()}</p>
                `
            }
        });

        // Send confirmation to guest
        const guestMessage = data.attending === 'yes'
            ? `
                <p>We're thrilled that you'll be joining us on our special day!</p>
                <p><strong>Number of guests:</strong> ${data.numGuests}</p>
                <p><strong>Date:</strong> April 2, 2026 at 4:00 PM</p>
                <p><strong>Location:</strong> Norris Dam Tea Room, Norris Cir, Andersonville, TN 37705</p>
                <p>We can't wait to celebrate with you!</p>
            `
            : `
                <p>Thank you for letting us know. We're sorry you can't make it, but we appreciate your response.</p>
                <p>We hope to see you soon!</p>
            `;

        await db.collection('mail').add({
            to: data.email,
            from: 'dustin.mcafee@my.maryvillecollege.edu',
            replyTo: 'dustin.mcafee@my.maryvillecollege.edu',
            message: {
                subject: data.attending === 'yes'
                    ? 'RSVP Confirmed - Dustin & Sarah\'s Wedding'
                    : 'RSVP Received - Dustin & Sarah\'s Wedding',
                html: `
                    <h2>Thank you for your RSVP!</h2>
                    <p>Hi ${data.firstName},</p>
                    ${guestMessage}
                    <p>If you have any questions, please don't hesitate to reach out.</p>
                    <p>Best wishes,<br>Dustin & Sarah</p>
                `
            }
        });

        // Check if this person is on the after-party list and send invitation
        if (data.attending === 'yes' && isAfterPartyInvitee(data.firstName, data.lastName)) {
            await sendAfterPartyInvitation(data);
        }

        // Check if the additional guest is on the after-party list (send to main email)
        if (data.attending === 'yes' && data.additionalGuest) {
            const guest = data.additionalGuest;
            if (isAfterPartyInvitee(guest.firstName, guest.lastName)) {
                await sendAfterPartyInvitation({
                    firstName: guest.firstName,
                    lastName: guest.lastName,
                    email: data.email  // Send to main person's email
                });
            }
        }
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
// FAQ Accordion
// ===========================
document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
        const faqItem = button.parentElement;
        const isActive = faqItem.classList.contains('active');

        // Close all FAQ items
        document.querySelectorAll('.faq-item').forEach(item => {
            item.classList.remove('active');
            item.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        });

        // Open clicked item if it wasn't already open
        if (!isActive) {
            faqItem.classList.add('active');
            button.setAttribute('aria-expanded', 'true');
        }
    });
});

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

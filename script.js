// script.js
function openVideo() {
  window.open('https://youtu.be/GrXaWkKDzrc', '_blank');
}

// Typing animation for hero headline
const phrases = ["Fleet Efficiency.", "Tyre Performance.", "Proven Results."];
let i = 0, j = 0, isDeleting = false;
function typeEffect() {
  const typedSpan = document.getElementById('typedHeadline');
  if (!typedSpan) return;
  const current = phrases[i];
  if (isDeleting) typedSpan.textContent = current.substring(0, j--);
  else typedSpan.textContent = current.substring(0, j++);
  if (!isDeleting && j === current.length) { isDeleting = true; setTimeout(typeEffect, 2000); return; }
  if (isDeleting && j === 0) { isDeleting = false; i = (i + 1) % phrases.length; }
  setTimeout(typeEffect, isDeleting ? 50 : 100);
}
setTimeout(typeEffect, 500);

let voiceRecognition = null;

document.addEventListener('alpine:init', () => {
  Alpine.data('primeFleetData', () => ({
    mobileMenuOpen: false,
    formStatus: '',
    submitting: false,
    formName: '',
    formCompany: '',
    formEmail: '',
    formMessage: '',
    isDarkMode: localStorage.getItem('darkMode') === 'true',
    slideIndex: 0,
    ceoImageIndex: 0,
    
    // Chatbot state
    chatbotOpen: false,
    chatMode: 'text',
    chatMessages: [],
    textInput: '',
    isTyping: false,
    voiceActive: false,
    voiceConnecting: false,
    voiceError: null,
    isRecording: false,
    bookingStep: 0,
    bookingData: { name: "", company: "", contact: "", schedule: "" },
    
    init() {
      if (this.isDarkMode) document.body.classList.add('dark-mode');
      setInterval(() => { this.slideIndex = (this.slideIndex + 1) % 8; }, 5000);
      setInterval(() => { this.ceoImageIndex = (this.ceoImageIndex + 1) % 2; }, 4000);
      this.addBotMessage("Hello! I'm PrimeFleet AI Expert. I can help you with:\n\n• Tyre management and lifecycle optimization\n• Fleet efficiency and cost reduction\n• Technical training programs\n• Retread management solutions\n• CPK analysis and failure diagnostics\n• Booking a consultation\n\nHow can I assist you today?");
    },
    
    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode;
      if (this.isDarkMode) document.body.classList.add('dark-mode');
      else document.body.classList.remove('dark-mode');
      localStorage.setItem('darkMode', this.isDarkMode);
    },
    
    async submitForm() {
      this.submitting = true;
      this.formStatus = '';
      const fd = new FormData();
      fd.append('name', this.formName);
      fd.append('company', this.formCompany);
      fd.append('email', this.formEmail);
      fd.append('message', this.formMessage);
      try {
        const res = await fetch('https://formspree.io/f/xbdpgjgb', { method: 'POST', body: fd, headers: { 'Accept': 'application/json' } });
        if (res.ok) {
          this.formStatus = '<div class="success-message">✓ Request received. A senior consultant will respond within 24 hours.</div>';
          this.formName = this.formCompany = this.formEmail = this.formMessage = '';
          setTimeout(() => this.formStatus = '', 5000);
        } else {
          this.formStatus = '<div class="error-message">Submission failed. Please use WhatsApp.</div>';
        }
      } catch {
        this.formStatus = '<div class="error-message">Network issue. Please use WhatsApp.</div>';
      } finally {
        this.submitting = false;
      }
    },
    
    async sendToFormspree(data) {
      try {
        const response = await fetch("https://formspree.io/f/xbdpgjgb", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({ subject: "New Booking from PrimeFleet Chatbot", message: `Name: ${data.name}\nCompany: ${data.company || "Not provided"}\nContact: ${data.contact}\nPreferred Schedule: ${data.schedule}` })
        });
        return response.ok;
      } catch (error) {
        return false;
      }
    },
    
    openChatbot() { this.chatbotOpen = true; setTimeout(() => this.scrollToBottom(), 100); },
    closeChatbot() { this.chatbotOpen = false; this.stopVoiceChat(); },
    switchMode(mode) { this.chatMode = mode; if (mode === 'voice') this.stopVoiceChat(); },
    addBotMessage(text) { this.chatMessages.push({ id: Date.now(), sender: 'bot', text: text }); this.scrollToBottom(); },
    addUserMessage(text) { this.chatMessages.push({ id: Date.now(), sender: 'user', text: text }); this.scrollToBottom(); },
    scrollToBottom() { setTimeout(() => { const container = document.querySelector('.chat-messages'); if (container) container.scrollTop = container.scrollHeight; }, 100); },
    
    getProfessionalResponse(question) {
      const q = question.toLowerCase().trim();
      const isGreeting = /hi|hello|hey/.test(q);
      const isBooking = /book|appointment|schedule|meeting|consult/.test(q);
      const isTyre = /tyre|tire/.test(q);
      const isCost = /cost|saving|roi|reduce/.test(q);
      const isTraining = /training|driver|technician/.test(q);
      const isContact = /contact|phone|email|reach/.test(q);
      
      if (isGreeting) return "Hello 👋 Welcome to PrimeFleet Solutions. How can I assist you today? You can ask about our services or book a consultation.";
      if (isBooking) { this.bookingStep = 1; return "Great choice. Let's schedule your consultation.\n\nWhat is your name?"; }
      if (this.bookingStep === 1) { this.bookingData.name = question; this.bookingStep = 2; return "Thank you. What company are you representing? (You can skip by typing 'skip')"; }
      if (this.bookingStep === 2) { if (q !== 'skip') this.bookingData.company = question; this.bookingStep = 3; return "Got it. Please provide your phone number or email address."; }
      if (this.bookingStep === 3) { this.bookingData.contact = question; this.bookingStep = 4; return "When would you prefer the consultation? (Date & time)"; }
      if (this.bookingStep === 4) {
        this.bookingData.schedule = question;
        const dataToSend = { ...this.bookingData };
        this.bookingStep = 0;
        this.bookingData = { name: "", company: "", contact: "", schedule: "" };
        this.sendToFormspree(dataToSend);
        return "✅ Your consultation request has been submitted successfully. Our team will contact you shortly.";
      }
      if (isTyre) return "We help fleets extend tyre life by up to 30% through proper inflation, rotation, and failure analysis. Would you like a quick assessment for your fleet?";
      if (isCost) return "Our clients typically achieve up to 30% cost reduction and 12–18% fuel savings. We focus on data-driven optimization and efficiency.";
      if (isTraining) return "We offer driver and technician training covering tyre handling, safety, and efficiency. Sessions can be on-site or virtual.";
      if (isContact) return "You can reach us via WhatsApp at +254 715 598 399 or email mumobrian1542@gmail.com. We respond within 24 hours.";
      return "I can help with fleet optimization, tyre management, or booking a consultation. What would you like to explore?";
    },
    
    async sendTextMessage() {
      if (!this.textInput.trim()) return;
      const userMessage = this.textInput.trim();
      this.addUserMessage(userMessage);
      this.textInput = '';
      this.isTyping = true;
      setTimeout(() => {
        this.isTyping = false;
        this.addBotMessage(this.getProfessionalResponse(userMessage));
      }, 600);
    },
    
    async startVoiceChat() {
      this.voiceConnecting = true;
      this.voiceError = null;
      try {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) throw new Error('Speech recognition not supported. Please use Chrome, Edge, or Safari.');
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        voiceRecognition = new SpeechRecognition();
        voiceRecognition.lang = 'en-US';
        voiceRecognition.interimResults = false;
        voiceRecognition.maxAlternatives = 1;
        voiceRecognition.continuous = false;
        voiceRecognition.onstart = () => { this.isRecording = true; this.voiceConnecting = false; this.voiceActive = true; };
        voiceRecognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          if (transcript && transcript.trim()) {
            this.addUserMessage(`🎤 ${transcript}`);
            const response = this.getProfessionalResponse(transcript);
            this.addBotMessage(response);
            if ('speechSynthesis' in window) {
              const utterance = new SpeechSynthesisUtterance(response);
              utterance.lang = 'en-US';
              utterance.rate = 0.95;
              window.speechSynthesis.cancel();
              window.speechSynthesis.speak(utterance);
            }
          }
        };
        voiceRecognition.onerror = (event) => {
          this.voiceError = event.error === 'not-allowed' ? 'Microphone access denied.' : 'Voice error: ' + event.error;
          this.stopVoiceChat();
        };
        voiceRecognition.onend = () => { this.isRecording = false; if (this.voiceActive) this.voiceActive = false; };
        voiceRecognition.start();
      } catch (err) {
        this.voiceError = err.message || 'Failed to start voice chat.';
        this.voiceConnecting = false;
      }
    },
    
    stopVoiceChat() {
      if (voiceRecognition) { try { voiceRecognition.abort(); } catch(e) {} voiceRecognition = null; }
      window.speechSynthesis.cancel();
      this.voiceActive = false;
      this.voiceConnecting = false;
      this.isRecording = false;
    }
  }));
});

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => anchor.addEventListener('click', function(e) {
  const href = this.getAttribute('href');
  if (href === '#') return;
  const target = document.querySelector(href);
  if (target) {
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth' });
  }
}));

// Initialize AOS
AOS.init({ once: true, offset: 30, duration: 700 });
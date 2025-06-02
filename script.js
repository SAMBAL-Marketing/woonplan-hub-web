/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Firebase v9+ Modular SDK Imports
import { initializeApp } from "firebase/app";
// Removed: import { getAnalytics } from "firebase/analytics"; 
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
} from "firebase/auth";
import {
    getFirestore,
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    writeBatch,
    query as firestoreQuery,
    orderBy,
    limit,
    deleteField
} from "firebase/firestore";


// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyBuId9Yv6LmUOupjnqBxRhNGeIMlcnlu6o",
  authDomain: "woonplan-hub.firebaseapp.com",
  projectId: "woonplan-hub",
  storageBucket: "woonplan-hub.firebasestorage.app", // Corrected to user-provided value
  messagingSenderId: "210903134913",
  appId: "1:210903134913:web:76abffb7ee8efcb5215a40",
  measurementId: "G-0XL1XZRBT5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const fbAuth = getAuth(app);
const db = getFirestore(app);
// Removed: const analytics = getAnalytics(app); 


// Data constants (voorbeelddata, dient vervangen te worden door accurate data)
const insulationData = {
    Tussenwoning: {
        spouw: { brutoPricePerM2: 25, subsidiePerM2: 5, gasSavingPercentage: 0.20, applicableBouwjaarMin: 1920, applicableBouwjaarMax: 1991, m2Factor: 0.8, label: "Spouwmuurisolatie" },
        vloer: { brutoPricePerM2: 40, subsidiePerM2: 7, gasSavingPercentage: 0.15, applicableBouwjaarMin: 1900, applicableBouwjaarMax: 1982, m2Factor: 1.0, label: "Vloerisolatie" },
        dak: { brutoPricePerM2: 55, subsidiePerM2: 8, gasSavingPercentage: 0.25, applicableBouwjaarMin: 1900, applicableBouwjaarMax: 2000, m2Factor: 1.2, label: "Dakisolatie" },
        glas: { brutoPricePerM2: 150, subsidiePerM2: 23, gasSavingPercentage: 0.10, m2Factor: 0.2, label: "HR++ Glas" }
    },
    Hoekwoning: {
        spouw: { brutoPricePerM2: 25, subsidiePerM2: 5, gasSavingPercentage: 0.22, applicableBouwjaarMin: 1920, applicableBouwjaarMax: 1991, m2Factor: 1.2, label: "Spouwmuurisolatie" },
        vloer: { brutoPricePerM2: 40, subsidiePerM2: 7, gasSavingPercentage: 0.16, applicableBouwjaarMin: 1900, applicableBouwjaarMax: 1982, m2Factor: 1.0, label: "Vloerisolatie" },
        dak: { brutoPricePerM2: 55, subsidiePerM2: 8, gasSavingPercentage: 0.27, applicableBouwjaarMin: 1900, applicableBouwjaarMax: 2000, m2Factor: 1.3, label: "Dakisolatie" },
        glas: { brutoPricePerM2: 150, subsidiePerM2: 23, gasSavingPercentage: 0.11, m2Factor: 0.25, label: "HR++ Glas" }
    },
    '2 onder 1 kap': {
        spouw: { brutoPricePerM2: 27, subsidiePerM2: 5, gasSavingPercentage: 0.23, applicableBouwjaarMin: 1920, applicableBouwjaarMax: 1991, m2Factor: 1.1, label: "Spouwmuurisolatie" },
        vloer: { brutoPricePerM2: 42, subsidiePerM2: 7, gasSavingPercentage: 0.17, applicableBouwjaarMin: 1900, applicableBouwjaarMax: 1982, m2Factor: 1.0, label: "Vloerisolatie" },
        dak: { brutoPricePerM2: 58, subsidiePerM2: 8, gasSavingPercentage: 0.28, applicableBouwjaarMin: 1900, applicableBouwjaarMax: 2000, m2Factor: 1.4, label: "Dakisolatie" },
        glas: { brutoPricePerM2: 155, subsidiePerM2: 23, gasSavingPercentage: 0.12, m2Factor: 0.3, label: "HR++ Glas" }
    },
    Vrijstaand: {
        spouw: { brutoPricePerM2: 30, subsidiePerM2: 5, gasSavingPercentage: 0.25, applicableBouwjaarMin: 1920, applicableBouwjaarMax: 1991, m2Factor: 1.5, label: "Spouwmuurisolatie" },
        vloer: { brutoPricePerM2: 45, subsidiePerM2: 7, gasSavingPercentage: 0.18, applicableBouwjaarMin: 1900, applicableBouwjaarMax: 1982, m2Factor: 1.0, label: "Vloerisolatie" },
        dak: { brutoPricePerM2: 60, subsidiePerM2: 8, gasSavingPercentage: 0.30, applicableBouwjaarMin: 1900, applicableBouwjaarMax: 2000, m2Factor: 1.6, label: "Dakisolatie" },
        glas: { brutoPricePerM2: 160, subsidiePerM2: 23, gasSavingPercentage: 0.13, m2Factor: 0.35, label: "HR++ Glas" }
    }
};

const heatPumpData = {
    hybride: {
        '3kW': { cost: 5000, subsidy: 1800, Econsumption: 1200, GbesparingFactor: 0.50, label: "Hybride 3kW" },
        '5kW': { cost: 6500, subsidy: 2250, Econsumption: 1800, GbesparingFactor: 0.65, label: "Hybride 5kW" },
        '7kW': { cost: 8000, subsidy: 2700, Econsumption: 2400, GbesparingFactor: 0.75, label: "Hybride 7kW" },
    },
    volledig_elektrisch: {
        '5kW': { cost: 10000, subsidy: 2900, Econsumption: 3000, GbesparingFactor: 1.0, label: "Volledig Elektrisch 5kW" },
        '7kW': { cost: 12000, subsidy: 3400, Econsumption: 4000, GbesparingFactor: 1.0, label: "Volledig Elektrisch 7kW" },
        '9kW': { cost: 14000, subsidy: 3900, Econsumption: 5000, GbesparingFactor: 1.0, label: "Volledig Elektrisch 9kW" },
    },
    none: { 'none': { cost: 0, subsidy: 0, Econsumption: 0, GbesparingFactor: 0, label: "Geen" } }
};

const MeterkastKosten = {
    geen_vervanging: { price: 0, label: "Geen vervanging" },
    '1_fase_naar_3_fase': { price: 850, label: "1-fase naar 3-fase" },
    nieuwe_groepenkast: { price: 600, label: "Nieuwe groepenkast" }
};

const AircoPrijzen = {
    none: { price: 0, annualKwh: 0, label: "Geen" },
    single_split_2_5kW: { price: 1600, annualKwh: 300, label: "Single Split 2.5kW" },
    multi_split_5kW: { price: 2900, annualKwh: 600, label: "Multi Split 5kW" }
};

const solarPanelConstants = {
    pricePerPanel: 350,
    wpPerPanel: 410,
    performanceRatio: 0.85,
    subsidyPerPanel: 0
};

const AppView = {
    LOGIN: 'login-view',
    DASHBOARD: 'dashboard-view',
    TOOL: 'tool-view',
    CONTACT: 'contact-view',
    SETTINGS: 'settings-view',
};

let currentView = AppView.LOGIN;
let currentUser = null; // Holds the current Firebase user
let lastCalculationResults = null;

// Firestore collection names
const USERS_COLLECTION = 'users';
const CLIENTS_SUBCOLLECTION = 'clients';
const ARCHIVED_CLIENTS_SUBCOLLECTION = 'archivedClients';
const APP_DATA_DOC_SUBCOLLECTION = 'appData'; // Subcollection name
const APP_DATA_DOC_ID = 'mainDoc'; // Document ID within the subcollection for settings and form drafts
const SETTINGS_FIELD = 'settings';
const CURRENT_FORM_FIELD = 'currentForm';


document.addEventListener("DOMContentLoaded", () => {
    // View elements
    const loginView = document.getElementById(AppView.LOGIN);
    const dashboardView = document.getElementById(AppView.DASHBOARD);
    const toolView = document.getElementById(AppView.TOOL);
    const contactView = document.getElementById(AppView.CONTACT);
    const settingsView = document.getElementById(AppView.SETTINGS);
    const loginErrorMessage = document.getElementById('login-error-message');

    const appViews = [loginView, dashboardView, toolView, contactView, settingsView];

    // Tool specific elements
    const form = document.getElementById("energyDataForm");
    const fieldsets = Array.from(document.querySelectorAll('#tool-view .form-step'));
    const progressBar = document.getElementById('progress');
    const progressSteps = Array.from(document.querySelectorAll('#tool-view .progress-step'));
    const resultSection = document.getElementById('resultSection');
    const resultDiv = document.getElementById('result');
    const numberOfPanelsSelect = document.getElementById('numberOfPanels');
    const clearCurrentFormButton = document.getElementById('clear-current-form-btn');

    // Navigation buttons
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const addClientNavBtn = document.getElementById('add-client-nav-btn');
    const contactNavBtn = document.getElementById('contact-nav-btn');
    const settingsNavBtn = document.getElementById('settings-nav-btn');
    const backToDashboardFromToolBtn = document.getElementById('back-to-dashboard-from-tool-btn');
    const backToDashboardFromContactBtn = document.getElementById('back-to-dashboard-from-contact-btn');
    const backToDashboardFromSettingsBtn = document.getElementById('back-to-dashboard-from-settings-btn');

    const saveClientDataBtn = document.getElementById('save-client-data-btn');

    // Contact Form
    const contactForm = document.getElementById('contact-form');
    const contactFormFeedback = document.getElementById('contact-form-feedback');

    // Settings
    const darkModeToggle = document.getElementById('darkModeToggle');
    const changePasswordBtn = document.getElementById('change-password-btn');
    const clearAllAppDataBtn = document.getElementById('clear-all-app-data-btn');

    let currentStep = 0;

    // --- Initialize App ---
    onAuthStateChanged(fbAuth, async (user) => {
        if (user) {
            currentUser = user;
            await loadSettings(); // Load settings for the logged-in user
            switchView(AppView.DASHBOARD);
            await renderClientList();
        } else {
            currentUser = null;
            // Load default/guest settings (e.g. dark mode if saved non-user-specifically before, or just default)
            document.body.classList.remove('dark-mode'); // Default to light mode if not logged in
            if(darkModeToggle) darkModeToggle.checked = false;
            switchView(AppView.LOGIN);
        }
        if(loginErrorMessage) loginErrorMessage.textContent = ''; // Clear any previous login errors
    });

    function switchView(targetView) {
        appViews.forEach(view => {
            if (view) view.classList.toggle('active-view', view.id === targetView);
        });
        currentView = targetView;
        window.scrollTo(0,0);
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const emailInput = document.getElementById('username'); 
            const passwordInput = document.getElementById('password');
            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (!email || !password) {
                if(loginErrorMessage) loginErrorMessage.textContent = "E-mail en wachtwoord zijn verplicht.";
                loginErrorMessage.classList.add('visible');
                return;
            }
            if(loginErrorMessage) loginErrorMessage.textContent = "";
            loginErrorMessage.classList.remove('visible');
            setButtonLoadingState(loginBtn, 'Inloggen...');

            try {
                await signInWithEmailAndPassword(fbAuth, email, password);
                // onAuthStateChanged will handle view switching and data loading
            } catch (error) {
                console.error("Login failed:", error);
                if(loginErrorMessage) {
                    switch (error.code) {
                        case 'auth/user-not-found':
                        case 'auth/wrong-password':
                        case 'auth/invalid-credential': // Common for wrong email/pass
                            loginErrorMessage.textContent = 'Ongeldige e-mail of wachtwoord.';
                            break;
                        case 'auth/invalid-email':
                            loginErrorMessage.textContent = 'Ongeldig e-mailadres formaat.';
                            break;
                        default:
                            loginErrorMessage.textContent = 'Login mislukt. Probeer het opnieuw.';
                    }
                    loginErrorMessage.classList.add('visible');
                }
            } finally {
                resetButtonState(loginBtn, 'Login', 'fa-sign-in-alt');
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await signOut(fbAuth);
                // onAuthStateChanged will handle view switching
            } catch (error) {
                console.error("Logout failed:", error);
                alert("Uitloggen mislukt. Probeer het opnieuw.");
            }
        });
    }

    if (addClientNavBtn) {
        addClientNavBtn.addEventListener('click', async () => {
            if (!currentUser) {
                 switchView(AppView.LOGIN); return;
            }
            form.reset();
            currentStep = 0;
            lastCalculationResults = null;
            if(resultSection) resultSection.classList.add('hidden');
            if(resultDiv) resultDiv.innerHTML = '<p>Uw resultaten worden berekend...</p>';
            ["spouwmuurIsolatie", "vloerIsolatie", "dakIsolatie", "isolatieGlasHR"].forEach(id => {
                 const sel = document.getElementById(id);
                 if (sel) delete sel.dataset.userInteracted;
            });
            initializeForm();
            await loadFormFromFirestore();
            switchView(AppView.TOOL);
        });
    }

    if (contactNavBtn) contactNavBtn.addEventListener('click', () => switchView(AppView.CONTACT));
    if (settingsNavBtn) settingsNavBtn.addEventListener('click', () => switchView(AppView.SETTINGS));

    const commonBackToDashboardLogic = async () => {
        if (!currentUser) { switchView(AppView.LOGIN); return; }
        switchView(AppView.DASHBOARD);
        await renderClientList();
    };

    if(backToDashboardFromToolBtn) backToDashboardFromToolBtn.addEventListener('click', commonBackToDashboardLogic);
    if(backToDashboardFromContactBtn) backToDashboardFromContactBtn.addEventListener('click', commonBackToDashboardLogic);
    if(backToDashboardFromSettingsBtn) backToDashboardFromSettingsBtn.addEventListener('click', commonBackToDashboardLogic);


    if (numberOfPanelsSelect) {
        const optionNone = new Option('0 Panelen', '0');
        numberOfPanelsSelect.add(optionNone);
        for (let i = 6; i <= 30; i++) {
            const option = new Option(`${i} Panelen`, i.toString());
            numberOfPanelsSelect.add(option);
        }
    }

    function getElementValue(id) {
        const element = document.getElementById(id);
        return element ? element.value : "";
    }

    function getElementValueAsNumber(id, defaultValue = 0) {
        const val = parseFloat(getElementValue(id));
        return isNaN(val) ? defaultValue : val;
    }

    function initializeForm() {
        fieldsets.forEach((fs, idx) => {
            fs.classList.toggle('active', idx === currentStep);
            fs.querySelectorAll('input, select, textarea').forEach(input => {
                 input.disabled = (idx !== currentStep);
                 if (input.required && !input.hasAttribute('data-original-required')) {
                    input.setAttribute('data-original-required', 'true');
                 }
                 input.required = (idx === currentStep && input.hasAttribute('data-original-required'));
            });
        });
        updateProgressBar();
        updateInsulationOptionsVisibility();
        const calcBtn = fieldsets[currentStep]?.querySelector('#calculate-btn.next-btn');
        if (calcBtn) resetButtonState(calcBtn, 'Bereken Besparing', 'fa-calculator');
    }

    function updateProgressBar() {
        progressSteps.forEach((step, idx) => {
            step.classList.toggle('active', idx === currentStep);
            step.classList.toggle('completed', idx < currentStep);
        });
        const totalSteps = progressSteps.length;
        let progressPercentage = 0;
        if (totalSteps > 1) {
             progressPercentage = (currentStep / (totalSteps - 1)) * 100;
        }
        if(progressBar) progressBar.style.width = `${progressPercentage}%`;
    }

    function setErrorMessage(field, message) {
        const errorMsgElement = document.getElementById(`${field.id}-error`);
        let describedBy = field.getAttribute('aria-describedby') || '';
        const errorId = `${field.id}-error`;
        const helpId = `${field.id}-help`;

        if (errorMsgElement) {
            errorMsgElement.textContent = message;
            errorMsgElement.classList.toggle('visible', !!message);
        }
        field.classList.toggle('error', !!message);

        let describedByArray = describedBy.split(' ').filter(id => id.trim() !== '' && id !== errorId);
        if (message) {
            describedByArray.push(errorId);
            field.setAttribute('aria-invalid', 'true');
        } else {
            field.removeAttribute('aria-invalid');
        }

        const helpElement = document.getElementById(helpId);
        if (helpElement && !describedByArray.includes(helpId)) {
            describedByArray.push(helpId);
        }

        field.setAttribute('aria-describedby', describedByArray.join(' ').trim());
    }

    function validateCurrentStep() {
        const currentFieldset = fieldsets[currentStep];
        if (!currentFieldset) return false;

        const requiredFields = currentFieldset.querySelectorAll('input[required], select[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (field.disabled) {
                 setErrorMessage(field, '');
                 return;
            }
            let errorMessage = '';
            if (!field.value.trim()) {
                errorMessage = 'Dit veld is verplicht.';
            } else if (field.id === "email" && !/^\S+@\S+\.\S+$/.test(field.value)){
                errorMessage = 'Voer een geldig e-mailadres in.';
            } else if (field instanceof HTMLInputElement && field.type === 'number') {
                const numValue = parseFloat(field.value);
                const min = parseFloat(field.min);
                const max = parseFloat(field.max);
                if (field.min && !isNaN(min) && numValue < min) {
                    errorMessage = `Waarde moet minimaal ${min} zijn.`;
                } else if (field.max && !isNaN(max) && numValue > max) {
                     errorMessage = `Waarde mag maximaal ${max} zijn.`;
                }
            }

            if (field instanceof HTMLSelectElement && field.required && field.value === "") {
                 errorMessage = 'Maak een keuze.';
            }

            if (errorMessage) {
                isValid = false;
                setErrorMessage(field, errorMessage);
            } else {
                setErrorMessage(field, '');
            }
        });

        const loanTermField = document.getElementById('loanTerm');
        if (loanTermField && !loanTermField.disabled && loanTermField.required && loanTermField.value && (getElementValueAsNumber('loanTerm') % 12 !== 0)) {
            isValid = false;
            setErrorMessage(loanTermField, 'De looptijd moet een veelvoud van 12 maanden zijn.');
        } else if (loanTermField && !loanTermField.disabled && loanTermField.classList.contains('error') && loanTermField.value && (getElementValueAsNumber('loanTerm') % 12 === 0)) {
            setErrorMessage(loanTermField, '');
        }

        const installationAddressCheckbox = document.getElementById('installationAddressDifferent');
        if (installationAddressCheckbox && installationAddressCheckbox.checked) {
            const section = document.getElementById('installationAddressSection');
            section.querySelectorAll('input[required]').forEach(field => {
                 if (!field.value.trim()) {
                    isValid = false;
                    setErrorMessage(field, 'Dit veld is verplicht voor het installatieadres.');
                 } else {
                    setErrorMessage(field, '');
                 }
            });
        }
        return isValid;
    }

    function setButtonLoadingState(button, loadingText) {
        button.disabled = true;
        const textSpan = button.querySelector('.btn-text');
        const mainIcon = button.querySelector('.icon-main');
        const loadingIcon = button.querySelector('.icon-loading');

        if (textSpan) textSpan.textContent = loadingText;
        if (mainIcon) mainIcon.style.display = 'none';
        if (loadingIcon) loadingIcon.style.display = 'inline-block';
    }

    function resetButtonState(button, defaultText, defaultIconClass) {
        button.disabled = false;
        const textSpan = button.querySelector('.btn-text');
        const mainIcon = button.querySelector('.icon-main');
        const loadingIcon = button.querySelector('.icon-loading');

        if (textSpan) textSpan.textContent = defaultText;
        if (mainIcon) {
            mainIcon.style.display = 'inline-block';
            mainIcon.className = `fas ${defaultIconClass} icon-main`;
        }
        if (loadingIcon) loadingIcon.style.display = 'none';
    }

    document.querySelectorAll('#tool-view .next-btn').forEach(btn => btn.addEventListener('click', () => {
        const button = btn;
        if (button.id === 'calculate-btn') {
            if (validateCurrentStep()) {
                setButtonLoadingState(button, 'Berekenen...');
                setTimeout(() => {
                    collectAndDisplayData();
                    currentStep = Math.min(currentStep + 1, fieldsets.length - 1);
                    initializeForm();
                    resetButtonState(button, 'Bereken Besparing', 'fa-calculator');
                    window.scrollTo(0,0);
                }, 500); // Simulating async calculation
            }
        } else if (button.id === 'save-client-data-btn') {
            // This button is handled by its own event listener, no change needed here
        } else {
            if (validateCurrentStep()) {
                currentStep = Math.min(currentStep + 1, fieldsets.length - 1);
                 if (fieldsets[currentStep] && fieldsets[currentStep].id === 'resultStep' && !lastCalculationResults) {
                    collectAndDisplayData(); // Calculate if moving to results step and no results yet
                 }
                initializeForm();
                window.scrollTo(0,0);
            }
        }
    }));

    document.querySelectorAll('#tool-view .prev-btn').forEach(btn => btn.addEventListener('click', () => {
        currentStep = Math.max(currentStep - 1, 0);
        initializeForm();
        window.scrollTo(0,0);
    }));

    if (form) {
        form.addEventListener('keydown', (e) => {
            if (currentView !== AppView.TOOL) return;
            if (e.key === 'Enter') {
                if (!(e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON')) {
                    e.preventDefault();
                    const activeFieldset = fieldsets[currentStep];
                    const calculateBtnInStep = activeFieldset.querySelector('#calculate-btn.next-btn');
                    if (calculateBtnInStep) {
                        calculateBtnInStep.click();
                    } else {
                        const nextButton = activeFieldset.querySelector('.next-btn');
                        if (nextButton) {
                            nextButton.click();
                        }
                    }
                }
            }
        });
    }

    const aantalBewonersSelect = document.getElementById('aantalBewoners');
    const gasConsumptionInput = document.getElementById('gasConsumption');
    const electricityConsumptionInput = document.getElementById('electricityConsumption');

    if (aantalBewonersSelect) {
        aantalBewonersSelect.addEventListener('change', () => {
            const bewoners = aantalBewonersSelect.value;
            const placeholders = {
                gas: { '1': 900, '2': 1100, '3': 1400, '4': 1700, '5': 1900 },
                elektra: { '1': 1600, '2': 2500, '3': 3400, '4': 4300, '5': 5000 }
            };
            if (gasConsumptionInput && bewoners in placeholders.gas) {
                gasConsumptionInput.placeholder = placeholders.gas[bewoners].toString();
                if (!gasConsumptionInput.value && !gasConsumptionInput.readOnly) gasConsumptionInput.value = placeholders.gas[bewoners].toString();

            }
            if (electricityConsumptionInput && bewoners in placeholders.elektra) {
                electricityConsumptionInput.placeholder = placeholders.elektra[bewoners].toString();
                 if (!electricityConsumptionInput.value && !electricityConsumptionInput.readOnly) electricityConsumptionInput.value = placeholders.elektra[bewoners].toString();
            }
        });
    }

    const bouwjaarInput = document.getElementById("bouwjaar");
    const woningtypeSelect = document.getElementById("woningtype");

    function updateInsulationOptionsVisibility() {
        const bouwjaar = getElementValueAsNumber("bouwjaar");
        const woningtype = getElementValue("woningtype");
        const insulationNoteEl = document.getElementById("insulation-advice-note");

        if (!bouwjaar || !woningtype || !insulationData[woningtype]) {
            if (insulationNoteEl) insulationNoteEl.textContent = "Selecteer eerst woningtype en huidig bouwjaar voor specifiek isolatieadvies.";
             ["spouwmuurIsolatie", "vloerIsolatie", "dakIsolatie", "isolatieGlasHR"].forEach(id => {
                const sel = document.getElementById(id);
                if (sel) {
                    sel.innerHTML = '<option value="Yes" selected>Ja</option><option value="No">Nee</option><option value="nvt">N.v.t. / weet niet</option>';
                    sel.value = "Yes";
                    delete sel.dataset.userInteracted;
                    setErrorMessage(sel, '');
                }
            });
            return;
        }
        if (insulationNoteEl) insulationNoteEl.textContent = "";

        const insulationFieldIds = ["spouwmuurIsolatie", "vloerIsolatie", "dakIsolatie", "isolatieGlasHR"];
        const insulationTypeKeys = ["spouw", "vloer", "dak", "glas"];

        insulationFieldIds.forEach((fieldId, index) => {
            const selectElement = document.getElementById(fieldId);
            if (!selectElement) return;

            const originalSelectedValue = selectElement.value;
            selectElement.innerHTML = '';

            const insuKey = insulationTypeKeys[index];
            const data = insulationData[woningtype]?.[insuKey];

            if (!data) {
                 selectElement.add(new Option("Ja", "Yes"));
                 selectElement.add(new Option("Nee", "No"));
                 selectElement.add(new Option("N.v.t. / weet niet", "nvt"));
                 selectElement.value = "Yes";
                 return;
            }

            let isAdvisedNee = false;
            let neeText = "Nee";

            if (data.applicableBouwjaarMin && bouwjaar && bouwjaar < data.applicableBouwjaarMin) {
                neeText = `Nee (doorgaans niet standaard/mogelijk voor bouwjaar vóór ${data.applicableBouwjaarMin})`;
                isAdvisedNee = true;
            } else if (data.applicableBouwjaarMax && bouwjaar && bouwjaar > data.applicableBouwjaarMax) {
                neeText = `Nee (waarschijnlijk al aanwezig/standaard ná ${data.applicableBouwjaarMax})`;
                isAdvisedNee = true;
            }

            selectElement.add(new Option("Ja", "Yes"));
            selectElement.add(new Option(neeText, "No"));
            selectElement.add(new Option("N.v.t. / weet niet", "nvt"));

            let preferredDefaultBasedOnBauwjaar = "Yes";
            if (isAdvisedNee) {
                preferredDefaultBasedOnBauwjaar = "No";
            }

            if (selectElement.dataset.userInteracted === "true") {
                if (Array.from(selectElement.options).some(opt => opt.value === originalSelectedValue)) {
                    selectElement.value = originalSelectedValue;
                } else {
                    selectElement.value = preferredDefaultBasedOnBauwjaar;
                }
            } else {
                selectElement.value = preferredDefaultBasedOnBauwjaar;
            }

            if (!selectElement.dataset.hasChangeListener) {
                selectElement.addEventListener('change', () => {
                    selectElement.dataset.userInteracted = "true";
                });
                selectElement.dataset.hasChangeListener = "true";
            }
            setErrorMessage(selectElement, '');
        });
    }

    if (bouwjaarInput) bouwjaarInput.addEventListener("input", updateInsulationOptionsVisibility);
    if (woningtypeSelect) woningtypeSelect.addEventListener("change", updateInsulationOptionsVisibility);

    function calculateHeatPumpAdvice(livingArea, bouwjaar, gasConsumption) {
        if (!livingArea || !bouwjaar || !gasConsumption) return "N.v.t.";
        const baseLoad = (( (bouwjaar < 1992 ? 80 : bouwjaar <= 2000 ? 65 : bouwjaar <= 2010 ? 55 : bouwjaar <= 2017 ? 45 : 35) * livingArea) / 1000);
        const gasFactor = ( (gasConsumption * 9.6) / 1600);
        const advisedKw = ((baseLoad + gasFactor) / 2) * 0.7;
        return advisedKw.toFixed(1);
    }

    function calculateInsulationCosts(livingArea, woningtypeKey, selections) {
        const results = {};
        const typeData = insulationData[woningtypeKey];
        if (!typeData || !livingArea) return results;

        for (const [key, selectionValue] of Object.entries(selections)) {
            if (selectionValue === "Yes") {
                const insuKey = key;
                const insuDetails = typeData[insuKey];
                if (insuDetails) {
                    const area = livingArea * (insuDetails.m2Factor || 1);
                    const bruto = area * insuDetails.brutoPricePerM2;
                    const sub = area * insuDetails.subsidiePerM2;
                    results[key] = { brutoPrice: bruto, subsidie: sub, gasSavingApplied: insuDetails.gasSavingPercentage || 0, label: insuDetails.label || key };
                } else {
                     results[key] = { brutoPrice: 0, subsidie: 0, gasSavingApplied: 0, label: key };
                }
            } else {
                 results[key] = { brutoPrice: 0, subsidie: 0, gasSavingApplied: 0, label: typeData[key]?.label || key };
            }
        }
        return results;
    }

    function collectAndDisplayData() {
        const currentFieldset = fieldsets[currentStep];
        const calculateBtn = currentFieldset?.querySelector('#calculate-btn.next-btn');

        if (!validateCurrentStep()) {
             if(resultDiv) resultDiv.innerHTML = "<p class='error-message visible' style='text-align:center; font-weight:bold;'>Vul alle verplichte velden in de huidige stap correct in om een berekening te maken.</p>";
             if(resultSection) resultSection.classList.add('hidden');
             if(calculateBtn) resetButtonState(calculateBtn, 'Bereken Besparing', 'fa-calculator');
             initializeForm();
             window.scrollTo(0,0);
             return;
        }

        const formData = {
            woningtype: getElementValue("woningtype"),
            bouwjaar: getElementValueAsNumber("bouwjaar"),
            livingArea: getElementValueAsNumber("livingArea"),
            gasConsumption: getElementValueAsNumber("gasConsumption"),
            electricityConsumption: getElementValueAsNumber("electricityConsumption"),
            spouwmuurIsolatie: getElementValue("spouwmuurIsolatie"),
            vloerIsolatie: getElementValue("vloerIsolatie"),
            dakIsolatie: getElementValue("dakIsolatie"),
            isolatieGlasHR: getElementValue("isolatieGlasHR"),
            heatPumpType: getElementValue("heatPumpType"),
            heatPumpSize: getElementValue("heatPumpSize"),
            numberOfPanels: getElementValueAsNumber("numberOfPanels"),
            meterkastNieuw: getElementValue("meterkastNieuw"),
            aircoType: getElementValue("aircoType"),
            loanTerm: getElementValueAsNumber("loanTerm"),
            interestRate: getElementValueAsNumber("interestRate"),
        };

        const { livingArea, woningtype, bouwjaar, gasConsumption, electricityConsumption, heatPumpType, heatPumpSize, numberOfPanels, meterkastNieuw, aircoType, loanTerm, interestRate } = formData;

        const adviesWPElement = document.getElementById("adviesW");
        if(adviesWPElement) adviesWPElement.innerHTML = `Warmtepomp Capaciteit (advies: ${calculateHeatPumpAdvice(livingArea, bouwjaar, gasConsumption)} kW)`;

        const heatPumpDetails = heatPumpData[heatPumpType]?.[heatPumpSize] || heatPumpData.none.none;
        const advisedSolarPanels = Math.ceil((electricityConsumption + (heatPumpDetails.Econsumption || 0)) / solarPanelConstants.performanceRatio / solarPanelConstants.wpPerPanel);
        const adviesZElement = document.getElementById("adviesZ");
        if(adviesZElement) adviesZElement.innerHTML = `Aantal Zonnepanelen (advies: ${advisedSolarPanels > 0 ? advisedSolarPanels : 0} stuks)`;

        const insulationSelections = {
            spouw: formData.spouwmuurIsolatie,
            vloer: formData.vloerIsolatie,
            dak: formData.dakIsolatie,
            glas: formData.isolatieGlasHR,
        };
        const insulationResults = calculateInsulationCosts(livingArea, woningtype, insulationSelections);

        const currentMeterkastType = MeterkastKosten[meterkastNieuw];
        const meterkastPrijs = currentMeterkastType?.price || 0;

        const currentAircoType = AircoPrijzen[aircoType];
        const aircoPrijs = currentAircoType?.price || 0;
        const aircoAnnualKwh = currentAircoType?.annualKwh || 0;

        const panelInvestment = numberOfPanels * solarPanelConstants.pricePerPanel;
        const panelSubsidy = 0;

        const totaleBrutoInvestering = [
            aircoPrijs,
            meterkastPrijs,
            panelInvestment,
            heatPumpDetails.cost,
            ...Object.values(insulationResults).map(r => r.brutoPrice || 0)
        ].reduce((a, b) => a + b, 0);

        const totaleSubsidies = [
            heatPumpDetails.subsidy,
            panelSubsidy,
            ...Object.values(insulationResults).map(r => r.subsidie || 0)
        ].reduce((a, b) => a + b, 0);

        const nettoInvestering = totaleBrutoInvestering - totaleSubsidies;

        const monthlyRate = interestRate / 100 / 12;
        const periods = loanTerm;
        const pmt = (r, n, pv) => {
            if (n === 0) return 0;
            if (r === 0 && pv !== 0) return pv / n;
            if (r === 0 && pv === 0) return 0;
            return (pv * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        }

        const paymentWithoutSubsidy = periods > 0 ? pmt(monthlyRate, periods, totaleBrutoInvestering) : 0;
        const paymentWithSubsidy = periods > 0 ? pmt(monthlyRate, periods, nettoInvestering) : 0;

        let newGasConsumption = gasConsumption;
        let newElectricityConsumption = electricityConsumption;

        newGasConsumption = newGasConsumption * (1 - (heatPumpDetails.GbesparingFactor || 0));
        newElectricityConsumption += (heatPumpDetails.Econsumption || 0);

        Object.values(insulationResults).forEach(insuResult => {
            if (insuResult.brutoPrice > 0) {
                newGasConsumption *= (1 - (insuResult.gasSavingApplied || 0));
            }
        });

        newElectricityConsumption += aircoAnnualKwh;

        const solarProductionAnnual = numberOfPanels * solarPanelConstants.wpPerPanel * solarPanelConstants.performanceRatio;
        newElectricityConsumption -= solarProductionAnnual;
        newElectricityConsumption = Math.max(0, newElectricityConsumption);

        const gasTarief = 1.35;
        const elecTarief = 0.33;

        const currentAnnualGasCost = gasConsumption * gasTarief;
        const currentAnnualElecCost = electricityConsumption * elecTarief;
        const currentTotalAnnualEnergyCost = currentAnnualGasCost + currentAnnualElecCost;

        const newAnnualGasCost = newGasConsumption * gasTarief;
        const newAnnualElecCost = newElectricityConsumption * elecTarief;
        const newTotalAnnualEnergyCost = newAnnualGasCost + newAnnualElecCost;

        const totalAnnualEnergySaving = currentTotalAnnualEnergyCost - newTotalAnnualEnergyCost;
        const totalMonthlyEnergySaving = totalAnnualEnergySaving / 12;

        const netMonthlySavingExclSubsidyLoan = totalMonthlyEnergySaving - paymentWithoutSubsidy;
        const netMonthlySavingInclSubsidyLoan = totalMonthlyEnergySaving - paymentWithSubsidy;

        lastCalculationResults = {
            totaleBrutoInvestering,
            totaleSubsidies,
            nettoInvestering,
            paymentWithoutSubsidy,
            paymentWithSubsidy,
            currentMonthlyEnergyCost: currentTotalAnnualEnergyCost / 12,
            newMonthlyEnergyCost: newTotalAnnualEnergyCost / 12,
            totalMonthlyEnergySaving,
            netMonthlySavingExclSubsidyLoan,
            netMonthlySavingInclSubsidyLoan,
            initialGasConsumption: gasConsumption,
            newGasConsumption: Math.max(0, newGasConsumption),
            initialElecConsumption: electricityConsumption,
            newElecConsumptionWithSolar: newElectricityConsumption,
            solarProductionAnnual,
            heatPumpChosen: heatPumpType !== 'none' ? `${heatPumpData[heatPumpType]?.[heatPumpSize]?.label || heatPumpType + " " + heatPumpSize}` : "Geen",
            insulationChosenDetails: insulationResults,
            meterkastLabel: MeterkastKosten[meterkastNieuw]?.label || "N.v.t",
            aircoLabel: AircoPrijzen[aircoType]?.label || "N.v.t",
            numberOfPanels,
            loanTerm,
            interestRate,
            currentAnnualGasCost, currentAnnualElecCost, newAnnualGasCost, newAnnualElecCost,
            gasTarief, elecTarief
        };

        if (resultDiv && resultSection) {
            displayResults(lastCalculationResults);
            resultSection.classList.remove('hidden');
        }
        if(calculateBtn) resetButtonState(calculateBtn, 'Bereken Besparing', 'fa-calculator');
    }

    function displayResults(results) {
        if(!resultDiv) return;
        const f = (num) => num.toFixed(2).replace('.', ',');
        const kwh = (num) => Math.round(num).toLocaleString('nl-NL');
        const m3 = (num) => Math.round(num).toLocaleString('nl-NL');

        const isPositiveSavingExcl = results.netMonthlySavingExclSubsidyLoan >= 0;
        const isPositiveSavingIncl = results.netMonthlySavingInclSubsidyLoan >= 0;

        resultDiv.innerHTML = `
            <div class="results-grid">
                <div class="result-card">
                    <h3><i class="fas fa-piggy-bank section-icon" style="font-size: 1em;"></i>Investering & Lening</h3>
                    <div class="result-item"><span class="result-label">Totale Bruto Investering:</span><span class="result-value">€ ${f(results.totaleBrutoInvestering)}</span></div>
                    <div class="result-item"><span class="result-label">Totale Subsidies:</span><span class="result-value">€ ${f(results.totaleSubsidies)}</span></div>
                    <div class="result-item"><span class="result-label">Netto Investering (na subsidie):</span><span class="result-value">€ ${f(results.nettoInvestering)}</span></div>
                    <hr style="border-color: var(--subtle-border-color); margin: 15px 0;">
                    <div class="result-item"><span class="result-label">Maandelijkse lening (bruto inv.):</span><span class="result-value">€ ${f(results.paymentWithoutSubsidy)}</span></div>
                    <div class="result-item"><span class="result-label">Maandelijkse lening (netto inv.):</span><span class="result-value">€ ${f(results.paymentWithSubsidy)}</span></div>
                </div>

                <div class="result-card">
                    <h3><i class="fas fa-bolt section-icon" style="font-size: 1em;"></i>Energieverbruik & Kosten</h3>
                    <p style="font-weight:500; margin-bottom: 5px; color: var(--text-dark);">Huidige situatie:</p>
                    <div class="result-item"><span class="result-label">Gasverbruik (oud):</span><span class="result-value">${m3(results.initialGasConsumption)} m³</span></div>
                    <div class="result-item"><span class="result-label">Elektraverbruik (oud):</span><span class="result-value">${kwh(results.initialElecConsumption)} kWh</span></div>
                    <div class="result-item"><span class="result-label">Energiekosten p/m (oud):</span><span class="result-value">€ ${f(results.currentMonthlyEnergyCost)}</span></div>
                    <hr style="border-color: var(--subtle-border-color); margin: 15px 0;">
                    <p style="font-weight:500; margin-bottom: 5px; color: var(--text-dark);">Nieuwe situatie (geschat):</p>
                    <div class="result-item"><span class="result-label">Gasverbruik (nieuw):</span><span class="result-value">${m3(results.newGasConsumption)} m³</span></div>
                    <div class="result-item"><span class="result-label">Elektraverbruik (nieuw, na zon):</span><span class="result-value">${kwh(results.newElecConsumptionWithSolar)} kWh</span></div>
                    <div class="result-item"><span class="result-label">Zonnepanelen productie (jaar):</span><span class="result-value">${kwh(results.solarProductionAnnual)} kWh</span></div>
                    <div class="result-item"><span class="result-label">Energiekosten p/m (nieuw):</span><span class="result-value">€ ${f(results.newMonthlyEnergyCost)}</span></div>
                </div>
            </div>

            <div class="result-card" style="margin-top: 25px;">
                <h3><i class="fas fa-hand-holding-usd section-icon" style="font-size: 1em;"></i>Maandelijkse Besparing</h3>
                <div class="result-item"><span class="result-label">Besparing op energiekosten p/m:</span><span class="result-value" style="color: var(--success-color); font-weight:bold;">€ ${f(results.totalMonthlyEnergySaving)}</span></div>
                <button type="button" id="toggle-results" class="toggle-button">Toon besparing INCLUSIEF subsidie in lening</button>

                <div class="result-item important important-1 ${!isPositiveSavingExcl ? 'negative' : ''}" style="display: flex;">
                    <span class="result-label">Netto voordeel p/m (EXCLUSIEF subsidie in lening):</span>
                    <span class="result-value">€ ${f(results.netMonthlySavingExclSubsidyLoan)}</span>
                </div>
                <div class="result-item important-1" style="display: flex;"><span class="result-label">Subsidiebedrag (eenmalig):</span><span class="result-value">€ ${f(results.totaleSubsidies)}</span></div>
                <div class="result-item important important-2 ${!isPositiveSavingIncl ? 'negative' : ''}" style="display: none;">
                    <span class="result-label">Netto voordeel p/m (INCLUSIEF subsidie in lening):</span>
                    <span class="result-value">€ ${f(results.netMonthlySavingInclSubsidyLoan)}</span>
                </div>
            </div>
            <p style="font-size: 0.85em; text-align: center; margin-top: 20px; color: var(--text-light);">Alle berekeningen zijn schattingen en kunnen afwijken van de werkelijke situatie.</p>
        `;
    }

    document.body.addEventListener('click', function(event) {
        const target = event.target;
        if (target && target.id === 'toggle-results') {
            const important1Items = document.querySelectorAll('.important-1');
            const important2Items = document.querySelectorAll('.important-2');
            const toggleButton = target;
            const isShowingExcl = important2Items.length > 0 && important2Items[0].style.display === 'none';

            if (isShowingExcl) {
                important1Items.forEach(item => item.style.display = 'none');
                important2Items.forEach(item => item.style.display = 'flex');
                toggleButton.textContent = 'Toon besparing EXCLUSIEF subsidie in lening';
            } else {
                important1Items.forEach(item => item.style.display = 'flex');
                important2Items.forEach(item => item.style.display = 'none');
                toggleButton.textContent = 'Toon besparing INCLUSIEF subsidie in lening';
            }
        }
    });

    const installationAddressCheckbox = document.getElementById('installationAddressDifferent');
    const installationAddressSection = document.getElementById('installationAddressSection');
    if (installationAddressCheckbox && installationAddressSection) {
        installationAddressCheckbox.addEventListener('change', () => {
            const isChecked = installationAddressCheckbox.checked;
            installationAddressSection.style.display = isChecked ? 'block' : 'none';
            installationAddressSection.querySelectorAll('input').forEach(input => {
                if (isChecked) {
                    input.setAttribute('required', 'true');
                    if (!input.hasAttribute('data-original-required')) {
                         input.setAttribute('data-original-required', 'true');
                    }
                } else {
                    input.removeAttribute('required');
                    setErrorMessage(input, '');
                }
            });
            validateCurrentStep();
        });
    }

    // --- Firestore Data Management ---

    // Path: users/{uid}/appData/mainDoc
    function getAppDataDocRef(uid) {
        return doc(db, USERS_COLLECTION, uid, APP_DATA_DOC_SUBCOLLECTION, APP_DATA_DOC_ID);
    }
    
    // Path: users/{uid}/clients
    function getClientsCollectionRef(uid) {
        return collection(db, USERS_COLLECTION, uid, CLIENTS_SUBCOLLECTION);
    }

    // Path: users/{uid}/archivedClients
    function getArchivedClientsCollectionRef(uid) {
        return collection(db, USERS_COLLECTION, uid, ARCHIVED_CLIENTS_SUBCOLLECTION);
    }


    async function getAllClients() {
        if (!currentUser) return [];
        try {
            const clientsCollection = getClientsCollectionRef(currentUser.uid);
            const q = firestoreQuery(clientsCollection, orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching clients:", error);
            alert("Kon klanten niet laden uit de cloud.");
            return [];
        }
    }

    async function saveClient(clientData) {
        if (!currentUser) return null;
        try {
            const clientsCollection = getClientsCollectionRef(currentUser.uid);
            const docRef = await addDoc(clientsCollection, clientData);
            return docRef.id;
        } catch (error) {
            console.error("Error saving client:", error);
            alert("Kon klant niet opslaan in de cloud.");
            return null;
        }
    }

    async function getClientById(clientId) {
        if (!currentUser) return null;
        try {
            // Check active clients first
            const clientDocRef = doc(getClientsCollectionRef(currentUser.uid), clientId);
            let docSnap = await getDoc(clientDocRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            // Then check archived clients
            const archivedClientDocRef = doc(getArchivedClientsCollectionRef(currentUser.uid), clientId);
            docSnap = await getDoc(archivedClientDocRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
        } catch (error) {
            console.error(`Error fetching client ${clientId}:`, error);
            return null;
        }
    }


    async function renderClientList() {
        if (!currentUser) return;
        const clientListContainer = document.getElementById('client-list-container');
        if (!clientListContainer) return;
        clientListContainer.innerHTML = '<p>Laden van klanten...</p>';

        const clients = await getAllClients();
        if (clients.length === 0) {
            clientListContainer.innerHTML = '<p>Geen actieve klanten gevonden. Voeg een nieuwe klant toe via de knop hierboven.</p>';
            return;
        }

        clientListContainer.innerHTML = '';
        clients.forEach(client => {
            const clientItem = document.createElement('div');
            clientItem.className = 'client-item';
            clientItem.innerHTML = `
                <div class="client-item-info">
                    <p class="client-name">${client.name}</p>
                    <p class="client-date">Toegevoegd op: ${new Date(client.createdAt).toLocaleDateString('nl-NL')}</p>
                </div>
                <div class="client-item-actions">
                    <button type="button" class="btn-secondary btn-small view-quote-btn" data-client-id="${client.id}"><i class="fas fa-eye"></i> Offerte</button>
                    <button type="button" class="btn-primary btn-small send-webhook-btn" data-client-id="${client.id}"><i class="fas fa-share-square"></i> Verstuur</button>
                </div>
            `;
            clientListContainer.appendChild(clientItem);
        });

        clientListContainer.querySelectorAll('.view-quote-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const clientId = btn.dataset.clientId;
                if (clientId) showClientQuote(clientId);
            });
        });
        clientListContainer.querySelectorAll('.send-webhook-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const clientId = btn.dataset.clientId;
                if (clientId) {
                    setButtonLoadingState(btn, 'Versturen...');
                    try {
                        await sendClientDataToWebhookAndArchive(clientId);
                        alert('Klantgegevens succesvol verstuurd en gearchiveerd!');
                        await renderClientList(); // Re-render to remove the client from active list
                    } catch (error) {
                        console.error("Webhook/Archive error:", error);
                        alert('Fout bij het versturen/archiveren van klantgegevens. Zie console.');
                        resetButtonState(btn, 'Verstuur', 'fa-share-square');
                    }
                }
            });
        });
    }

    async function showClientQuote(clientId) {
        const client = await getClientById(clientId);
        if (client) {
            const quoteHTML = generateQuoteHTML(client.quoteData, client.calculationResults);
            const quoteWindow = window.open('', '_blank');
            if (quoteWindow) {
                quoteWindow.document.write(quoteHTML);
                quoteWindow.document.close();
                quoteWindow.focus();
            } else {
                alert("Het openen van het offerte-scherm is geblokkeerd. Sta pop-ups toe.");
            }
        } else {
            alert("Klant niet gevonden.");
        }
    }

    async function sendClientDataToWebhookAndArchive(clientId) {
        if (!currentUser) throw new Error("Gebruiker niet ingelogd.");

        const clientDocRef = doc(getClientsCollectionRef(currentUser.uid), clientId);
        const clientDocSnap = await getDoc(clientDocRef);

        if (!clientDocSnap.exists()) {
            throw new Error("Klant niet gevonden voor webhook verzending.");
        }
        const clientData = clientDocSnap.data();

        const payload = {
            clientDetails: clientData.quoteData,
            calculationSummary: clientData.calculationResults
        };

        const webhookUrl = "https://hook.eu1.make.com/atr3qe3qmtey8di9b66jlv4j28nwgc1n"; // Keep your actual webhook URL
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Webhook request failed: ${response.status} ${response.statusText} - ${errorBody}`);
        }

        // Archive client on successful send
        const batch = writeBatch(db);
        const archivedClientRef = doc(getArchivedClientsCollectionRef(currentUser.uid), clientId);
        batch.set(archivedClientRef, clientData); // Add to archived
        batch.delete(clientDocRef); // Remove from active
        await batch.commit();

        return response.json();
    }


    if (saveClientDataBtn) {
        saveClientDataBtn.addEventListener('click', async () => {
             if (!currentUser) {
                alert("U moet ingelogd zijn om klantgegevens op te slaan.");
                switchView(AppView.LOGIN);
                return;
            }
            if (validateCurrentStep()) {
                if (!lastCalculationResults) {
                    alert("Er is nog geen berekening gemaakt. Doorloop eerst de berekeningsstappen.");
                    return;
                }
                setButtonLoadingState(saveClientDataBtn, 'Opslaan...');

                const quoteData = {
                    woningtype: getElementValue("woningtype"), bouwjaar: getElementValueAsNumber("bouwjaar"),
                    livingArea: getElementValueAsNumber("livingArea"), energielabel: getElementValue("energielabel"),
                    aantalBewoners: getElementValue("aantalBewoners"), gasConsumption: getElementValueAsNumber("gasConsumption"),
                    electricityConsumption: getElementValueAsNumber("electricityConsumption"), currentSolarPanels: getElementValueAsNumber("currentSolarPanels"),
                    currentEnergyBill: getElementValueAsNumber("currentEnergyBill", 0), spouwmuurIsolatie: getElementValue("spouwmuurIsolatie"),
                    vloerIsolatie: getElementValue("vloerIsolatie"), dakIsolatie: getElementValue("dakIsolatie"),
                    isolatieGlasHR: getElementValue("isolatieGlasHR"), heatPumpType: getElementValue("heatPumpType"),
                    heatPumpSize: getElementValue("heatPumpSize"), numberOfPanels: getElementValueAsNumber("numberOfPanels"),
                    meterkastNieuw: getElementValue("meterkastNieuw"), aircoType: getElementValue("aircoType"),
                    interestRate: getElementValueAsNumber("interestRate"), loanTerm: getElementValueAsNumber("loanTerm"),
                    bsn: getElementValue("bsn"), voorletters: getElementValue("voorletters"),
                    tussenvoegsel: getElementValue("tussenvoegsel"), achternaam: getElementValue("achternaam"),
                    geslacht: getElementValue("geslacht"), telefoon: getElementValue("telefoon"),
                    mobiel: getElementValue("mobiel"), email: getElementValue("email"),
                    iban: getElementValue("iban"), postcode: getElementValue("postcode"),
                    huisnummer: getElementValue("huisnummer"), straat: getElementValue("straat"),
                    woonplaats: getElementValue("woonplaats"), land: getElementValue("land"),
                    installationAddressDifferent: document.getElementById('installationAddressDifferent').checked,
                    installatiePostcode: getElementValue("installatiePostcode"), installatieHuisnummer: getElementValue("installatieHuisnummer"),
                    installatieStraat: getElementValue("installatieStraat"), installatieWoonplaats: getElementValue("installatieWoonplaats"),
                };

                const clientName = `${quoteData.voorletters || ''} ${quoteData.tussenvoegsel || ''} ${quoteData.achternaam || 'Onbekende Klant'}`.trim();
                const newClientData = {
                    name: clientName,
                    createdAt: new Date().toISOString(),
                    quoteData: quoteData,
                    calculationResults: lastCalculationResults
                };

                const newClientId = await saveClient(newClientData);

                if (newClientId) {
                    resetButtonState(saveClientDataBtn, 'Klantgegevens Opslaan', 'fa-save');
                    alert(`Klant "${clientName}" succesvol opgeslagen in de cloud!`);
                    await deleteFormFromFirestore();
                    if(form) form.reset();
                    switchView(AppView.DASHBOARD);
                    await renderClientList();
                } else {
                    resetButtonState(saveClientDataBtn, 'Klantgegevens Opslaan', 'fa-save');
                    // Alert already shown by saveClient
                }

            } else {
                 alert("Vul alstublieft alle verplichte velden in het offerteformulier correct in. Controleer de rood gemarkeerde velden.");
                 window.scrollTo(0,0);
            }
        });
    }

    function fQuote(num, decimals = 2) {
        if (typeof num === 'undefined' || isNaN(num)) return 'N/A';
        return num.toFixed(decimals).replace('.', ',');
    }
    function kwhQuote(num) {
        if (typeof num === 'undefined' || isNaN(num)) return 'N/A';
        return Math.round(num).toLocaleString('nl-NL');
    }

    function generateQuoteHTML(quoteData, resultsData) {
        const today = new Date().toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' });
        const quoteNumber = `WPH-${Date.now().toString().slice(-6)}`;

        let measuresHTML = '';
        if (resultsData?.insulationChosenDetails) {
            Object.entries(resultsData.insulationChosenDetails).forEach(([key, detail]) => {
                if (detail.brutoPrice > 0) {
                    measuresHTML += `<tr><td>${detail.label}</td><td>€ ${fQuote(detail.brutoPrice)}</td><td>€ ${fQuote(detail.subsidie)}</td><td>€ ${fQuote(detail.brutoPrice - detail.subsidie)}</td></tr>`;
                }
            });
        }
        if (resultsData?.heatPumpChosen && resultsData.heatPumpChosen !== "Geen") {
            const hpKey = quoteData.heatPumpType;
            const hpSizeKey = quoteData.heatPumpSize;
            const hpDetails = heatPumpData[hpKey]?.[hpSizeKey];
            if (hpDetails && hpDetails.cost > 0) {
                 measuresHTML += `<tr><td>Warmtepomp: ${hpDetails.label}</td><td>€ ${fQuote(hpDetails.cost)}</td><td>Subsidie: € ${fQuote(hpDetails.subsidy)}</td><td>Netto: € ${fQuote(hpDetails.cost - hpDetails.subsidy)}</td></tr>`;
            }
        }
        if (quoteData.numberOfPanels > 0) {
            const panelInvestment = quoteData.numberOfPanels * solarPanelConstants.pricePerPanel;
            measuresHTML += `<tr><td>Zonnepanelen (${quoteData.numberOfPanels} stuks)</td><td>Bruto: € ${fQuote(panelInvestment)}</td><td>Subsidie: € ${fQuote(0)}</td><td>Netto: € ${fQuote(panelInvestment)}</td></tr>`;
        }
        if (quoteData.meterkastNieuw !== "geen_vervanging") {
            const mkDetails = MeterkastKosten[quoteData.meterkastNieuw];
            if (mkDetails && mkDetails.price > 0) {
                 measuresHTML += `<tr><td>Meterkast: ${mkDetails.label}</td><td>Bruto: € ${fQuote(mkDetails.price)}</td><td>Subsidie: € ${fQuote(0)}</td><td>Netto: € ${fQuote(mkDetails.price)}</td></tr>`;
            }
        }
        if (quoteData.aircoType !== "none") {
             const acDetails = AircoPrijzen[quoteData.aircoType];
             if (acDetails && acDetails.price > 0) {
                measuresHTML += `<tr><td>Airconditioning: ${acDetails.label}</td><td>Bruto: € ${fQuote(acDetails.price)}</td><td>Subsidie: € ${fQuote(0)}</td><td>Netto: € ${fQuote(acDetails.price)}</td></tr>`;
             }
        }

        const htmlContent = `
            <html lang="nl">
            <head>
                <meta charset="UTF-8">
                <title>Indicatieve Offerte - ${quoteNumber}</title>
                <style>
                    body { font-family: 'Montserrat', Arial, sans-serif; margin: 0; padding: 0; background-color: #fff; color: #333; -webkit-font-smoothing: antialiased; }
                    .printable-quote-body { font-family: 'Montserrat', Arial, sans-serif; margin: 20px; color: #333; background-color: #fff; }
                    .printable-quote-container { max-width: 800px; margin: 0 auto; padding: 25px; border: 1px solid #dee2e6; box-shadow: 0 0 10px rgba(0,0,0,0.07); }
                    .pq-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #002245; padding-bottom: 15px; margin-bottom: 25px; }
                    .pq-logo-placeholder { font-size: 24px; font-weight: bold; color: #002245; }
                    .pq-company-info { text-align: right; font-size: 0.9em; }
                    .pq-company-info h2 { color: #002245; margin: 0 0 5px 0; font-size: 1.8em; }
                    .pq-client-info { margin-bottom: 20px; }
                    .pq-section h3 { color: #002245; border-bottom: 1px solid #009A72; padding-bottom: 8px; margin-top: 25px; margin-bottom: 15px; font-size: 1.3em; }
                    .pq-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 0.95em; }
                    .pq-table th, .pq-table td { border: 1px solid #e9ecef; padding: 10px; text-align: left; }
                    .pq-table th { background-color: #f8f9fa; color: #002245; font-weight: 500; }
                    .pq-table td.num { text-align: right; }
                    .pq-summary-table { width: 100%; margin-top: 10px; }
                    .pq-summary-table td { padding: 6px 0; }
                    .pq-summary-table td:first-child { font-weight: 500; }
                    .pq-summary-table td:last-child { text-align: right; font-weight: bold; }
                    .pq-total { font-weight: bold; font-size: 1.15em; color: #002245; }
                    .pq-footer { margin-top: 35px; font-size: 0.85em; text-align: center; color: #777777; }
                    .pq-print-button { display: block; width: fit-content; margin: 25px auto; padding: 12px 25px; background-color: #009A72; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 1.1em; font-weight: 500; font-family: 'Montserrat', sans-serif;}
                    @media print {
                        .pq-print-button { display: none !important; }
                        body, .printable-quote-body { margin: 0; padding: 0; background-color: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .printable-quote-container { border: none; box-shadow: none; max-width: 100%; margin: 0; padding:0; }
                    }
                </style>
                <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;700&display=swap" rel="stylesheet">
            </head>
            <body class="printable-quote-body">
                <div class="printable-quote-container">
                    <button type="button" class="pq-print-button" onclick="window.print()">Print Offerte</button>
                    <div class="pq-header">
                        <div class="pq-logo"><span class="pq-logo-placeholder">Uw Bedrijfsnaam</span></div>
                        <div class="pq-company-info">
                            <h2>Indicatieve Offerte</h2>
                            <p>Datum: ${today}<br>Offertenummer: ${quoteNumber}</p>
                            <p>Uw Bedrijfsnaam B.V.<br>Postbus XYZ, 1234 AB Stad<br>info@uwdomein.nl | 012 - 345 6789</p>
                        </div>
                    </div>

                    <div class="pq-client-info">
                        <h3>Gegevens Aanvrager</h3>
                        <p>
                            ${quoteData.voorletters} ${quoteData.tussenvoegsel ? quoteData.tussenvoegsel + ' ' : ''}${quoteData.achternaam}<br>
                            ${quoteData.straat} ${quoteData.huisnummer}<br>
                            ${quoteData.postcode} ${quoteData.woonplaats}<br>
                            Telefoon: ${quoteData.telefoon || 'N/A'}<br>
                            E-mail: ${quoteData.email}
                        </p>
                        ${quoteData.installationAddressDifferent ? `
                        <p><strong>Installatieadres:</strong><br>
                            ${quoteData.installatieStraat || 'N/A'} ${quoteData.installatieHuisnummer || ''}<br>
                            ${quoteData.installatiePostcode || 'N/A'} ${quoteData.installatieWoonplaats || 'N/A'}
                        </p>` : ''}
                    </div>

                    <div class="pq-section">
                        <h3>Gekozen Maatregelen & Investering</h3>
                        <table class="pq-table">
                            <thead><tr><th>Maatregel</th><th>Bruto Kosten</th><th>Subsidie</th><th>Netto Kosten</th></tr></thead>
                            <tbody>${measuresHTML.length > 0 ? measuresHTML : '<tr><td colspan="4" style="text-align:center;">Geen maatregelen geselecteerd voor investering.</td></tr>'}</tbody>
                        </table>
                        <table class="pq-summary-table">
                            <tr><td>Totaal Bruto Investering:</td><td class="pq-total">€ ${fQuote(resultsData?.totaleBrutoInvestering)}</td></tr>
                            <tr><td>Totaal Subsidies:</td><td class="pq-total">€ ${fQuote(resultsData?.totaleSubsidies)}</td></tr>
                            <tr><td>Netto Investering (na subsidie):</td><td class="pq-total">€ ${fQuote(resultsData?.nettoInvestering)}</td></tr>
                        </table>
                    </div>

                    ${ (resultsData?.loanTerm > 0 && resultsData?.interestRate >=0 && resultsData?.nettoInvestering > 0) ? `
                    <div class="pq-section">
                        <h3>Indicatie Financiering (op basis van Netto Investering)</h3>
                        <table class="pq-summary-table">
                            <tr><td>Leenbedrag:</td><td>€ ${fQuote(resultsData?.nettoInvestering)}</td></tr>
                            <tr><td>Rentepercentage (per jaar):</td><td>${fQuote(resultsData?.interestRate,1)}%</td></tr>
                            <tr><td>Looptijd:</td><td>${resultsData?.loanTerm} maanden</td></tr>
                            <tr><td>Maandelijkse betaling (indicatief):</td><td class="pq-total">€ ${fQuote(resultsData?.paymentWithSubsidy)}</td></tr>
                        </table>
                    </div>` : ''}

                    <div class="pq-section">
                        <h3>Indicatie Energiebesparing & Nieuwe Kosten</h3>
                        <table class="pq-table">
                           <thead><tr><th>Omschrijving</th><th>Huidige Situatie</th><th>Nieuwe Situatie (geschat)</th><th>Besparing</th></tr></thead>
                           <tbody>
                               <tr><td>Gasverbruik (per jaar)</td><td>${kwhQuote(resultsData?.initialGasConsumption)} m³</td><td>${kwhQuote(resultsData?.newGasConsumption)} m³</td><td>${kwhQuote(resultsData?.initialGasConsumption - resultsData?.newGasConsumption)} m³</td></tr>
                               <tr><td>Elektraverbruik (per jaar, na zon)</td><td>${kwhQuote(resultsData?.initialElecConsumption)} kWh</td><td>${kwhQuote(resultsData?.newElecConsumptionWithSolar)} kWh</td><td>${kwhQuote(resultsData?.initialElecConsumption - resultsData?.newElecConsumptionWithSolar)} kWh</td></tr>
                               <tr><td>Energiekosten (per maand)</td><td>€ ${fQuote(resultsData?.currentMonthlyEnergyCost)}</td><td>€ ${fQuote(resultsData?.newMonthlyEnergyCost)}</td><td style="color: #009A72; font-weight: bold;">€ ${fQuote(resultsData?.totalMonthlyEnergySaving)}</td></tr>
                           </tbody>
                        </table>
                         <table class="pq-summary-table">
                            <tr><td>Netto voordeel per maand (energiebesparing - maandelijkse lening o.b.v. netto investering):</td><td class="pq-total" style="color: ${resultsData?.netMonthlySavingInclSubsidyLoan >= 0 ? '#009A72' : '#e74c3c'};">€ ${fQuote(resultsData?.netMonthlySavingInclSubsidyLoan)}</td></tr>
                        </table>
                    </div>

                    <div class="pq-footer">
                        <p>Deze offerte is indicatief en gebaseerd op de door u ingevoerde gegevens. Aan deze berekening kunnen geen rechten worden ontleend. Werkelijke kosten en besparingen kunnen afwijken. Een definitieve offerte wordt opgesteld na een technisch schouw en persoonlijk adviesgesprek.</p>
                        <p>Uw Bedrijfsnaam - Uw partner in duurzaam wonen.</p>
                    </div>
                    <button type="button" class="pq-print-button" onclick="window.print()">Print Offerte</button>
                </div>
            </body>
            </html>
        `;
        return htmlContent;
    }


    async function saveFormToFirestore() {
        if (currentView !== AppView.TOOL || !form || !currentUser) return;
        const formDataToSave = {};
        form.querySelectorAll('input, select, textarea').forEach(element => {
            if (element.id) {
                if (element.type === 'checkbox') {
                    formDataToSave[element.id] = element.checked;
                } else {
                    formDataToSave[element.id] = element.value;
                }
            }
        });
        try {
            const userAppDataDocRef = getAppDataDocRef(currentUser.uid);
            await setDoc(userAppDataDocRef, { [CURRENT_FORM_FIELD]: formDataToSave }, { merge: true });
        } catch (error) {
            console.error("Error saving form data to Firestore:", error);
        }
    }

    async function loadFormFromFirestore() {
        if (!form || !currentUser) return;
        try {
            const userAppDataDocRef = getAppDataDocRef(currentUser.uid);
            const docSnap = await getDoc(userAppDataDocRef);
            if (docSnap.exists()) {
                const appData = docSnap.data();
                const formData = appData?.[CURRENT_FORM_FIELD];
                if (formData) {
                    let aantalBewonersLoadedValue = null;
                    let bouwjaarLoadedValue = null;
                    let woningtypeLoadedValue = null;
                    let heatPumpTypeLoadedValue = null;
                    let installationAddressDifferentLoadedValue = null;

                    Object.keys(formData).forEach(id => {
                        const element = document.getElementById(id);
                        if (element) {
                            if (element.type === 'checkbox') {
                                element.checked = formData[id];
                                if (id === 'installationAddressDifferent') {
                                    installationAddressDifferentLoadedValue = formData[id];
                                }
                            } else {
                                element.value = formData[id];
                            }
                            if (id === 'aantalBewoners') aantalBewonersLoadedValue = formData[id];
                            if (id === 'bouwjaar') bouwjaarLoadedValue = formData[id];
                            if (id === 'woningtype') woningtypeLoadedValue = formData[id];
                            if (id === 'heatPumpType') heatPumpTypeLoadedValue = formData[id];
                             if (id.includes('Isolatie') && element instanceof HTMLSelectElement) {
                                element.dataset.userInteracted = "true";
                            }
                        }
                    });

                    if (aantalBewonersLoadedValue && aantalBewonersSelect) aantalBewonersSelect.dispatchEvent(new Event('change', { bubbles: true }));
                    if (bouwjaarLoadedValue || woningtypeLoadedValue) updateInsulationOptionsVisibility();
                    if (heatPumpTypeLoadedValue) document.getElementById('heatPumpType')?.dispatchEvent(new Event('change', { bubbles: true }));
                    if (installationAddressDifferentLoadedValue !== null) document.getElementById('installationAddressDifferent')?.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        } catch (error) {
            console.error("Error loading form data from Firestore:", error);
        }
    }

     async function deleteFormFromFirestore() {
        if (!currentUser) return;
        try {
            const userAppDataDocRef = getAppDataDocRef(currentUser.uid);
            await updateDoc(userAppDataDocRef, {
                [CURRENT_FORM_FIELD]: deleteField()
            });
        } catch (error) {
            console.error("Error deleting form data from Firestore:", error);
        }
    }

    if (clearCurrentFormButton) {
        clearCurrentFormButton.addEventListener('click', async () => {
            if (!currentUser) return;
            if (confirm("Weet u zeker dat u de huidige formulierinvoer wilt wissen? Opgeslagen klantgegevens blijven behouden.")) {
                await deleteFormFromFirestore();
                if(form) form.reset();
                ["spouwmuurIsolatie", "vloerIsolatie", "dakIsolatie", "isolatieGlasHR"].forEach(id => {
                    const sel = document.getElementById(id);
                    if (sel) delete sel.dataset.userInteracted;
                });
                const event = new Event('change', { bubbles: true });
                const inputEvent = new Event('input', { bubbles: true });
                if (aantalBewonersSelect) aantalBewonersSelect.dispatchEvent(event);
                if (bouwjaarInput) bouwjaarInput.dispatchEvent(inputEvent);
                if (woningtypeSelect) woningtypeSelect.dispatchEvent(event);
                document.getElementById('heatPumpType')?.dispatchEvent(event);
                document.getElementById('installationAddressDifferent')?.dispatchEvent(event);
                currentStep = 0;
                lastCalculationResults = null;
                if(resultSection) resultSection.classList.add('hidden');
                if(resultDiv) resultDiv.innerHTML = '<p>Uw resultaten worden berekend...</p>';
                initializeForm();
                window.scrollTo(0,0);
                alert("Huidige formulierinvoer gewist.");
            }
        });
    }

    if(form) {
        form.querySelectorAll('input, select, textarea').forEach(element => {
            const saveCurrentForm = () => {
                 if (currentUser) {
                    saveFormToFirestore();
                 }
            };
            element.addEventListener('input', saveCurrentForm);
            element.addEventListener('change', saveCurrentForm);
        });
    }

    // --- Contact Form ---
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('contactName').value;
            const emailVal = document.getElementById('contactEmail').value;
            const subject = document.getElementById('contactSubject').value;
            const message = document.getElementById('contactMessage').value;
            console.log("Contact Form Submitted (simulated):", { name, email: emailVal, subject, message });
            if(contactFormFeedback) contactFormFeedback.textContent = 'Bedankt voor uw bericht! We nemen zo spoedig mogelijk contact met u op.';
            contactFormFeedback.style.color = 'var(--success-color)';
            contactForm.reset();
            setTimeout(() => { if(contactFormFeedback) contactFormFeedback.textContent = ''; }, 5000);
        });
    }

    // --- Settings ---
    async function loadSettings() {
        if (!currentUser) { // Apply default settings if no user
             document.body.classList.remove('dark-mode');
             if(darkModeToggle) darkModeToggle.checked = false;
            return;
        }
        try {
            const userAppDataDocRef = getAppDataDocRef(currentUser.uid);
            const docSnap = await getDoc(userAppDataDocRef);
            if (docSnap.exists()) {
                const appData = docSnap.data();
                const settings = appData?.[SETTINGS_FIELD] || {};
                if (settings.darkMode) {
                    document.body.classList.add('dark-mode');
                    if(darkModeToggle) darkModeToggle.checked = true;
                } else {
                     document.body.classList.remove('dark-mode');
                     if(darkModeToggle) darkModeToggle.checked = false;
                }
            } else { // No settings saved yet, apply defaults
                document.body.classList.remove('dark-mode');
                if(darkModeToggle) darkModeToggle.checked = false;
            }
        } catch (error) {
            console.error("Error loading settings from Firestore:", error);
             document.body.classList.remove('dark-mode'); // Fallback to default
             if(darkModeToggle) darkModeToggle.checked = false;
        }
    }
    async function saveSettings() {
        if (!currentUser) return;
        const settingsToSave = {
            darkMode: darkModeToggle ? darkModeToggle.checked : false,
        };
        try {
            const userAppDataDocRef = getAppDataDocRef(currentUser.uid);
            await setDoc(userAppDataDocRef, { [SETTINGS_FIELD]: settingsToSave }, { merge: true });
        } catch (error) {
             console.error("Error saving settings to Firestore:", error);
             alert("Kon instellingen niet opslaan in de cloud.");
        }
    }

    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', () => {
            document.body.classList.toggle('dark-mode', darkModeToggle.checked);
            saveSettings();
        });
    }
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            alert("Wachtwoord wijzigen kan via de standaard Firebase methoden (bijv. wachtwoord reset e-mail) of direct in de Firebase console.");
        });
    }

    async function deleteCollection(collectionRef, batchSize = 10) {
        const q = firestoreQuery(collectionRef, limit(batchSize));
        return new Promise((resolve, reject) => {
            deleteQueryBatchModular(q, resolve, reject);
        });
    }
    
    async function deleteQueryBatchModular(query, resolve, reject) {
        try {
            const snapshot = await getDocs(query);
            if (snapshot.size === 0) {
                resolve();
                return;
            }
            const batch = writeBatch(db);
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
    
            // Recurse on the next process tick, to avoid exploding the stack.
            setTimeout(() => { // Using setTimeout as a simple way to defer
                deleteQueryBatchModular(query, resolve, reject);
            }, 0);
        } catch (error) {
            reject(error);
        }
    }


    if (clearAllAppDataBtn) {
        clearAllAppDataBtn.addEventListener('click', async () => {
            if (!currentUser) {
                alert("U moet ingelogd zijn om uw gegevens te wissen.");
                return;
            }
            if (confirm(`WEET U ZEKER DAT U AL UW APPLICATIE DATA WILT WISSEN VOOR GEBRUIKER "${currentUser.email}"?\nDit omvat alle opgeslagen klanten, instellingen, en de huidige formuliercache voor deze gebruiker in de cloud. Dit kan niet ongedaan worden gemaakt!`)) {
                setButtonLoadingState(clearAllAppDataBtn, "Wissen...");
                try {
                    // Delete appData document (settings, form cache)
                    const userAppDataDocRef = getAppDataDocRef(currentUser.uid);
                    await deleteDoc(userAppDataDocRef);

                    // Delete clients subcollection
                    const clientsRef = getClientsCollectionRef(currentUser.uid);
                    await deleteCollection(clientsRef);

                    // Delete archivedClients subcollection
                    const archivedClientsRef = getArchivedClientsCollectionRef(currentUser.uid);
                    await deleteCollection(archivedClientsRef);

                    if(form) form.reset();
                    currentStep = 0;
                    lastCalculationResults = null;
                    if(resultSection) resultSection.classList.add('hidden');
                    if(resultDiv) resultDiv.innerHTML = '<p>Uw resultaten worden berekend...</p>';

                    alert(`Alle applicatiedata voor gebruiker "${currentUser.email}" is gewist uit de cloud.`);
                    // Settings will be re-applied (to default) on next login or by onAuthStateChanged if it re-triggers data load
                    // Forcing logout might be a good idea here to ensure clean state
                    await signOut(fbAuth);

                } catch (error) {
                    console.error("Error clearing all app data:", error);
                    alert("Fout bij het wissen van data. Zie console.");
                } finally {
                    resetButtonState(clearAllAppDataBtn, 'Wis Mijn Applicatie Data', 'fa-exclamation-triangle');
                }
            }
        });
    }

});
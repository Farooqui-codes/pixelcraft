/**
 * PixelCraft Progressive Web App (PWA) Manager
 * Handles Service Worker registration, install prompts, and connection status.
 */

const PixelCraftPWA = {
    deferredPrompt: null,

    init() {
        this.registerServiceWorker();
        this.listenForInstallPrompt();
        this.monitorConnection();
    },

    registerServiceWorker() {
        if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then((reg) => {
                        console.log('PixelCraft PWA Service Worker registered:', reg.scope);
                    })
                    .catch((err) => {
                        console.warn('PWA Service Worker registration error:', err);
                    });
            });
        }
    },

    listenForInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;

            // Show install button or banner if container exists
            const installBtns = document.querySelectorAll('.btn-pwa-install');
            installBtns.forEach(btn => {
                btn.style.display = 'inline-flex';
                btn.onclick = () => this.promptInstall();
            });
        });

        window.addEventListener('appinstalled', () => {
            console.log('PixelCraft PWA was successfully installed.');
            this.deferredPrompt = null;
            document.querySelectorAll('.btn-pwa-install').forEach(btn => btn.style.display = 'none');
            if (window.PixelCraftUX) {
                PixelCraftUX.showToast('PixelCraft App installed successfully!', 'success');
            }
        });
    },

    async promptInstall() {
        if (!this.deferredPrompt) {
            if (window.PixelCraftUX) {
                PixelCraftUX.showToast('PixelCraft is already installed or your browser does not support install prompts.', 'info');
            }
            return;
        }

        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('User accepted PWA installation');
        }
        this.deferredPrompt = null;
    },

    monitorConnection() {
        window.addEventListener('offline', () => {
            if (window.PixelCraftUX) {
                PixelCraftUX.showToast('Internet connection lost. Switching to offline-ready utilities.', 'warning');
            }
        });

        window.addEventListener('online', () => {
            if (window.PixelCraftUX) {
                PixelCraftUX.showToast('Internet connection restored. Cloud sync re-established!', 'success');
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    PixelCraftPWA.init();
});

window.PixelCraftPWA = PixelCraftPWA;


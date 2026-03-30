import React from 'react';

/**
 * SessionTimeoutModal Component
 * 
 * Modal yang muncul ketika session timeout (15 menit).
 * Menampilkan pesan dan tombol untuk login kembali.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Apakah modal terbuka
 * @param {Function} props.onLoginRedirect - Callback saat tombol login diklik
 */
const SessionTimeoutModal = ({ isOpen, onLoginRedirect }) => {
    if (!isOpen) return null;

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.icon}>⏰</div>

                <h2 style={styles.title}>Session Berakhir</h2>

                <p style={styles.message}>
                    Session anda telah berakhir.
                    <br />
                    Login kembali untuk melanjutkan.
                </p>

                <button
                    onClick={onLoginRedirect}
                    style={styles.button}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#0056b3';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#007bff';
                    }}
                >
                    Login Kembali
                </button>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    modal: {
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '40px',
        maxWidth: '450px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        animation: 'modalSlideIn 0.3s ease-out',
    },
    icon: {
        fontSize: '64px',
        marginBottom: '20px',
    },
    title: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#333',
        marginBottom: '16px',
    },
    message: {
        fontSize: '16px',
        color: '#666',
        marginBottom: '30px',
        lineHeight: '1.6',
    },
    button: {
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        padding: '14px 32px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)',
    },
};

// CSS Animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes modalSlideIn {
        from {
            opacity: 0;
            transform: translateY(-30px) scale(0.95);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
`;
document.head.appendChild(styleSheet);

export default SessionTimeoutModal;
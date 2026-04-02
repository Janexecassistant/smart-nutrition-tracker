'use client';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '32px',
      backgroundColor: '#f8fafc',
    }}>
      <div style={{
        maxWidth: '640px',
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: 'bold',
          marginBottom: '16px',
          color: '#1e293b',
        }}>
          404
        </h1>
        <p style={{
          fontSize: '24px',
          marginBottom: '24px',
          color: '#475569',
        }}>
          Page Not Found
        </p>
        <p style={{
          fontSize: '16px',
          marginBottom: '32px',
          color: '#64748b',
        }}>
          Sorry, we couldn't find the page you're looking for.
        </p>
        <a
          href="/"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#059669',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '500',
            transition: 'background-color 0.3s',
          }}
          onMouseOver={(e) => {
            const target = e.currentTarget as HTMLAnchorElement;
            target.style.backgroundColor = '#047857';
          }}
          onMouseOut={(e) => {
            const target = e.currentTarget as HTMLAnchorElement;
            target.style.backgroundColor = '#059669';
          }}
        >
          Go Home
        </a>
      </div>
    </div>
  );
}

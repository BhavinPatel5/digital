'use client';

import { useAuth } from '@/context/AuthContext';
import { notifyGlobal } from '../components/NotificationProvider';
import Image from 'next/image';
import './header.css'; // Assuming you have a CSS file for styles
import { SkyNavbar,SkyButton,SkyThemeSwitcher } from '@sky-ui/react';

export default function Header() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      logout(); // clears localStorage and context
      notifyGlobal({
        title: 'Logged out',
        message: 'You have been logged out successfully.',
        type: 'success',
      });
    } catch (err) {
      notifyGlobal({
        title: 'Logout failed',
        message: 'Something went wrong while logging out.',
        type: 'alert',
      });
    }
  };

  const MenuItems = [
    { label: 'Home', route: '/' },
    { label: 'Shop', route: '/shop' },
    { label: 'Product', route: '/product' },
    { label: 'Settings', route: '/settings' },
  ];

  const handleRoute = (e) => {
    const route = e?.detail; // for flexibility
    console.log('Navigating to:', route,e.detail);

    if (typeof window !== 'undefined' && window.$nuxt?.$router) {
      window.$nuxt.$router.push(route);
    } else {
      window.location.href = route;
    }
  };

  const activePath = typeof window !== 'undefined' ? window.location.pathname : '/';



  return (
    <>
      <SkyNavbar items={MenuItems} onrouteChange={handleRoute} activeRoute={activePath}>
        <div slot="prepend">
<Image src={'/logo.png'} alt="Logo" loading='eager' width={40} height={40} className='icon'/>
        </div>
        <div slot="append">
       <div className='append'>
        <SkyThemeSwitcher/>
           {user ? (
            <div className='user-info'>
              <p className='info'>Welcome, {user.name || user.email}</p>
              <SkyButton onClick={handleLogout}>
                Logout
              </SkyButton>
            </div>
          ) : (
            <SkyButton onClick={() => window.location.href = '/auth'}>
              Login
            </SkyButton>
          )}
       </div>
        </div>
      </SkyNavbar>
    </>
  );
}

import "./globals.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { NotificationProvider } from "./components/NotificationProvider.js";
import { AuthProvider } from "@/context/AuthContext";
import { ShopProvider } from "@/context/ShopContext"; // ✅ NEW: import ShopProvider
import Header from "./header/page.js";
import { ThemeProvider } from "./components/ThemeProvider";

export const metadata = {
  title: "Inventory & Billing",
  description: "Track your products and invoices",
};

export default function RootLayout({ children }) {

  const clientId = process.env.GOOGLE_CLIENT_ID;
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <ShopProvider>
              <GoogleOAuthProvider clientId={clientId}>
                <NotificationProvider>
                  <main className="main-content">
                    <Header />
                    {children}
                  </main>
                </NotificationProvider>
              </GoogleOAuthProvider>
            </ShopProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

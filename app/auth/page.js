"use client";

import { useState } from "react";
import {
  Required,
  StrongPassword,
  ValidEmail,
  ValidEmailOrPhone,
  ValidName,
} from "../../lib/validation.js";
import "./auth.css";
import { GoogleLogin } from "@react-oauth/google";
import { notifyGlobal } from "../components/NotificationProvider.js";
import { useAuth } from "@/context/AuthContext";
import {
  SkyInput,
  SkyButton,
  SkyForm,
  SkyDivider,
  SkyDialog,
  SkyOtp,
} from "@sky-ui/react";

export default function AuthPage() {
  const { setUser } = useAuth();
  const [mode, setMode] = useState("register");
  const [loading, setLoading] = useState({
    login: false,
    register: false,
    forgot: false,
    otp: false,
    reset: false,
  });
  const [otpData, setOtpData] = useState({
    userId: "",
    email: "",
    isPending: false,
  });
  const [otpValue, setOtpValue] = useState("");
  const [forgotData, setForgotData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    userId: "",
    step: "email",
  });

  const [forgotOpen, setForgotOpen] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
  };

  const callAuthApi = async (action, body) => {
    try {
      let endpoint;
      let method = "POST";

      switch (action) {
        case "register":
          endpoint = "register/initiate";
          break;
        case "register-verify":
          endpoint = "register/verify";
          break;
        case "register-resend":
          endpoint = "register/resend";
          break;
        case "login":
          endpoint = "login";
          break;
        case "google":
          endpoint = "google";
          break;
        case "forgot-initiate":
          endpoint = "forgot/initiate";
          break;
        case "forgot-verify":
          endpoint = "forgot/verify";
          break;
        case "forgot-resend":
          endpoint = "forgot/resend";
          break;
        case "forgot-reset":
          endpoint = "forgot/reset";
          break;
        case "verify-resend":
          endpoint = "verify/resend";
          break;
        case "verify":
          endpoint = "verify";
          break;
        default:
          notifyGlobal({
            title: "Invalid Request",
            message: "Invalid API action",
            type: "alert",
          });
          return { error: "Invalid API action" };
      }

      const res = await fetch(`/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        notifyGlobal({
          title: "Error",
          message: data.error || "Something went wrong",
          type: "alert",
        });
        return { error: data.error };
      }

      return data;
    } catch (err) {
      notifyGlobal({
        title: "Connection Error",
        message: "Please check your network and try again",
        type: "alert",
      });
      return { error: "network_error" };
    }
  };

  const checkEmailAvailability = async (email) => {
    const response = await callAuthApi("email", {
      action: "check",
      email,
    });
    if (response.error) {
      return { available: false, isPending: false };
    }
    return { available: response.available, isPending: response.isPending };
  };

  const handleEmailBlur = async (email) => {
    if (!email || !ValidEmail(email)) return;

    const { available, isPending } = await checkEmailAvailability(email);

    if (!available) {
      notifyGlobal({
        title: "Email Taken",
        message: isPending
          ? "This email has a pending verification. Please check your inbox."
          : "This email is already registered.",
        type: "alert",
      });
    }
  };

  const handleLogin = async (formValues) => {
    setLoading((prev) => ({ ...prev, login: true }));
    try {
      const response = await callAuthApi("login", {
        email: formValues.email,
        password: formValues.password,
      });

      if (response.action === "complete-verification") {
        setOtpData({
          userId: response.userId,
          email: formValues.email,
          isPending: response.isPending,
        });
        setOtpOpen(true);
        notifyGlobal({
          title: "Verification Required",
          message: "Please verify your email to continue",
          type: "info",
        });
      } else if (response.user) {
        setUser(response.user);
        notifyGlobal({
          title: "Login Successful",
          message: `Welcome back, ${response.user?.name || response.user?.email}!`,
          type: "success",
        });
      }
    } catch (error) {
    } finally {
      setLoading((prev) => ({ ...prev, login: false }));
    }
  };

  const handleRegister = async (formValues) => {
    setLoading((prev) => ({ ...prev, register: true }));
    const response = await callAuthApi("register", {
      name: formValues.name,
      email: formValues.email,
      password: formValues.password,
    });

    if (response.userId) {
      setOtpData({
        userId: response.userId,
        email: formValues.email,
        isPending: true,
      });
      setOtpOpen(true);
      notifyGlobal({
        title: "Almost there!",
        message: "We've sent a verification code to your email",
        type: "success",
      });
    }
    setLoading((prev) => ({ ...prev, register: false }));
  };

  const handleForgotPassword = async (email) => {
    setLoading((prev) => ({ ...prev, forgot: true }));
    const response = await callAuthApi("forgot-initiate", {
      email: email,
    });

    if (response.action === "verify-otp-set-password") {
      setForgotData((prev) => ({
        ...prev,
        userId: response.userId,
        step: "otp",
        email: response.email,
      }));
      notifyGlobal({
        title: "Security Check",
        message: response.message,
        type: "info",
      });
    } else if (response.userId) {
      setForgotData((prev) => ({
        ...prev,
        userId: response.userId,
        step: "otp",
        email: response.email,
      }));
      notifyGlobal({
        title: "Reset Code Sent",
        message: response.message,
        type: "info",
      });
    }
    setLoading((prev) => ({ ...prev, forgot: false }));
  };

  const handleOtpVerify = async (formValues) => {
    setLoading((prev) => ({ ...prev, otp: true }));
    let response;

    if (otpData.isPending) {
      response = await callAuthApi("register-verify", {
        userId: otpData.userId,
        otp: formValues.otp,
        isPending: true,
      });
    } else {
      response = await callAuthApi("verify", {
        userId: otpData.userId,
        otp: formValues.otp,
      });
    }

    if (!response.error) {
      notifyGlobal({
        title: "Success!",
        message: "Your email has been verified successfully",
        type: "success",
      });

      setOtpOpen(false);
      setOtpValue("");
      setMode("login");
    } else {
      notifyGlobal({
        title: "Verification Failed",
        message: response.error || "The code you entered is incorrect",
        type: "alert",
      });
    }
    setLoading((prev) => ({ ...prev, otp: false }));
  };

  const handleForgotOtpVerify = async (formValues) => {
    setLoading((prev) => ({ ...prev, otp: true }));
    const response = await callAuthApi("forgot-verify", {
      userId: forgotData.userId,
      otp: formValues.otp,
    });

    if (!response.error) {
      setForgotData((prev) => ({ ...prev, step: "reset" }));
      notifyGlobal({
        title: "Verified!",
        message: "You can now create your new password",
        type: "success",
      });
    } else {
      notifyGlobal({
        title: "Invalid Code",
        message: response.error,
        type: "alert",
      });
    }
    setLoading((prev) => ({ ...prev, otp: false }));
  };

  const handlePasswordReset = async (password) => {
    setLoading((prev) => ({ ...prev, reset: true }));
    const response = await callAuthApi("forgot-reset", {
      userId: forgotData.userId,
      password: password,
      otp: forgotData.otp,
    });

    if (!response.error) {
      notifyGlobal({
        title: "Password Updated!",
        message: response.message || "Your password has been reset successfully",
        type: "success",
      });
      setForgotOpen(false);
      setForgotData({
        email: "",
        otp: "",
        newPassword: "",
        userId: "",
        step: "email",
      });
      setMode("login");
    } else {
      notifyGlobal({
        title: "Error",
        message: response.error,
        type: "alert",
      });
    }
    setLoading((prev) => ({ ...prev, reset: false }));
  };

  const handleGoogleLogin = async (credentialResponse) => {
    const token = credentialResponse?.credential;
    if (!token) {
      notifyGlobal({
        title: "Error",
        message: "Unable to connect with Google. Please try again.",
        type: "alert",
      });
      return;
    }

    setLoading((prev) => ({ ...prev, login: true }));
    const response = await callAuthApi("google", {
      provider: "google",
      token,
    });

    if (response.user) {
      setUser(response.user);
      notifyGlobal({
        title: "Welcome!",
        message: `Great to see you, ${response.user?.name || response.user?.email || "there"}!`,
        type: "success",
      });
    } else if (response.action === "set-password") {
      setForgotData((prev) => ({
        ...prev,
        userId: response.userId,
        step: "set-password",
      }));
      setForgotOpen(true);
      notifyGlobal({
        title: "One Last Step",
        message: response.message,
        type: "info",
      });
    } else if (response.error) {
      notifyGlobal({
        title: "Google Login Failed",
        message: response.error,
        type: "alert",
      });
    }
    setLoading((prev) => ({ ...prev, login: false }));
  };

  const handleResendOtp = async () => {
    setLoading((prev) => ({ ...prev, otp: true }));
    let response;

    if (otpData.isPending) {
      response = await callAuthApi("register-resend", {
        email: otpData.email,
      });
    } else if (forgotData.step === "otp") {
      response = await callAuthApi("forgot-resend", {
        userId: forgotData.userId,
      });

      if (response.userId) {
        setForgotData((prev) => ({ ...prev, userId: response.userId }));
      }
    } else {
      response = await callAuthApi("verify-resend", {
        userId: otpData.userId,
      });
    }

    if (!response.error) {
      notifyGlobal({
        title: "New Code Sent",
        message: "Check your email for the new verification code",
        type: "success",
      });
    } else {
      notifyGlobal({
        title: "Error",
        message: response.error || "Failed to resend code",
        type: "alert",
      });
    }
    setLoading((prev) => ({ ...prev, otp: false }));
  };

  return (
    <div className="auth-container">
      {/* Forgot Password Dialog */}
      <SkyDialog open={forgotOpen} dialogPadding="10px">
        {forgotData.step === "email" && (
          <ForgotPasswordForm
            onSubmit={handleForgotPassword}
            loading={loading.forgot}
          />
        )}

        {forgotData.step === "otp" && (
          <OtpForm
            userId={forgotData.userId}
            onVerify={handleForgotOtpVerify}
            onResend={handleResendOtp}
            loading={loading.otp}
            formId="forgotOtpForm"
            email={forgotData.email}
            isForgot={true}
          />
        )}

        {(forgotData.step === "reset" ||
          forgotData.step === "set-password") && (
          <ResetPasswordForm
            title={
              forgotData.step === "set-password"
                ? "Create Your Password"
                : "Create New Password"
            }
            subtitle={
              forgotData.step === "set-password"
                ? "Choose a secure password to protect your account"
                : "Choose a strong, memorable password"
            }
            onSubmit={handlePasswordReset}
            loading={loading.reset}
          />
        )}
      </SkyDialog>

      {/* OTP Verification Dialog */}
      <SkyDialog open={otpOpen} dialogPadding="10px">
        <OtpForm
          userId={otpData.userId}
          onVerify={handleOtpVerify}
          onResend={handleResendOtp}
          loading={loading.otp}
          formId="otpForm"
          email={otpData.email}
          isRegistration={otpData.isPending}
        />
      </SkyDialog>

      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-section">
            <div className="app-logo">🔐</div>
            <h1>Welcome to SkyApp</h1>
            <p className="app-tagline">
              {mode === "login" 
                ? "Sign in to continue your journey" 
                : "Join us and get started today"}
            </p>
          </div>
        </div>

        <div className="auth-content">
          {mode === "login" ? (
            <LoginForm
              onSubmit={handleLogin}
              loading={loading.login}
              onForgot={() => setForgotOpen(true)}
              onGoogleLogin={handleGoogleLogin}
              onSwitchMode={toggleMode}
            />
          ) : (
            <RegisterForm
              onSubmit={handleRegister}
              loading={loading.register}
              onEmailBlur={handleEmailBlur}
              onSwitchMode={toggleMode}
            />
          )}
        </div>

        <div className="auth-footer">
          <p>Secure • Reliable • User-Friendly</p>
        </div>
      </div>
    </div>
  );
}

function LoginForm({
  onSubmit,
  loading,
  onForgot,
  onGoogleLogin,
  onSwitchMode,
}) {
  const fields = [
    {
      name: "email",
      placeholder: "Enter your email or phone",
      label: "Email or Phone",
      validations: [Required, ValidEmailOrPhone],
    },
    {
      name: "password",
      placeholder: "Enter your password",
      label: "Password",
      type: "password",
      validations: [Required],
    },
  ];

  return (
    <div className="form-container">
      <div className="form-header">
        <h2>Welcome Back</h2>
        <p className="form-subtitle">Sign in to access your account</p>
      </div>

      <div className="social-login-section">
        <GoogleLogin
          onSuccess={onGoogleLogin}
          onError={() => {
            notifyGlobal({
              title: "Google Sign-In Failed",
              message: "Please try another method or try again later",
              type: "alert",
            });
          }}
          theme="filled_blue"
          size="large"
          text="signin_with"
        />
      </div>

      <div className="divider-section">
        <span className="divider-text">or continue with email</span>
      </div>

      <SkyForm
        resetOnSubmit
        formId="loginForm"
        onFormSubmit={(e) => {
          if (e.detail.success) {
            onSubmit(e.detail.values);
          }
        }}
      >
        <div className="auth-fields">
          {fields.map(({ name, placeholder, validations, type = "text", label }) => (
            <div key={name} className="field-group">
              <SkyInput
                name={name}
                type={type}
                label={label}
                placeholder={placeholder}
                required
                validations={validations}
              />
            </div>
          ))}
        </div>
      </SkyForm>

      <div className="form-actions">
        <div className="remember-forgot">
          <button
            type="button"
            className="forgot-link"
            onClick={onForgot}
          >
            Forgot your password?
          </button>
        </div>

        <SkyButton
          variant="primary"
          type="submit"
          formId="loginForm"
          disabled={loading}
          loading={loading}
          className="submit-button"
        >
          Sign In
        </SkyButton>
      </div>

      <div className="auth-switch">
        <p>
          Don't have an account?{" "}
          <button className="switch-link" onClick={onSwitchMode}>
            Create one here
          </button>
        </p>
      </div>
    </div>
  );
}

function RegisterForm({ onSubmit, loading, onEmailBlur, onSwitchMode }) {
  const fields = [
    {
      name: "name",
      placeholder: "Enter your full name",
      label: "Full Name",
      validations: [Required, ValidName],
      helpText: "This is how you'll appear on the platform"
    },
    {
      name: "email",
      placeholder: "Enter your email address",
      label: "Email Address",
      validations: [Required, ValidEmail],
      onBlur: onEmailBlur,
      helpText: "We'll send a verification code to this email"
    },
    {
      name: "password",
      placeholder: "Create a strong password",
      label: "Password",
      type: "password",
      validations: [Required, StrongPassword],
      helpText: "Use at least 8 characters with letters, numbers, and symbols"
    },
  ];

  return (
    <div className="form-container">
      <div className="form-header">
        <h2>Join Our Community</h2>
        <p className="form-subtitle">Create your account in just a few steps</p>
      </div>

      <SkyForm
        formId="registerForm"
        resetOnSubmit
        onFormSubmit={(e) => {
          if (e.detail.success) {
            onSubmit(e.detail.values);
          }
        }}
      >
        <div className="auth-fields">
          {fields.map(
            ({ name, placeholder, validations, type = "text", onBlur, label, helpText }) => (
              <div key={name} className="field-group">
                <SkyInput
                  name={name}
                  type={type}
                  label={label}
                  placeholder={placeholder}
                  required
                  validations={validations}
                  onblur={name === "email" ? (e) => onBlur(e.target.value) : undefined}
                />
              </div>
            )
          )}
        </div>
      </SkyForm>

      <div className="form-actions">
        <SkyButton
          variant="primary"
          type="submit"
          formId="registerForm"
          disabled={loading}
          loading={loading}
          className="submit-button"
        >
          Create Account
        </SkyButton>
      </div>

      <div className="terms-notice">
        <p>
          By creating an account, you agree to our{" "}
          <button className="inline-link">Terms of Service</button> and{" "}
          <button className="inline-link">Privacy Policy</button>
        </p>
      </div>

      <div className="auth-switch">
        <p>
          Already have an account?{" "}
          <button className="switch-link" onClick={onSwitchMode}>
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
}

function ForgotPasswordForm({ onSubmit, loading }) {
  return (
    <>
      <div slot="header">
        <div className="dialog-title">Reset Your Password</div>
        <div className="dialog-subtitle">
          Enter your email address and we'll send you a code to reset your password
        </div>
      </div>
      <SkyForm
        formId="forgotForm"
        resetOnSubmit
        slot="body"
        onFormSubmit={(e) => {
          if (e.detail.success) {
            onSubmit(e.detail.values.email);
          }
        }}
      >
        <div className="field-group">
          <SkyInput
            name="email"
            type="email"
            label="Email Address"
            placeholder="your.email@example.com"
            required
            validations={[Required, ValidEmail]}
          />
          <div className="help-text">We'll send a 6-digit verification code</div>
        </div>
      </SkyForm>
      <SkyButton
        variant="primary"
        slot="footer"
        type="submit"
        formId="forgotForm"
        loading={loading}
        disabled={loading}
        className="dialog-button"
      >
        Send Reset Code
      </SkyButton>
    </>
  );
}

function ResetPasswordForm({
  onSubmit,
  loading,
  title,
  subtitle,
}) {
  return (
    <>
      <div slot="header">
        <div className="dialog-title">{title}</div>
        <div className="dialog-subtitle">{subtitle}</div>
      </div>
      <SkyForm
        formId="resetForm"
        resetOnSubmit
        slot="body"
        onFormSubmit={(e) => {
          if (e.detail.success) {
            onSubmit(e.detail.values.password);
          }
        }}
      >
        <div className="field-group">
          <SkyInput
            name="password"
            type="password"
            label="New Password"
            placeholder="Enter your new password"
            required
            validations={[Required, StrongPassword]}
          />
          
        </div>
      </SkyForm>
      <SkyButton
        variant="primary"
        slot="footer"
        type="submit"
        formId="resetForm"
        loading={loading}
        disabled={loading}
        className="dialog-button"
      >
        {title === "Create Your Password" ? "Set Password" : "Update Password"}
      </SkyButton>
    </>
  );
}

function OtpForm({
  userId,
  onVerify,
  onResend,
  loading,
  formId,
  email,
  isRegistration,
  isForgot,
}) {
  const [resendLoading, setResendLoading] = useState(false);

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await onResend();
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <>
      <div slot="header">
        <div className="dialog-title">
          {isForgot ? "Verify Your Identity" : "Verify Your Email"}
        </div>
        <div className="dialog-subtitle">
          We've sent a 6-digit code to <strong>{email}</strong>
          {isRegistration && " to complete your registration"}
          {isForgot && " to reset your password"}
        </div>
      </div>
      <SkyForm
        formId={formId}
        onFormSubmit={(e) => {
          if (e.detail.success) {
            onVerify(e.detail.values);
          }
        }}
        slot="body"
      >
        <div className="field-group">
          <label className="field-label">Verification Code</label>
          <SkyOtp
            name="otp"
            required
            length={6}
            className="otp-input"
          />
          <div className="help-text">Enter the code you received in your email</div>
        </div>
      </SkyForm>
      <div slot="footer" className="otp-buttons">
        <SkyButton
          type="submit"
          variant="primary"
          formId={formId}
          loading={loading}
          disabled={loading}
          className="verify-button"
        >
          Verify Code
        </SkyButton>
        <button
          type="button"
          className="resend-link"
          onClick={handleResend}
          disabled={resendLoading}
        >
          {resendLoading ? "Sending..." : "Didn't receive code? Resend"}
        </button>
      </div>
    </>
  );
}
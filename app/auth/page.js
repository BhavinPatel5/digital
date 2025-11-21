"use client";

import { useState, useRef } from "react";
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
  const [formData, setFormData] = useState({
    register: { name: "", email: "", password: "" },
    login: { email: "", password: "" },
  });
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
    step: "email", // 'email' | 'otp' | 'reset' | 'set-password'
  });

  const [forgotOpen, setForgotOpen] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);

  const toggleMode = () => {
    setFormData({
      register: { name: "", email: "", password: "" },
      login: { email: "", password: "" },
    });
    setMode(mode === "login" ? "register" : "login");
  };

  const handleFormChange = (form, key, value) => {
    setFormData((prev) => ({
      ...prev,
      [form]: { ...prev[form], [key]: value },
    }));
  };

  const handleForgotChange = (key, value) => {
    setForgotData((prev) => ({ ...prev, [key]: value }));
  };

  const callAuthApi = async (action, body) => {
    try {
      let endpoint;
      let method = "POST";

      // Determine endpoint based on action
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

  const handleLogin = async () => {
    setLoading((prev) => ({ ...prev, login: true }));
    try {
      const response = await callAuthApi("login", {
        email: formData.login.email,
        password: formData.login.password,
      });

      if (response.action === "complete-verification") {
        // First update the state
        setOtpData({
          userId: response.userId,
          email: formData.login.email,
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
          message: `Welcome ${response.user?.name || response.user?.email}`,
          type: "success",
        });
      }
    } catch (error) {
    } finally {
      setLoading((prev) => ({ ...prev, login: false }));
    }
  };

  const handleRegister = async () => {
    setLoading((prev) => ({ ...prev, register: true }));
    const response = await callAuthApi("register", {
      name: formData.register.name,
      email: formData.register.email,
      password: formData.register.password,
    });

    if (response.userId) {
      setOtpData({
        userId: response.userId,
        email: formData.register.email,
        isPending: true,
      });
      setOtpOpen(true);
      notifyGlobal({
        title: "Verification Sent",
        message: "Please check your email for the verification code",
        type: "success",
      });
    }
    setLoading((prev) => ({ ...prev, register: false }));
  };

  const handleOtpVerify = async () => {
    setLoading((prev) => ({ ...prev, otp: true }));
    let response;

    if (otpData.isPending) {
      response = await callAuthApi("register-verify", {
        userId: otpData.userId,
        otp: otpValue,
        isPending: true,
      });
    } else {
      response = await callAuthApi("verify", {
        userId: otpData.userId,
        otp: otpValue,
      });
    }

    if (!response.error) {
      notifyGlobal({
        title: "Verified",
        message: "Email verification complete!",
        type: "success",
      });

      setOtpOpen(false);
      setOtpValue("");

      if (mode === "login") {
        await handleLogin();
      } else {
        setMode("login");
      }
    } else {
      notifyGlobal({
        title: "Verification Failed",
        message: response.error || "Invalid OTP",
        type: "alert",
      });
    }
    setLoading((prev) => ({ ...prev, otp: false }));
  };

  const handleForgotPassword = async () => {
    setLoading((prev) => ({ ...prev, forgot: true }));
    const response = await callAuthApi("forgot-initiate", {
      email: forgotData.email,
    });

    if (response.action === "verify-otp-set-password") {
      setForgotData((prev) => ({
        ...prev,
        userId: response.userId,
        step: "otp",
        email: response.email,
      }));
      notifyGlobal({
        title: "Verify OTP",
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
        title: "OTP Sent",
        message: response.message,
        type: "info",
      });
    }
    setLoading((prev) => ({ ...prev, forgot: false }));
  };

  const handleForgotOtpVerify = async () => {
    setLoading((prev) => ({ ...prev, otp: true }));
    const response = await callAuthApi("forgot-verify", {
      userId: forgotData.userId,
      otp: forgotData.otp,
    });

    if (!response.error) {
      setForgotData((prev) => ({ ...prev, step: "reset" }));
      notifyGlobal({
        title: "OTP Verified",
        message: "You can now reset your password",
        type: "success",
      });
    } else {
      notifyGlobal({
        title: "Verification Failed",
        message: response.error,
        type: "alert",
      });
    }
    setLoading((prev) => ({ ...prev, otp: false }));
  };

  const handlePasswordReset = async () => {
    setLoading((prev) => ({ ...prev, reset: true }));
    const response = await callAuthApi("forgot-reset", {
      userId: forgotData.userId,
      password: forgotData.newPassword,
      otp: forgotData.otp,
    });

    if (!response.error) {
      notifyGlobal({
        title: "Password Reset",
        message: response.message || "Password reset successfully",
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
        message: "No Google token received.",
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
        title: "Welcome",
        message: `Hello ${
          response.user?.name || response.user?.email || "User"
        }`,
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
        title: "Set Password",
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
        title: "OTP Resent",
        message: "A new OTP has been sent to your email",
        type: "success",
      });
    } else {
      notifyGlobal({
        title: "Error",
        message: response.error || "Failed to resend OTP",
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
            email={forgotData.email}
            onChange={(val) => handleForgotChange("email", val)}
            onSubmit={handleForgotPassword}
            loading={loading.forgot}
          />
        )}

        {forgotData.step === "otp" && (
          <OtpForm
            userId={forgotData.userId}
            otp={forgotData.otp}
            onChange={(val) => handleForgotChange("otp", val)}
            onVerify={handleForgotOtpVerify}
            onResend={handleResendOtp}
            loading={loading.otp}
            formId="forgotOtpForm"
            email={forgotData.email}
          />
        )}

        {(forgotData.step === "reset" ||
          forgotData.step === "set-password") && (
          <ResetPasswordForm
            title={
              forgotData.step === "set-password"
                ? "Set Password"
                : "Reset Password"
            }
            subtitle={
              forgotData.step === "set-password"
                ? "You're almost done! Just set your new password."
                : "Set your new password"
            }
            data={{ password: forgotData.newPassword }}
            onChange={(val) => handleForgotChange("newPassword", val)}
            onSubmit={handlePasswordReset}
            loading={loading.reset}
          />
        )}
      </SkyDialog>

      {/* OTP Verification Dialog */}
      <SkyDialog open={otpOpen} dialogPadding="10px">
        <OtpForm
          userId={otpData.userId}
          otp={otpValue}
          onChange={setOtpValue}
          onVerify={handleOtpVerify}
          onResend={handleResendOtp}
          loading={loading.otp}
          formId="otpForm"
          email={otpData.email}
          isRegistration={otpData.isPending}
        />
      </SkyDialog>

      <div className={`auth-wrapper ${mode}`}>
        <div className="auth-slide login-slot">
          <div className="auth-inner">
            <LoginForm
              data={formData.login}
              onChange={(key, val) => handleFormChange("login", key, val)}
              onSubmit={handleLogin}
              loading={loading.login}
              onForgot={() => setForgotOpen(true)}
              onGoogleLogin={handleGoogleLogin}
            />
          </div>
        </div>

        <div className="auth-slide register-slot">
          <div className="auth-inner">
            <RegisterForm
              data={formData.register}
              onChange={(key, val) => handleFormChange("register", key, val)}
              onSubmit={handleRegister}
              loading={loading.register}
              onEmailBlur={handleEmailBlur}
            />
          </div>
        </div>

        {(mode === "login" || mode === "register") && (
          <div className="auth-overlay">
            <div className="auth-info">
              <h2>{mode === "login" ? "New Here?" : "Welcome Back"}</h2>
              <h5>
                {mode === "login"
                  ? "Sign up and get started"
                  : "Already have an account?"}
              </h5>
              <button className="toggle-btn" onClick={toggleMode}>
                {mode === "login" ? "Register" : "Login"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LoginForm({
  data,
  onChange,
  onSubmit,
  loading,
  onForgot,
  onGoogleLogin,
}) {
  const fields = [
    {
      key: "email",
      placeholder: "you@example.com",
      validations: [Required, ValidEmailOrPhone],
    },
    {
      key: "password",
      placeholder: "Password",
      type: "password",
      validations: [Required],
    },
  ];

  return (
    <div className="form-container">
      <div className="form-header">
        <h2>Login</h2>
        <h5>Welcome back! Please login to continue</h5>
      </div>
      <SkyDivider />
      <SkyForm
        resetOnSubmit
        formId="loginForm"
        onformSubmit={(e) => {
          e.preventDefault();
          if (e.detail.success) onSubmit();
        }}
      >
        <div className="auth-fields">
          {fields.map(({ key, placeholder, validations, type = "text" }) => (
            <SkyInput
              key={key}
              type={type}
              placeholder={placeholder}
              required
              value={data[key]}
              validations={validations}
              onvalueChanged={(e) => onChange(key, e.detail.value)}
            />
          ))}
        </div>
      </SkyForm>
      <p
        className="forgot-link"
        onClick={onForgot}
        style={{ cursor: "pointer", marginTop: "8px" }}
      >
        Forgot Password?
      </p>
      <SkyButton
        variant="primary"
        type="submit"
        formId="loginForm"
        disabled={loading}
        loading={loading}
      >
        Login
      </SkyButton>

      <div className="social-login">
        <GoogleLogin
          onSuccess={onGoogleLogin}
          onError={() => {
            notifyGlobal({
              title: "Google Login Failed",
              message: "Unable to login with Google",
              type: "alert",
            });
          }}
        />
      </div>
    </div>
  );
}

function RegisterForm({ data, onChange, onSubmit, loading, onEmailBlur }) {
  const fields = [
    {
      key: "name",
      placeholder: "Full Name",
      validations: [Required, ValidName],
    },
    {
      key: "email",
      placeholder: "you@example.com",
      validations: [Required, ValidEmail],
      onBlur: onEmailBlur,
    },
    {
      key: "password",
      placeholder: "Password",
      type: "password",
      validations: [Required, StrongPassword],
    },
  ];

  return (
    <div className="form-container">
      <div className="form-header">
        <h2>Register</h2>
        <h5>Create your account below</h5>
      </div>
      <SkyDivider />
      <SkyForm
        formId="registerForm"
        resetOnSubmit
        onformSubmit={(e) => {
          if (e.detail.success) onSubmit();
        }}
      >
        <div className="auth-fields">
          {fields.map(
            ({ key, placeholder, validations, type = "text", onBlur }) => (
              <SkyInput
                key={key}
                type={type}
                placeholder={placeholder}
                required
                value={data[key]}
                validations={validations}
                onvalueChanged={(e) => onChange(key, e.detail.value)}
                onblur={key === "email" ? () => onBlur(data.email) : undefined}
              />
            )
          )}
        </div>
      </SkyForm>
      <SkyButton
        variant="primary"
        type="submit"
        formId="registerForm"
        disabled={loading}
        loading={loading}
      >
        Register
      </SkyButton>
    </div>
  );
}

function ForgotPasswordForm({ email, onChange, onSubmit, loading }) {
  return (
    <>
      <div slot="header">
        <div className="dialog-title">Forgot Password</div>
        <div className="dialog-subtitle">
          Enter your email to receive reset link
        </div>
      </div>
      <SkyForm
        formId="forgotForm"
        resetOnSubmit
        slot="body"
        onformSubmit={(e) => {
          if (e.detail.success) onSubmit();
        }}
      >
        <SkyInput
          type="email"
          placeholder="you@example.com"
          required
          value={email}
          validations={[Required, ValidEmail]}
          onvalueChanged={(e) => onChange(e.detail.value)}
        />
      </SkyForm>
      <SkyButton
        variant="transparent"
        slot="footer"
        type="submit"
        formId="forgotForm"
        loading={loading}
        disabled={loading}
      >
        Send Reset Link
      </SkyButton>
    </>
  );
}

function ResetPasswordForm({
  data,
  onChange,
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
        onformSubmit={(e) => {
          if (e.detail.success) onSubmit();
        }}
      >
        <SkyInput
          type="password"
          placeholder="New Password"
          required
          value={data.password}
          validations={[Required, StrongPassword]}
          onvalueChanged={(e) => onChange(e.detail.value)}
        />
      </SkyForm>
      <SkyButton
        variant="transparent"
        slot="footer"
        type="submit"
        formId="resetForm"
        loading={loading}
        disabled={loading}
      >
        {title === "Set Password" ? "Set Password" : "Reset Password"}
      </SkyButton>
    </>
  );
}

function OtpForm({
  userId,
  otp,
  onChange,
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
          {isForgot ? "Password Reset" : "Complete Verification"}
        </div>
        <div className="dialog-subtitle">
          Enter OTP sent to {email}
          {isRegistration && " to complete registration"}
        </div>
      </div>
      <SkyForm
        formId={formId}
        onformSubmit={(e) => {
          if (e.detail.success) onVerify();
        }}
        slot="body"
      >
        <SkyOtp
          value={otp}
          onvalueChanged={(e) => onChange(e.detail.otp)}
          required
          length={6}
        />
      </SkyForm>
      <div slot="footer" className="otp-buttons">
        <SkyButton
          type="submit"
          variant="transparent"
          formId={formId}
          loading={loading}
          disabled={loading}
        >
          Verify
        </SkyButton>
        <SkyButton
          variant="transparent"
          color="var(--sky-success-primary)"
          onClick={handleResend}
          loading={resendLoading}
          disabled={resendLoading}
        >
          Resend OTP
        </SkyButton>
      </div>
    </>
  );
}

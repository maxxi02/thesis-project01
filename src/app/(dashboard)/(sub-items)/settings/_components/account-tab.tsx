"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Shield,
  Loader2,
  AlertCircle,
  Key,
  Save,
  Smartphone,
  CheckCircle2,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Session } from "@/better-auth/auth-types";

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface TwoFactorState {
  isEnabled: boolean;
  backupCodes?: string[];
}

export default function AccountTab({ session }: { session: Session }) {
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [twoFactor, setTwoFactor] = useState<TwoFactorState>({
    isEnabled: false,
  });
  const [passwordFor2FA, setPasswordFor2FA] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isEnabling2FA, setIsEnabling2FA] = useState(false);
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);
  const [isCheckingTwoFactor, setIsCheckingTwoFactor] = useState(true);

  // Use useCallback to memoize the function and prevent unnecessary re-renders
  const checkTwoFactorStatus = useCallback(async () => {
    setIsCheckingTwoFactor(true);
    try {
      const isEnabled = session?.user?.twoFactorEnabled || false;
      setTwoFactor({ isEnabled });
    } catch (error) {
      console.error("Failed to check 2FA status:", error);
      setTwoFactor({ isEnabled: false });
    } finally {
      setIsCheckingTwoFactor(false);
    }
  }, [session?.user?.twoFactorEnabled]);

  // Check 2FA status on component mount
  useEffect(() => {
    checkTwoFactorStatus();
  }, [checkTwoFactorStatus]);

  const handlePasswordChange = (field: keyof PasswordData, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  const validatePassword = (): string | null => {
    if (!passwordData.currentPassword.trim()) {
      return "Please enter your current password";
    }
    if (!passwordData.newPassword.trim()) {
      return "Please enter a new password";
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return "New passwords do not match";
    }
    if (passwordData.newPassword.length < 8) {
      return "New password must be at least 8 characters long";
    }

    const hasUpperCase = /[A-Z]/.test(passwordData.newPassword);
    const hasLowerCase = /[a-z]/.test(passwordData.newPassword);
    const hasNumbers = /\d/.test(passwordData.newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(
      passwordData.newPassword
    );

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return "Password must contain uppercase, lowercase, number, and special character";
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      return "New password must be different from current password";
    }

    return null;
  };

  const handlePasswordUpdate = async () => {
    const validationError = validatePassword();
    if (validationError) {
      toast.error("Invalid password", {
        description: validationError,
        richColors: true,
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await authClient.changePassword({
        newPassword: passwordData.newPassword,
        currentPassword: passwordData.currentPassword,
        revokeOtherSessions: true,
      });

      if (error) {
        throw error;
      }

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast.success("Password updated", {
        description:
          "Password updated successfully! Other sessions have been revoked.",
        richColors: true,
      });
    } catch (error) {
      console.error("Password update failed:", error);
      let errorMessage = "Failed to update password. Please try again.";

      if ((error as Error).message?.includes("INVALID_PASSWORD")) {
        errorMessage = "Current password is incorrect";
      } else if ((error as Error).message?.includes("WEAK_PASSWORD")) {
        errorMessage = "New password doesn't meet requirements";
      } else if ((error as Error).message?.includes("RATE_LIMIT")) {
        errorMessage = "Too many attempts. Please try again later";
      } else if ((error as Error).message) {
        errorMessage = (error as Error).message;
      }

      toast.error("Password update failed", {
        description: errorMessage,
        richColors: true,
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleEnable2FA = async () => {
    if (!passwordFor2FA.trim()) {
      toast.error("Password required", {
        description: "Please enter your password to enable 2FA",
        richColors: true,
      });
      return;
    }

    setIsEnabling2FA(true);
    try {
      const { data, error } = await authClient.twoFactor.enable({
        password: passwordFor2FA,
      });

      if (error) {
        throw error;
      }

      setTwoFactor({
        isEnabled: true,
        backupCodes: data?.backupCodes,
      });
      setPasswordFor2FA("");

      toast.success("2FA Enabled", {
        description: "Two-factor authentication has been successfully enabled!",
        richColors: true,
      });

      await checkTwoFactorStatus();
    } catch (error) {
      console.error("Failed to enable 2FA:", error);
      let errorMessage = "Failed to enable 2FA. Please try again.";

      if ((error as Error).message?.includes("INVALID_PASSWORD")) {
        errorMessage = "Incorrect password. Please try again.";
      } else if (
        (error as Error).message?.includes("TWO_FACTOR_ALREADY_ENABLED")
      ) {
        errorMessage = "Two-factor authentication is already enabled.";
      } else if ((error as Error).message) {
        errorMessage = (error as Error).message;
      }

      toast.error("2FA Enable Failed", {
        description: errorMessage,
        richColors: true,
      });
    } finally {
      setIsEnabling2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!passwordFor2FA.trim()) {
      toast.error("Password required", {
        description: "Please enter your password to disable 2FA",
        richColors: true,
      });
      return;
    }

    setIsDisabling2FA(true);
    try {
      const { error } = await authClient.twoFactor.disable({
        password: passwordFor2FA,
      });

      if (error) {
        throw error;
      }

      setTwoFactor({ isEnabled: false });
      setPasswordFor2FA("");

      toast.success("2FA Disabled", {
        description: "Two-factor authentication has been disabled",
        richColors: true,
      });

      await checkTwoFactorStatus();
    } catch (error) {
      console.error("Failed to disable 2FA:", error);
      let errorMessage = "Failed to disable 2FA. Please try again.";

      if ((error as Error).message?.includes("INVALID_PASSWORD")) {
        errorMessage = "Incorrect password. Please try again.";
      } else if ((error as Error).message?.includes("TWO_FACTOR_NOT_ENABLED")) {
        errorMessage = "Two-factor authentication is not currently enabled.";
      } else if ((error as Error).message) {
        errorMessage = (error as Error).message;
      }

      toast.error("2FA Disable Failed", {
        description: errorMessage,
        richColors: true,
      });
    } finally {
      setIsDisabling2FA(false);
    }
  };

  const resetPasswordForm = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const hasPasswordChanges = Object.values(passwordData).some(
    (value) => value.trim() !== ""
  );

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    const strengths = [
      {
        strength: 0,
        label: "Very Weak",
        color: "text-red-600 dark:text-red-400",
      },
      { strength: 1, label: "Weak", color: "text-red-500 dark:text-red-400" },
      {
        strength: 2,
        label: "Fair",
        color: "text-yellow-600 dark:text-yellow-400",
      },
      { strength: 3, label: "Good", color: "text-blue-600 dark:text-blue-400" },
      {
        strength: 4,
        label: "Strong",
        color: "text-green-600 dark:text-green-400",
      },
      {
        strength: 5,
        label: "Very Strong",
        color: "text-green-700 dark:text-green-300",
      },
    ];
    return strengths[score];
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);

  return (
    <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
      {/* Account Security Card */}
      <Card className="lg:col-span-1 xl:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Security
          </CardTitle>
          <CardDescription>
            Manage your password and security settings to keep your account
            safe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  handlePasswordChange("currentPassword", e.target.value)
                }
                disabled={isUpdatingPassword}
                placeholder="Enter your current password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  handlePasswordChange("newPassword", e.target.value)
                }
                disabled={isUpdatingPassword}
                placeholder="Enter your new password"
              />
              {passwordData.newPassword && (
                <div className="flex items-center gap-2 text-sm">
                  <span>Strength:</span>
                  <span className={passwordStrength.color}>
                    {passwordStrength.label}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                handlePasswordChange("confirmPassword", e.target.value)
              }
              disabled={isUpdatingPassword}
              placeholder="Confirm your new password"
            />
            {passwordData.confirmPassword &&
              passwordData.newPassword !== passwordData.confirmPassword && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  Passwords do not match
                </p>
              )}
          </div>

          {/* Password Requirements */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Key className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Password Requirements:
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-0.5">
                  <li>• At least 8 characters long</li>
                  <li>• Contains uppercase and lowercase letters</li>
                  <li>• Contains at least one number</li>
                  <li>• Contains at least one special character</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Changing your password will automatically log you out of all other
              devices and sessions for security.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              className="flex items-center gap-2"
              onClick={handlePasswordUpdate}
              disabled={isUpdatingPassword || !hasPasswordChanges}
            >
              {isUpdatingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Update Password
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={resetPasswordForm}
              disabled={isUpdatingPassword || !hasPasswordChanges}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication Card */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account with 2FA.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 2FA Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <div className="flex items-center gap-3">
              {isCheckingTwoFactor ? (
                <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
              ) : session.user.twoFactorEnabled ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              )}
              <div>
                <p className="font-medium">
                  {isCheckingTwoFactor
                    ? "Checking 2FA Status..."
                    : session.user.twoFactorEnabled
                    ? "2FA Enabled"
                    : "2FA Disabled"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isCheckingTwoFactor
                    ? "Verifying your 2FA setup..."
                    : twoFactor.isEnabled
                    ? "Your account is protected with 2FA"
                    : "Enable 2FA for enhanced security"}
                </p>
              </div>
            </div>
          </div>

          {!isCheckingTwoFactor && !twoFactor.isEnabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="passwordFor2FA">Password</Label>
                <Input
                  id="passwordFor2FA"
                  type="password"
                  value={passwordFor2FA}
                  onChange={(e) => setPasswordFor2FA(e.target.value)}
                  disabled={isEnabling2FA}
                  placeholder="Enter your password to enable 2FA"
                />
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Enable Two-Factor Authentication
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Add an extra layer of security to your account by
                      requiring a verification code from your authenticator app.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                className="flex items-center gap-2 w-full"
                onClick={handleEnable2FA}
                disabled={isEnabling2FA || !passwordFor2FA.trim()}
              >
                {isEnabling2FA ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enabling...
                  </>
                ) : (
                  <>
                    <Smartphone className="h-4 w-4" />
                    Enable 2FA
                  </>
                )}
              </Button>
            </>
          )}

          {!isCheckingTwoFactor && twoFactor.isEnabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="passwordForDisable2FA">Password</Label>
                <Input
                  id="passwordForDisable2FA"
                  type="password"
                  value={passwordFor2FA}
                  onChange={(e) => setPasswordFor2FA(e.target.value)}
                  disabled={isDisabling2FA}
                  placeholder="Enter your password to disable 2FA"
                />
              </div>

              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-800 dark:text-red-200">
                  Disabling 2FA will make your account less secure. Make sure
                  you have other security measures in place.
                </p>
              </div>

              <Button
                variant="destructive"
                className="flex items-center gap-2 w-full"
                onClick={handleDisable2FA}
                disabled={isDisabling2FA || !passwordFor2FA.trim()}
              >
                {isDisabling2FA ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Disabling...
                  </>
                ) : (
                  "Disable 2FA"
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

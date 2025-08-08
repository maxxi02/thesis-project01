"use client";

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { User, Save, Upload, Mail, Edit2, AlertCircle } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Session } from "@/better-auth/auth-types";

export default function ProfileTab({ session }: { session: Session }) {
  // Profile states
  const [name, setName] = useState(session.user?.name || "");
  const [image, setImage] = useState(session.user?.image || "");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Email change states
  const [newEmail, setNewEmail] = useState("");
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isEmailChangeLoading, setIsEmailChangeLoading] = useState(false);

  // Generate user initials for avatar fallback
  const getUserInitials = (name: string | null | undefined): string => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Format date to dd-MMM-yyyy
  const formatDate = (date: Date | undefined): string => {
    if (!date) return "Not available";
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  };

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File too large", {
        description: "File size must be less than 2MB",
        richColors: true,
      });
      return;
    }

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png|gif)$/)) {
      toast.error("Invalid file type", {
        description: "Please select a JPG, PNG, or GIF image",
        richColors: true,
      });
      return;
    }

    // Create temporary URL for preview
    const imageUrl = URL.createObjectURL(file);
    setImage(imageUrl);
  };

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      await authClient.updateUser({
        name: name.trim(),
        image: image,
      });
      toast.success("Success", {
        description: "Profile updated successfully",
        richColors: true,
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Error", {
        description: "Profile update failed",
        richColors: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail.trim()) {
      toast.error("Invalid email", {
        description: "Please enter a new email address",
        richColors: true,
      });
      return;
    }

    if (!isValidEmail(newEmail)) {
      toast.error("Invalid email", {
        description: "Please enter a valid email address",
        richColors: true,
      });
      return;
    }

    if (newEmail === session.user.email) {
      toast.error("Same email", {
        description: "The new email is the same as your current email",
        richColors: true,
      });
      return;
    }

    try {
      setIsEmailChangeLoading(true);
      await authClient.changeEmail({
        newEmail: newEmail.trim(),
        callbackURL: "/dashboard",
      });
      toast.success("Verification sent", {
        description:
          "Please check your current email for the verification link",
        richColors: true,
      });
      setIsEmailDialogOpen(false);
      setNewEmail("");
    } catch (error) {
      console.error("Failed to change email:", error);
      toast.error("Error", {
        description:
          (error as Error).message || "Failed to initiate email change",
        richColors: true,
      });
    } finally {
      setIsEmailChangeLoading(false);
    }
  };

  const resetProfileChanges = () => {
    setName(session.user?.name || "");
    setImage(session.user?.image || "");
  };

  const hasProfileChanges =
    name !== (session.user?.name || "") ||
    image !== (session.user?.image || "");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Personal Information Card */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Update your personal details and contact information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={image || "/placeholder.svg"}
                className="object-cover"
              />
              <AvatarFallback className="text-lg">
                {getUserInitials(name)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2 flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 w-full sm:w-auto"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Upload Photo
              </Button>
              <p className="text-sm text-muted-foreground">
                JPG, PNG or GIF. Max size 2MB.
              </p>
            </div>
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          {/* Email Section */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Input
                id="email"
                type="email"
                value={session.user.email}
                disabled
                className="bg-muted flex-1"
              />
              <Dialog
                open={isEmailDialogOpen}
                onOpenChange={setIsEmailDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Change
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Change Email Address</DialogTitle>
                    <DialogDescription>
                      Enter your new email address. A verification link will be
                      sent to your current email.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentEmail">Current Email</Label>
                      <Input
                        id="currentEmail"
                        value={session.user.email}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newEmail">New Email Address</Label>
                      <Input
                        id="newEmail"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Enter new email address"
                      />
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        A verification email will be sent to your current email
                        address ({session.user.email}) to approve this change.
                      </p>
                    </div>
                  </div>
                  <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEmailDialogOpen(false);
                        setNewEmail("");
                      }}
                      disabled={isEmailChangeLoading}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleEmailChange}
                      disabled={isEmailChangeLoading || !newEmail.trim()}
                      className="w-full sm:w-auto"
                    >
                      {isEmailChangeLoading
                        ? "Sending..."
                        : "Send Verification"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Email Status Info */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <span>Email status:</span>
                <span
                  className={
                    session.user.emailVerified
                      ? "text-green-600 dark:text-green-400"
                      : "text-yellow-600 dark:text-yellow-400"
                  }
                >
                  {session.user.emailVerified ? "Verified" : "Unverified"}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                <span>Account created: </span>
                <span>{formatDate(session.user?.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* User ID Section */}
          {session.user?.id && (
            <div className="space-y-2">
              <Label>User ID</Label>
              <div className="p-2 bg-muted rounded-md">
                <code className="text-sm font-mono break-all">
                  {session.user.id}
                </code>
              </div>
              <p className="text-sm text-muted-foreground">
                Your unique user identifier (read-only).
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              className="flex items-center gap-2"
              onClick={handleSaveProfile}
              disabled={!hasProfileChanges || isLoading}
            >
              <Save className="h-4 w-4" />
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              variant="outline"
              onClick={resetProfileChanges}
              disabled={!hasProfileChanges}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Session Information Card */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Session Information
          </CardTitle>
          <CardDescription>
            View details about your current session and authentication status.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Session ID</Label>
              <div className="p-2 bg-muted rounded-md">
                <code className="text-sm font-mono break-all">
                  {session.session.id}
                </code>
              </div>
            </div>

            <div className="space-y-2">
              <Label>IP Address</Label>
              <div className="p-2 bg-muted rounded-md">
                <code className="text-sm font-mono">
                  {session.session.ipAddress}
                </code>
              </div>
            </div>

            <div className="space-y-2">
              <Label>User Agent</Label>
              <div className="p-2 bg-muted rounded-md max-h-20 overflow-y-auto">
                <code className="text-sm font-mono break-all">
                  {session.session.userAgent}
                </code>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Session Started</Label>
                <div className="p-2 bg-muted rounded-md">
                  <code className="text-sm font-mono">
                    {formatDate(session.session.createdAt)}
                  </code>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Session Expires</Label>
                <div className="p-2 bg-muted rounded-md">
                  <code className="text-sm font-mono">
                    {formatDate(session.session.expiresAt)}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

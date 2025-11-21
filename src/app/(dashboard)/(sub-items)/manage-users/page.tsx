"use client";

import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Loader2, Crown, Users, Truck, CreditCard, RefreshCw, Copy, Check } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { UsersTable } from "./_components/user-table";
import { UserData, UserRole } from "@/types/user-type";

// Simplified form schema
const createUserSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    middleName: z.string().optional(),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    role: z.enum(["admin", "cashier", "delivery", "user"]),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
  })
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    }
  );

type CreateUserFormValues = z.infer<typeof createUserSchema>;

const UserManagementPage = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [passwordCopied, setPasswordCopied] = useState(false);

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      role: "user",
      password: "",
      confirmPassword: "",
    },
  });

  const {
    formState: { isSubmitting },
  } = form;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await authClient.admin.listUsers({
        query: {
          limit: 100,
        },
      });

      if (response.data?.users) {
        const mappedUsers: UserData[] = response.data.users.map((user) => ({
          id: user.id,
          name: user.name || "",
          email: user.email,
          role: (user.role || "user") as UserRole,
          emailVerified: user.emailVerified || false,
          banned: user.banned || false,
          image: user.image ?? undefined,
          createdAt: user.createdAt
            ? new Date(user.createdAt).toISOString()
            : new Date().toISOString(),
        }));
        setUsers(mappedUsers);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    {
      value: "admin" as UserRole,
      label: "Admin",
      variant: "destructive" as const,
      icon: Crown,
      description: "Full system access",
    },
    {
      value: "cashier" as UserRole,
      label: "Cashier",
      variant: "default" as const,
      icon: CreditCard,
      description: "Point of sale access",
    },
    {
      value: "delivery" as UserRole,
      label: "Delivery",
      variant: "secondary" as const,
      icon: Truck,
      description: "Delivery management",
    },
    {
      value: "user" as UserRole,
      label: "User",
      variant: "outline" as const,
      icon: Users,
      description: "Basic user access",
    },
  ];

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const generateRandomPassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword();
    setGeneratedPassword(newPassword);
    form.setValue("password", newPassword);
    form.setValue("confirmPassword", newPassword);
    setPasswordCopied(false);
    toast.success("Password generated successfully!");
  };

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setPasswordCopied(true);
      toast.success("Password copied to clipboard!");
      setTimeout(() => setPasswordCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy password");
    }
  };

  const onSubmit = async (values: CreateUserFormValues) => {
    try {
      // Combine name parts
      const fullName = [
        values.firstName,
        values.middleName?.trim(),
        values.lastName
      ]
        .filter(Boolean)
        .join(" ");

      // Create user with Better Auth
      const response = await authClient.admin.createUser({
        name: fullName,
        email: values.email,
        password: values.password,
        role: values.role,
        data: {},
      });

      if ("error" in response && response.error) {
        throw new Error(response.error.message || "Failed to create user");
      }

      const userData = "data" in response ? response.data?.user : response;

      if (!userData?.id) {
        throw new Error("Invalid user data received");
      }

      const newUser: UserData = {
        id: userData.id,
        name: userData.name || fullName,
        email: userData.email,
        role: values.role,
        emailVerified: userData.emailVerified || false,
        banned: false,
        image: userData.image || "",
        createdAt: new Date().toISOString(),
      };

      setUsers((prev) => [...prev, newUser]);
      setShowCreateModal(false);
      form.reset();
      setGeneratedPassword("");
      setPasswordCopied(false);
      toast.success(`User ${fullName} created successfully!`);
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error(`Failed to create user: ${(error as Error).message}`);
    }
  };

  const handleUserAction = async (action: string, userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    setActionLoading(userId);

    try {
      switch (action) {
        case "ban":
          await authClient.admin.banUser({ userId });
          setUsers((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, banned: true } : u))
          );
          toast.success(`${user.name} has been banned`);
          break;

        case "unban":
          await authClient.admin.unbanUser({ userId });
          setUsers((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, banned: false } : u))
          );
          toast.success(`${user.name} has been unbanned`);
          break;

        case "delete":
          if (confirm(`Are you sure you want to delete ${user.name}?`)) {
            await authClient.admin.removeUser({ userId });
            setUsers((prev) => prev.filter((u) => u.id !== userId));
            toast.success(`${user.name} has been deleted`);
          }
          break;
      }
    } catch (error) {
      console.error("Action error:", error);
      toast.error(`Error: ${(error as Error).message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setActionLoading(userId);
    try {
      await authClient.admin.setRole({
        userId,
        role: newRole,
      });

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      toast.success("User role updated successfully");
    } catch (error) {
      console.error("Role change error:", error);
      toast.error(`Error updating role: ${(error as Error).message}`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-muted-foreground">
          Manage users, roles, and permissions
        </p>

        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system with appropriate role and
                permissions
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid gap-4">
                  {/* First Name Field */}
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Middle Name Field (Optional) */}
                  <FormField
                    control={form.control}
                    name="middleName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Middle Name (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Michael" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Last Name Field */}
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="john@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                <div className="flex items-center gap-2">
                                  <role.icon className="h-4 w-4" />
                                  <div>
                                    <div className="font-medium">
                                      {role.label}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {role.description}
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                {...field}
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={handleGeneratePassword}
                              title="Generate random password"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </div>
                          {generatedPassword && (
                            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                              <code className="flex-1 text-sm font-mono">
                                {generatedPassword}
                              </code>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleCopyPassword}
                              >
                                {passwordCopied ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Create User
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter users by name, email, or role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex items-center gap-2">
                      <role.icon className="h-4 w-4" />
                      {role.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <div className="rounded-md border">
        <UsersTable
          users={filteredUsers}
          onRoleChange={handleRoleChange}
          onUserAction={handleUserAction}
          actionLoading={actionLoading}
        />
      </div>
    </div>
  );
};

export default UserManagementPage;
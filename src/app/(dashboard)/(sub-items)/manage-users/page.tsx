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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Loader2,
  Crown,
  Users,
  Truck,
  CreditCard,
  RefreshCw,
  Copy,
  Check,
  User,
  MoreVertical,
  Trash2,
  Ban,
  UserCheck,
  CheckCircle,
  XCircle,
  Search,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { UserData, UserRole } from "@/types/user-type";
import Image from "next/image";
import { createUserSchema } from "./_components/create-user-schema";


type CreateUserFormValues = z.infer<typeof createUserSchema>;

// ========== USER TABLE COMPONENT ==========
interface UsersTableProps {
  users: UserData[];
  onRoleChange: (userId: string, newRole: UserRole) => void;
  onUserAction: (action: string, userId: string) => void;
  actionLoading: string | null;
}

const UsersTable: React.FC<UsersTableProps> = ({
  users,
  onRoleChange,
  onUserAction,
  actionLoading,
}) => {
  const roles = [
    { value: "admin" as UserRole, variant: "destructive" as const, icon: Crown },
    { value: "cashier" as UserRole, variant: "default" as const, icon: CreditCard },
    { value: "delivery" as UserRole, variant: "secondary" as const, icon: Truck },
    { value: "user" as UserRole, variant: "outline" as const, icon: Users },
  ];

  const getRoleVariant = (role: UserRole) => {
    return roles.find((r) => r.value === role)?.variant || "outline";
  };

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <User className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">No users found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        {user.image ? (
                          <Image
                            src={user.image}
                            alt={user.name}
                            width={32}
                            height={32}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(value) =>
                        onRoleChange(user.id, value as UserRole)
                      }
                      disabled={actionLoading === user.id}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            <div className="flex items-center gap-2">
                              <role.icon className="h-4 w-4" />
                              <span className="capitalize">{role.value}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.banned ? (
                        <Badge variant="destructive">
                          <Ban className="mr-1 h-3 w-3" />
                          Banned
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Active
                        </Badge>
                      )}
                      {user.emailVerified ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-orange-600" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          disabled={actionLoading === user.id}
                        >
                          {actionLoading === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreVertical className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {user.banned ? (
                          <DropdownMenuItem
                            onClick={() => onUserAction("unban", user.id)}
                          >
                            <UserCheck className="mr-2 h-4 w-4" /> Unban User
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => onUserAction("ban", user.id)}
                          >
                            <Ban className="mr-2 h-4 w-4" /> Ban User
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                          onClick={() => onUserAction("delete", user.id)}
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// ========== MAIN USER MANAGEMENT PAGE ==========
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
    mode: "onChange",
  });

  const {
    formState: { isSubmitting, isValid },
  } = form;

  // ========== EFFECTS ==========
  useEffect(() => {
    fetchUsers();
  }, []);

  // ========== DATA FETCHING ==========
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

  // ========== PASSWORD GENERATION ==========
  const generateRandomPassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const special = "!@#$%^&*";

    // Ensure at least one of each required type
    let password = "";
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Fill the rest randomly
    const allChars = uppercase + lowercase + numbers + special;
    for (let i = password.length; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
  };

  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword();
    setGeneratedPassword(newPassword);
    form.setValue("password", newPassword, { shouldValidate: true });
    form.setValue("confirmPassword", newPassword, { shouldValidate: true });
    setPasswordCopied(false);
    toast.success("Secure password generated!");
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

  // ========== FORM SUBMISSION ==========
  const onSubmit = async (values: CreateUserFormValues) => {
    try {
      // Combine name parts with proper formatting
      const fullName = [
        values.firstName.trim(),
        values.middleName?.trim(),
        values.lastName.trim(),
      ]
        .filter(Boolean)
        .join(" ");

      // Validate full name length
      if (fullName.length > 150) {
        toast.error("Full name is too long (max 150 characters)");
        return;
      }

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
      const errorMessage = (error as Error).message;
      
      if (errorMessage.includes("email") || errorMessage.includes("Email")) {
        toast.error("This email address is already registered");
      } else {
        toast.error(`Failed to create user: ${errorMessage}`);
      }
    }
  };

  // ========== USER ACTIONS ==========
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
          if (confirm(`Are you sure you want to permanently delete ${user.name}? This action cannot be undone.`)) {
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

  // ========== FILTERING ==========
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

  // ========== RENDER STATES ==========
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* ========== HEADER SECTION ========== */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage users, roles, and permissions across the system
          </p>
        </div>

        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system with appropriate role and permissions. 
                All fields are required unless marked optional.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid gap-4">
                  {/* ========== FIRST NAME FIELD ========== */}
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="John" 
                            {...field} 
                            maxLength={50}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^a-zA-Z\s'-]/g, '');
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* ========== MIDDLE NAME FIELD ========== */}
                  <FormField
                    control={form.control}
                    name="middleName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Middle Name (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Michael"
                            {...field}
                            maxLength={50}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^a-zA-Z\s'-]/g, '');
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* ========== LAST NAME FIELD ========== */}
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Doe" 
                            {...field} 
                            maxLength={50}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^a-zA-Z\s'-]/g, '');
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* ========== EMAIL FIELD ========== */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="john.doe@example.com"
                            {...field}
                            maxLength={100}
                            onChange={(e) => {
                              field.onChange(e.target.value.toLowerCase());
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* ========== ROLE FIELD ========== */}
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                  <span>{role.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* ========== PASSWORD FIELD ========== */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password *</FormLabel>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                {...field}
                                maxLength={100}
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={handleGeneratePassword}
                              title="Generate secure password"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </div>
                          {generatedPassword && (
                            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                              <code className="flex-1 text-sm font-mono break-all">
                                {generatedPassword}
                              </code>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleCopyPassword}
                                className="shrink-0"
                              >
                                {passwordCopied ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>Password must contain:</p>
                            <ul className="list-disc list-inside space-y-1">
                              <li>At least 8 characters</li>
                              <li>One uppercase letter</li>
                              <li>One lowercase letter</li>
                              <li>One number</li>
                              <li>One special character</li>
                            </ul>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* ========== CONFIRM PASSWORD FIELD ========== */}
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password *</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                            maxLength={100}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      form.reset();
                      setGeneratedPassword("");
                      setPasswordCopied(false);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !isValid}
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

      {/* ========== FILTERS SECTION ========== */}
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search users by name or email..."
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

      {/* ========== USERS TABLE SECTION ========== */}
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
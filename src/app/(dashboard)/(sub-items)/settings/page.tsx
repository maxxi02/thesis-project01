// app/settings/page.tsx
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Shield, Settings } from "lucide-react";
import ProfileTab from "./_components/profile-tab";
import AccountTab from "./_components/account-tab";
import PreferencesTab from "./_components/preference-tab";
import { getServerSession } from "@/better-auth/action";

export default async function SettingsPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto p-4">
      <Tabs defaultValue="profile" className="space-y-6 ">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-3 gap-2">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>

          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Preferences</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ProfileTab session={session} />
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <AccountTab session={session} />
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <PreferencesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

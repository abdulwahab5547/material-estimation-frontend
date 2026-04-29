import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountTab } from "@/features/profile/AccountTab";
import { BrandingTab } from "@/features/profile/BrandingTab";
import { DefaultsTab } from "@/features/profile/DefaultsTab";
import { RatesTab } from "@/features/profile/RatesTab";

export function ProfilePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-4xl px-6 py-8 lg:px-10 lg:py-10"
    >
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Profile & Settings</h1>
        <p className="mt-1 text-muted-foreground">Your account, branding, and default estimation parameters.</p>
      </div>

      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="defaults">Defaults</TabsTrigger>
          <TabsTrigger value="rates">Rates</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <AccountTab />
        </TabsContent>
        <TabsContent value="branding">
          <BrandingTab />
        </TabsContent>
        <TabsContent value="defaults">
          <DefaultsTab />
        </TabsContent>
        <TabsContent value="rates">
          <RatesTab />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

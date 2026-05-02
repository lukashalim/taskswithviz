"use client";

import { useState } from "react";
import { MagicLinkForm } from "@/components/auth/magic-link-form";
import { PasswordForm } from "@/components/auth/password-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function LoginTabs() {
  const [tab, setTab] = useState("password");

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="magic">Magic link</TabsTrigger>
      </TabsList>
      <TabsContent value="password" className="mt-6">
        <PasswordForm />
      </TabsContent>
      <TabsContent value="magic" className="mt-6">
        <MagicLinkForm />
      </TabsContent>
    </Tabs>
  );
}

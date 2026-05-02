import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in | Task Tracker",
  description: "Sign in to manage your tasks",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

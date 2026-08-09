import type { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Kayıt Ol",
};

export default function KayitPage() {
  return <RegisterForm />;
}

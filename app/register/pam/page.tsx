import { RegistrationForm } from "@/components/registration/RegistrationForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Matrícula EMAD | SEMADEJ Online",
    description: "Inscrição para a EMAD (Curso Básico de Missões)",
};

export default function PamRegisterPage() {
    return (
        <RegistrationForm
            courseType="PAM"
            badge="EMAD • Inscrições 2026"
            title="Matrícula EMAD"
            subtitle="Curso Básico de Missões da Assembleia de Deus"
            courseDisplayName="EMAD — Curso Básico de Missões"
        />
    );
}

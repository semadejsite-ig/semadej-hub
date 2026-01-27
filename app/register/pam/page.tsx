import { RegistrationForm } from "@/components/registration/RegistrationForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Matrícula PAM | SEMADEJ Hub",
    description: "Inscrição para o Programa de Aprofundamento Missionário",
};

export default function PamRegisterPage() {
    return (
        <RegistrationForm
            courseType="PAM"
            title="Inscrição PAM"
            subtitle="Programa de Aprofundamento Missionário"
        />
    );
}

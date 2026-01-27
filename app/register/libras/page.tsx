import { RegistrationForm } from "@/components/registration/RegistrationForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Curso de LIBRAS | SEMADEJ Hub",
    description: "Inscrição para o curso de LIBRAS para evangelismo",
};

export default function LibrasRegisterPage() {
    return (
        <RegistrationForm
            courseType="LIBRAS"
            title="Curso de LIBRAS"
            subtitle="Língua Brasileira de Sinais para o Reino"
        />
    );
}
